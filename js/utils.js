/**
 * OpositaGC - Utilidades generales
 */

// ═══════════════════════════════════════════════════════════
// FORMATEO DE FECHAS
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
function getTodayString() {
    return formatDate(new Date());
}

/**
 * Formatea una fecha a YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene el año-mes actual en formato YYYY-MM
 */
function getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Formatea una fecha a texto legible (ej: "Lunes 20 de enero")
 */
function formatDateFull(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es-ES', options);
}

/**
 * Formatea mes y año (ej: "Enero 2026")
 */
function formatMonthYear(year, month) {
    const date = new Date(year, month, 1);
    const options = { month: 'long', year: 'numeric' };
    let formatted = date.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// ═══════════════════════════════════════════════════════════
// FORMATEO DE TIEMPO
// ═══════════════════════════════════════════════════════════

/**
 * Formatea milisegundos a HH:MM:SS o MM:SS
 */
function formatTime(millis) {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formatea minutos a texto legible (ej: "2h 30m")
 */
function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
    }
    return `${minutes}m`;
}

/**
 * Formatea minutos a formato de horas decimal (ej: "2.5h")
 */
function formatHoursDecimal(totalMinutes) {
    const hours = totalMinutes / 60;
    return `${hours.toFixed(1)}h`;
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Muestra un toast notification
 */
function showToast(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════

/**
 * Muestra un modal con contenido HTML
 */
function showModal(content) {
    const overlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = content;
    overlay.classList.remove('hidden');
    
    // Cerrar al hacer clic fuera
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            hideModal();
        }
    };
}

/**
 * Oculta el modal
 */
function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
}

/**
 * Muestra un diálogo de confirmación
 */
function showConfirm(title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar') {
    const content = `
        <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
        </div>
        <div class="modal-body">
            <p>${message}</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-text" onclick="hideModal()">${cancelText}</button>
            <button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
        </div>
    `;
    
    showModal(content);
    
    document.getElementById('modal-confirm-btn').onclick = () => {
        hideModal();
        if (onConfirm) onConfirm();
    };
}

// ═══════════════════════════════════════════════════════════
// LOCAL STORAGE (Preferencias)
// ═══════════════════════════════════════════════════════════

const PREFERENCES_KEY = 'opositagc_preferences';

/**
 * Obtiene las preferencias guardadas
 */
function getPreferences() {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    const defaults = {
        darkMode: false,
        pomodoroWorkMinutes: 50,
        pomodoroBreakMinutes: 10,
        pomodoroLongBreakMinutes: 30,
        pomodoroSessionsBeforeLongBreak: 4,
        alarmVolume: 0.7,
        soundEnabled: true
    };
    
    if (stored) {
        return { ...defaults, ...JSON.parse(stored) };
    }
    return defaults;
}

/**
 * Guarda una preferencia
 */
function setPreference(key, value) {
    const prefs = getPreferences();
    prefs[key] = value;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

/**
 * Aplica el tema (claro/oscuro)
 */
function applyTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const themeColor = isDark ? '#121212' : '#4A7C59';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
}

// ═══════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════

/**
 * Descarga datos como archivo JSON
 */
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON subido
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (err) {
                reject(new Error('Archivo JSON inválido'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

// ═══════════════════════════════════════════════════════════
// ICONOS SVG
// ═══════════════════════════════════════════════════════════

const ICONS = {
    play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    stop: `<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>`,
    add: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    delete: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    timer: `<svg viewBox="0 0 24 24"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    skip: `<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`
};

/**
 * Obtiene un icono SVG
 */
function getIcon(name) {
    return ICONS[name] || '';
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES VARIAS
// ═══════════════════════════════════════════════════════════

/**
 * Debounce para limitar llamadas a funciones
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Genera un ID único
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
