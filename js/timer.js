/**
 * OpositaGC - Sistema de Timer y Pomodoro
 */

class StudyTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        this.totalPausedTime = 0;
        this.intervalId = null;
        
        // Pomodoro
        this.isPomodoroMode = false;
        this.pomodoroState = 'work'; // 'work', 'break', 'long_break'
        this.pomodoroPhaseStartTime = null;
        this.completedPomodoros = 0;
        
        // Topic
        this.topicId = null;
        
        // Callbacks
        this.onTick = null;
        this.onPhaseComplete = null;
        this.onStop = null;
        
        // Settings
        this.settings = getPreferences();
    }

    /**
     * Inicia el timer
     */
    start(topicId = null, isPomodoroMode = false) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.totalPausedTime = 0;
        this.topicId = topicId;
        this.isPomodoroMode = isPomodoroMode;
        this.settings = getPreferences();
        
        if (isPomodoroMode) {
            this.pomodoroState = 'work';
            this.pomodoroPhaseStartTime = Date.now();
            this.completedPomodoros = 0;
        }
        
        this.intervalId = setInterval(() => this.tick(), 100);
        
        console.log(`Timer started - Pomodoro: ${isPomodoroMode}, Topic: ${topicId}`);
    }

    /**
     * Pausa el timer
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pausedTime = Date.now();
        
        console.log('Timer paused');
    }

    /**
     * Reanuda el timer
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        const pauseDuration = Date.now() - this.pausedTime;
        this.totalPausedTime += pauseDuration;
        this.isPaused = false;
        this.pausedTime = 0;
        
        console.log(`Timer resumed - Paused for ${pauseDuration}ms`);
    }

    /**
     * Detiene el timer y guarda la sesión
     */
    async stop() {
        if (!this.isRunning) return 0;
        
        clearInterval(this.intervalId);
        this.intervalId = null;
        
        const totalElapsed = this.getElapsedTime();
        const totalMinutes = Math.floor(totalElapsed / 60000);
        
        // Guardar sesión
        if (totalMinutes > 0) {
            await this.saveSession(totalMinutes);
        }
        
        // Reset
        const savedMinutes = totalMinutes;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pomodoroState = 'work';
        this.completedPomodoros = 0;
        
        if (this.onStop) {
            this.onStop(savedMinutes);
        }
        
        console.log(`Timer stopped - Total: ${savedMinutes} minutes`);
        
        return savedMinutes;
    }

    /**
     * Salta la fase actual del pomodoro
     */
    skipPhase() {
        if (!this.isPomodoroMode || !this.isRunning) return;
        
        this.completeCurrentPhase();
    }

    /**
     * Tick del timer (llamado cada 100ms)
     */
    tick() {
        if (!this.isRunning || this.isPaused) return;
        
        const elapsed = this.getElapsedTime();
        
        if (this.isPomodoroMode) {
            const phaseElapsed = Date.now() - this.pomodoroPhaseStartTime - this.totalPausedTime;
            const phaseDuration = this.getCurrentPhaseDuration();
            const remaining = Math.max(0, phaseDuration - phaseElapsed);
            
            if (this.onTick) {
                this.onTick(elapsed, true, this.pomodoroState, remaining);
            }
            
            // Comprobar si la fase ha terminado
            if (remaining <= 0) {
                this.completeCurrentPhase();
            }
        } else {
            if (this.onTick) {
                this.onTick(elapsed, false, '', 0);
            }
        }
    }

    /**
     * Obtiene el tiempo transcurrido en milisegundos
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        
        let elapsed = Date.now() - this.startTime - this.totalPausedTime;
        
        if (this.isPaused && this.pausedTime) {
            elapsed -= (Date.now() - this.pausedTime);
        }
        
        return Math.max(0, elapsed);
    }

    /**
     * Obtiene la duración de la fase actual en milisegundos
     */
    getCurrentPhaseDuration() {
        switch (this.pomodoroState) {
            case 'work':
                return this.settings.pomodoroWorkMinutes * 60 * 1000;
            case 'break':
                return this.settings.pomodoroBreakMinutes * 60 * 1000;
            case 'long_break':
                return this.settings.pomodoroLongBreakMinutes * 60 * 1000;
            default:
                return this.settings.pomodoroWorkMinutes * 60 * 1000;
        }
    }

    /**
     * Completa la fase actual y pasa a la siguiente
     */
    completeCurrentPhase() {
        const previousPhase = this.pomodoroState;
        
        // Reproducir sonido
        this.playAlarm();
        
        // Determinar siguiente fase
        if (this.pomodoroState === 'work') {
            this.completedPomodoros++;
            
            if (this.completedPomodoros >= this.settings.pomodoroSessionsBeforeLongBreak) {
                this.pomodoroState = 'long_break';
                this.completedPomodoros = 0;
            } else {
                this.pomodoroState = 'break';
            }
        } else {
            this.pomodoroState = 'work';
        }
        
        this.pomodoroPhaseStartTime = Date.now();
        
        if (this.onPhaseComplete) {
            this.onPhaseComplete(previousPhase, this.pomodoroState);
        }
        
        // Notificación
        this.showPhaseNotification(this.pomodoroState);
        
        console.log(`Phase complete: ${previousPhase} -> ${this.pomodoroState}`);
    }

    /**
     * Reproduce el sonido de alarma usando Web Audio API
     */
    playAlarm() {
        const prefs = getPreferences();
        if (!prefs.soundEnabled) return;
        
        try {
            // Usar Web Audio API para generar el sonido
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crear osciladores para un sonido agradable
            const duration = 0.5;
            const frequency = 800;
            
            // Tocar 3 tonos
            for (let i = 0; i < 3; i++) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency + (i * 100);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(prefs.alarmVolume * 0.3, audioContext.currentTime + i * 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + duration);
                
                oscillator.start(audioContext.currentTime + i * 0.2);
                oscillator.stop(audioContext.currentTime + i * 0.2 + duration);
            }
        } catch (e) {
            console.log('Could not play alarm:', e);
        }
    }

    /**
     * Muestra notificación del cambio de fase
     */
    showPhaseNotification(newPhase) {
        let message;
        let emoji;
        
        switch (newPhase) {
            case 'work':
                message = '¡A estudiar!';
                emoji = '📚';
                break;
            case 'break':
                message = '¡Tómate un descanso!';
                emoji = '☕';
                break;
            case 'long_break':
                message = '¡Buen trabajo! Descanso largo';
                emoji = '🎉';
                break;
        }
        
        showToast(`${emoji} ${message}`, 'success');
        
        // Notificación del sistema (si está permitido)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('OpositaGC', {
                body: message,
                icon: '/icons/icon-192.svg',
                badge: '/icons/icon-72.svg'
            });
        }
    }

    /**
     * Guarda la sesión de estudio en la base de datos
     */
    async saveSession(durationMinutes) {
        const today = getTodayString();
        const yearMonth = getCurrentYearMonth();
        
        try {
            // Crear sesión de estudio
            const session = {
                startTime: this.startTime,
                endTime: Date.now(),
                durationMinutes: durationMinutes,
                topicId: this.topicId,
                isPomodoroSession: this.isPomodoroMode,
                pomodoroWorkMinutes: this.isPomodoroMode ? this.settings.pomodoroWorkMinutes : 0,
                pomodoroBreakMinutes: this.isPomodoroMode ? this.settings.pomodoroBreakMinutes : 0,
                date: today
            };
            
            await db.insertSession(session);
            
            // Actualizar registro diario
            await db.addStudyMinutesToDate(today, durationMinutes);
            
            // Actualizar minutos del tema si existe
            if (this.topicId) {
                await db.addStudyMinutesToTopic(this.topicId, durationMinutes);
            }
            
            console.log(`Session saved: ${durationMinutes} minutes`);
            
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Obtiene el estado actual del timer
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            isPomodoroMode: this.isPomodoroMode,
            pomodoroState: this.pomodoroState,
            topicId: this.topicId,
            elapsed: this.getElapsedTime(),
            completedPomodoros: this.completedPomodoros
        };
    }
}

// Instancia global del timer
const timer = new StudyTimer();

// Solicitar permiso para notificaciones
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}
