/**
 * OpositaGC - Página de Estudio (Cronómetro y Pomodoro)
 */

const StudyPage = {
    topics: [],
    selectedTopicId: null,
    isPomodoroMode: false,

    /**
     * Renderiza la página de estudio
     */
    async render() {
        await this.loadTopics();
        const todayStats = await this.getTodayStats();
        const monthlyGoal = await this.getMonthlyGoal();
        const prefs = getPreferences();
        
        const state = timer.getState();
        
        return `
            <div class="page-content">
                <!-- Timer Card -->
                <div class="card">
                    <div class="card-title">TIEMPO DE ESTUDIO</div>
                    <div class="timer-container">
                        <div class="timer-circle ${state.isRunning ? (state.pomodoroState === 'work' ? 'active' : 'break') : ''}" id="timer-circle">
                            <span class="timer-display" id="timer-display">00:00</span>
                            <span class="timer-state" id="timer-state" style="display: ${state.isRunning && state.isPomodoroMode ? 'block' : 'none'}">
                                ${this.getPomodoroStateText(state.pomodoroState)}
                            </span>
                        </div>
                        
                        <div class="timer-controls">
                            <button class="btn btn-primary btn-large" id="btn-start-stop">
                                ${state.isRunning ? getIcon('stop') : getIcon('play')}
                                <span>${state.isRunning ? 'Terminar' : 'Empezar'}</span>
                            </button>
                            
                            <button class="btn btn-secondary btn-icon" id="btn-pause-resume" style="display: ${state.isRunning ? 'flex' : 'none'}">
                                ${state.isPaused ? getIcon('play') : getIcon('pause')}
                            </button>
                        </div>
                        
                        <button class="btn btn-text" id="btn-skip-phase" style="display: ${state.isRunning && state.isPomodoroMode ? 'flex' : 'none'}">
                            ${getIcon('skip')} Saltar fase
                        </button>
                        
                        <div id="total-elapsed" style="display: ${state.isRunning && state.isPomodoroMode ? 'block' : 'none'}; margin-top: 16px; font-size: 14px; color: var(--color-text-secondary);">
                            Total: <span id="total-elapsed-time">00:00:00</span>
                        </div>
                    </div>
                </div>

                <!-- Topic Selector -->
                <div class="card">
                    <div class="card-title">TEMA ACTUAL</div>
                    <select class="input" id="topic-select" ${state.isRunning ? 'disabled' : ''}>
                        <option value="">Sin tema específico</option>
                        ${this.topics.map(t => `
                            <option value="${t.id}" ${this.selectedTopicId === t.id ? 'selected' : ''}>
                                ${escapeHtml(t.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <!-- Pomodoro Toggle -->
                <div class="card">
                    <div class="setting-item" style="border: none; padding: 0;">
                        <div class="setting-info">
                            <div class="setting-title">🍅 Modo Pomodoro</div>
                            <div class="setting-description" id="pomodoro-config">
                                ${prefs.pomodoroWorkMinutes}min estudio / ${prefs.pomodoroBreakMinutes}min descanso
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="switch-pomodoro" ${this.isPomodoroMode ? 'checked' : ''} ${state.isRunning ? 'disabled' : ''}>
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                    
                    <button class="btn btn-text" id="btn-pomodoro-settings" style="margin-top: 12px; width: 100%;" ${state.isRunning ? 'disabled' : ''}>
                        ${getIcon('settings')} Configurar Pomodoro
                    </button>
                </div>

                <!-- Today Stats -->
                <div class="card">
                    <div class="card-title">HOY</div>
                    <div class="today-summary">
                        <div class="today-stat">
                            <div class="today-stat-value" id="today-hours">${formatMinutes(todayStats.minutes)}</div>
                            <div class="today-stat-label">Estudiado</div>
                        </div>
                    </div>
                    
                    <button class="btn btn-text" id="btn-add-hours" style="margin-top: 12px; width: 100%;">
                        ${getIcon('add')} Añadir horas manualmente
                    </button>
                </div>

                <!-- Monthly Goal -->
                <div class="card" id="monthly-goal-card" style="cursor: pointer;">
                    <div class="card-title">OBJETIVO MENSUAL</div>
                    ${monthlyGoal ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${monthlyGoal.percentage}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${formatHoursDecimal(monthlyGoal.completedMinutes)}</span>
                            <span>${monthlyGoal.targetHours}h (${monthlyGoal.percentage}%)</span>
                        </div>
                    ` : `
                        <p style="color: var(--color-text-hint); text-align: center;">
                            Toca para definir tu objetivo mensual
                        </p>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Inicializa los event listeners
     */
    init() {
        // Start/Stop button
        document.getElementById('btn-start-stop')?.addEventListener('click', () => {
            const state = timer.getState();
            if (state.isRunning) {
                this.stopStudying();
            } else {
                this.startStudying();
            }
        });

        // Pause/Resume button
        document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
            const state = timer.getState();
            if (state.isPaused) {
                timer.resume();
                this.updatePauseButton(false);
            } else {
                timer.pause();
                this.updatePauseButton(true);
            }
        });

        // Skip phase button
        document.getElementById('btn-skip-phase')?.addEventListener('click', () => {
            timer.skipPhase();
        });

        // Topic selector
        document.getElementById('topic-select')?.addEventListener('change', (e) => {
            this.selectedTopicId = e.target.value ? parseInt(e.target.value) : null;
        });

        // Pomodoro switch
        document.getElementById('switch-pomodoro')?.addEventListener('change', (e) => {
            this.isPomodoroMode = e.target.checked;
        });

        // Pomodoro settings button
        document.getElementById('btn-pomodoro-settings')?.addEventListener('click', () => {
            this.showPomodoroSettingsDialog();
        });

        // Add hours button
        document.getElementById('btn-add-hours')?.addEventListener('click', () => {
            this.showAddHoursDialog();
        });

        // Monthly goal card
        document.getElementById('monthly-goal-card')?.addEventListener('click', () => {
            this.showSetGoalDialog();
        });

        // Timer callbacks
        timer.onTick = (elapsed, isPomodoro, state, remaining) => {
            this.updateTimerDisplay(elapsed, isPomodoro, state, remaining);
        };

        timer.onPhaseComplete = (prevPhase, newPhase) => {
            this.updatePomodoroUI(newPhase);
        };

        timer.onStop = async (minutes) => {
            await this.onTimerStopped(minutes);
        };

        // Si el timer ya está corriendo, actualizar UI
        const state = timer.getState();
        if (state.isRunning) {
            this.updateUIForStudying(true);
        }
    },

    /**
     * Carga los temas activos
     */
    async loadTopics() {
        try {
            this.topics = await db.getActiveTopics();
        } catch (error) {
            console.error('Error loading topics:', error);
            this.topics = [];
        }
    },

    /**
     * Obtiene las estadísticas de hoy
     */
    async getTodayStats() {
        try {
            const today = getTodayString();
            const record = await db.getRecordForDate(today);
            return {
                minutes: record?.studyMinutes || 0
            };
        } catch (error) {
            console.error('Error getting today stats:', error);
            return { minutes: 0 };
        }
    },

    /**
     * Obtiene el objetivo mensual
     */
    async getMonthlyGoal() {
        try {
            const yearMonth = getCurrentYearMonth();
            const goal = await db.getGoalForMonth(yearMonth);
            
            if (!goal) return null;
            
            const completedMinutes = await db.getTotalMinutesForMonth(yearMonth);
            const targetMinutes = goal.targetHours * 60;
            const percentage = targetMinutes > 0 
                ? Math.min(100, Math.round((completedMinutes / targetMinutes) * 100))
                : 0;
            
            return {
                targetHours: goal.targetHours,
                completedMinutes: completedMinutes,
                percentage: percentage
            };
        } catch (error) {
            console.error('Error getting monthly goal:', error);
            return null;
        }
    },

    /**
     * Inicia el estudio
     */
    startStudying() {
        const topicSelect = document.getElementById('topic-select');
        this.selectedTopicId = topicSelect?.value ? parseInt(topicSelect.value) : null;
        
        const pomodoroSwitch = document.getElementById('switch-pomodoro');
        this.isPomodoroMode = pomodoroSwitch?.checked || false;
        
        timer.start(this.selectedTopicId, this.isPomodoroMode);
        this.updateUIForStudying(true);
        
        // Request notification permission
        requestNotificationPermission();
    },

    /**
     * Detiene el estudio
     */
    async stopStudying() {
        await timer.stop();
    },

    /**
     * Callback cuando el timer se detiene
     */
    async onTimerStopped(minutes) {
        this.updateUIForStudying(false);
        
        // Recargar estadísticas
        const todayStats = await this.getTodayStats();
        const todayHours = document.getElementById('today-hours');
        if (todayHours) {
            todayHours.textContent = formatMinutes(todayStats.minutes);
        }
        
        // Recargar objetivo mensual
        await this.refreshMonthlyGoal();
        
        if (minutes > 0) {
            showToast(`Sesión terminada: ${formatMinutes(minutes)}`, 'success');
        }
    },

    /**
     * Actualiza la UI cuando se inicia/detiene el estudio
     */
    updateUIForStudying(isStudying) {
        const startStopBtn = document.getElementById('btn-start-stop');
        const pauseBtn = document.getElementById('btn-pause-resume');
        const skipBtn = document.getElementById('btn-skip-phase');
        const totalElapsed = document.getElementById('total-elapsed');
        const timerCircle = document.getElementById('timer-circle');
        const timerState = document.getElementById('timer-state');
        const topicSelect = document.getElementById('topic-select');
        const pomodoroSwitch = document.getElementById('switch-pomodoro');
        const pomodoroSettingsBtn = document.getElementById('btn-pomodoro-settings');
        
        if (startStopBtn) {
            startStopBtn.innerHTML = isStudying 
                ? `${getIcon('stop')}<span>Terminar</span>`
                : `${getIcon('play')}<span>Empezar</span>`;
        }
        
        if (pauseBtn) {
            pauseBtn.style.display = isStudying ? 'flex' : 'none';
            pauseBtn.innerHTML = getIcon('pause');
        }
        
        if (timerCircle) {
            if (isStudying) {
                timerCircle.classList.add(this.isPomodoroMode && timer.pomodoroState !== 'work' ? 'break' : 'active');
            } else {
                timerCircle.classList.remove('active', 'break');
            }
        }
        
        if (timerState) {
            timerState.style.display = isStudying && this.isPomodoroMode ? 'block' : 'none';
        }
        
        if (skipBtn) {
            skipBtn.style.display = isStudying && this.isPomodoroMode ? 'flex' : 'none';
        }
        
        if (totalElapsed) {
            totalElapsed.style.display = isStudying && this.isPomodoroMode ? 'block' : 'none';
        }
        
        if (topicSelect) topicSelect.disabled = isStudying;
        if (pomodoroSwitch) pomodoroSwitch.disabled = isStudying;
        if (pomodoroSettingsBtn) pomodoroSettingsBtn.disabled = isStudying;
        
        if (!isStudying) {
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) timerDisplay.textContent = '00:00';
        }
    },

    /**
     * Actualiza el botón de pausa
     */
    updatePauseButton(isPaused) {
        const pauseBtn = document.getElementById('btn-pause-resume');
        if (pauseBtn) {
            pauseBtn.innerHTML = isPaused ? getIcon('play') : getIcon('pause');
        }
    },

    /**
     * Actualiza el display del timer
     */
    updateTimerDisplay(elapsed, isPomodoro, state, remaining) {
        const timerDisplay = document.getElementById('timer-display');
        const timerState = document.getElementById('timer-state');
        const timerCircle = document.getElementById('timer-circle');
        const totalElapsedTime = document.getElementById('total-elapsed-time');
        
        if (timerDisplay) {
            timerDisplay.textContent = isPomodoro 
                ? formatTime(remaining)
                : formatTime(elapsed);
        }
        
        if (isPomodoro) {
            if (timerState) {
                timerState.textContent = this.getPomodoroStateText(state);
                timerState.style.display = 'block';
            }
            
            if (timerCircle) {
                timerCircle.classList.remove('active', 'break');
                timerCircle.classList.add(state === 'work' ? 'active' : 'break');
            }
            
            if (totalElapsedTime) {
                totalElapsedTime.textContent = formatTime(elapsed);
            }
        }
    },

    /**
     * Actualiza la UI del pomodoro cuando cambia de fase
     */
    updatePomodoroUI(newPhase) {
        const timerState = document.getElementById('timer-state');
        const timerCircle = document.getElementById('timer-circle');
        
        if (timerState) {
            timerState.textContent = this.getPomodoroStateText(newPhase);
        }
        
        if (timerCircle) {
            timerCircle.classList.remove('active', 'break');
            timerCircle.classList.add(newPhase === 'work' ? 'active' : 'break');
        }
    },

    /**
     * Obtiene el texto del estado del pomodoro
     */
    getPomodoroStateText(state) {
        switch (state) {
            case 'work': return '📚 Estudiando';
            case 'break': return '☕ Descanso';
            case 'long_break': return '🎉 Descanso largo';
            default: return '';
        }
    },

    /**
     * Refresca el objetivo mensual
     */
    async refreshMonthlyGoal() {
        const monthlyGoal = await this.getMonthlyGoal();
        const card = document.getElementById('monthly-goal-card');
        
        if (card) {
            card.innerHTML = `
                <div class="card-title">OBJETIVO MENSUAL</div>
                ${monthlyGoal ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${monthlyGoal.percentage}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${formatHoursDecimal(monthlyGoal.completedMinutes)}</span>
                        <span>${monthlyGoal.targetHours}h (${monthlyGoal.percentage}%)</span>
                    </div>
                ` : `
                    <p style="color: var(--color-text-hint); text-align: center;">
                        Toca para definir tu objetivo mensual
                    </p>
                `}
            `;
        }
    },

    /**
     * Muestra el diálogo para añadir horas manualmente
     */
    showAddHoursDialog() {
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Añadir horas manualmente</h2>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Horas</label>
                    <input type="number" class="input" id="add-hours" min="0" max="23" value="0" inputmode="numeric">
                </div>
                <div class="input-group">
                    <label class="input-label">Minutos</label>
                    <input type="number" class="input" id="add-minutes" min="0" max="59" value="0" inputmode="numeric">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-hours">Añadir</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-save-hours').onclick = async () => {
            const hours = parseInt(document.getElementById('add-hours').value) || 0;
            const minutes = parseInt(document.getElementById('add-minutes').value) || 0;
            const totalMinutes = hours * 60 + minutes;
            
            if (totalMinutes > 0) {
                await this.addManualHours(totalMinutes);
                hideModal();
            } else {
                showToast('Introduce un tiempo válido', 'error');
            }
        };
    },

    /**
     * Añade horas manualmente
     */
    async addManualHours(minutes) {
        try {
            const today = getTodayString();
            const currentTime = Date.now();
            
            // Crear sesión
            const session = {
                startTime: currentTime - (minutes * 60 * 1000),
                endTime: currentTime,
                durationMinutes: minutes,
                topicId: null,
                isPomodoroSession: false,
                date: today
            };
            
            await db.insertSession(session);
            await db.addStudyMinutesToDate(today, minutes);
            
            // Actualizar UI
            const todayStats = await this.getTodayStats();
            const todayHours = document.getElementById('today-hours');
            if (todayHours) {
                todayHours.textContent = formatMinutes(todayStats.minutes);
            }
            
            await this.refreshMonthlyGoal();
            
            showToast(`+${formatMinutes(minutes)} añadidos`, 'success');
            
        } catch (error) {
            console.error('Error adding manual hours:', error);
            showToast('Error al añadir horas', 'error');
        }
    },

    /**
     * Muestra el diálogo para definir el objetivo mensual
     */
    async showSetGoalDialog() {
        const yearMonth = getCurrentYearMonth();
        const currentGoal = await db.getGoalForMonth(yearMonth);
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Objetivo mensual de horas</h2>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Horas objetivo este mes</label>
                    <input type="number" class="input" id="goal-hours" min="1" max="500" 
                           value="${currentGoal ? currentGoal.targetHours : ''}" 
                           placeholder="Ej: 50" inputmode="numeric">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-goal">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-save-goal').onclick = async () => {
            const hours = parseFloat(document.getElementById('goal-hours').value);
            
            if (hours > 0) {
                await this.saveMonthlyGoal(hours);
                hideModal();
            } else {
                showToast('Introduce un número válido de horas', 'error');
            }
        };
    },

    /**
     * Guarda el objetivo mensual
     */
    async saveMonthlyGoal(targetHours) {
        try {
            const yearMonth = getCurrentYearMonth();
            
            await db.insertOrUpdateGoal({
                yearMonth: yearMonth,
                targetHours: targetHours,
                completedMinutes: 0
            });
            
            await this.refreshMonthlyGoal();
            showToast(`Objetivo guardado: ${targetHours}h`, 'success');
            
        } catch (error) {
            console.error('Error saving goal:', error);
            showToast('Error al guardar objetivo', 'error');
        }
    },

    /**
     * Muestra el diálogo de configuración del Pomodoro
     */
    showPomodoroSettingsDialog() {
        const prefs = getPreferences();
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Configurar Pomodoro</h2>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Minutos de estudio</label>
                    <input type="number" class="input" id="pomo-work" min="1" max="120" 
                           value="${prefs.pomodoroWorkMinutes}" inputmode="numeric">
                </div>
                <div class="input-group">
                    <label class="input-label">Minutos de descanso</label>
                    <input type="number" class="input" id="pomo-break" min="1" max="60" 
                           value="${prefs.pomodoroBreakMinutes}" inputmode="numeric">
                </div>
                <div class="input-group">
                    <label class="input-label">Minutos de descanso largo</label>
                    <input type="number" class="input" id="pomo-long-break" min="1" max="120" 
                           value="${prefs.pomodoroLongBreakMinutes}" inputmode="numeric">
                </div>
                <div class="input-group">
                    <label class="input-label">Sesiones antes de descanso largo</label>
                    <input type="number" class="input" id="pomo-sessions" min="1" max="10" 
                           value="${prefs.pomodoroSessionsBeforeLongBreak}" inputmode="numeric">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-pomo">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-save-pomo').onclick = () => {
            const workMinutes = parseInt(document.getElementById('pomo-work').value) || 50;
            const breakMinutes = parseInt(document.getElementById('pomo-break').value) || 10;
            const longBreakMinutes = parseInt(document.getElementById('pomo-long-break').value) || 30;
            const sessions = parseInt(document.getElementById('pomo-sessions').value) || 4;
            
            setPreference('pomodoroWorkMinutes', workMinutes);
            setPreference('pomodoroBreakMinutes', breakMinutes);
            setPreference('pomodoroLongBreakMinutes', longBreakMinutes);
            setPreference('pomodoroSessionsBeforeLongBreak', sessions);
            
            // Actualizar UI
            const pomoConfig = document.getElementById('pomodoro-config');
            if (pomoConfig) {
                pomoConfig.textContent = `${workMinutes}min estudio / ${breakMinutes}min descanso`;
            }
            
            hideModal();
            showToast('Configuración guardada', 'success');
        };
    }
};
