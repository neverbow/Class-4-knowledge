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
            this.updateAllTopicCount();
        });
        
        // Start buttons
        document.getElementById('start-practice-btn').addEventListener('click', () => this.startPractice());
        document.getElementById('start-mock-btn').addEventListener('click', () => this.startMockExam());
        document.getElementById('start-mistakes-btn').addEventListener('click', () => this.startMistakesReview());
        
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
        
        const promptText = `I am studying for the ICBC Class 4 Commercial Driving Knowledge Test.
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

    updateAllTopicCount() {
        const count = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass)).length;
        const allOption = document.querySelector('#practice-topic-filter option[value="all"]');
        if (allOption) allOption.textContent = `All Class 4 Topics (${count} Questions)`;
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
    
    // --- PRACTICE MODE ---
    startPractice() {
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
        this.renderQuestion('practice');
        this.navigate('practice-view');
    }
    
    // --- MOCK EXAM MODE ---
    startMockExam() {
        // Balanced Class 4 study blueprint. This does not claim to reproduce live ICBC weighting.
        const baseFiltered = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass));
        const getQuestionsByChapter = (chapterPrefix, limit) => {
            return this.shuffleArray(baseFiltered.filter(q => q.chapter.startsWith(chapterPrefix))).slice(0, limit);
        };
        const blueprint = {
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
        const count = Object.keys(this.mistakesBook).length;
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
        this.activeQuestions = window.QUESTION_BANK.filter(q => mistakeIds.includes(this.getQuestionKey(q)));
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
        
        const chapters = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter10', 'chapter11'];
        const labels = ['Licensing', 'Braking', 'Driving', 'Fuel', 'Special Rules', 'Passengers', 'Hours', 'Pre-Trip', 'Signs'];
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
