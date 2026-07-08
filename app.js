class App {
    constructor() {
        this.currentView = 'home-view';
        this.licenceClass = 'class4-rest';
        
        // Data states
        this.userHistory = JSON.parse(localStorage.getItem('icbc_history')) || [];
        this.mistakesBook = JSON.parse(localStorage.getItem('icbc_mistakes')) || {};
        this.practiceProgress = JSON.parse(localStorage.getItem('icbc_practice_progress')) || [];
        
        // Quiz states
        this.activeQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.mockTimerInterval = null;
        this.isMockExam = false;
        this.mistakeReviewMode = false;
        
        this.init();
    }
    
    init() {
        // Navigation bindings
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.nav-btn').dataset.target;
                this.navigate(target);
            });
        });
        
        // Licence change binding
        document.getElementById('licence-class').addEventListener('change', (e) => {
            this.licenceClass = e.target.value;
            // Optionally reset/refresh views
        });
        
        // Start buttons
        document.querySelector('#home-view .primary-btn').addEventListener('click', () => this.startPractice());
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
            document.getElementById('mock-results').classList.add('hidden');
        } else if (targetId === 'mistakes-view') {
            this.updateMistakesCount();
        } else if (targetId === 'analytics-view') {
            this.renderAnalytics();
        }
        
        this.currentView = targetId;
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
        
        let unseen = allFiltered.filter(q => !this.practiceProgress.includes(q.id));
        
        if(unseen.length === 0) {
            if (allFiltered.length > 0) {
                if (confirm('You have completed all questions in this topic! Do you want to restart and practice them again?')) {
                    const topicIds = allFiltered.map(q => q.id);
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
        
        document.getElementById('prac-total-q').textContent = this.activeQuestions.length;
        this.renderQuestion('practice');
        this.navigate('practice-view');
    }
    
    // --- MOCK EXAM MODE ---
    startMockExam() {
        // Enforce strict chapter proportions for a realistic 35-question mock exam
        const baseFiltered = window.QUESTION_BANK.filter(q => q.classes.includes(this.licenceClass));
        const getQuestionsByChapter = (chapterPrefix, limit) => {
            return this.shuffleArray(baseFiltered.filter(q => q.chapter.startsWith(chapterPrefix))).slice(0, limit);
        };
        
        const qCh6 = getQuestionsByChapter('chapter6', 10);  // Passenger Safety
        const qCh10 = getQuestionsByChapter('chapter10', 8); // Pre-trip
        const qCh7 = getQuestionsByChapter('chapter7', 6);   // Hours of Service
        const qCh23 = this.shuffleArray(baseFiltered.filter(q => q.chapter === 'chapter2' || q.chapter === 'chapter3')).slice(0, 7); // Driving & Braking
        const qCh11 = getQuestionsByChapter('chapter11', 4); // Signs
        
        let mockQuestions = [...qCh6, ...qCh10, ...qCh7, ...qCh23, ...qCh11];
        
        // Pad with random if pool lacks enough questions for specific quotas
        if (mockQuestions.length < 35) {
            const usedIds = mockQuestions.map(q => q.id);
            const remaining = this.shuffleArray(baseFiltered.filter(q => !usedIds.includes(q.id)));
            mockQuestions = [...mockQuestions, ...remaining.slice(0, 35 - mockQuestions.length)];
        }
        
        // Final shuffle so the test isn't clustered by chapter
        this.activeQuestions = this.shuffleArray(mockQuestions);
        
        this.currentQuestionIndex = 0;
        this.isMockExam = true;
        this.mistakeReviewMode = false;
        this.score = 0;
        
        // Init mock state (user answers)
        this.activeQuestions.forEach(q => q.userAnswer = null);
        
        document.getElementById('mock-intro').classList.add('hidden');
        document.getElementById('mock-active').classList.remove('hidden');
        
        this.startTimer(45 * 60, document.getElementById('mock-timer'));
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
        this.activeQuestions = window.QUESTION_BANK.filter(q => mistakeIds.includes(q.id.toString()));
        this.activeQuestions = this.activeQuestions.sort(() => Math.random() - 0.5); // Shuffle
        
        this.currentQuestionIndex = 0;
        this.isMockExam = false;
        this.mistakeReviewMode = true;
        
        document.getElementById('mistakes-list').classList.add('hidden');
        document.getElementById('mistakes-active').classList.remove('hidden');
        document.getElementById('mistake-total-q').textContent = this.activeQuestions.length;
        
        this.renderQuestion('mistake');
    }
    
    logMistake(question) {
        if (!this.mistakesBook[question.id]) {
            this.mistakesBook[question.id] = { correctStreak: 0, chapter: question.chapter };
        } else {
            this.mistakesBook[question.id].correctStreak = 0; // Reset streak
        }
        this.saveData();
    }
    
    logCorrectMistake(questionId) {
        if (this.mistakesBook[questionId]) {
            this.mistakesBook[questionId].correctStreak++;
            if (this.mistakesBook[questionId].correctStreak >= 2) {
                // Mastered!
                delete this.mistakesBook[questionId];
            }
            this.saveData();
        }
    }
    
    saveData() {
        localStorage.setItem('icbc_mistakes', JSON.stringify(this.mistakesBook));
        localStorage.setItem('icbc_history', JSON.stringify(this.userHistory));
        localStorage.setItem('icbc_practice_progress', JSON.stringify(this.practiceProgress));
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
            if (mode === 'mistake') this.logCorrectMistake(q.id);
        } else {
            selectedBtn.classList.add('wrong');
            correctBtn.classList.add('correct');
            this.logMistake(q);
        }
        
        if (mode === 'practice' && !this.practiceProgress.includes(q.id)) {
            this.practiceProgress.push(q.id);
            this.saveData();
        }
        
        // Show feedback
        const feedbackContainer = document.getElementById(`${mode}-feedback`);
        feedbackContainer.className = `feedback-container ${isCorrect ? 'correct' : 'wrong'}`;
        feedbackContainer.innerHTML = `
            <h3>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</h3>
            <p>${q.explanation}</p>
        `;
        
        document.getElementById(`${mode}-controls`).classList.remove('hidden');
    }
    
    // Navigation inside modes
    nextPracticeQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.activeQuestions.length) {
            this.renderQuestion('practice');
        } else {
            alert('Practice completed for this topic!');
            this.navigate('home-view');
        }
    }
    
    nextMistakeQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.activeQuestions.length) {
            this.renderQuestion('mistake');
        } else {
            alert('Mistakes review session completed!');
            this.updateMistakesCount();
            this.navigate('mistakes-view');
        }
    }
    
    nextMockQuestion() {
        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion('mock');
        }
    }
    
    prevMockQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion('mock');
        }
    }
    
    submitMockExam() {
        clearInterval(this.mockTimerInterval);
        document.getElementById('mock-active').classList.add('hidden');
        
        let score = 0;
        this.activeQuestions.forEach(q => {
            if (q.userAnswer === null) {
                // Skipped/Unanswered. Do not log as mistake, do not add to score.
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
            msgEl.textContent = "Congratulations! You passed the mock exam. ICBC requires 80% to pass.";
            msgEl.style.color = "var(--success-color)";
        } else {
            msgEl.textContent = "You did not pass. You need at least 80% to pass the ICBC knowledge test. Review your mistakes below.";
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
            let icon = isCorrect ? '✅' : '❌';
            if (isSkipped) icon = '⚠️';
            
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
                    </div>
                </div>
            `;
        });
        document.getElementById('mock-review-container').innerHTML = html;
        
        this.updateRadarChart();
    }   
    
    // --- ANALYTICS ---
    renderAnalytics() {
        // Calculate category performance based on mistakes and history
        // For simplicity, we analyze the mistakes book density by chapter
        const chapterErrors = {};
        Object.values(this.mistakesBook).forEach(m => {
            chapterErrors[m.chapter] = (chapterErrors[m.chapter] || 0) + 1;
        });
        
        const chapters = ['chapter6', 'chapter7', 'chapter10', 'chapter11'];
        const labels = ['Passenger Safety', 'Hours of Service', 'Pre-Trip Inspection', 'Signs & Signals'];
        const data = chapters.map(ch => {
            // Error weight (higher means worse). Invert for radar (100 = perfect)
            const errors = chapterErrors[ch] || 0;
            return Math.max(0, 100 - (errors * 10)); // Arbitrary formula for demo
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
                    label: 'Knowledge Mastery %',
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
