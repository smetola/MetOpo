/**
 * OpositaGC Web - Aplicación Principal
 */

const App = {
    currentPage: 'study',
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('OpositaGC Web - Iniciando...');
        
        // 1. Aplicar tema
        const prefs = getPreferences();
        applyTheme(prefs.darkMode);
        
        // 2. Inicializar base de datos
        try {
            await db.init();
            console.log('Base de datos inicializada');
        } catch (error) {
            console.error('Error inicializando base de datos:', error);
            showToast('Error al cargar datos', 'error');
        }
        
        // 3. Configurar navegación
        this.setupNavigation();
        
        // 4. Registrar Service Worker
        this.registerServiceWorker();
        
        // 5. Cargar página inicial
        this.loadPage('study');
        
        // 6. Manejar visibilidad de la página (pausar timer si sale)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // El timer sigue corriendo, solo guardamos el estado
                this.saveTimerState();
            }
        });
        
        // 7. Cargar el audio de alarma
        this.preloadAlarmSound();
        
        console.log('OpositaGC Web - Iniciado correctamente');
    },
    
    /**
     * Configura la navegación
     */
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.loadPage(page);
                }
            });
        });
    },
    
    /**
     * Carga una página
     */
    async loadPage(pageName) {
        const mainContent = document.getElementById('main-content');
        const headerTitle = document.getElementById('header-title');
        
        if (!mainContent) return;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Mostrar loading
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
            </div>
        `;
        
        try {
            let html = '';
            let title = '';
            
            switch (pageName) {
                case 'study':
                    title = 'Estudio';
                    html = await StudyPage.render();
                    break;
                case 'topics':
                    title = 'Temas';
                    html = await TopicsPage.render();
                    break;
                case 'calendar':
                    title = 'Calendario';
                    html = await CalendarPage.render();
                    break;
                case 'stats':
                    title = 'Estadísticas';
                    html = await StatsPage.render();
                    break;
                case 'settings':
                    title = 'Ajustes';
                    html = await SettingsPage.render();
                    break;
                default:
                    title = 'Estudio';
                    html = await StudyPage.render();
            }
            
            // Actualizar título
            if (headerTitle) {
                headerTitle.textContent = title;
            }
            
            // Renderizar contenido
            mainContent.innerHTML = html;
            
            // Inicializar eventos de la página
            this.initCurrentPage(pageName);
            
            this.currentPage = pageName;
            
        } catch (error) {
            console.error('Error cargando página:', error);
            mainContent.innerHTML = `
                <div class="error-container">
                    <p>Error al cargar la página</p>
                    <button class="btn btn-primary" onclick="App.loadPage('${pageName}')">Reintentar</button>
                </div>
            `;
        }
    },
    
    /**
     * Inicializa los eventos de la página actual
     */
    initCurrentPage(pageName) {
        switch (pageName) {
            case 'study':
                StudyPage.init();
                break;
            case 'topics':
                TopicsPage.init();
                break;
            case 'calendar':
                CalendarPage.init();
                break;
            case 'stats':
                StatsPage.init();
                break;
            case 'settings':
                SettingsPage.init();
                break;
        }
    },
    
    /**
     * Registra el Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registrado:', registration.scope);
                
                // Verificar actualizaciones
                registration.addEventListener('updatefound', () => {
                    console.log('Nueva versión del Service Worker encontrada');
                    showToast('Nueva versión disponible', 'info');
                });
                
            } catch (error) {
                console.log('Error registrando Service Worker:', error);
            }
        }
    },
    
    /**
     * Guarda el estado del timer
     */
    saveTimerState() {
        if (typeof studyTimer !== 'undefined' && studyTimer.isRunning) {
            // El timer tiene su propio sistema de guardado
            console.log('Timer activo, estado guardado');
        }
    },
    
    /**
     * Precarga el sonido de alarma
     */
    preloadAlarmSound() {
        const audio = document.getElementById('alarm-sound');
        if (audio) {
            audio.load();
        }
    },
    
    /**
     * Refresca la página actual
     */
    refresh() {
        this.loadPage(this.currentPage);
    }
};

// Instancia global del timer
let studyTimer = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Funciones de utilidad globales

/**
 * Descarga un objeto como archivo JSON
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
 * Lee un archivo JSON
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('El archivo no es un JSON válido'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

/**
 * Solicita permiso para notificaciones
 */
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

/**
 * Envía una notificación
 */
function sendNotification(title, body, tag = 'opositagc') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-72.svg',
            tag,
            vibrate: [200, 100, 200]
        });
    }
}
