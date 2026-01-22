/**
 * OpositaGC - Página de Temas
 */

const TopicsPage = {
    topics: [],

    /**
     * Renderiza la página de temas
     */
    async render() {
        await this.loadTopics();
        
        if (this.topics.length === 0) {
            return `
                <div class="page-content">
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24">
                            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                        </svg>
                        <h3 class="empty-state-title">No hay temas</h3>
                        <p class="empty-state-text">Añade temas para organizar tu estudio</p>
                    </div>
                    
                    <button class="fab" id="fab-add-topic">
                        ${getIcon('add')}
                    </button>
                </div>
            `;
        }
        
        const currentYearMonth = getCurrentYearMonth();
        
        return `
            <div class="page-content">
                <div id="topics-list">
                    ${this.topics.map(topic => this.renderTopicItem(topic, currentYearMonth)).join('')}
                </div>
                
                <button class="fab" id="fab-add-topic">
                    ${getIcon('add')}
                </button>
            </div>
        `;
    },

    /**
     * Renderiza un item de tema
     */
    renderTopicItem(topic, currentYearMonth) {
        const hasGoal = topic.monthlyGoalHours && topic.goalYearMonth === currentYearMonth;
        let progressPercent = 0;
        
        if (hasGoal) {
            const goalMinutes = topic.monthlyGoalHours * 60;
            progressPercent = Math.min(100, Math.round((topic.totalStudyMinutes / goalMinutes) * 100));
        } else {
            // Sin objetivo, mostrar progreso sutil basado en 20h máximo
            progressPercent = Math.min(100, Math.round((topic.totalStudyMinutes / (20 * 60)) * 100));
        }
        
        return `
            <div class="list-item ${topic.isCompleted ? 'topic-completed' : ''}" 
                 data-topic-id="${topic.id}" 
                 onclick="TopicsPage.showEditTopicDialog(${topic.id})"
                 oncontextmenu="TopicsPage.showDeleteConfirmation(${topic.id}); return false;">
                <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(topic.name)}</div>
                    ${topic.description ? `<div class="list-item-subtitle">${escapeHtml(topic.description)}</div>` : ''}
                    
                    <div class="topic-progress-container">
                        <div class="topic-progress-bar">
                            <div class="topic-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="topic-goal-text">
                            <span>${formatMinutes(topic.totalStudyMinutes)}</span>
                            ${hasGoal ? `<span>/ ${topic.monthlyGoalHours}h (${progressPercent}%)</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); TopicsPage.showAddTimeDialog(${topic.id})">
                        ${getIcon('add')}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Inicializa los event listeners
     */
    init() {
        document.getElementById('fab-add-topic')?.addEventListener('click', () => {
            this.showAddTopicDialog();
        });
    },

    /**
     * Carga los temas
     */
    async loadTopics() {
        try {
            this.topics = await db.getAllTopics();
        } catch (error) {
            console.error('Error loading topics:', error);
            this.topics = [];
        }
    },

    /**
     * Muestra el diálogo para añadir tema
     */
    showAddTopicDialog() {
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Añadir tema</h2>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Nombre del tema *</label>
                    <input type="text" class="input" id="topic-name" placeholder="Ej: Tema 9 Derecho Procesal">
                </div>
                <div class="input-group">
                    <label class="input-label">Descripción (opcional)</label>
                    <input type="text" class="input" id="topic-description" placeholder="Notas adicionales">
                </div>
                <div class="input-group">
                    <label class="input-label">Objetivo de horas este mes (opcional)</label>
                    <input type="number" class="input" id="topic-goal" min="1" max="200" placeholder="Ej: 17" inputmode="numeric">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-topic">Añadir</button>
            </div>
        `;
        
        showModal(content);
        
        // Focus en el input
        setTimeout(() => document.getElementById('topic-name')?.focus(), 100);
        
        document.getElementById('btn-save-topic').onclick = async () => {
            const name = document.getElementById('topic-name').value.trim();
            const description = document.getElementById('topic-description').value.trim();
            const goalHours = parseFloat(document.getElementById('topic-goal').value) || null;
            
            if (name) {
                await this.addTopic(name, description, goalHours);
                hideModal();
            } else {
                showToast('El nombre es obligatorio', 'error');
            }
        };
    },

    /**
     * Añade un nuevo tema
     */
    async addTopic(name, description, monthlyGoalHours) {
        try {
            const goalYearMonth = monthlyGoalHours ? getCurrentYearMonth() : null;
            
            await db.insertTopic({
                name: name,
                description: description,
                monthlyGoalHours: monthlyGoalHours,
                goalYearMonth: goalYearMonth
            });
            
            showToast('Tema añadido', 'success');
            
            // Recargar página
            App.loadPage('topics');
            
        } catch (error) {
            console.error('Error adding topic:', error);
            showToast('Error al añadir tema', 'error');
        }
    },

    /**
     * Muestra el diálogo para editar tema
     */
    async showEditTopicDialog(topicId) {
        const topic = await db.getTopicById(topicId);
        if (!topic) return;
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Editar tema</h2>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Nombre del tema *</label>
                    <input type="text" class="input" id="edit-topic-name" value="${escapeHtml(topic.name)}">
                </div>
                <div class="input-group">
                    <label class="input-label">Descripción (opcional)</label>
                    <input type="text" class="input" id="edit-topic-description" value="${escapeHtml(topic.description || '')}">
                </div>
                <div class="input-group">
                    <label class="input-label">Objetivo de horas este mes (opcional)</label>
                    <input type="number" class="input" id="edit-topic-goal" min="1" max="200" 
                           value="${topic.monthlyGoalHours || ''}" inputmode="numeric">
                </div>
                
                <div class="setting-item" style="margin-top: 16px;">
                    <div class="setting-info">
                        <div class="setting-title">Tema completado</div>
                        <div class="setting-description">Marcar cuando hayas terminado de estudiar este tema</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="edit-topic-completed" ${topic.isCompleted ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" style="color: var(--color-error);" id="btn-delete-topic">Eliminar</button>
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-update-topic">Guardar</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-update-topic').onclick = async () => {
            const name = document.getElementById('edit-topic-name').value.trim();
            const description = document.getElementById('edit-topic-description').value.trim();
            const goalHours = parseFloat(document.getElementById('edit-topic-goal').value) || null;
            const isCompleted = document.getElementById('edit-topic-completed').checked;
            
            if (name) {
                await this.updateTopic(topic, name, description, goalHours, isCompleted);
                hideModal();
            } else {
                showToast('El nombre es obligatorio', 'error');
            }
        };
        
        document.getElementById('btn-delete-topic').onclick = () => {
            hideModal();
            this.showDeleteConfirmation(topicId);
        };
    },

    /**
     * Actualiza un tema
     */
    async updateTopic(topic, name, description, monthlyGoalHours, isCompleted) {
        try {
            const goalYearMonth = monthlyGoalHours ? getCurrentYearMonth() : null;
            
            const updatedTopic = {
                ...topic,
                name: name,
                description: description,
                monthlyGoalHours: monthlyGoalHours,
                goalYearMonth: goalYearMonth,
                isCompleted: isCompleted
            };
            
            await db.updateTopic(updatedTopic);
            
            showToast('Tema actualizado', 'success');
            App.loadPage('topics');
            
        } catch (error) {
            console.error('Error updating topic:', error);
            showToast('Error al actualizar tema', 'error');
        }
    },

    /**
     * Muestra confirmación de eliminación
     */
    async showDeleteConfirmation(topicId) {
        const topic = await db.getTopicById(topicId);
        if (!topic) return;
        
        showConfirm(
            'Eliminar tema',
            `¿Estás seguro de que quieres eliminar "${escapeHtml(topic.name)}"?`,
            async () => {
                await this.deleteTopic(topicId);
            },
            'Eliminar',
            'Cancelar'
        );
    },

    /**
     * Elimina un tema
     */
    async deleteTopic(topicId) {
        try {
            await db.deleteTopic(topicId);
            showToast('Tema eliminado', 'success');
            App.loadPage('topics');
        } catch (error) {
            console.error('Error deleting topic:', error);
            showToast('Error al eliminar tema', 'error');
        }
    },

    /**
     * Muestra el diálogo para añadir tiempo a un tema
     */
    async showAddTimeDialog(topicId) {
        const topic = await db.getTopicById(topicId);
        if (!topic) return;
        
        const content = `
            <div class="modal-header">
                <h2 class="modal-title">Añadir tiempo</h2>
            </div>
            <div class="modal-body">
                <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
                    Añadir tiempo a "<strong>${escapeHtml(topic.name)}</strong>"
                </p>
                <div class="input-group">
                    <label class="input-label">Horas</label>
                    <input type="number" class="input" id="add-time-hours" min="0" max="23" value="0" inputmode="numeric">
                </div>
                <div class="input-group">
                    <label class="input-label">Minutos</label>
                    <input type="number" class="input" id="add-time-minutes" min="0" max="59" value="30" inputmode="numeric">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-text" onclick="hideModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-add-time">Añadir</button>
            </div>
        `;
        
        showModal(content);
        
        document.getElementById('btn-add-time').onclick = async () => {
            const hours = parseInt(document.getElementById('add-time-hours').value) || 0;
            const minutes = parseInt(document.getElementById('add-time-minutes').value) || 0;
            const totalMinutes = hours * 60 + minutes;
            
            if (totalMinutes > 0) {
                await this.addTimeToTopic(topic, totalMinutes);
                hideModal();
            } else {
                showToast('Introduce un tiempo válido', 'error');
            }
        };
    },

    /**
     * Añade tiempo a un tema
     */
    async addTimeToTopic(topic, minutesToAdd) {
        try {
            const today = getTodayString();
            const currentTime = Date.now();
            
            // Actualizar minutos del tema
            await db.addStudyMinutesToTopic(topic.id, minutesToAdd);
            
            // Crear sesión de estudio
            const session = {
                startTime: currentTime - (minutesToAdd * 60 * 1000),
                endTime: currentTime,
                durationMinutes: minutesToAdd,
                topicId: topic.id,
                isPomodoroSession: false,
                date: today
            };
            await db.insertSession(session);
            
            showToast(`+${formatMinutes(minutesToAdd)} añadidos a ${topic.name}`, 'success');
            App.loadPage('topics');
            
        } catch (error) {
            console.error('Error adding time to topic:', error);
            showToast('Error al añadir tiempo', 'error');
        }
    }
};
