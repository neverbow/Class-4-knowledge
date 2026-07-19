import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../sync.js', import.meta.url), 'utf8');

function response(body) {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

async function runSync(localMistakes, cloudState) {
    const storage = new Map();
    const status = { textContent: '', dataset: {}, title: '' };
    let posted = null;
    const windowObject = {
        QUESTION_BANK_VERSION: { version: 'test' },
        QUESTION_BANK: [{ id: 245, uid: 'C4-2026-245' }],
        addEventListener() {},
        setInterval() { return 1; },
        setTimeout(callback) { callback(); return 1; },
        clearTimeout() {}
    };
    const context = {
        window: windowObject,
        document: {
            visibilityState: 'visible',
            addEventListener() {},
            getElementById(id) { return id === 'cloud-sync-status' ? status : null; },
            createElement() { return { click() {} }; }
        },
        localStorage: {
            getItem(key) { return storage.has(key) ? storage.get(key) : null; },
            setItem(key, value) { storage.set(key, String(value)); }
        },
        fetch: async (_url, options = {}) => {
            if (!options.method) return response({ state: cloudState });
            posted = JSON.parse(options.body);
            return response({ state: posted.state });
        },
        Response,
        Blob,
        URL,
        crypto: globalThis.crypto,
        console
    };
    vm.runInNewContext(source, context);
    const app = {
        currentUser: 'KENT',
        mistakesBook: structuredClone(localMistakes),
        practiceProgress: [],
        userHistory: [],
        saveData() {},
        updateMistakesCount() {}
    };
    const sync = new windowObject.KentCloudSync();
    await sync.start(app);
    return { app, posted, storage, status };
}

const emptyCloud = { schemaVersion: 1, profile: 'KENT', revision: 0, updatedAt: new Date(0).toISOString(), mistakes: {}, practiceProgress: [], history: [], migrations: {} };

test('first phone sync uploads existing local mistakes and creates a local backup', async () => {
    const local = {
        'C4-2026-245': { correctStreak: 0, chapter: 'chapter6' },
        'C4-2026-246': { correctStreak: 0, chapter: 'chapter6' }
    };
    const result = await runSync(local, emptyCloud);
    assert.equal(Object.keys(result.posted.state.mistakes).length, 2);
    assert.equal(result.posted.initialMigration, true);
    assert.ok(result.storage.has('icbc_pre_cloud_backup_KENT'));
    assert.equal(result.status.dataset.state, 'synced');
});

test('empty PC imports active cloud mistakes instead of overwriting them', async () => {
    const cloud = structuredClone(emptyCloud);
    cloud.mistakes['C4-2026-245'] = { status: 'active', correctStreak: 0, chapter: 'chapter6', updatedAt: '2026-07-18T10:00:00.000Z', deviceId: 'device-phone-1' };
    const result = await runSync({}, cloud);
    assert.ok(result.app.mistakesBook['C4-2026-245']);
    assert.ok(result.posted.state.mistakes['C4-2026-245']);
});
