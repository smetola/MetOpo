/**
 * OpositaGC - Base de datos IndexedDB
 * Replica la estructura de Room de Android
 */

const DB_NAME = 'OpositaGCDB';
const DB_VERSION = 1;

// Stores (equivalentes a las tablas de Room)
const STORES = {
    TOPICS: 'study_topics',
    MONTHLY_GOALS: 'monthly_goals',
    DAILY_RECORDS: 'daily_records',
    STUDY_SESSIONS: 'study_sessions',
    PLANNED_TASKS: 'planned_tasks'
};

class Database {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    /**
     * Inicializa la base de datos
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error opening database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    /**
     * Crea los object stores (tablas)
     */
    createStores(db) {
        // Study Topics
        if (!db.objectStoreNames.contains(STORES.TOPICS)) {
            const topicsStore = db.createObjectStore(STORES.TOPICS, { keyPath: 'id', autoIncrement: true });
            topicsStore.createIndex('name', 'name', { unique: false });
            topicsStore.createIndex('isCompleted', 'isCompleted', { unique: false });
            topicsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Monthly Goals
        if (!db.objectStoreNames.contains(STORES.MONTHLY_GOALS)) {
            const goalsStore = db.createObjectStore(STORES.MONTHLY_GOALS, { keyPath: 'yearMonth' });
        }

        // Daily Records
        if (!db.objectStoreNames.contains(STORES.DAILY_RECORDS)) {
            const recordsStore = db.createObjectStore(STORES.DAILY_RECORDS, { keyPath: 'date' });
        }

        // Study Sessions
        if (!db.objectStoreNames.contains(STORES.STUDY_SESSIONS)) {
            const sessionsStore = db.createObjectStore(STORES.STUDY_SESSIONS, { keyPath: 'id', autoIncrement: true });
            sessionsStore.createIndex('date', 'date', { unique: false });
            sessionsStore.createIndex('topicId', 'topicId', { unique: false });
            sessionsStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Planned Tasks
        if (!db.objectStoreNames.contains(STORES.PLANNED_TASKS)) {
            const tasksStore = db.createObjectStore(STORES.PLANNED_TASKS, { keyPath: 'id', autoIncrement: true });
            tasksStore.createIndex('date', 'date', { unique: false });
            tasksStore.createIndex('topicId', 'topicId', { unique: false });
            tasksStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        }

        console.log('Database stores created');
    }

    /**
     * Obtiene una transacción
     */
    getTransaction(storeName, mode = 'readonly') {
        return this.db.transaction(storeName, mode);
    }

    /**
     * Obtiene un object store
     */
    getStore(storeName, mode = 'readonly') {
        return this.getTransaction(storeName, mode).objectStore(storeName);
    }

    // ═══════════════════════════════════════════════════════════
    // STUDY TOPICS DAO
    // ═══════════════════════════════════════════════════════════

    async getAllTopics() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS);
            const request = store.getAll();
            request.onsuccess = () => {
                const topics = request.result.sort((a, b) => b.createdAt - a.createdAt);
                resolve(topics);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getActiveTopics() {
        const topics = await this.getAllTopics();
        return topics.filter(t => !t.isCompleted);
    }

    async getTopicById(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async insertTopic(topic) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS, 'readwrite');
            const newTopic = {
                ...topic,
                createdAt: topic.createdAt || Date.now(),
                isCompleted: topic.isCompleted || false,
                totalStudyMinutes: topic.totalStudyMinutes || 0,
                description: topic.description || '',
                monthlyGoalHours: topic.monthlyGoalHours || null,
                goalYearMonth: topic.goalYearMonth || null
            };
            const request = store.add(newTopic);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTopic(topic) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS, 'readwrite');
            const request = store.put(topic);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTopic(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async addStudyMinutesToTopic(topicId, minutes) {
        const topic = await this.getTopicById(topicId);
        if (topic) {
            topic.totalStudyMinutes = (topic.totalStudyMinutes || 0) + minutes;
            await this.updateTopic(topic);
        }
    }

    async setTopicCompleted(topicId, completed) {
        const topic = await this.getTopicById(topicId);
        if (topic) {
            topic.isCompleted = completed;
            await this.updateTopic(topic);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MONTHLY GOALS DAO
    // ═══════════════════════════════════════════════════════════

    async getGoalForMonth(yearMonth) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.MONTHLY_GOALS);
            const request = store.get(yearMonth);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async insertOrUpdateGoal(goal) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.MONTHLY_GOALS, 'readwrite');
            const request = store.put(goal);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllGoals() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.MONTHLY_GOALS);
            const request = store.getAll();
            request.onsuccess = () => {
                const goals = request.result.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
                resolve(goals);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // DAILY RECORDS DAO
    // ═══════════════════════════════════════════════════════════

    async getRecordForDate(date) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.DAILY_RECORDS);
            const request = store.get(date);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async insertOrUpdateRecord(record) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.DAILY_RECORDS, 'readwrite');
            const request = store.put(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecordsForMonth(yearMonth) {
        const allRecords = await this.getAllRecords();
        return allRecords.filter(r => r.date.startsWith(yearMonth));
    }

    async getAllRecords() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.DAILY_RECORDS);
            const request = store.getAll();
            request.onsuccess = () => {
                const records = request.result.sort((a, b) => b.date.localeCompare(a.date));
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async addStudyMinutesToDate(date, minutes) {
        let record = await this.getRecordForDate(date);
        if (record) {
            record.studyMinutes = (record.studyMinutes || 0) + minutes;
        } else {
            record = {
                date: date,
                studyMinutes: minutes,
                topicId: null,
                notes: ''
            };
        }
        await this.insertOrUpdateRecord(record);
    }

    // ═══════════════════════════════════════════════════════════
    // STUDY SESSIONS DAO
    // ═══════════════════════════════════════════════════════════

    async insertSession(session) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS, 'readwrite');
            const newSession = {
                ...session,
                startTime: session.startTime || Date.now(),
                durationMinutes: session.durationMinutes || 0,
                isPomodoroSession: session.isPomodoroSession || false,
                pomodoroWorkMinutes: session.pomodoroWorkMinutes || 0,
                pomodoroBreakMinutes: session.pomodoroBreakMinutes || 0
            };
            const request = store.add(newSession);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionsForDate(date) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS);
            const index = store.index('date');
            const request = index.getAll(date);
            request.onsuccess = () => {
                const sessions = request.result.sort((a, b) => b.startTime - a.startTime);
                resolve(sessions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getTotalMinutesForMonth(yearMonth) {
        const sessions = await this.getAllSessions();
        return sessions
            .filter(s => s.date && s.date.startsWith(yearMonth))
            .reduce((total, s) => total + (s.durationMinutes || 0), 0);
    }

    async getAllSessions() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS);
            const request = store.getAll();
            request.onsuccess = () => {
                const sessions = request.result.sort((a, b) => b.startTime - a.startTime);
                resolve(sessions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionById(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateSession(session) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS, 'readwrite');
            const request = store.put(session);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSession(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // PLANNED TASKS DAO
    // ═══════════════════════════════════════════════════════════

    async insertTask(task) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS, 'readwrite');
            const newTask = {
                ...task,
                createdAt: task.createdAt || Date.now(),
                isCompleted: task.isCompleted || false,
                completedMinutes: task.completedMinutes || 0,
                notes: task.notes || ''
            };
            const request = store.add(newTask);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTask(task) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS, 'readwrite');
            const request = store.put(task);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTask(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getTasksForDate(date) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS);
            const index = store.index('date');
            const request = index.getAll(date);
            request.onsuccess = () => {
                const tasks = request.result.sort((a, b) => a.createdAt - b.createdAt);
                resolve(tasks);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingTasks(fromDate) {
        const allTasks = await this.getAllTasks();
        return allTasks
            .filter(t => !t.isCompleted && t.date >= fromDate)
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getDatesWithPlannedTasksForMonth(yearMonth) {
        const allTasks = await this.getAllTasks();
        const dates = allTasks
            .filter(t => t.date.startsWith(yearMonth))
            .map(t => t.date);
        return [...new Set(dates)];
    }

    async getAllTasks() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setTaskCompleted(taskId, completed, completedMinutes = 0) {
        return new Promise(async (resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS, 'readwrite');
            const request = store.get(taskId);
            request.onsuccess = () => {
                const task = request.result;
                if (task) {
                    task.isCompleted = completed;
                    task.completedMinutes = completedMinutes;
                    const updateRequest = store.put(task);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // BACKUP / RESTORE
    // ═══════════════════════════════════════════════════════════

    async exportAllData() {
        const data = {
            version: DB_VERSION,
            exportDate: new Date().toISOString(),
            topics: await this.getAllTopics(),
            monthlyGoals: await this.getAllGoals(),
            dailyRecords: await this.getAllRecords(),
            studySessions: await this.getAllSessions(),
            plannedTasks: await this.getAllTasks()
        };
        return data;
    }

    async importAllData(data) {
        // Clear existing data
        await this.clearAllStores();

        // Import topics
        for (const topic of data.topics || []) {
            const { id, ...topicData } = topic;
            await this.insertTopicWithId(topic);
        }

        // Import monthly goals
        for (const goal of data.monthlyGoals || []) {
            await this.insertOrUpdateGoal(goal);
        }

        // Import daily records
        for (const record of data.dailyRecords || []) {
            await this.insertOrUpdateRecord(record);
        }

        // Import study sessions
        for (const session of data.studySessions || []) {
            await this.insertSessionWithId(session);
        }

        // Import planned tasks
        for (const task of data.plannedTasks || []) {
            await this.insertTaskWithId(task);
        }

        return true;
    }

    async insertTopicWithId(topic) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TOPICS, 'readwrite');
            const request = store.put(topic);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async insertSessionWithId(session) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.STUDY_SESSIONS, 'readwrite');
            const request = store.put(session);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async insertTaskWithId(task) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.PLANNED_TASKS, 'readwrite');
            const request = store.put(task);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllStores() {
        const storeNames = [STORES.TOPICS, STORES.MONTHLY_GOALS, STORES.DAILY_RECORDS, STORES.STUDY_SESSIONS, STORES.PLANNED_TASKS];
        for (const storeName of storeNames) {
            await this.clearStore(storeName);
        }
    }

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, 'readwrite');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Instancia global de la base de datos
const db = new Database();
