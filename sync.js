(() => {
    const PROFILE = 'KENT';
    const API_URL = '/api/sync';
    const META_KEY = 'icbc_cloud_sync_meta_KENT';
    const DEVICE_KEY = 'icbc_cloud_sync_device_id';
    const BACKUP_KEY = 'icbc_pre_cloud_backup_KENT';
    const QUESTION_KEY_PATTERN = /^C4-2026-\d{3,}$/;

    function stableHash(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function historyWithId(entry) {
        const signature = [entry?.date, entry?.score, entry?.mode, entry?.class].join('|');
        return {
            id: entry?.id || `history-${stableHash(signature)}`,
            date: entry?.date || new Date(0).toISOString(),
            score: Number(entry?.score) || 0,
            mode: entry?.mode || 'Mock Exam',
            class: entry?.class || 'class4-rest'
        };
    }

    class KentCloudSync {
        constructor() {
            this.app = null;
            this.started = false;
            this.syncInFlight = null;
            this.syncQueued = false;
            this.syncTimer = null;
            this.listenersInstalled = false;
            this.deviceId = this.getOrCreateDeviceId();
        }

        getOrCreateDeviceId() {
            let value = localStorage.getItem(DEVICE_KEY);
            if (value) return value;
            const randomPart = globalThis.crypto?.randomUUID?.()
                || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            value = `device-${randomPart}`;
            localStorage.setItem(DEVICE_KEY, value);
            return value;
        }

        isKent(app = this.app) {
            return app?.currentUser === PROFILE;
        }

        setStatus(state, detail = '') {
            const element = document.getElementById('cloud-sync-status');
            if (!element) return;
            const labels = {
                syncing: 'Cloud: syncing...',
                synced: 'Cloud: synced',
                local: 'Cloud unavailable - saved locally',
                disabled: 'Cloud sync: KENT only'
            };
            element.textContent = labels[state] || labels.local;
            element.dataset.state = state;
            element.title = detail || element.textContent;
        }

        backupLocalSnapshot(app) {
            if (app?.currentUser !== PROFILE || localStorage.getItem(BACKUP_KEY)) return;
            const snapshot = {
                createdAt: new Date().toISOString(),
                bankVersion: window.QUESTION_BANK_VERSION?.version || 'unknown',
                mistakes: app.mistakesBook || {},
                history: app.userHistory || [],
                practiceProgress: app.practiceProgress || []
            };
            localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
        }

        normalizeLegacyQuestionKeys(app) {
            if (!this.isKent(app)) return;
            const normalized = {};
            Object.entries(app.mistakesBook || {}).forEach(([key, value]) => {
                let uid = key;
                if (!QUESTION_KEY_PATTERN.test(uid) && /^\d+$/.test(key)) {
                    uid = window.QUESTION_BANK.find(question => question.id === Number(key))?.uid || '';
                }
                if (QUESTION_KEY_PATTERN.test(uid)) normalized[uid] = value;
            });
            app.mistakesBook = normalized;
            app.practiceProgress = [...new Set((app.practiceProgress || []).map(key => {
                if (QUESTION_KEY_PATTERN.test(key)) return key;
                if (/^\d+$/.test(String(key))) {
                    return window.QUESTION_BANK.find(question => question.id === Number(key))?.uid || '';
                }
                return '';
            }).filter(Boolean))];
        }

        loadMeta() {
            try {
                const parsed = JSON.parse(localStorage.getItem(META_KEY));
                if (parsed?.version === 1 && parsed.mistakes) return parsed;
            } catch {
                // A damaged sync index must never affect the primary local practice data.
            }
            return { version: 1, migrated: false, backupUploaded: false, mistakes: {} };
        }

        saveMeta(meta) {
            localStorage.setItem(META_KEY, JSON.stringify(meta));
        }

        markMistake(questionKey, value) {
            if (!this.isKent() || !QUESTION_KEY_PATTERN.test(questionKey)) return;
            const meta = this.loadMeta();
            meta.mistakes[questionKey] = {
                status: value.status === 'resolved' ? 'resolved' : 'active',
                correctStreak: Number(value.correctStreak) || 0,
                chapter: value.chapter || '',
                updatedAt: new Date().toISOString(),
                deviceId: this.deviceId
            };
            this.saveMeta(meta);
        }

        installListeners() {
            if (this.listenersInstalled) return;
            this.listenersInstalled = true;
            window.addEventListener('online', () => this.sync());
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.sync();
            });
            window.setInterval(() => this.sync(), 120000);
        }

        async start(app) {
            this.app = app;
            if (!this.isKent(app)) {
                this.setStatus('disabled');
                return;
            }
            this.backupLocalSnapshot(app);
            this.normalizeLegacyQuestionKeys(app);
            app.saveData({ sync: false });
            this.started = true;
            this.installListeners();
            await this.sync();
        }

        schedule() {
            if (!this.started || !this.isKent()) return;
            window.clearTimeout(this.syncTimer);
            this.syncTimer = window.setTimeout(() => this.sync(), 1000);
        }

        async fetchCloud() {
            const response = await fetch(API_URL, {
                headers: { 'X-Kent-Sync': '1' },
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error(`Cloud read failed (${response.status})`);
            return (await response.json()).state;
        }

        prepareState(cloud) {
            const meta = this.loadMeta();
            const now = new Date().toISOString();
            if (!meta.migrated) {
                meta.mistakes = { ...(cloud?.mistakes || {}) };
                Object.entries(this.app.mistakesBook || {}).forEach(([key, value]) => {
                    if (!meta.mistakes[key] && QUESTION_KEY_PATTERN.test(key)) {
                        meta.mistakes[key] = {
                            status: 'active',
                            correctStreak: Number(value.correctStreak) || 0,
                            chapter: value.chapter || '',
                            updatedAt: now,
                            deviceId: this.deviceId
                        };
                    }
                });
                meta.migrated = true;
            } else {
                Object.entries(this.app.mistakesBook || {}).forEach(([key, value]) => {
                    if (!meta.mistakes[key] && QUESTION_KEY_PATTERN.test(key)) {
                        meta.mistakes[key] = {
                            status: 'active',
                            correctStreak: Number(value.correctStreak) || 0,
                            chapter: value.chapter || '',
                            updatedAt: now,
                            deviceId: this.deviceId
                        };
                    }
                });
            }
            this.saveMeta(meta);
            return {
                schemaVersion: 1,
                profile: PROFILE,
                revision: Number(cloud?.revision) || 0,
                updatedAt: now,
                mistakes: meta.mistakes,
                practiceProgress: [...new Set(this.app.practiceProgress || [])],
                history: (this.app.userHistory || []).map(historyWithId),
                migrations: cloud?.migrations || {}
            };
        }

        applyState(state) {
            const activeMistakes = {};
            Object.entries(state.mistakes || {}).forEach(([key, value]) => {
                if (value.status === 'active') {
                    activeMistakes[key] = {
                        correctStreak: Number(value.correctStreak) || 0,
                        chapter: value.chapter || ''
                    };
                }
            });
            this.app.mistakesBook = activeMistakes;
            this.app.practiceProgress = [...new Set(state.practiceProgress || [])];
            this.app.userHistory = (state.history || []).map(historyWithId);
            this.app.saveData({ sync: false });
            this.app.updateMistakesCount();

            const meta = this.loadMeta();
            meta.mistakes = state.mistakes || {};
            meta.backupUploaded = true;
            meta.migrated = true;
            this.saveMeta(meta);
        }

        async sync() {
            if (!this.started || !this.isKent()) return;
            if (this.syncInFlight) {
                this.syncQueued = true;
                return this.syncInFlight;
            }

            this.setStatus('syncing');
            this.syncInFlight = (async () => {
                try {
                    const cloud = await this.fetchCloud();
                    const meta = this.loadMeta();
                    const localState = this.prepareState(cloud);
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Kent-Sync': '1'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            state: localState,
                            deviceId: this.deviceId,
                            initialMigration: !meta.backupUploaded
                        })
                    });
                    if (!response.ok) throw new Error(`Cloud write failed (${response.status})`);
                    const result = await response.json();
                    this.applyState(result.state);
                    this.setStatus('synced', `Last synchronized ${new Date().toLocaleString()}`);
                } catch (error) {
                    console.warn('KENT cloud sync deferred; local data is preserved.', error);
                    this.setStatus('local', error.message);
                } finally {
                    this.syncInFlight = null;
                    if (this.syncQueued) {
                        this.syncQueued = false;
                        this.schedule();
                    }
                }
            })();
            return this.syncInFlight;
        }

        downloadBackup() {
            if (!this.app) return;
            const payload = {
                exportedAt: new Date().toISOString(),
                profile: this.app.currentUser,
                mistakes: this.app.mistakesBook,
                history: this.app.userHistory,
                practiceProgress: this.app.practiceProgress,
                syncMeta: this.loadMeta()
            };
            const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `class4-kent-backup-${new Date().toISOString().slice(0, 10)}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
        }
    }

    window.KentCloudSync = KentCloudSync;
})();
