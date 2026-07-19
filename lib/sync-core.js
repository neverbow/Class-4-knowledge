const PROFILE = 'KENT';
const QUESTION_KEY_PATTERN = /^C4-2026-\d{3,}$/;

function validIso(value) {
    if (typeof value !== 'string') return '1970-01-01T00:00:00.000Z';
    return Number.isNaN(Date.parse(value)) ? '1970-01-01T00:00:00.000Z' : new Date(value).toISOString();
}

function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

export function historyId(entry) {
    if (entry && typeof entry.id === 'string' && entry.id.length <= 100) return entry.id;
    const signature = [entry?.date, entry?.score, entry?.mode, entry?.class].join('|');
    return `history-${stableHash(signature)}`;
}

function normalizeMistake(record) {
    if (!record || typeof record !== 'object') return null;
    return {
        status: record.status === 'resolved' ? 'resolved' : 'active',
        correctStreak: Math.max(0, Math.min(2, Number(record.correctStreak) || 0)),
        chapter: typeof record.chapter === 'string' ? record.chapter.slice(0, 40) : '',
        updatedAt: validIso(record.updatedAt),
        deviceId: typeof record.deviceId === 'string' ? record.deviceId.slice(0, 80) : ''
    };
}

function normalizeHistory(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const date = validIso(entry.date);
    const score = Math.max(0, Math.min(100, Number(entry.score) || 0));
    const mode = typeof entry.mode === 'string' ? entry.mode.slice(0, 40) : 'Mock Exam';
    const licenceClass = typeof entry.class === 'string' ? entry.class.slice(0, 40) : 'class4-rest';
    return { id: historyId(entry), date, score, mode, class: licenceClass };
}

export function emptyState() {
    return {
        schemaVersion: 1,
        profile: PROFILE,
        revision: 0,
        updatedAt: '1970-01-01T00:00:00.000Z',
        mistakes: {},
        practiceProgress: [],
        history: [],
        migrations: {}
    };
}

export function normalizeState(input) {
    const state = emptyState();
    if (!input || typeof input !== 'object') return state;

    state.revision = Math.max(0, Number(input.revision) || 0);
    state.updatedAt = validIso(input.updatedAt);

    if (input.mistakes && typeof input.mistakes === 'object') {
        Object.entries(input.mistakes).forEach(([key, value]) => {
            if (!QUESTION_KEY_PATTERN.test(key)) return;
            const normalized = normalizeMistake(value);
            if (normalized) state.mistakes[key] = normalized;
        });
    }

    if (Array.isArray(input.practiceProgress)) {
        state.practiceProgress = [...new Set(input.practiceProgress.filter(key => QUESTION_KEY_PATTERN.test(key)))].slice(0, 5000);
    }

    if (Array.isArray(input.history)) {
        const byId = new Map();
        input.history.forEach(entry => {
            const normalized = normalizeHistory(entry);
            if (normalized) byId.set(normalized.id, normalized);
        });
        state.history = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-1000);
    }

    if (input.migrations && typeof input.migrations === 'object') {
        Object.entries(input.migrations).slice(0, 20).forEach(([deviceId, timestamp]) => {
            if (/^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) state.migrations[deviceId] = validIso(timestamp);
        });
    }

    return state;
}

function chooseMistake(left, right) {
    if (!left) return right;
    if (!right) return left;
    const comparison = left.updatedAt.localeCompare(right.updatedAt);
    if (comparison < 0) return right;
    if (comparison > 0) return left;
    if (left.status !== right.status) return left.status === 'resolved' ? left : right;
    return left.correctStreak >= right.correctStreak ? left : right;
}

export function mergeStates(leftInput, rightInput) {
    const left = normalizeState(leftInput);
    const right = normalizeState(rightInput);
    const merged = emptyState();
    merged.revision = Math.max(left.revision, right.revision);
    merged.updatedAt = left.updatedAt > right.updatedAt ? left.updatedAt : right.updatedAt;

    const mistakeKeys = new Set([...Object.keys(left.mistakes), ...Object.keys(right.mistakes)]);
    mistakeKeys.forEach(key => {
        merged.mistakes[key] = chooseMistake(left.mistakes[key], right.mistakes[key]);
    });

    merged.practiceProgress = [...new Set([...left.practiceProgress, ...right.practiceProgress])].slice(0, 5000);

    const history = new Map();
    [...left.history, ...right.history].forEach(entry => history.set(entry.id, entry));
    merged.history = [...history.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-1000);

    merged.migrations = { ...left.migrations, ...right.migrations };
    return merged;
}
