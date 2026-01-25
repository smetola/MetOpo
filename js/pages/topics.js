/**
 * OpositaGC - Página de Temas
 */

const TopicsPage = {
    topics: [],
    
    // Drag and drop state
    isDragging: false,
    draggedElement: null,
    draggedTopicId: null,
    dragClone: null,
    placeholder: null,
    touchStartY: 0,
    touchStartX: 0,
    initialIndex: -1,
    deleteZone: null,
    isOverDeleteZone: false,

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
                
                <!-- Zona de eliminación (aparece al arrastrar) -->
                <div id="delete-zone" class="delete-zone">
                    <span class="delete-zone-icon">🗑️</span>
                    <span class="delete-zone-text">Soltar para eliminar</span>
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
            progressPercent = Math.min(100, Math.round((topic.totalStudyMinutes / (20 * 60)) * 100));
        }
        
        return `
            <div class="list-item topic-item ${topic.isCompleted ? 'topic-completed' : ''}" 
                 data-topic-id="${topic.id}">
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
                    <button class="btn btn-icon btn-secondary" data-action="add-time" data-topic-id="${topic.id}">
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
        
        this.deleteZone = document.getElementById('delete-zone');
        this.setupDragAndDrop();
    },
    
    /**
     * Configura el sistema de drag-and-drop para reordenar temas
     */
    setupDragAndDrop() {
        const topicsList = document.getElementById('topics-list');
        if (!topicsList) return;
        
        const DRAG_THRESHOLD = 150; // ms antes de iniciar arrastre
        let pressTimer = null;
        let canStartDrag = false;
        
        topicsList.querySelectorAll('.topic-item').forEach(item => {
            const topicId = parseInt(item.dataset.topicId);
            
            // === TOUCH EVENTS ===
            item.addEventListener('touchstart', (e) => {
                if (this.isDragging) return;
                if (e.target.closest('[data-action]')) return;
                
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                canStartDrag = false;
                
                // Después de DRAG_THRESHOLD, permitir arrastre
                pressTimer = setTimeout(() => {
                    canStartDrag = true;
                    item.classList.add('ready-to-drag');
                }, DRAG_THRESHOLD);
            }, { passive: true });
            
            item.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - this.touchStartX);
                const deltaY = Math.abs(touch.clientY - this.touchStartY);
                
                // Si se mueve antes del threshold, es scroll normal
                if (!canStartDrag && (deltaX > 10 || deltaY > 10)) {
                    clearTimeout(pressTimer);
                    item.classList.remove('ready-to-drag');
                    return;
                }
                
                // Iniciar arrastre si está permitido y hay movimiento
                if (canStartDrag && !this.isDragging && (deltaX > 5 || deltaY > 5)) {
                    this.startDrag(item, topicId, touch.clientX, touch.clientY);
                }
                
                if (this.isDragging) {
                    e.preventDefault();
                    this.onDragMove(touch.clientX, touch.clientY);
                }
            }, { passive: false });
            
            item.addEventListener('touchend', (e) => {
                clearTimeout(pressTimer);
                item.classList.remove('ready-to-drag');
                
                if (this.isDragging) {
                    this.endDrag();
                } else if (!canStartDrag) {
                    // Tap rápido = click
                    if (!e.target.closest('[data-action]')) {
                        this.showEditTopicDialog(topicId);
                    }
                }
                canStartDrag = false;
            });
            
            item.addEventListener('touchcancel', () => {
                clearTimeout(pressTimer);
                item.classList.remove('ready-to-drag');
                if (this.isDragging) {
                    this.cancelDrag();
                }
                canStartDrag = false;
            });
            
            // === MOUSE EVENTS ===
            item.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                if (e.target.closest('[data-action]')) return;
                
                this.touchStartX = e.clientX;
                this.touchStartY = e.clientY;
                canStartDrag = false;
                
                pressTimer = setTimeout(() => {
                    canStartDrag = true;
                    item.classList.add('ready-to-drag');
                }, DRAG_THRESHOLD);
                
                e.preventDefault();
            });
            
            // Click en añadir tiempo
            item.querySelector('[data-action="add-time"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAddTimeDialog(topicId);
            });
        });
        
        // Mouse move global
        document.addEventListener('mousemove', (e) => {
            if (!canStartDrag && !this.isDragging) return;
            
            const deltaX = Math.abs(e.clientX - this.touchStartX);
            const deltaY = Math.abs(e.clientY - this.touchStartY);
            
            // Iniciar arrastre
            if (canStartDrag && !this.isDragging && (deltaX > 5 || deltaY > 5)) {
                const item = document.querySelector('.topic-item.ready-to-drag');
                if (item) {
                    const topicId = parseInt(item.dataset.topicId);
                    this.startDrag(item, topicId, e.clientX, e.clientY);
                }
            }
            
            if (this.isDragging) {
                this.onDragMove(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
            document.querySelectorAll('.ready-to-drag').forEach(el => el.classList.remove('ready-to-drag'));
            
            if (this.isDragging) {
                this.endDrag();
            }
            canStartDrag = false;
        });
    },
    
    /**
     * Inicia el arrastre
     */
    startDrag(element, topicId, clientX, clientY) {
        this.isDragging = true;
        this.draggedElement = element;
        this.draggedTopicId = topicId;
        
        const topicsList = document.getElementById('topics-list');
        const items = Array.from(topicsList.querySelectorAll('.topic-item'));
        this.initialIndex = items.indexOf(element);
        
        // Crear clon visual que sigue al cursor
        const rect = element.getBoundingClientRect();
        this.dragClone = element.cloneNode(true);
        this.dragClone.classList.add('drag-clone');
        this.dragClone.style.width = rect.width + 'px';
        this.dragClone.style.left = rect.left + 'px';
        this.dragClone.style.top = rect.top + 'px';
        document.body.appendChild(this.dragClone);
        
        // Crear placeholder
        this.placeholder = document.createElement('div');
        this.placeholder.classList.add('drag-placeholder');
        this.placeholder.style.height = rect.height + 'px';
        element.parentNode.insertBefore(this.placeholder, element);
        
        // Ocultar elemento original
        element.classList.add('dragging-original');
        element.classList.remove('ready-to-drag');
        
        // Mostrar zona de eliminación
        this.deleteZone?.classList.add('visible');
        
        // Vibrar
        if (navigator.vibrate) navigator.vibrate(30);
    },
    
    /**
     * Durante el arrastre
     */
    onDragMove(clientX, clientY) {
        if (!this.dragClone) return;
        
        // Mover clon
        this.dragClone.style.left = (clientX - this.dragClone.offsetWidth / 2) + 'px';
        this.dragClone.style.top = (clientY - this.dragClone.offsetHeight / 2) + 'px';
        
        // Verificar si está sobre zona de eliminación
        if (this.deleteZone) {
            const deleteRect = this.deleteZone.getBoundingClientRect();
            this.isOverDeleteZone = clientY >= deleteRect.top - 20;
            this.deleteZone.classList.toggle('active', this.isOverDeleteZone);
            this.dragClone.classList.toggle('over-delete', this.isOverDeleteZone);
        }
        
        // Si no está sobre zona de eliminación, reorganizar items
        if (!this.isOverDeleteZone) {
            this.updateItemPositions(clientY);
        }
    },
    
    /**
     * Actualiza las posiciones de los items durante el arrastre
     */
    updateItemPositions(clientY) {
        const topicsList = document.getElementById('topics-list');
        const items = Array.from(topicsList.querySelectorAll('.topic-item:not(.dragging-original)'));
        
        let newIndex = items.length;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (clientY < midY) {
                newIndex = i;
                break;
            }
        }
        
        // Mover placeholder a la nueva posición
        if (this.placeholder) {
            const placeholderIndex = Array.from(topicsList.children).indexOf(this.placeholder);
            
            if (newIndex !== placeholderIndex) {
                if (newIndex >= items.length) {
                    topicsList.appendChild(this.placeholder);
                } else {
                    const targetItem = items[newIndex];
                    topicsList.insertBefore(this.placeholder, targetItem);
                }
            }
        }
    },
    
    /**
     * Finaliza el arrastre
     */
    async endDrag() {
        if (!this.isDragging) return;
        
        // Ocultar zona de eliminación
        this.deleteZone?.classList.remove('visible', 'active');
        
        if (this.isOverDeleteZone) {
            // Eliminar tema
            this.confirmDeleteTopic(this.draggedTopicId);
        } else {
            // Mover elemento a la posición del placeholder
            if (this.placeholder && this.draggedElement) {
                this.placeholder.parentNode.insertBefore(this.draggedElement, this.placeholder);
            }
            
            // Guardar nuevo orden
            await this.saveNewOrder();
        }
        
        this.cleanupDrag();
    },
    
    /**
     * Cancela el arrastre
     */
    cancelDrag() {
        this.deleteZone?.classList.remove('visible', 'active');
        this.cleanupDrag();
    },
    
    /**
     * Limpia elementos de arrastre
     */
    cleanupDrag() {
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging-original');
        }
        
        this.isDragging = false;
        this.draggedElement = null;
        this.draggedTopicId = null;
        this.isOverDeleteZone = false;
    },
    
    /**
     * Guarda el nuevo orden
     */
    async saveNewOrder() {
        const topicsList = document.getElementById('topics-list');
        const newOrder = Array.from(topicsList.querySelectorAll('.topic-item'))
            .map(item => parseInt(item.dataset.topicId));
        
        await db.updateTopicsOrder(newOrder);
        showToast('Orden actualizado', 'success');
    },
    
    /**
     * Confirma eliminación de tema
     */
    async confirmDeleteTopic(topicId) {
        const topic = await db.getTopicById(topicId);
        if (!topic) {
            this.cleanupDrag();
            return;
        }
        
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
