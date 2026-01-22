# OpositaGC Web

Progressive Web App (PWA) para gestión de estudio de oposiciones.

## 🚀 Características

- ⏱️ Cronómetro de estudio con modo Pomodoro
- 📚 Gestión de temas con objetivos de horas
- 📅 Calendario con planificación de tareas
- 📊 Estadísticas mensuales y seguimiento de racha
- 🎯 Objetivos mensuales personalizables
- 🌙 Modo oscuro
- 💾 Exportar/Importar datos
- 📴 Funciona completamente offline
- 📱 Instalable en cualquier dispositivo (PWA)

## 🌐 Demo en vivo

Puedes probar la aplicación en: [https://tu-usuario.github.io/OpositaGC-Web](https://tu-usuario.github.io/OpositaGC-Web)

## 💻 Instalación local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/OpositaGC-Web.git
cd OpositaGC-Web
```

2. Inicia un servidor local:
```bash
# Con Python 3
python -m http.server 8080

# Con Node.js (npx)
npx serve

# Con PHP
php -S localhost:8080
```

3. Abre tu navegador en `http://localhost:8080`

## 📱 Instalar en dispositivos móviles

### iOS (iPhone/iPad)
1. Abre Safari y navega a la URL de la app
2. Toca el botón de compartir (📤)
3. Selecciona "Añadir a pantalla de inicio"
4. ¡Listo! La app se instalará como una app nativa

### Android
1. Abre Chrome y navega a la URL de la app
2. Toca el menú (⋮) y selecciona "Añadir a pantalla de inicio"
3. O espera el banner automático de instalación PWA

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos (Material Design)
- **JavaScript** (Vanilla) - Lógica
- **IndexedDB** - Almacenamiento local
- **Service Worker** - Funcionalidad offline
- **Web Audio API** - Notificaciones sonoras

## 📂 Estructura del proyecto

```
OpositaGC-Web/
├── index.html              # Página principal
├── manifest.json           # Manifest PWA
├── service-worker.js       # Service Worker
├── css/
│   ├── styles.css          # Estilos principales
│   └── themes.css          # Tema oscuro
├── js/
│   ├── app.js              # Controlador principal
│   ├── database.js         # Gestión IndexedDB
│   ├── timer.js            # Sistema de cronómetro
│   ├── utils.js            # Utilidades
│   └── pages/              # Módulos de cada página
│       ├── study.js
│       ├── topics.js
│       ├── calendar.js
│       ├── stats.js
│       └── settings.js
└── icons/                  # Iconos PWA
```

## 🎯 Uso

### Cronómetro
- Selecciona un tema y pulsa "Iniciar"
- Alterna entre modo normal y Pomodoro
- El cronómetro guarda automáticamente al detener

### Temas
- Crea temas con objetivos de horas
- Añade tiempo manualmente cuando sea necesario
- Visualiza tu progreso con barras de progreso

### Calendario
- Planifica tareas para días específicos
- Registra estudio retroactivo
- Visualiza tu planificación mensual

### Estadísticas
- Consulta horas totales del mes
- Revisa tu racha de días consecutivos
- Analiza tiempo invertido por tema

### Ajustes
- Personaliza duración del Pomodoro
- Activa/desactiva modo oscuro
- Exporta/Importa tus datos en formato JSON

## 💾 Datos

Todos los datos se almacenan **localmente** en tu dispositivo usando IndexedDB. No se envía información a ningún servidor externo.

Para hacer backup:
1. Ve a "Ajustes"
2. Pulsa "Exportar datos"
3. Guarda el archivo JSON en un lugar seguro

Para restaurar:
1. Ve a "Ajustes"
2. Pulsa "Importar datos"
3. Selecciona tu archivo de backup

## 📝 Licencia

Uso personal y educativo.

## 👨‍💻 Autor

Creado para estudiantes de oposiciones que buscan organizar mejor su tiempo de estudio.

---

¡Buena suerte con tu oposición! 📚💪
