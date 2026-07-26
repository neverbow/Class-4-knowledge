import { emptyState, mergeStates, normalizeState } from '../lib/sync-core.js';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

const redis = new Redis({ url, token });

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

async function readCloudState(profile) {
    try {
        const key = `class4/sync-${profile}`;
        const result = await redis.get(key);
        if (!result) {
            return { state: emptyState() };
        }
        // Upstash redis.get automatically parses JSON if it is JSON
        const raw = typeof result === 'string' ? JSON.parse(result) : result;
        return { state: normalizeState(raw) };
    } catch (err) {
        console.error('Redis read error:', err);
        return { state: emptyState() };
    }
}

async function saveInitialBackup(deviceId, state, profile) {
    const safeDeviceId = /^[a-zA-Z0-9-]{8,80}$/.test(deviceId) ? deviceId : 'unknown-device';
    const key = `class4/backups/${profile}-initial-${safeDeviceId}`;
    
    // Only set if not exists (NX)
    await redis.set(key, state, { nx: true });
}

async function mergeAndWrite(incoming, deviceId, initialMigration, profile) {
    const key = `class4/sync-${profile}`;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const current = await readCloudState(profile);
        const needsBackup = initialMigration && !current.state.migrations[deviceId];
        if (needsBackup) await saveInitialBackup(deviceId, incoming, profile);

        const merged = mergeStates(current.state, incoming);
        const now = new Date().toISOString();
        merged.revision = current.state.revision + 1;
        merged.updatedAt = now;
        if (needsBackup && /^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) {
            merged.migrations[deviceId] = now;
        }

        try {
            await redis.set(key, merged);
            return merged;
        } catch (error) {
            if (attempt === 2) throw error;
        }
    }
    throw new Error('Unable to save synchronized state');
}

export async function GET(request) {
    if (!requestAllowed(request)) return json({ error: 'Forbidden' }, 403);
    if (!url || !token) return json({ error: 'Redis credentials missing' }, 500);
    
    const profileRaw = request.headers.get('x-profile-name');
    if (!profileRaw) return json({ error: 'Profile name missing' }, 400);
    const profile = decodeURIComponent(profileRaw).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    if (!profile) return json({ error: 'Invalid profile name' }, 400);
    
    try {
        const { state } = await readCloudState(profile);
        return json({ state });
    } catch (error) {
        console.error('KENT sync read failed', error);
        return json({ error: 'Cloud sync is temporarily unavailable', details: error.stack || error.message }, 503);
    }
}

export async function POST(request) {
    if (!requestAllowed(request)) return json({ error: 'Forbidden' }, 403);
    if (!url || !token) return json({ error: 'Redis credentials missing' }, 500);

    const contentLength = Number(request.headers.get('content-length')) || 0;
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);

    const profileRaw = request.headers.get('x-profile-name');
    if (!profileRaw) return json({ error: 'Profile name missing' }, 400);
    const profile = decodeURIComponent(profileRaw).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    if (!profile) return json({ error: 'Invalid profile name' }, 400);

    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);
        const body = JSON.parse(raw);
        if (body?.state?.profile !== profile) return json({ error: 'Invalid profile payload' }, 400);
        const deviceId = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 80) : '';
        if (!/^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) return json({ error: 'Invalid device' }, 400);
        
        const state = await mergeAndWrite(normalizeState(body.state), deviceId, body.initialMigration === true, profile);
        return json({ state });
    } catch (error) {
        console.error('KENT sync write failed', error);
        return json({ error: 'Cloud sync is temporarily unavailable', details: error.stack || error.message }, 503);
    }
}
