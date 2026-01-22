/**
 * OpositaGC - Página de Ajustes
 */

const SettingsPage = {
    /**
     * Renderiza la página de ajustes
     */
    async render() {
        const prefs = getPreferences();
        
        return `
            <div class="page-content">
                <!-- Tema -->
                <div class="card">
                    <div class="card-title">APARIENCIA</div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">🌙 Modo oscuro</div>
                            <div class="setting-description">Tema oscuro para reducir fatiga visual</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="switch-dark-mode" ${prefs.darkMode ? 'checked' : ''}>
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Pomodoro Settings -->
                <div class="card">
                    <div class="card-title">🍅 CONFIGURACIÓN POMODORO</div>
                    
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
                    
                    <button class="btn btn-primary" style="width: 100%; margin-top: 8px;" id="btn-save-pomo">
                        Guardar configuración
                    </button>
                </div>

                <!-- Sound Settings -->
                <div class="card">
                    <div class="card-title">🔊 SONIDO</div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Sonido activado</div>
                            <div class="setting-description">Alarma al cambiar de fase en Pomodoro</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="switch-sound" ${prefs.soundEnabled ? 'checked' : ''}>
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                    
                    <div class="input-group" style="margin-top: 16px;">
                        <label class="input-label">Volumen de alarma</label>
                        <div class="slider-container">
                            <input type="range" class="slider" id="alarm-volume" 
                                   min="0" max="1" step="0.1" value="${prefs.alarmVolume}">
                            <span class="slider-value" id="volume-value">${Math.round(prefs.alarmVolume * 100)}%</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 8px;" id="btn-test-sound">
                        🔔 Probar sonido
                    </button>
                </div>

                <!-- Backup -->
                <div class="card">
                    <div class="card-title">💾 COPIA DE SEGURIDAD</div>
                    <p style="color: var(--color-text-secondary); margin-bottom: 16px; font-size: 14px;">
                        Exporta tus datos para guardarlos en un lugar seguro o importa una copia anterior.
                    </p>
                    
                    <button class="btn btn-secondary" style="width: 100%; margin-bottom: 12px;" id="btn-export">
                        📤 Exportar datos
                    </button>
                    
                    <button class="btn btn-secondary" style="width: 100%;" id="btn-import">
                        📥 Importar datos
                    </button>
                    
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                </div>

                <!-- Clear Data -->
                <div class="card">
                    <div class="card-title">⚠️ ZONA PELIGROSA</div>
                    <button class="btn btn-text" style="width: 100%; color: var(--color-error);" id="btn-clear-data">
                        🗑️ Borrar todos los datos
                    </button>
                </div>

                <!-- About -->
                <div class="card">
                    <div class="card-title">ℹ️ ACERCA DE</div>
                    <p style="color: var(--color-text-secondary); font-size: 14px;">
                        <strong>OpositaGC Web</strong><br>
                        v1.0.0<br><br>
                        Tu compañero de estudio para oposiciones.<br>
                        Versión PWA que funciona en cualquier dispositivo.
                    </p>
                    
                    <div style="margin-top: 16px; padding: 12px; background: var(--color-surface-variant); border-radius: 8px; font-size: 12px;">
                        <strong>Cambios v1.0:</strong><br>
                        • Cronómetro y modo Pomodoro<br>
                        • Gestión de temas con objetivos<br>
                        • Calendario con tareas planificadas<br>
                        • Estadísticas mensuales<br>
                        • Estudio retroactivo<br>
                        • Modo oscuro<br>
                        • Exportar/Importar datos<br>
                        • Funciona offline (PWA)
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Inicializa los event listeners
     */
    init() {
        // Dark mode toggle
        document.getElementById('switch-dark-mode')?.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            setPreference('darkMode', isDark);
            applyTheme(isDark);
        });

        // Sound toggle
        document.getElementById('switch-sound')?.addEventListener('change', (e) => {
            setPreference('soundEnabled', e.target.checked);
        });

        // Volume slider
        const volumeSlider = document.getElementById('alarm-volume');
        const volumeValue = document.getElementById('volume-value');
        volumeSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            volumeValue.textContent = `${Math.round(value * 100)}%`;
            setPreference('alarmVolume', value);
        });

        // Test sound button
        document.getElementById('btn-test-sound')?.addEventListener('click', () => {
            this.testSound();
        });

        // Save pomodoro settings
        document.getElementById('btn-save-pomo')?.addEventListener('click', () => {
            this.savePomodoroSettings();
        });

        // Export button
        document.getElementById('btn-export')?.addEventListener('click', () => {
            this.exportData();
        });

        // Import button
        document.getElementById('btn-import')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        // Import file handler
        document.getElementById('import-file')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
            }
        });

        // Clear data button
        document.getElementById('btn-clear-data')?.addEventListener('click', () => {
            this.showClearDataConfirmation();
        });
    },

    /**
     * Guarda la configuración del Pomodoro
     */
    savePomodoroSettings() {
        const workMinutes = parseInt(document.getElementById('pomo-work').value) || 50;
        const breakMinutes = parseInt(document.getElementById('pomo-break').value) || 10;
        const longBreakMinutes = parseInt(document.getElementById('pomo-long-break').value) || 30;
        const sessions = parseInt(document.getElementById('pomo-sessions').value) || 4;
        
        setPreference('pomodoroWorkMinutes', workMinutes);
        setPreference('pomodoroBreakMinutes', breakMinutes);
        setPreference('pomodoroLongBreakMinutes', longBreakMinutes);
        setPreference('pomodoroSessionsBeforeLongBreak', sessions);
        
        showToast('Configuración guardada', 'success');
    },

    /**
     * Prueba el sonido de alarma usando Web Audio API
     */
    testSound() {
        const prefs = getPreferences();
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 0.5;
            const frequency = 800;
            
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
            showToast('No se pudo reproducir el sonido', 'error');
        }
    },

    /**
     * Exporta todos los datos
     */
    async exportData() {
        try {
            const data = await db.exportAllData();
            const filename = `opositagc_backup_${getTodayString()}.json`;
            downloadJSON(data, filename);
            showToast('Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showToast('Error al exportar datos', 'error');
        }
    },

    /**
     * Importa datos desde un archivo
     */
    async importData(file) {
        showConfirm(
            'Importar datos',
            '⚠️ Esto reemplazará TODOS los datos actuales. ¿Estás seguro?',
            async () => {
                try {
                    const data = await readJSONFile(file);
                    
                    // Validar estructura básica
                    if (!data.topics && !data.studySessions) {
                        throw new Error('Archivo de backup inválido');
                    }
                    
                    await db.importAllData(data);
                    showToast('Datos importados correctamente', 'success');
                    
                    // Recargar la página actual
                    App.loadPage('settings');
                    
                } catch (error) {
                    console.error('Error importing data:', error);
                    showToast(error.message || 'Error al importar datos', 'error');
                }
            },
            'Importar',
            'Cancelar'
        );
    },

    /**
     * Muestra confirmación para borrar datos
     */
    showClearDataConfirmation() {
        showConfirm(
            '⚠️ Borrar todos los datos',
            'Esta acción eliminará TODOS tus datos: temas, sesiones, tareas y estadísticas. Esta acción NO se puede deshacer.',
            async () => {
                try {
                    await db.clearAllStores();
                    showToast('Datos eliminados', 'success');
                    App.loadPage('study');
                } catch (error) {
                    console.error('Error clearing data:', error);
                    showToast('Error al borrar datos', 'error');
                }
            },
            'Borrar todo',
            'Cancelar'
        );
    }
};
