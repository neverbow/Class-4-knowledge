import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { emptyState, mergeStates, normalizeState } from '../lib/sync-core.js';

const BLOB_PATH = process.env.SYNC_BLOB_PATH || 'class4/kent-sync-v1.json';
const MAX_BODY_BYTES = 512 * 1024;

function json(data, status = 200) {
    return Response.json(data, {
        status,
        headers: {
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}

function requestAllowed(request) {
    if (request.headers.get('x-kent-sync') !== '1') return false;
    const origin = request.headers.get('origin');
    if (!origin) return true;
    try {
        return new URL(origin).host === new URL(request.url).host;
    } catch {
        return false;
    }
}

async function readCloudState() {
    const result = await get(BLOB_PATH, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
        return { state: emptyState(), etag: null };
    }
    const raw = await new Response(result.stream).text();
    return { state: normalizeState(JSON.parse(raw)), etag: result.blob.etag };
}

function isAlreadyExists(error) {
    return error?.name === 'BlobAlreadyExistsError'
        || error?.code === 'blob_already_exists'
        || /already exists/i.test(error?.message || '');
}

function isRetryableConflict(error) {
    return error instanceof BlobPreconditionFailedError
        || error?.name === 'BlobPreconditionFailedError'
        || /ETag mismatch/i.test(error?.message || '')
        || isAlreadyExists(error);
}

async function saveInitialBackup(deviceId, state) {
    const safeDeviceId = /^[a-zA-Z0-9-]{8,80}$/.test(deviceId) ? deviceId : 'unknown-device';
    const pathname = `class4/backups/kent-initial-${safeDeviceId}.json`;
    try {
        await put(pathname, JSON.stringify(state), {
            access: 'private',
            contentType: 'application/json',
            cacheControlMaxAge: 60
        });
    } catch (error) {
        if (!isAlreadyExists(error)) throw error;
    }
}

async function mergeAndWrite(incoming, deviceId, initialMigration) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const current = await readCloudState();
        const needsBackup = initialMigration && !current.state.migrations[deviceId];
        if (needsBackup) await saveInitialBackup(deviceId, incoming);

        const merged = mergeStates(current.state, incoming);
        const now = new Date().toISOString();
        merged.revision = current.state.revision + 1;
        merged.updatedAt = now;
        if (needsBackup && /^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) {
            merged.migrations[deviceId] = now;
        }

        try {
            await put(BLOB_PATH, JSON.stringify(merged), {
                access: 'private',
                contentType: 'application/json',
                cacheControlMaxAge: 60,
                allowOverwrite: true
            });
            return merged;
        } catch (error) {
            if (!isRetryableConflict(error) || attempt === 3) throw error;
        }
    }
    throw new Error('Unable to save synchronized state');
}

export async function GET(request) {
    if (!requestAllowed(request)) return json({ error: 'Forbidden' }, 403);
    try {
        const { state } = await readCloudState();
        return json({ state });
    } catch (error) {
        console.error('KENT sync read failed', error);
        return json({ error: 'Cloud sync is temporarily unavailable', details: error.stack || error.message }, 503);
    }
}

export async function POST(request) {
    if (!requestAllowed(request)) return json({ error: 'Forbidden' }, 403);
    const contentLength = Number(request.headers.get('content-length')) || 0;
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);

    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);
        const body = JSON.parse(raw);
        if (body?.state?.profile !== 'KENT') return json({ error: 'Invalid profile' }, 400);
        const deviceId = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 80) : '';
        if (!/^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) return json({ error: 'Invalid device' }, 400);
        const state = await mergeAndWrite(normalizeState(body.state), deviceId, body.initialMigration === true);
        return json({ state });
    } catch (error) {
        console.error('KENT sync write failed', error);
        return json({ error: 'Cloud sync is temporarily unavailable', details: error.stack || error.message }, 503);
    }
}


