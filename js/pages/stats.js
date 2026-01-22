/**
 * OpositaGC - Página de Estadísticas
 */

const StatsPage = {
    /**
     * Renderiza la página de estadísticas
     */
    async render() {
        const yearMonth = getCurrentYearMonth();
        const monthName = formatMonthYear(new Date().getFullYear(), new Date().getMonth());
        
        const stats = await this.getMonthStats(yearMonth);
        const goal = await this.getMonthlyGoal(yearMonth);
        const recentRecords = await this.getRecentRecords();
        
        return `
            <div class="page-content">
                <!-- Month Header -->
                <div class="card">
                    <div class="card-title">${monthName.toUpperCase()}</div>
                    
                    <!-- Monthly Goal -->
                    ${goal ? `
                        <div style="margin-bottom: 24px;">
                            <div class="progress-bar" style="height: 12px;">
                                <div class="progress-fill" style="width: ${goal.percentage}%"></div>
                            </div>
                            <div class="progress-text" style="margin-top: 8px;">
                                <span>${formatHoursDecimal(goal.completedMinutes)}</span>
                                <span>${goal.targetHours}h objetivo (${goal.percentage}%)</span>
                            </div>
                        </div>
                    ` : `
                        <p style="color: var(--color-text-hint); margin-bottom: 24px; text-align: center;">
                            Sin objetivo mensual definido
                        </p>
                    `}
                    
                    <button class="btn btn-secondary" style="width: 100%;" id="btn-set-goal">
                        ${goal ? 'Editar objetivo' : 'Definir objetivo'}
                    </button>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalHours}</div>
                        <div class="stat-label">Horas totales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.avgDaily}m</div>
                        <div class="stat-label">Media diaria</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.daysStudied}</div>
                        <div class="stat-label">Días estudiados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.streak}</div>
                        <div class="stat-label">Racha actual</div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-title">ACTIVIDAD RECIENTE</div>
                    ${recentRecords.length > 0 ? `
                        <div id="recent-records">
                            ${recentRecords.map(record => this.renderRecordItem(record)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="padding: 24px 0;">
                            <p class="empty-state-text">No hay registros este mes</p>
                        </div>
                    `}
                </div>

                <!-- Topics Summary -->
                <div class="card">
                    <div class="card-title">TIEMPO POR TEMA</div>
                    <div id="topics-summary">
                        ${await this.renderTopicsSummary()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Inicializa los event listeners
     */
    init() {
        document.getElementById('btn-set-goal')?.addEventListener('click', () => {
            this.showSetGoalDialog();
        });
    },

    /**
     * Obtiene las estadísticas del mes
     */
    async getMonthStats(yearMonth) {
        try {
            const sessions = await db.getAllSessions();
            const monthSessions = sessions.filter(s => s.date && s.date.startsWith(yearMonth));
            
            // Agrupar por día
            const dailyMinutes = {};
            monthSessions.forEach(s => {
                if (!dailyMinutes[s.date]) {
                    dailyMinutes[s.date] = 0;
                }
                dailyMinutes[s.date] += s.durationMinutes || 0;
            });
            
            const daysStudied = Object.keys(dailyMinutes).filter(d => dailyMinutes[d] > 0).length;
            const totalMinutes = Object.values(dailyMinutes).reduce((a, b) => a + b, 0);
            const avgDaily = daysStudied > 0 ? Math.round(totalMinutes / daysStudied) : 0;
            
            // Calcular racha
            const streak = this.calculateStreak(dailyMinutes);
            
            return {
                totalHours: formatHoursDecimal(totalMinutes),
                daysStudied: daysStudied,
                avgDaily: avgDaily,
                streak: streak
            };
            
        } catch (error) {
            console.error('Error getting month stats:', error);
            return {
                totalHours: '0h',
                daysStudied: 0,
                avgDaily: 0,
                streak: 0
            };
        }
    },

    /**
     * Calcula la racha actual de días consecutivos
     */
    calculateStreak(dailyMinutes) {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        // Verificar desde hoy hacia atrás
        while (true) {
            const dateStr = formatDate(currentDate);
            
            if (dailyMinutes[dateStr] && dailyMinutes[dateStr] > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                // Si es hoy y no hay estudio, no rompe la racha
                if (streak === 0 && dateStr === formatDate(today)) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        
        return streak;
    },

    /**
     * Obtiene el objetivo mensual
     */
    async getMonthlyGoal(yearMonth) {
        try {
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
     * Obtiene los registros recientes
     */
    async getRecentRecords() {
        try {
            const yearMonth = getCurrentYearMonth();
            const records = await db.getRecordsForMonth(yearMonth);
            return records.slice(0, 10); // Últimos 10
        } catch (error) {
            console.error('Error getting recent records:', error);
            return [];
        }
    },

    /**
     * Renderiza un item de registro
     */
    renderRecordItem(record) {
        const formattedDate = formatDateFull(record.date);
        
        return `
            <div class="list-item" style="cursor: default;">
                <div class="list-item-content">
                    <div class="list-item-title">${formattedDate}</div>
                    <div class="list-item-subtitle">${formatMinutes(record.studyMinutes)}</div>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza el resumen de tiempo por tema
     */
    async renderTopicsSummary() {
        try {
            const topics = await db.getAllTopics();
            const yearMonth = getCurrentYearMonth();
            const sessions = await db.getAllSessions();
            
            // Calcular minutos por tema este mes
            const topicMinutes = {};
            sessions
                .filter(s => s.date && s.date.startsWith(yearMonth) && s.topicId)
                .forEach(s => {
                    if (!topicMinutes[s.topicId]) {
                        topicMinutes[s.topicId] = 0;
                    }
                    topicMinutes[s.topicId] += s.durationMinutes || 0;
                });
            
            // Ordenar temas por minutos estudiados este mes
            const topicsWithMinutes = topics
                .map(t => ({
                    ...t,
                    monthMinutes: topicMinutes[t.id] || 0
                }))
                .filter(t => t.monthMinutes > 0 || t.totalStudyMinutes > 0)
                .sort((a, b) => b.monthMinutes - a.monthMinutes);
            
            if (topicsWithMinutes.length === 0) {
                return '<p style="color: var(--color-text-hint); text-align: center;">No hay temas con tiempo registrado</p>';
            }
            
            // Encontrar el máximo para calcular porcentajes de barra
            const maxMinutes = Math.max(...topicsWithMinutes.map(t => t.monthMinutes), 1);
            
            return topicsWithMinutes.map(topic => {
                const barWidth = (topic.monthMinutes / maxMinutes) * 100;
                
                return `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-size: 14px; font-weight: 500;">${escapeHtml(topic.name)}</span>
                            <span style="font-size: 14px; color: var(--color-primary);">${formatMinutes(topic.monthMinutes)}</span>
                        </div>
                        <div class="topic-progress-bar">
                            <div class="topic-progress-fill" style="width: ${barWidth}%"></div>
                        </div>
                        <div style="font-size: 11px; color: var(--color-text-hint); margin-top: 2px;">
                            Total acumulado: ${formatMinutes(topic.totalStudyMinutes)}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering topics summary:', error);
            return '<p style="color: var(--color-text-hint);">Error al cargar datos</p>';
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
                try {
                    await db.insertOrUpdateGoal({
                        yearMonth: yearMonth,
                        targetHours: hours,
                        completedMinutes: 0
                    });
                    
                    showToast(`Objetivo guardado: ${hours}h`, 'success');
                    hideModal();
                    App.loadPage('stats');
                    
                } catch (error) {
                    console.error('Error saving goal:', error);
                    showToast('Error al guardar objetivo', 'error');
                }
            } else {
                showToast('Introduce un número válido de horas', 'error');
            }
        };
    }
};
