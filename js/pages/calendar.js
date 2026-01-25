/**
 * OpositaGC - Página de Calendario
 */

const CalendarPage = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    monthStudyData: {},
    monthPlannedDates: [],
    topics: [],

    /**
     * Renderiza la página de calendario
     */
    async render() {
        await this.loadData();
        
        const calendarDays = this.generateCalendarDays();
        const monthName = formatMonthYear(this.currentYear, this.currentMonth);
        const summary = await this.getMonthSummary();
        const pendingTasks = await this.getPendingTasks();
        
        return `
            <div class="page-content">
                <!-- Calendar Card -->
                <div class="card">
                    <div class="calendar-header">
                        <button class="calendar-nav-btn" id="btn-prev-month">
                            ${getIcon('chevronLeft')}
                        </button>
                        <h2 class="calendar-month-title">${monthName}</h2>
                        <button class="calendar-nav-btn" id="btn-next-month">
                            ${getIcon('chevronRight')}
                        </button>
                    </div>
                    
                    <div class="calendar-weekdays">
                        <div class="calendar-weekday">L</div>
                        <div class="calendar-weekday">M</div>
                        <div class="calendar-weekday">X</div>
                        <div class="calendar-weekday">J</div>
                        <div class="calendar-weekday">V</div>
                        <div class="calendar-weekday">S</div>
                        <div class="calendar-weekday">D</div>
                    </div>
                    
                    <div class="calendar-grid" id="calendar-grid">
                        ${calendarDays}
                    </div>
                </div>

                <!-- Month Summary -->
                <div class="card">
                    <div class="card-title">RESUMEN DEL MES</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${summary.daysStudied}</div>
                            <div class="stat-label">Días estudiados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.totalHours}</div>
                            <div class="stat-label">Horas totales</div>
                        </div>
                    </div>
                </div>

                <!-- Upcoming Tasks -->
                <div class="card">
                    <div class="card-title">PRÓXIMAS TAREAS</div>
                    ${pendingTasks.length > 0 ? `
                        <div id="pending-tasks-list">
                            ${pendingTasks.map(task => this.renderTaskItem(task)).join('')}
                        </div>
                    ` : `
                        <p style="color: var(--color-text-hint); text-align: center; padding: 16px;">
                            No hay tareas pendientes
                        </p>
                    `}
                </div>
                
                <button class="fab" id="fab-add-task">
                    ${getIcon('add')}
                </button>
            </div>
        `;
    },

    /**
     * Inicializa los event listeners
     */
    init() {
        document.getElementById('btn-prev-month')?.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            App.loadPage('calendar');
        });

        document.getElementById('btn-next-month')?.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            App.loadPage('calendar');
        });

        document.getElementById('fab-add-task')?.addEventListener('click', () => {
            this.showAddTaskDialog(getTodayString());
        });

        // Click en días del calendario
        document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.getAttribute('data-date');
                if (date) {
                    this.showDayDetailDialog(date);
                }
            });
        });
    },

    /**
     * Carga los datos necesarios
     */
    async loadData() {
        const yearMonth = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        
        try {
            // Cargar temas
            this.topics = await db.getAllTopics();
            
            // Cargar sesiones del mes
            this.monthStudyData = {};
            const sessions = await db.getAllSessions();
            sessions
                .filter(s => s.date && s.date.startsWith(yearMonth))
                .forEach(s => {
                    if (!this.monthStudyData[s.date]) {
                        this.monthStudyData[s.date] = 0;
                    }
                    this.monthStudyData[s.date] += s.durationMinutes || 0;
                });
            
            // Cargar fechas con tareas planificadas
            this.monthPlannedDates = await db.getDatesWithPlannedTasksForMonth(yearMonth);
            
        } catch (error) {
            console.error('Error loading calendar data:', error);
        }
    },

    /**
     * Genera los días del calendario
     */
    generateCalendarDays() {
        const today = getTodayString();
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Obtener el día de la semana del primer día (0=domingo, convertir a lunes=0)
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6;
        
        let html = '';
        
        // Días vacíos al principio
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const studiedMinutes = this.monthStudyData[dateStr] || 0;
            const hasPlanned = this.monthPlannedDates.includes(dateStr);
            const isToday = dateStr === today;
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (studiedMinutes > 0) classes += ' has-study';
            if (hasPlanned) classes += ' has-planned';
            
            html += `
                <div class="${classes}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    ${studiedMinutes > 0 ? `<span class="calendar-day-minutes">${this.formatShortTime(studiedMinutes)}</span>` : ''}
                </div>
            `;
        }
        
        return html;
    },

    /**
     * Formatea tiempo en formato corto
     */
    formatShortTime(minutes) {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
        }
        return `${minutes}m`;
    },

    /**
     * Obtiene el resumen del mes
     */
    async getMonthSummary() {
        const daysStudied = Object.keys(this.monthStudyData).filter(d => this.monthStudyData[d] > 0).length;
        const totalMinutes = Object.values(this.monthStudyData).reduce((a, b) => a + b, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        return {
            daysStudied: daysStudied,
            totalHours: mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
        };
    },

    /**
     * Obtiene las tareas pendientes
     */
    async getPendingTasks() {
        try {
            const tasks = await db.getPendingTasks(getTodayString());
            return tasks.slice(0, 5); // Máximo 5 tareas
        } catch (error) {
            console.error('Error getting pending tasks:', error);
            return [];
        }
    },

    /**
     * Renderiza un item de tarea
     */
    renderTaskItem(task) {
        return `
            <div class="list-item" onclick="CalendarPage.showEditTaskDialog(${task.id})">
                <label class="checkbox" onclick="event.stopPropagation();">
                    <input type="checkbox" ${task.isCompleted ? 'checked' : ''} 
                           onchange="CalendarPage.toggleTaskComplete(${task.id}, this.checked)">
                    <span class="checkbox-box">
                        ${getIcon('check')}
                    </span>
                </label>
                <div class="list-item-content" style="margin-left: 12px;">
                    <div class="list-item-title" style="${task.isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        ${escapeHtml(task.topicName)}
                    </div>
                    <div class="list-item-subtitle">
                        📅 ${formatDateFull(task.date)} · ${formatMinutes(task.plannedMinutes)}
                    </div>
                </div>
                <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); CalendarPage.deleteTask(${task.id})">
                    ${getIcon('delete')}
                </button>
            </div>
        `;
    },

    /**
     * Muestra el diálogo de detalle del día
     */
    async showDayDetailDialog(date) {
        const sessions = await db.getSessionsForDate(date);
        const tasks = await db.getTasksForDate(date);
        const formattedDate = formatDateFull(date);
        
        // Crear mapa de nombres de temas
        const topicNames = {};
        this.topics.forEach(t => topicNames[t.id] = t.name);
        
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        
        // Formatear hora
        const formatTime = (timestamp) => {
            const d = new Date(timestamp);
            return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        };
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">📆 ${formattedDate}</h2>
            </div>
            <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                <!-- Sesiones de estudio -->
                <div class="section-title">Sesiones de estudio</div>
                ${sessions.length > 0 ? `
                    <p style="color: var(--color-text-hint); font-size: 12px; margin-bottom: 8px;">
                        💡 Toca una sesión para editarla
                    </p>
                    ${sessions.map(s => `
                        <div class="list-item session-editable" data-session-id="${s.id}" style="cursor: pointer;">
                            <div class="list-item-content" style="flex: 1;">
                                <div class="list-item-title">
                                    ${s.topicId && topicNames[s.topicId] ? escapeHtml(topicNames[s.topicId]) : 'Sin tema'}
                                </div>
                                <div class="list-item-subtitle">
                                    ${formatTime(s.startTime)} - ${s.endTime ? formatTime(s.endTime) : 'en curso'} · ${formatMinutes(s.durationMinutes)} ${s.isPomodoroSession ? '🍅' : ''}
                                </div>
                            </div>
                            <span class="edit-icon" style="color: var(--color-text-hint); font-size: 18px;">✏️</span>
                        </div>
                    `).join('')}
                    <p style="margin-top: 8px; font-weight: 600; color: var(--color-primary);">
                        Total: ${formatMinutes(totalMinutes)}
                    </p>
                ` : `
                    <p style="color: var(--color-text-hint); padding: 8px 0;">No hay sesiones registradas</p>
                `}
                
                <!-- Tareas planificadas -->
                <div class="section-title" style="margin-top: 24px;">Tareas planificadas</div>
                ${tasks.length > 0 ? `
                    ${tasks.map(t => `
                        <div class="list-item" style="cursor: default;">
                            <label class="checkbox" onclick="event.stopPropagation();">
                                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} 
                                       onchange="CalendarPage.toggleTaskComplete(${t.id}, this.checked)">
                                <span class="checkbox-box">${getIcon('check')}</span>
                            </label>
                            <div class="list-item-content" style="margin-left: 12px;">
                                <div class="list-item-title" style="${t.isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                                    ${escapeHtml(t.topicName)}
                                </div>
                                <div class="list-item-subtitle">${formatMinutes(t.plannedMinutes)}</div>
                            </div>
                        </div>
                    `).join('')}
                ` : `
                    <p style="color: var(--color-text-hint); padding: 8px 0;">No hay tareas planificadas</p>
                `}
            </div>
            <div class="modal-footer" style="flex-wrap: wrap; gap: 8px;">
                <button class="btn btn-secondary" id="btn-add-past-study">📚 Añadir estudio</button>
                <button class="btn btn-secondary" id="btn-add-task-modal">📋 Añadir tarea</button>
                <button class="btn btn-text" onclick="hideModal()">Cerrar</button>
            </div>
        `;
        
        showModal(content);
        
        // Event listeners para editar sesiones
        document.querySelectorAll('.session-editable').forEach(item => {
            item.addEventListener('click', () => {
                const sessionId = parseInt(item.getAttribute('data-session-id'));
                hideModal();
                this.showEditSessionDialog(sessionId, date);
            });
        });
        
        document.getElementById('btn-add-past-study').onclick = () => {
            hideModal();
            this.showAddPastStudyDialog(date);
        };
        
        document.getElementById('btn-add-task-modal').onclick = () => {
            hideModal();
            this.showAddTaskDialog(date);
        };
    },

    /**
     * Muestra el diálogo para editar una sesión de estudio
     */
    async showEditSessionDialog(sessionId, date) {
        const session = await db.getSessionById(sessionId);
        if (!session) {
            showToast('Sesión no encontrada', 'error');
            return;
        }
        
        const activeTopics = this.topics.filter(t => !t.isCompleted);
        const currentTopic = this.topics.find(t => t.id === session.topicId);
        
        const hours = Math.floor(session.durationMinutes / 60);
        const minutes = session.durationMinutes % 60;
        
        const formattedDate = formatDateFull(date);
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">✏️ Editar sesión</h2>
            </div>
            <div class="modal-body">
                <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
                    📅 ${formattedDate}
                </p>
                
                <div class="input-group">
                    <label class="input-label">Tema estudiado</label>
                    <select class="input" id="edit-session-topic">
                        <option value="">Sin tema</option>
                        ${this.topics.map(t => `
                            <option value="${t.id}" ${t.id === session.topicId ? 'selected' : ''}>
                                ${escapeHtml(t.name)} ${t.isCompleted ? '(completado)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div style="display: flex; gap: 16px;">
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Horas</label>
                        <input type="number" class="input" id="edit-session-hours" min="0" max="23" value="${hours}" inputmode="numeric">
                    </div>
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Minutos</label>
                        <input type="number" class="input" id="edit-session-minutes" min="0" max="59" value="${minutes}" inputmode="numeric">
                    </div>
                </div>
                
                <p style="color: var(--color-text-hint); font-size: 12px; margin-top: 8px;">
                    💡 Los cambios se reflejarán en el tiempo total del tema y en las estadísticas
                </p>
            </div>
            <div class="modal-footer" style="flex-wrap: wrap; gap: 8px;">
                <button class="btn btn-danger" id="btn-delete-session" style="margin-right: auto;">
                    🗑️ Eliminar
                </button>
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-session">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-save-session').onclick = async () => {
            const newTopicId = document.getElementById('edit-session-topic').value;
            const newHours = parseInt(document.getElementById('edit-session-hours').value) || 0;
            const newMinutes = parseInt(document.getElementById('edit-session-minutes').value) || 0;
            const newTotalMinutes = newHours * 60 + newMinutes;
            
            if (newTotalMinutes <= 0) {
                showToast('El tiempo debe ser mayor que 0', 'error');
                return;
            }
            
            await this.updateSession(session, newTopicId ? parseInt(newTopicId) : null, newTotalMinutes);
            hideModal();
        };
        
        document.getElementById('btn-delete-session').onclick = () => {
            hideModal();
            this.confirmDeleteSession(session);
        };
    },

    /**
     * Actualiza una sesión de estudio y ajusta los tiempos acumulados
     */
    async updateSession(session, newTopicId, newDurationMinutes) {
        try {
            const oldTopicId = session.topicId;
            const oldDuration = session.durationMinutes;
            const durationDiff = newDurationMinutes - oldDuration;
            
            // Si cambió el tema, actualizar ambos temas
            if (oldTopicId !== newTopicId) {
                // Restar del tema antiguo
                if (oldTopicId) {
                    await db.addStudyMinutesToTopic(oldTopicId, -oldDuration);
                }
                // Sumar al tema nuevo
                if (newTopicId) {
                    await db.addStudyMinutesToTopic(newTopicId, newDurationMinutes);
                }
            } else if (durationDiff !== 0 && newTopicId) {
                // Solo cambió la duración, ajustar en el mismo tema
                await db.addStudyMinutesToTopic(newTopicId, durationDiff);
            }
            
            // Actualizar la sesión
            session.topicId = newTopicId;
            session.durationMinutes = newDurationMinutes;
            // Ajustar endTime basándose en la nueva duración
            session.endTime = session.startTime + (newDurationMinutes * 60 * 1000);
            
            await db.updateSession(session);
            
            showToast('Sesión actualizada', 'success');
            App.loadPage('calendar');
            
        } catch (error) {
            console.error('Error updating session:', error);
            showToast('Error al actualizar sesión', 'error');
        }
    },

    /**
     * Confirma y elimina una sesión de estudio
     */
    confirmDeleteSession(session) {
        showConfirm(
            'Eliminar sesión',
            `¿Eliminar esta sesión de ${formatMinutes(session.durationMinutes)}? El tiempo se restará del tema y las estadísticas.`,
            async () => {
                await this.deleteSession(session);
            },
            'Eliminar',
            'Cancelar'
        );
    },

    /**
     * Elimina una sesión de estudio y ajusta los tiempos
     */
    async deleteSession(session) {
        try {
            // Restar tiempo del tema
            if (session.topicId) {
                await db.addStudyMinutesToTopic(session.topicId, -session.durationMinutes);
            }
            
            // Eliminar la sesión
            await db.deleteSession(session.id);
            
            showToast('Sesión eliminada', 'success');
            App.loadPage('calendar');
            
        } catch (error) {
            console.error('Error deleting session:', error);
            showToast('Error al eliminar sesión', 'error');
        }
    },

    /**
     * Muestra el diálogo para añadir tarea
     */
    async showAddTaskDialog(date) {
        const activeTopics = this.topics.filter(t => !t.isCompleted);
        const formattedDate = formatDateFull(date);
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Añadir tarea</h2>
            </div>
            <div class="modal-body">
                <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
                    📅 ${formattedDate}
                </p>
                
                <div class="input-group">
                    <label class="input-label">Tema o descripción</label>
                    <select class="input" id="task-topic-select">
                        <option value="">-- Seleccionar tema --</option>
                        <option value="custom">✏️ Escribir descripción manual</option>
                        ${activeTopics.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
                    </select>
                </div>
                
                <div class="input-group" id="custom-topic-group" style="display: none;">
                    <label class="input-label">Descripción</label>
                    <input type="text" class="input" id="task-custom-topic" placeholder="Ej: Repasar esquemas">
                </div>
                
                <div style="display: flex; gap: 16px;">
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Horas</label>
                        <input type="number" class="input" id="task-hours" min="0" max="23" value="1" inputmode="numeric">
                    </div>
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Minutos</label>
                        <input type="number" class="input" id="task-minutes" min="0" max="59" value="0" inputmode="numeric">
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Notas (opcional)</label>
                    <input type="text" class="input" id="task-notes" placeholder="Notas adicionales">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-task">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        // Mostrar/ocultar campo de descripción manual
        document.getElementById('task-topic-select').onchange = (e) => {
            const customGroup = document.getElementById('custom-topic-group');
            customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        };
        
        document.getElementById('btn-save-task').onclick = async () => {
            const selectValue = document.getElementById('task-topic-select').value;
            const customTopic = document.getElementById('task-custom-topic').value.trim();
            const hours = parseInt(document.getElementById('task-hours').value) || 0;
            const minutes = parseInt(document.getElementById('task-minutes').value) || 0;
            const notes = document.getElementById('task-notes').value.trim();
            
            const totalMinutes = hours * 60 + minutes;
            
            if (!selectValue) {
                showToast('Selecciona un tema', 'error');
                return;
            }
            
            if (selectValue === 'custom' && !customTopic) {
                showToast('Escribe una descripción', 'error');
                return;
            }
            
            if (totalMinutes <= 0) {
                showToast('El tiempo debe ser mayor que 0', 'error');
                return;
            }
            
            let topicName, topicId = null;
            
            if (selectValue === 'custom') {
                topicName = customTopic;
            } else {
                topicId = parseInt(selectValue);
                const topic = this.topics.find(t => t.id === topicId);
                topicName = topic ? topic.name : 'Sin tema';
            }
            
            await this.saveTask(date, topicId, topicName, totalMinutes, notes);
            hideModal();
        };
    },

    /**
     * Guarda una tarea
     */
    async saveTask(date, topicId, topicName, plannedMinutes, notes) {
        try {
            await db.insertTask({
                date: date,
                topicId: topicId,
                topicName: topicName,
                plannedMinutes: plannedMinutes,
                notes: notes
            });
            
            showToast('Tarea añadida', 'success');
            App.loadPage('calendar');
            
        } catch (error) {
            console.error('Error saving task:', error);
            showToast('Error al guardar tarea', 'error');
        }
    },

    /**
     * Muestra el diálogo para añadir estudio retroactivo
     */
    async showAddPastStudyDialog(date) {
        const activeTopics = this.topics.filter(t => !t.isCompleted);
        const formattedDate = formatDateFull(date);
        
        if (activeTopics.length === 0) {
            showToast('Primero crea un tema', 'error');
            return;
        }
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Añadir estudio</h2>
            </div>
            <div class="modal-body">
                <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
                    📅 ${formattedDate}
                </p>
                
                <div class="input-group">
                    <label class="input-label">Tema estudiado *</label>
                    <select class="input" id="past-study-topic">
                        <option value="">-- Seleccionar tema --</option>
                        ${activeTopics.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: flex; gap: 16px;">
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Horas</label>
                        <input type="number" class="input" id="past-study-hours" min="0" max="23" value="1" inputmode="numeric">
                    </div>
                    <div class="input-group" style="flex: 1;">
                        <label class="input-label">Minutos</label>
                        <input type="number" class="input" id="past-study-minutes" min="0" max="59" value="0" inputmode="numeric">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-past-study">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-save-past-study').onclick = async () => {
            const topicId = parseInt(document.getElementById('past-study-topic').value);
            const hours = parseInt(document.getElementById('past-study-hours').value) || 0;
            const minutes = parseInt(document.getElementById('past-study-minutes').value) || 0;
            const totalMinutes = hours * 60 + minutes;
            
            if (!topicId) {
                showToast('Selecciona un tema', 'error');
                return;
            }
            
            if (totalMinutes <= 0) {
                showToast('El tiempo debe ser mayor que 0', 'error');
                return;
            }
            
            await this.savePastStudy(date, topicId, totalMinutes);
            hideModal();
        };
    },

    /**
     * Guarda una sesión de estudio retroactiva
     */
    async savePastStudy(date, topicId, totalMinutes) {
        try {
            const parsedDate = new Date(date + 'T12:00:00');
            const sessionTime = parsedDate.getTime();
            
            // Crear sesión
            const session = {
                startTime: sessionTime,
                endTime: sessionTime + (totalMinutes * 60 * 1000),
                durationMinutes: totalMinutes,
                topicId: topicId,
                isPomodoroSession: false,
                date: date
            };
            await db.insertSession(session);
            
            // Actualizar minutos del tema
            await db.addStudyMinutesToTopic(topicId, totalMinutes);
            
            const topic = this.topics.find(t => t.id === topicId);
            showToast(`+${formatMinutes(totalMinutes)} añadidos a ${topic?.name || 'tema'}`, 'success');
            App.loadPage('calendar');
            
        } catch (error) {
            console.error('Error saving past study:', error);
            showToast('Error al guardar estudio', 'error');
        }
    },

    /**
     * Marca/desmarca una tarea como completada
     */
    async toggleTaskComplete(taskId, isCompleted) {
        try {
            const tasks = await db.getAllTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await db.setTaskCompleted(taskId, isCompleted, isCompleted ? task.plannedMinutes : 0);
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    },

    /**
     * Elimina una tarea
     */
    async deleteTask(taskId) {
        showConfirm(
            'Eliminar tarea',
            '¿Estás seguro de que quieres eliminar esta tarea?',
            async () => {
                try {
                    await db.deleteTask(taskId);
                    showToast('Tarea eliminada', 'success');
                    App.loadPage('calendar');
                } catch (error) {
                    console.error('Error deleting task:', error);
                    showToast('Error al eliminar tarea', 'error');
                }
            },
            'Eliminar',
            'Cancelar'
        );
    }
};
