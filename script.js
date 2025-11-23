class Timer {
    constructor(duration, onTick, onComplete) {
        this.initialDuration = duration * 60;
        this.remaining = this.initialDuration;
        this.isRunning = false;
        this.interval = null;
        this.onTick = onTick;
        this.onComplete = onComplete;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining, this.initialDuration);
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.interval);
    }

    reset(newDuration) {
        this.pause();
        if (newDuration) {
            this.initialDuration = newDuration * 60;
        }
        this.remaining = this.initialDuration;
        this.onTick(this.remaining, this.initialDuration);
    }

    complete() {
        this.pause();
        this.onComplete();
    }
}

class App {
    constructor() {
        // DOM Elements
        this.timeDisplay = document.getElementById('time-display');
        this.progressRing = document.getElementById('progress-ring');
        this.btnToggle = document.getElementById('btn-toggle');
        this.btnReset = document.getElementById('btn-reset');
        this.btnSettings = document.getElementById('btn-settings');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.pomodoroCounter = document.getElementById('pomodoro-counter');
        this.body = document.body;

        // Todo Elements
        this.todoInput = document.getElementById('todo-input');
        this.btnAddTodo = document.getElementById('btn-add-todo');
        this.todoList = document.getElementById('todo-list');

        // Modal Elements
        this.modal = document.getElementById('settings-modal');
        this.inputStudy = document.getElementById('study-time');
        this.inputBreak = document.getElementById('break-time');
        this.btnSave = document.getElementById('btn-save');
        this.btnCancel = document.getElementById('btn-cancel');

        // Audio Elements
        this.audioZen = document.getElementById('audio-zen');
        this.audioLofi = document.getElementById('audio-lofi');
        this.audioGong = document.getElementById('audio-gong');

        // State
        this.isStudyMode = true;
        this.studyTime = 25;
        this.breakTime = 5;
        this.completedSessions = 0;

        // Progress Ring Circumference
        this.circumference = 2 * Math.PI * 140;
        this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        // Initialize Timer
        this.timer = new Timer(
            this.studyTime,
            this.updateDisplay.bind(this),
            this.switchMode.bind(this)
        );

        this.initEventListeners();
        this.updateDisplay(this.studyTime * 60, this.studyTime * 60);
        this.loadTodos();
    }

    initEventListeners() {
        this.btnToggle.addEventListener('click', () => this.toggleTimer());
        this.btnReset.addEventListener('click', () => this.resetTimer());

        // Settings Modal
        this.btnSettings.addEventListener('click', () => this.modal.classList.remove('hidden'));
        this.btnCancel.addEventListener('click', () => this.modal.classList.add('hidden'));
        this.btnSave.addEventListener('click', () => this.saveSettings());

        // Todo List
        this.btnAddTodo.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
    }

    toggleTimer() {
        if (this.timer.isRunning) {
            this.timer.pause();
            this.btnToggle.innerHTML = '<span class="icon">▶</span> Iniciar';
            this.pauseAudio();
        } else {
            this.timer.start();
            this.btnToggle.innerHTML = '<span class="icon">⏸</span> Pausar';
            this.playAudio();
        }
    }

    resetTimer() {
        this.timer.reset();
        this.btnToggle.innerHTML = '<span class="icon">▶</span> Iniciar';
        this.pauseAudio();
        this.resetAudio();
    }

    updateDisplay(remaining, total) {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update Progress Ring
        const offset = this.circumference - (remaining / total) * this.circumference;
        this.progressRing.style.strokeDashoffset = offset;
    }

    switchMode() {
        // If finishing study mode, increment counter
        if (this.isStudyMode) {
            this.completedSessions++;
            this.pomodoroCounter.textContent = `Sesiones: ${this.completedSessions}`;
        }

        this.isStudyMode = !this.isStudyMode;

        // Play Gong for transition
        // Resetting currentTime ensures it plays from start even if previously played
        this.audioGong.currentTime = 0;
        this.audioGong.play().catch(e => console.log("Gong play failed:", e));

        if (this.isStudyMode) {
            this.modeIndicator.textContent = "Modo Estudio";
            this.body.classList.remove('mode-break');
            this.timer.reset(this.studyTime);
        } else {
            this.modeIndicator.textContent = "Modo Descanso";
            this.body.classList.add('mode-break');
            this.timer.reset(this.breakTime);
        }

        // Auto-start next phase with a slight delay for the music to let the gong shine
        this.timer.start();
        setTimeout(() => {
            this.playAudio();
        }, 2000); // 2 second delay for background music
    }

    playAudio() {
        // Ensure we don't play if paused manually during the delay
        if (!this.timer.isRunning) return;

        if (this.isStudyMode) {
            this.audioLofi.pause();
            this.audioZen.play().catch(e => console.log("Audio play failed:", e));
        } else {
            this.audioZen.pause();
            this.audioLofi.play().catch(e => console.log("Audio play failed:", e));
        }
    }

    pauseAudio() {
        this.audioZen.pause();
        this.audioLofi.pause();
    }

    resetAudio() {
        this.audioZen.currentTime = 0;
        this.audioLofi.currentTime = 0;
    }

    saveSettings() {
        const newStudy = parseInt(this.inputStudy.value);
        const newBreak = parseInt(this.inputBreak.value);

        if (newStudy > 0 && newBreak > 0) {
            this.studyTime = newStudy;
            this.breakTime = newBreak;

            // Reset timer with new duration if currently in that mode
            if (this.isStudyMode) {
                this.timer.reset(this.studyTime);
            } else {
                this.timer.reset(this.breakTime);
            }

            this.modal.classList.add('hidden');
        }
    }

    // Todo List Methods
    addTodo() {
        const text = this.todoInput.value.trim();
        if (text) {
            this.createTodoElement(text);
            this.todoInput.value = '';
            this.saveTodos();
        }
    }

    createTodoElement(text, completed = false) {
        const li = document.createElement('li');
        li.className = `todo-item ${completed ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = completed;
        checkbox.addEventListener('change', () => {
            li.classList.toggle('completed');
            this.saveTodos();
        });

        const span = document.createElement('span');
        span.textContent = text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.addEventListener('click', () => {
            li.remove();
            this.saveTodos();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        this.todoList.appendChild(li);
    }

    saveTodos() {
        const todos = [];
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            todos.push({
                text: item.querySelector('span').textContent,
                completed: item.querySelector('.todo-checkbox').checked
            });
        });
        localStorage.setItem('zenfocus_todos', JSON.stringify(todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('zenfocus_todos');
        if (saved) {
            JSON.parse(saved).forEach(todo => {
                this.createTodoElement(todo.text, todo.completed);
            });
        }
    }
}

// Initialize App
const app = new App();
