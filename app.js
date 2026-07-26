class App {
    constructor() {
        this.currentView = 'home-view';
        this.licenceClass = 'class4-rest';
        
        // Multi-user system
        this.users = JSON.parse(localStorage.getItem('icbc_users')) || [];
        this.currentUser = null;
        
        // Data states (will be loaded per user)
        this.userHistory = [];
        this.mistakesBook = {};
        this.practiceProgress = [];
        
        // Quiz states
        this.activeQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.mockTimerInterval = null;
        this.isMockExam = false;
        this.mistakeReviewMode = false;
        this.geminiApiKey = localStorage.getItem('icbc_gemini_key') || '';
        this.cloudSync = window.KentCloudSync ? new window.KentCloudSync() : null;
        
        // Registration & Access Control
        this.isRegistered = localStorage.getItem('icbc_is_registered') === 'true';
        this.attemptsUsed = parseInt(localStorage.getItem('icbc_attempts_used')) || 0;
        this.validCodeHashes = ["9e1c2839d15319bcf5a052a48f0954e74a4122b0e736be2dca48ebdaea9c8e2e", "2f98967685173c1513dcaeb001668d20bc11f6109618fed04ed487dfe950f623", "25412133ed721101caf0a2c2d54a0a7a594fe05d5cb7bbf0c4d4febfc9f9080d", "7ae8e2e4e669a8fea8bf4451920257c4e1bb311c579c4037f5e8d446ad27ba85", "0c2d365cbaa609f941b7542775553ddd164d4ecf3876483a8cf2ff15cce77ce0", "3f83037ada073b07887fe836151fe9effe844a589e4864221e4ba8e9d0a4852f", "50f632ebc65336b278d300b5147bc0e9688bdc097e011a0f83fbb47dd811f603", "1365e99d33f5dce73edd2c696d734fbcce02e29761d684e38f10f7f1eb343452", "a561b0ed6c806ce3a4a1849a8bc944d6a42669d2c21872a917d9bbbd434cba7f", "20624cb0db1461e6819049cf8d884febb5893720db7a9c0af890797dc22b8c5e", "0ce1b8d7373f6d14c5193749c713ac7d75f17a6fe16d387f3a0201cb9eb0801e", "df27ccdd5819b38a509a25adf5ae6d15bb36c2c0cf8753f61ea54ff3534faedc", "8c05931c71497340e5239c29f57ab409dd0f3cae5aa62dc7be5effa1698cfd7b", "0785159b739900af6bb9d968916f89a16f99688f457a089c485132f00fe40664", "b55d6f122e85ec5ad8ea213c689a76d56ab4042873c1f10f9da029061073573e", "3b3d89c56cbdff123d69078b75a7f462b4979a75a3944507f06d7c2473f19f13", "ad265477c13bcd6e3f5c1f82878e3f709e254e012a72b8caaae90288a0bb716c", "8af83617b378baf120ea71267c6aeb99f3a255e24b03ca7b4b442a281a57ee9f", "aada8651f337e82dd9e4b1ad21625b26ee54b25bb2d408af92b983094d3bf401", "763a5c14f87efcf1faf265d36eca1544a37eb088df044bb43e7224199708bd3d", "c6c15442dbc254052890b36f67cc6398fecc8a8a8ddd44b53b849a40f68bdfc1", "57d4d08df4b8fbb965a8dd94cd489e278109eec31121c92b3573c8f2473e5fa6", "de4ecddf962078fb5ae5a19afafd5590057d526c66698d9b36add9080f659bdb", "0721418eb78c5b2d6c9b3f12c8f241ff1a82a7bec218bb6dd4250c10ad40f4d5", "977a7347b59d699db1084131388cd48ca9d122806e85e50ad9a4ba04d5e3dde8", "6f795c38894cffa963c331edaec79615888a1e95bf9848bbbc6fd40430865872", "007149c20b1c5705f458d75a798fcbe09054b8fff7ca934dba61a299ab4fd016", "983e84700534c0990e5a5a838ed35f8e2cc9b4dd118eb3f50bcbf607bf395638", "ec95693cc5047ac018bc5e5a42a80bb1f043820de98cd9bb5cc524c7fe258a74", "279cda9b08c92b0863670a53a33647d7048a89e61ee662f89b98ff27cecf1be5", "0f7fb3a7a5a101955fa2ca9c8ae3cebcd9be9a82a745ac958b71907a9eea576f", "90f58da00e75256814063bdc2b670a980555d9a0bd47f91ff18f95bd1b5baf16", "6866ffbab2e2c74814b98e5baa9844a6976a2230fe1e6aa5fb374e044d31da5f", "faaf5e17c7562fdd8ff323c67de2e3b6d32a564965d65050cd8b683f0a937809", "75c748c793e4e420d11bd7def75794b55ddb5ec76d6fc75ff48d7488a99dee38", "a5e35bbb39952079f5f2223ec07740191deb83d65acdab31ea2b8715e5d11cdf", "18d866822cf5b4823100a5b8628db6bfeb6577ca891d129200fff7ff317ae638", "a670544b63b35277e69271e6a9d079d19d166c0343222f85250df7626517bb3c", "46279ead7bdeed230bbbdee37f33baec14e94f43e39b451b9895b616346a5724", "b6b26a242d3b4bfb7a9144deb72b152dbd18fdb37ec661ec41c63addb0287020", "a83b1618a91de3fd4b1c12a18ba95c9690997695abd91ff181b93365ce0a3c8d", "05452a296400c6916156f583735ced486e205d37c5093dd8097a0a18af20726e", "d6195c5b859e2a51786f2700eda1ea0f1a08da40a04c61cc79a362524678225d", "3dfd5c8719038a1d2893082eb8db15d7e3f57dcffcd5401947b7ca5e07aed4a1", "d3fbdbf522481938c9f612b673b14f81be624009b2f4223b79487f1885052cd3", "9b016d70aeaacd341c161069725a0a561d2ff8d0428f762f79b07d365e172462", "108a462de41f686d861aa0ca5623918b458e94f6b07b0d62704e83ef45bd5ab5", "9f4b5b687879880e01eb5d9a9f4c3f84748fb60cb4c41fd51d4061a76fcbea13", "46d4b3925f0dc175ed60317fd2edef4abfe22cad86673a3c745d1c93b7ad5403", "f9d38b123f57ca635fde3bfa57cfaa85135d003947a25e68e804a522c6311e4b"];
        
        this.migrateLegacyData();
        this.init();
        this.renderProfiles();
    }
    
    migrateLegacyData() {
        // If users list is empty but legacy data exists, migrate to KENT
        if (this.users.length === 0) {
            const legacyHistory = localStorage.getItem('icbc_history');
            const legacyMistakes = localStorage.getItem('icbc_mistakes');
            const legacyProgress = localStorage.getItem('icbc_practice_progress');
            
            if (legacyHistory || legacyMistakes || legacyProgress) {
                this.users.push('KENT');
                localStorage.setItem('icbc_users', JSON.stringify(this.users));
                
                if (legacyHistory) localStorage.setItem('icbc_history_KENT', legacyHistory);
                if (legacyMistakes) localStorage.setItem('icbc_mistakes_KENT', legacyMistakes);
                if (legacyProgress) localStorage.setItem('icbc_practice_progress_KENT', legacyProgress);
                
                // Clean up legacy
                localStorage.removeItem('icbc_history');
                localStorage.removeItem('icbc_mistakes');
                localStorage.removeItem('icbc_practice_progress');
            } else {
                // First time ever using app
                this.users.push('KENT');
                localStorage.setItem('icbc_users', JSON.stringify(this.users));
            }
        }
    }
    
    renderProfiles() {
        const list = document.getElementById('profile-list');
        list.innerHTML = '';
        this.users.forEach(user => {
            const btn = document.createElement('div');
            btn.className = 'profile-card';
            btn.style = 'background: rgba(255,255,255,0.05); padding: 2rem 1.5rem; border-radius: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; width: 140px; display: flex; flex-direction: column; align-items: center; gap: 1rem;';
            btn.onmouseover = () => {
                btn.style.borderColor = 'var(--primary-color)';
                btn.style.transform = 'translateY(-4px)';
                btn.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
            };
            btn.onmouseout = () => {
                btn.style.borderColor = 'rgba(255,255,255,0.1)';
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            };
            btn.onclick = () => this.selectProfile(user);
            
            const initial = user.charAt(0).toUpperCase();
            btn.innerHTML = `
                <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: white;">
                    ${initial}
                </div>
                <div style="font-weight: 500; font-size: 1.1rem; color: var(--text-primary); letter-spacing: 0.5px;">
                    ${user}
                </div>
            `;
            list.appendChild(btn);
        });
    }
    
    selectProfile(username) {
        this.currentUser = username;
        document.getElementById('active-user-display').textContent = username;
        
        // Load user-specific data
        this.userHistory = JSON.parse(localStorage.getItem(`icbc_history_${username}`)) || [];
        this.mistakesBook = JSON.parse(localStorage.getItem(`icbc_mistakes_${username}`)) || {};
        this.practiceProgress = JSON.parse(localStorage.getItem(`icbc_practice_progress_${username}`)) || [];
        this.cloudSync?.backupLocalSnapshot(this);
        this.cloudSync?.normalizeLegacyQuestionKeys(this);
        this.resetLearningStateForNewBank();
        
        document.getElementById('profile-gate').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        this.updateMistakesCount();
        this.navigate('home-view');
        void this.cloudSync?.start(this);
    }
    
    switchProfile() {
        document.getElementById('profile-gate').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
    
    showCreateProfile() {
        document.getElementById('create-profile-modal').classList.remove('hidden');
    }
    
    createNewProfile() {
        const name = document.getElementById('new-profile-name').value.trim().toUpperCase();
        if (!name) return;
        if (this.users.includes(name)) {
            alert('Profile already exists!');
            return;
        }
        
        this.users.push(name);
        localStorage.setItem('icbc_users', JSON.stringify(this.users));
        document.getElementById('new-profile-name').value = '';
        document.getElementById('create-profile-modal').classList.add('hidden');
        
        this.renderProfiles();
        this.selectProfile(name);
    }
    
    init() {
        // Navigation bindings
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.nav-btn').dataset.target;
                if (target === 'practice-view') {
                    this.startPractice();
                    return;
                }
                this.navigate(target);
            });
        });
        
        // Licence change binding
        document.getElementById('licence-class').addEventListener('change', (e) => {
            this.licenceClass = e.target.value;
            this.updateTopicDropdown();
            this.updateAllTopicCount();
            this.updateMistakesCount();
            if (document.getElementById('home-view').classList.contains('active-view')) {
                this.renderAnalytics();
            }
        });
        
        this.updateTopicDropdown();
        
        // Start buttons
        document.getElementById('start-practice-btn').addEventListener('click', () => this.startPractice());
        document.getElementById('start-mock-btn').addEventListener('click', () => this.startMockExam());
        document.getElementById('start-mistakes-btn').addEventListener('click', () => {
            if (this.checkPremiumAccess()) this.startMistakesReview();
        });
        
        // Premium Activation
        document.getElementById('activate-btn').addEventListener('click', async () => {
            const input = document.getElementById('registration-code-input').value.trim().toUpperCase();
            if (!input) return;
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            if (this.validCodeHashes.includes(hashHex)) {
                this.isRegistered = true;
                localStorage.setItem('icbc_is_registered', 'true');
                document.getElementById('activation-error').style.display = 'none';
                alert('Premium Access Unlocked! Welcome!\n会员权限已解锁，欢迎使用！');
                this.navigate('home-view');
            } else {
                document.getElementById('activation-error').style.display = 'block';
            }
        });
        
        // Quiz controls
        document.getElementById('next-prac-btn').addEventListener('click', () => this.nextPracticeQuestion());
        document.getElementById('next-mock-btn').addEventListener('click', () => this.nextMockQuestion());
        document.getElementById('prev-mock-btn').addEventListener('click', () => this.prevMockQuestion());
        document.getElementById('submit-mock-btn').addEventListener('click', () => this.submitMockExam());
        document.getElementById('next-mistake-btn').addEventListener('click', () => this.nextMistakeQuestion());
        
        // Topic filter
        document.getElementById('practice-topic-filter').addEventListener('change', () => this.startPractice());
        
        this.updateMistakesCount();
        this.updateAllTopicCount();

        // Settings bindings
        const keyInput = document.getElementById('api-key-input');
        if (keyInput && this.geminiApiKey) keyInput.value = this.geminiApiKey;
        const saveKeyBtn = document.getElementById('save-key-btn');
        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', () => {
                this.geminiApiKey = keyInput.value.trim();
                localStorage.setItem('icbc_gemini_key', this.geminiApiKey);
                const status = document.getElementById('key-save-status');
                status.style.display = 'inline';
                setTimeout(() => status.style.display = 'none', 2000);
            });
        }

        // Setup mobile pull-down to show topic filter
        let touchstartY = 0;
        document.addEventListener('touchstart', e => {
            touchstartY = e.changedTouches[0].screenY;
        }, {passive: true});
        document.addEventListener('touchend', e => {
            let touchendY = e.changedTouches[0].screenY;
            if (touchendY > touchstartY + 50) { // Swipe down detected
                if (document.body.classList.contains('quiz-focus-mode')) {
                    document.body.classList.add('show-mobile-topic-filter');
                }
            }
        }, {passive: true});
    }
    

    enterFocusMode() {
        document.body.classList.add('quiz-focus-mode');
        document.getElementById('quit-focus-btn').classList.remove('hidden');
    }
    
    exitFocusMode() {
        document.body.classList.remove('quiz-focus-mode');
        document.getElementById('quit-focus-btn').classList.add('hidden');
        this.navigate('home-view');
    }

    navigate(targetId) {
        // Stop any active timers
        clearInterval(this.mockTimerInterval);
        
        // Update nav UI
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const navBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
        if (navBtn) navBtn.classList.add('active');
        
        // Update view UI
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active-view');
        });
        const targetView = document.getElementById(targetId);
        targetView.classList.remove('hidden');
        targetView.classList.add('active-view');
        
        // View specific initializations
        if (targetId === 'mock-view') {
            document.getElementById('mock-intro').classList.remove('hidden');
            document.getElementById('mock-active').classList.add('hidden');
        document.body.classList.remove('quiz-focus-mode');
        document.getElementById('quit-focus-btn').classList.add('hidden');
            document.getElementById('mock-results').classList.add('hidden');
        } else if (targetId === 'mistakes-view') {
            this.updateMistakesCount();
        } else if (targetId === 'analytics-view') {
            this.renderAnalytics();
        }
        
        this.currentView = targetId;
    }
    
    async askAI(questionId, containerId) {
        if (!this.geminiApiKey) {
            alert('Please configure your Gemini API Key in the Settings first!');
            this.navigate('settings-view');
            return;
        }
        
        const q = window.QUESTION_BANK.find(q => q.id === parseInt(questionId));
        if (!q) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Setup AI UI
        let aiBox = container.querySelector('.ai-response-box');
        if (!aiBox) {
            aiBox = document.createElement('div');
            aiBox.className = 'ai-response-box mt-4 p-4';
            aiBox.style.background = 'rgba(59, 130, 246, 0.1)';
            aiBox.style.borderLeft = '4px solid var(--primary-color)';
            aiBox.style.borderRadius = 'var(--border-radius-sm)';
            container.appendChild(aiBox);
        }
        
        aiBox.innerHTML = '<p style="color: var(--primary-color);">AI Expert is thinking...</p>';
        
        const className = this.licenceClass === 'class5' ? 'Class 5 Passenger Vehicle' : 'Class 4 Commercial';
        const promptText = `I am studying for the ICBC ${className} Driving Knowledge Test.
I encountered this multiple choice question:
Question: ${q.question}
Options:
A: ${q.options.A}
B: ${q.options.B}
C: ${q.options.C}
D: ${q.options.D}

The correct answer is ${q.answer}.
Please act as an expert driving instructor and explain deeply and clearly why ${q.answer} is correct, and briefly why the other options are incorrect. Keep it encouraging and easy to understand.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-2-27b-it:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });
            
            const data = await response.json();
            if (data.error) {
                aiBox.innerHTML = `<p style="color: var(--danger-color);">❌ API Error: ${data.error.message}</p>`;
                return;
            }
            
            const aiText = data.candidates[0].content.parts[0].text;
            // Simple markdown parsing for bold and line breaks
            const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            
            aiBox.innerHTML = `
                <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">AI Explanation:</h4>
                <div style="font-size: 0.95rem; line-height: 1.6;">${formattedText}</div>
            `;
            
        } catch (error) {
            aiBox.innerHTML = `<p style="color: var(--danger-color);">❌ Failed to connect to AI. Check your network or API key.</p>`;
        }
    }

    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    getQuestionKey(question) {
        return question.uid || String(question.id);
    }

    resetLearningStateForNewBank() {
        const bankVersion = window.QUESTION_BANK_VERSION?.version || 'unknown';
        const schemaVersion = String(window.QUESTION_BANK_VERSION?.schemaVersion || 2);
        const versionKey = `icbc_bank_version_${this.currentUser}`;
        const schemaKey = `icbc_bank_schema_${this.currentUser}`;

        // Question UIDs are stable. Never erase local learning data during an additive bank update.
        localStorage.setItem(schemaKey, schemaVersion);
        localStorage.setItem(versionKey, bankVersion);
        this.saveData();
    }

    updateTopicDropdown() {
        const select = document.getElementById('practice-topic-filter');
        if (!select) return;
        const currentVal = select.value;
        if (this.licenceClass === 'class5') {
            select.innerHTML = `<option value="all">All Class 5 Topics</option>
                <option value="chapter-rules">Rules of the Road</option>
                <option value="chapter-signs">Signs, Signals & Markings</option>
                <option value="chapter-intersections">Intersections & Right-of-Way</option>
                <option value="chapter-sharing">Sharing the Road</option>
                <option value="chapter-emergencies">Emergencies & Safety</option>
                <option value="chapter-parking">Parking & Maneuvers</option>`;
        } else {
            select.innerHTML = `<option value="all">All Class 4 Topics</option>
                <option value="chapter1">Chapter 1: Licensing</option>
                <option value="chapter2">Chapter 2: Heavy Vehicle Braking</option>
                <option value="chapter3">Chapter 3: Driving Rules & Basics</option>
                <option value="chapter4">Chapter 4: Fuel-Efficient Driving</option>
                <option value="chapter5">Chapter 5: Required Special Topics</option>
                <option value="chapter6">Chapter 6: Passenger Safety & Rules</option>
                <option value="chapter7">Chapter 7: Hours of Service</option>
                <option value="chapter10">Chapter 10: Pre-Trip Inspection</option>
                <option value="chapter11">Chapter 11: Signs & Signals</option>`;
        }
        
        // Try to restore previous selection if it still exists
        const options = Array.from(select.options).map(o => o.value);
        if (options.includes(currentVal)) {
            select.value = currentVal;
        } else {
            select.value = 'all';
        }
        
        this.updateDynamicText();
    }
    
    updateDynamicText() {
        const isClass5 = this.licenceClass === 'class5';
        const classLabel = isClass5 ? 'Class 5' : 'Class 4';
        
        const elements = {
            'page-title': `ICBC ${classLabel} Practice`,
            'nav-logo': `${classLabel} Prep`,
            'main-title': `${classLabel} Practice Bank`,
            'mock-card-desc': `A 35-question, 45-minute study simulation covering every ${classLabel} topic.`,
            'mock-intro-text': `This study simulation selects 35 questions from a balanced ${classLabel} topic blueprint. The 45-minute timer and 80% target are practice settings, not a claim about the current live ICBC test format.`
        };
        
        for (const [id, text] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = text;
            }
        }
    }

    updateAllTopicCount() {
        const count = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass)).length;
        const allOption = document.querySelector('#practice-topic-filter option[value="all"]');
        if (allOption) {
            const className = this.licenceClass === 'class5' ? 'Class 5' : 'Class 4';
            allOption.textContent = `All ${className} Topics (${count} Questions)`;
        }
    }

    getSourceHtml(question) {
        if (!question.source) return '';
        const source = question.source;
        const label = `${source.document} (${source.version}), p. ${source.page} - ${source.section}`;
        return `<div class="question-source"><strong>Official source:</strong> <a href="${source.url}" target="_blank" rel="noopener noreferrer">${label}</a></div>`;
    }
    
    getFilteredQuestions(mode, topic = 'all') {
        // Filter by licence class first
        let filtered = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass));
        
        if (mode === 'practice' && topic !== 'all') {
            filtered = filtered.filter(q => q.chapter === topic);
        }
        
        // Shuffle array using Fisher-Yates
        return this.shuffleArray(filtered);
    }
    
    checkPremiumAccess() {
        if (this.isRegistered) return true;
        if (this.attemptsUsed < 1) {
            this.attemptsUsed++;
            localStorage.setItem('icbc_attempts_used', this.attemptsUsed.toString());
            return true;
        }
        
        // Show premium upgrade view
        this.navigate('premium-upgrade-view');
        return false;
    }
    
    // --- PRACTICE MODE ---
    startPractice() {
        if (!this.checkPremiumAccess()) return;
        
        const topic = document.getElementById('practice-topic-filter').value;
        let allFiltered = this.getFilteredQuestions('practice', topic);
        
        let unseen = allFiltered.filter(q => !this.practiceProgress.includes(this.getQuestionKey(q)));
        
        if(unseen.length === 0) {
            if (allFiltered.length > 0) {
                if (confirm('You have completed all questions in this topic! Do you want to restart and practice them again?')) {
                    const topicIds = allFiltered.map(q => this.getQuestionKey(q));
                    this.practiceProgress = this.practiceProgress.filter(id => !topicIds.includes(id));
                    this.saveData();
                    unseen = allFiltered;
                } else {
                    return;
                }
            } else {
                alert('No questions found for this topic/class combination.');
                return;
            }
        }
        
        // Take up to 40 questions per session
        this.activeQuestions = unseen.slice(0, 40);
        
        this.currentQuestionIndex = 0;
        this.isMockExam = false;
        this.mistakeReviewMode = false;
        this.geminiApiKey = localStorage.getItem('icbc_gemini_key') || '';
        
        document.getElementById('prac-total-q').textContent = this.activeQuestions.length;
        this.enterFocusMode();
        document.body.classList.add('show-mobile-topic-filter');
        this.renderQuestion('practice');
        this.navigate('practice-view');
    }
    
    // --- MOCK EXAM MODE ---
    startMockExam() {
        if (!this.checkPremiumAccess()) return;
        
        // Balanced Class 4 study blueprint. This does not claim to reproduce live ICBC weighting.
        const baseFiltered = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass));
        const getQuestionsByChapter = (chapterPrefix, limit) => {
            return this.shuffleArray(baseFiltered.filter(q => q.chapter.startsWith(chapterPrefix))).slice(0, limit);
        };
        let blueprint = {};
        if (this.licenceClass === 'class5') {
            blueprint = {
                'chapter-rules': 8,
                'chapter-signs': 5,
                'chapter-intersections': 7,
                'chapter-sharing': 5,
                'chapter-emergencies': 5,
                'chapter-parking': 5
            };
        } else {
            blueprint = {
                chapter1: 3,
                chapter2: 3,
                chapter3: 4,
                chapter4: 2,
                chapter5: 1,
                chapter6: 8,
                chapter7: 5,
                chapter10: 6,
                chapter11: 3
            };
        }
        let mockQuestions = Object.entries(blueprint)
            .flatMap(([chapter, count]) => getQuestionsByChapter(chapter, count));
        
        // Pad with random if pool lacks enough questions for specific quotas
        if (mockQuestions.length < 35) {
            const usedIds = new Set(mockQuestions.map(q => this.getQuestionKey(q)));
            const remaining = this.shuffleArray(baseFiltered.filter(q => !usedIds.has(this.getQuestionKey(q))));
            mockQuestions = [...mockQuestions, ...remaining.slice(0, 35 - mockQuestions.length)];
        }
        
        // Final shuffle so the test isn't clustered by chapter
        this.activeQuestions = this.shuffleArray(mockQuestions);
        
        this.currentQuestionIndex = 0;
        this.isMockExam = true;
        this.mistakeReviewMode = false;
        this.geminiApiKey = localStorage.getItem('icbc_gemini_key') || '';
        this.score = 0;
        
        // Init mock state (user answers)
        this.activeQuestions.forEach(q => q.userAnswer = null);
        
        document.getElementById('mock-intro').classList.add('hidden');
        document.getElementById('mock-active').classList.remove('hidden');
        
        this.startTimer(45 * 60, document.getElementById('mock-timer'));
        this.enterFocusMode();
        this.renderQuestion('mock');
    }
    
    startTimer(seconds, display) {
        let timer = seconds, minutes, secs;
        this.mockTimerInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            secs = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            secs = secs < 10 ? "0" + secs : secs;

            display.textContent = minutes + ":" + secs;
            
            if (timer < 300) {
                display.classList.add('warning');
            }

            if (--timer < 0) {
                clearInterval(this.mockTimerInterval);
                this.submitMockExam();
            }
        }, 1000);
    }
    
    // --- MISTAKES BOOK ---
    updateMistakesCount() {
        const mistakeIds = Object.keys(this.mistakesBook);
        const relevantMistakes = window.QUESTION_BANK.filter(q => mistakeIds.includes(this.getQuestionKey(q)) && q.classes.includes(this.licenceClass));
        const count = relevantMistakes.length;
        document.getElementById('mistakes-count').textContent = count;
        
        if (count > 0) {
            document.getElementById('mistakes-list').classList.remove('hidden');
            document.getElementById('mistakes-empty').classList.add('hidden');
        } else {
            document.getElementById('mistakes-list').classList.add('hidden');
            document.getElementById('mistakes-empty').classList.remove('hidden');
            document.getElementById('mistakes-active').classList.add('hidden');
        }
    }
    
    startMistakesReview() {
        const mistakeIds = Object.keys(this.mistakesBook);
        this.activeQuestions = window.QUESTION_BANK.filter(q => mistakeIds.includes(this.getQuestionKey(q)) && q.classes.includes(this.licenceClass));
        this.activeQuestions = this.activeQuestions.sort(() => Math.random() - 0.5); // Shuffle
        
        this.currentQuestionIndex = 0;
        this.isMockExam = false;
        this.mistakeReviewMode = true;
        
        document.getElementById('mistakes-list').classList.add('hidden');
        document.getElementById('mistakes-active').classList.remove('hidden');
        document.getElementById('mistake-total-q').textContent = this.activeQuestions.length;
        
        this.enterFocusMode();
        this.renderQuestion('mistake');
    }
    
    logMistake(question) {
        const questionKey = this.getQuestionKey(question);
        if (!this.mistakesBook[questionKey]) {
            this.mistakesBook[questionKey] = { correctStreak: 0, chapter: question.chapter };
        } else {
            this.mistakesBook[questionKey].correctStreak = 0;
        }
        this.cloudSync?.markMistake(questionKey, {
            status: 'active',
            correctStreak: 0,
            chapter: question.chapter
        });
        this.saveData();
    }
    
    logCorrectMistake(question) {
        const questionKey = this.getQuestionKey(question);
        if (this.mistakesBook[questionKey]) {
            this.mistakesBook[questionKey].correctStreak++;
            const correctStreak = this.mistakesBook[questionKey].correctStreak;
            if (correctStreak >= 2) {
                delete this.mistakesBook[questionKey];
                this.cloudSync?.markMistake(questionKey, {
                    status: 'resolved',
                    correctStreak: 2,
                    chapter: question.chapter
                });
            } else {
                this.cloudSync?.markMistake(questionKey, {
                    status: 'active',
                    correctStreak,
                    chapter: question.chapter
                });
            }
            this.saveData();
        }
    }
    
    saveData(options = {}) {
        if (!this.currentUser) return;
        localStorage.setItem(`icbc_mistakes_${this.currentUser}`, JSON.stringify(this.mistakesBook));
        localStorage.setItem(`icbc_history_${this.currentUser}`, JSON.stringify(this.userHistory));
        localStorage.setItem(`icbc_practice_progress_${this.currentUser}`, JSON.stringify(this.practiceProgress));
        if (options.sync !== false) this.cloudSync?.schedule();
    }

    downloadDataBackup() {
        this.cloudSync?.downloadBackup();
    }
    
    // --- SHARED RENDER LOGIC ---
    renderQuestion(mode) {
        this.hasAnswered = false;
        
        const q = this.activeQuestions[this.currentQuestionIndex];
        const containerId = `${mode}-question-card`;
        const container = document.getElementById(containerId);
        
        // Update index
        if (mode === 'practice') document.getElementById('prac-current-q').textContent = this.currentQuestionIndex + 1;
        if (mode === 'mock') document.getElementById('mock-current-q').textContent = this.currentQuestionIndex + 1;
        if (mode === 'mistake') document.getElementById('mistake-current-q').textContent = this.currentQuestionIndex + 1;
        
        let html = '';
        if (q.image) {
            html += `<div class="question-image-container"><img src="${q.image}" alt="Sign" class="question-img" /></div>`;
        }
        
        html += `
            <div class="question-text">${q.question}</div>
            <div class="options-grid">
        `;
        
        const options = ['A', 'B', 'C', 'D'];
        options.forEach(opt => {
            if (q.options[opt]) {
                const isSelected = q.userAnswer === opt;
                const extraClass = (mode === 'mock' && isSelected) ? 'selected' : '';
                html += `
                    <button class="option-btn ${extraClass}" onclick="app.handleAnswer('${opt}', '${mode}')" id="opt-${mode}-${opt}">
                        <strong>${opt}.</strong> &nbsp; ${q.options[opt]}
                    </button>
                `;
            }
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
        // Reset specific UI
        if (mode === 'practice') {
            document.getElementById('practice-feedback').classList.add('hidden');
            document.getElementById('practice-controls').classList.add('hidden');
        } else if (mode === 'mistake') {
            document.getElementById('mistake-feedback').classList.add('hidden');
            document.getElementById('mistake-controls').classList.add('hidden');
        } else if (mode === 'mock') {
            document.getElementById('prev-mock-btn').classList.toggle('hidden', this.currentQuestionIndex === 0);
            if (this.currentQuestionIndex === this.activeQuestions.length - 1) {
                document.getElementById('next-mock-btn').classList.add('hidden');
                document.getElementById('submit-mock-btn').classList.remove('hidden');
            } else {
                document.getElementById('next-mock-btn').classList.remove('hidden');
                document.getElementById('submit-mock-btn').classList.add('hidden');
            }
        }
    }
    
    handleAnswer(selectedOpt, mode) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        
        // Hide topic filter on mobile after answering
        document.body.classList.remove('show-mobile-topic-filter');
        
        const q = this.activeQuestions[this.currentQuestionIndex];
        const buttons = document.querySelectorAll(`#${mode}-question-card .option-btn`);
        
        if (mode === 'mock') {
            q.userAnswer = selectedOpt;
            buttons.forEach(btn => btn.classList.remove('selected'));
            document.getElementById(`opt-${mode}-${selectedOpt}`).classList.add('selected');
            return;
        }
        
        // Practice or Mistake mode - Instant feedback
        buttons.forEach(btn => btn.disabled = true);
        
        const isCorrect = selectedOpt === q.answer;
        const selectedBtn = document.getElementById(`opt-${mode}-${selectedOpt}`);
        const correctBtn = document.getElementById(`opt-${mode}-${q.answer}`);
        
        if (isCorrect) {
            selectedBtn.classList.add('correct');
            if (mode === 'mistake') this.logCorrectMistake(q);
        } else {
            selectedBtn.classList.add('wrong');
            correctBtn.classList.add('correct');
            this.logMistake(q);
        }
        
        const questionKey = this.getQuestionKey(q);
        if (mode === 'practice' && !this.practiceProgress.includes(questionKey)) {
            this.practiceProgress.push(questionKey);
            this.saveData();
        }
        
        // Show feedback
        const feedbackContainer = document.getElementById(`${mode}-feedback`);
        feedbackContainer.className = `feedback-container ${isCorrect ? 'correct' : 'wrong'}`;
        feedbackContainer.innerHTML = `
            <h3>${isCorrect ? 'Correct' : 'Incorrect'}</h3>
            <p>${q.explanation}</p>
            ${this.getSourceHtml(q)}
        `;
        
        const controls = document.getElementById(`${mode}-controls`);
        let aiBtn = controls.querySelector('.ask-ai-btn');
        if (!aiBtn) {
            aiBtn = document.createElement('button');
            aiBtn.className = 'secondary-btn ask-ai-btn';
            controls.insertBefore(aiBtn, controls.firstChild);
        }
        aiBtn.onclick = () => app.askAI(`${q.id}`, `${mode}-feedback`);
        aiBtn.textContent = 'Ask AI Expert';
        
        document.getElementById(`${mode}-controls`).classList.remove('hidden');
    }
    
    // Navigation inside modes
    nextPracticeQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.activeQuestions.length) {
            this.enterFocusMode();
        this.renderQuestion('practice');
        } else {
            alert('Practice completed for this topic!');
            this.exitFocusMode();
        }
    }
    
    nextMistakeQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.activeQuestions.length) {
            this.enterFocusMode();
        this.renderQuestion('mistake');
        } else {
            alert('Mistakes review session completed!');
            document.body.classList.remove('quiz-focus-mode');
            document.getElementById('quit-focus-btn').classList.add('hidden');
            this.updateMistakesCount();
            this.navigate('mistakes-view');
        }
    }
    
    nextMockQuestion() {
        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.enterFocusMode();
        this.renderQuestion('mock');
        }
    }
    
    prevMockQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.enterFocusMode();
        this.renderQuestion('mock');
        }
    }
    
    submitMockExam() {
        clearInterval(this.mockTimerInterval);
        document.getElementById('mock-active').classList.add('hidden');
        document.body.classList.remove('quiz-focus-mode');
        document.getElementById('quit-focus-btn').classList.add('hidden');
        
        let score = 0;
        this.activeQuestions.forEach(q => {
            const questionKey = this.getQuestionKey(q);
            if (!this.practiceProgress.includes(questionKey)) {
                this.practiceProgress.push(questionKey);
            }
            if (q.userAnswer === null) {
                this.logMistake(q);
            } else if (q.userAnswer === q.answer) {
                score++;
            } else {
                this.logMistake(q);
            }
        });
        
        const percentage = Math.round((score / this.activeQuestions.length) * 100);
        
        // Save history
        this.userHistory.push({
            date: new Date().toISOString(),
            score: percentage,
            mode: 'Mock Exam',
            class: this.licenceClass
        });
        this.saveData();
        
        document.getElementById('mock-results').classList.remove('hidden');
        document.getElementById('final-score').textContent = percentage;
        
        const msgEl = document.getElementById('score-message');
        if (percentage >= 80) {
            msgEl.textContent = "You reached the 80% study target for this practice simulation.";
            msgEl.style.color = "var(--success-color)";
        } else {
            msgEl.textContent = "You have not reached the 80% study target yet. Review the questions below and try again.";
            msgEl.style.color = "var(--danger-color)";
        }
        
        // Render detailed review list
        let reviewContainer = document.getElementById('mock-review-container');
        if (!reviewContainer) {
            reviewContainer = document.createElement('div');
            reviewContainer.id = 'mock-review-container';
            reviewContainer.style.marginTop = '2rem';
            reviewContainer.style.textAlign = 'left';
            document.getElementById('mock-results').appendChild(reviewContainer);
        }
        
        let html = '<h3 style="margin-bottom: 1rem;">Detailed Review</h3>';
        this.activeQuestions.forEach((q, index) => {
            const isSkipped = q.userAnswer === null;
            const isCorrect = q.userAnswer === q.answer;
            let icon = isCorrect ? 'Correct' : 'Incorrect';
            if (isSkipped) icon = 'Skipped';
            
            const userAnsText = q.userAnswer ? `${q.userAnswer}. ${q.options[q.userAnswer]}` : 'Skipped / No Answer';
            const correctAnsText = `${q.answer}. ${q.options[q.answer]}`;
            
            html += `
                <div class="review-item" style="background: rgba(255,255,255,0.05); margin-bottom: 1.5rem; padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${isCorrect ? 'var(--success-color)' : (isSkipped ? '#f59e0b' : 'var(--danger-color)')};">
                    <h4 style="margin-top: 0;">${icon} Q${index + 1}: ${q.question}</h4>
                    ${q.image ? `<img src="${q.image}" style="max-height: 100px; display: block; margin-bottom: 1rem;" />` : ''}
                    <p style="margin: 0.5rem 0;"><strong>Your Answer:</strong> <span style="color: ${isCorrect ? 'var(--success-color)' : 'var(--danger-color)'}">${userAnsText}</span></p>
                    ${!isCorrect ? `<p style="margin: 0.5rem 0; color: var(--success-color);"><strong>Correct Answer:</strong> ${correctAnsText}</p>` : ''}
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; color: #ccc;">
                        <strong>Explanation:</strong> ${q.explanation}
                        ${this.getSourceHtml(q)}
                    </div>
                </div>
            `;
        });
        document.getElementById('mock-review-container').innerHTML = html;
        
        this.updateRadarChart();
    }   
    
    // --- ANALYTICS ---
    renderAnalytics() {
        // Readiness combines question coverage with unresolved mistakes. Unseen topics start at 0.
        const chapterErrors = {};
        Object.values(this.mistakesBook).forEach(m => {
            chapterErrors[m.chapter] = (chapterErrors[m.chapter] || 0) + 1;
        });
        
        let chapters = [];
        let labels = [];
        
        if (this.licenceClass === 'class5') {
            chapters = ['chapter-rules', 'chapter-signs', 'chapter-intersections', 'chapter-sharing', 'chapter-emergencies', 'chapter-parking'];
            labels = ['Rules', 'Signs', 'Intersections', 'Sharing', 'Emergencies', 'Parking'];
        } else {
            chapters = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter10', 'chapter11'];
            labels = ['Licensing', 'Braking', 'Driving', 'Fuel', 'Special Rules', 'Passengers', 'Hours', 'Pre-Trip', 'Signs'];
        }
        
        const data = chapters.map(ch => {
            const available = window.QUESTION_BANK.filter(q => q.chapter === ch && q.classes.includes(this.licenceClass));
            const attempted = available.filter(q => this.practiceProgress.includes(this.getQuestionKey(q))).length;
            const errors = chapterErrors[ch] || 0;
            if (available.length === 0) return 0;
            return Math.max(0, Math.round(((attempted - errors) / available.length) * 100));
        });
        
        // Find weakest
        const weakestIndices = data.map((val, idx) => ({val, idx})).sort((a,b) => a.val - b.val).slice(0, 2);
        const weakList = document.getElementById('weak-topics-list');
        weakList.innerHTML = '';
        weakestIndices.forEach(item => {
            weakList.innerHTML += `
                <li>
                    <span class="topic-name">${labels[item.idx]}</span>
                    <span class="topic-score">Needs Work</span>
                </li>
            `;
        });
        
        // Render Chart
        const ctx = document.getElementById('radarChart');
        if (window.myRadarChart) { window.myRadarChart.destroy(); }
        
        window.myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Practice Readiness %',
                    data: data,
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(59, 130, 246)'
                }]
            },
            options: {
                elements: { line: { tension: 0.3 } },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94a3b8', font: { size: 12 } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
        
        // Bind generate btn
        document.getElementById('generate-targeted-btn').onclick = () => {
            document.getElementById('practice-topic-filter').value = chapters[weakestIndices[0].idx];
            this.startPractice();
        };
    }
}

// Init App when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
