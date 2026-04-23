// --- Module Re-exports (extracted modules expose via window.*) ---
// Script tags load these before DOMContentLoaded, so they're available here.

// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';
const ARCHIVE_STORAGE_KEY = 'weekly-task-board.archive';
const TEMPLATES_STORAGE_KEY = 'weekly-task-board.templates';
const JOURNALS_STORAGE_KEY = 'weekly-task-board.journals';

// --- Task Categories Definition ---
const TASK_CATEGORIES = {
    'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
    'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
    'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
    'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
    'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
    'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
};

// グローバル変数として宣言のみ行い、初期化はDOMContentLoaded内で行う
let tasks;
let settings;
let currentDate; // 💡 修正: アプリケーションの基点となる日付
let datePicker; // DOM要素もグローバルでアクセスできるように定義
let currentCategoryFilter = ''; // カテゴリフィルターの状態
let weekdayManager; // 曜日管理インスタンス
let taskBulkMover; // タスク一括移動インスタンス

/**
 * Load settings from localStorage, providing defaults if empty.
 * @returns {object}
 */
function loadSettings() {
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const defaultSettings = { 
        ideal_daily_minutes: 480, // Default to 8 hours
        weekday_visibility: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
        }
    };
    
    if (!settingsJson) {
        return defaultSettings;
    }
    
    try {
        const loadedSettings = JSON.parse(settingsJson);
        // 既存設定に曜日設定がない場合はデフォルトを追加
        if (!loadedSettings.weekday_visibility) {
            loadedSettings.weekday_visibility = defaultSettings.weekday_visibility;
        }
        return loadedSettings;
    } catch (error) {
        console.warn('設定の読み込みに失敗:', error);
        return defaultSettings;
    }
}

/**
 * Save settings to localStorage.
 */
function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Gets the Monday of the week for the given date.
 * @param {Date} d - The date.
 * @returns {Date} The Monday of that week, set to 00:00:00 local time.
 */
function getMonday(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string}
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Helper to get a future date string in YYYY-MM-DD format.
 * @param {number} daysToAdd - Number of days to add to today.
 * @returns {string}
 */
function getNextDate(daysToAdd) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysToAdd);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Migration version constant
 */
const CURRENT_MIGRATION_VERSION = '1.1';
const MIGRATION_HISTORY_KEY = 'weekly-task-board.migration-history';

/**
 * Get migration history from localStorage
 * @returns {object}
 */
function getMigrationHistory() {
    const historyJson = localStorage.getItem(MIGRATION_HISTORY_KEY);
    if (!historyJson) {
        return {
            version: '0.0',
            lastMigrationDate: null,
            migrations: []
        };
    }
    try {
        return JSON.parse(historyJson);
    } catch (error) {
        console.warn('マイグレーション履歴の読み込みに失敗:', error);
        return {
            version: '0.0',
            lastMigrationDate: null,
            migrations: []
        };
    }
}

/**
 * Save migration history to localStorage
 * @param {object} history
 */
function saveMigrationHistory(history) {
    localStorage.setItem(MIGRATION_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Backup current tasks data before migration
 * @returns {string} Backup key in localStorage
 */
function backupTasksBeforeMigration() {
    const timestamp = new Date().toISOString();
    const backupKey = `weekly-task-board.backup-${timestamp}`;
    const currentTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (currentTasks) {
        localStorage.setItem(backupKey, currentTasks);
    }
    return backupKey;
}

/**
 * Migrate tasks to add actual_time field
 * @param {object[]} tasksData
 * @returns {object[]}
 */
function migrateTasksAddActualTime(tasksData) {
    return tasksData.map(task => {
        if (task.actual_time === undefined) {
            return {
                ...task,
                actual_time: 0
            };
        }
        return task;
    });
}

/**
 * Migrate tasks to add recurring task fields
 * @param {object[]} tasksData
 * @returns {object[]}
 */
function migrateTasksAddRecurringFields(tasksData) {
    return tasksData.map(task => {
        const updatedTask = { ...task };
        
        if (updatedTask.is_recurring === undefined) {
            updatedTask.is_recurring = false;
        }
        if (updatedTask.recurrence_pattern === undefined) {
            updatedTask.recurrence_pattern = null;
        }
        if (updatedTask.recurrence_end_date === undefined) {
            updatedTask.recurrence_end_date = null;
        }
        
        return updatedTask;
    });
}

/**
 * Execute all pending migrations
 * @param {object[]} tasksData
 * @returns {object[]}
 */
function executeMigrations(tasksData) {
    const history = getMigrationHistory();
    let migratedData = tasksData;
    
    // Version 0.0 -> 1.0: Add actual_time field
    if (history.version < '1.0') {
        console.log('マイグレーション実行: v0.0 -> v1.0 (actual_timeフィールド追加)');
        migratedData = migrateTasksAddActualTime(migratedData);
        
        // マイグレーション履歴を更新
        history.migrations.push({
            version: '1.0',
            date: new Date().toISOString(),
            description: 'Added actual_time field to all tasks'
        });
        history.version = '1.0';
        history.lastMigrationDate = new Date().toISOString();
        saveMigrationHistory(history);
    }
    
    // Version 1.0 -> 1.1: Add recurring task fields
    if (history.version < '1.1') {
        console.log('マイグレーション実行: v1.0 -> v1.1 (繰り返しタスクフィールド追加)');
        migratedData = migrateTasksAddRecurringFields(migratedData);
        
        // マイグレーション履歴を更新
        history.migrations.push({
            version: '1.1',
            date: new Date().toISOString(),
            description: 'Added is_recurring, recurrence_pattern, and recurrence_end_date fields to all tasks'
        });
        history.version = '1.1';
        history.lastMigrationDate = new Date().toISOString();
        saveMigrationHistory(history);
    }
    
    return migratedData;
}

/**
 * Load tasks from localStorage.
 * @returns {object[]}
 */
function loadTasks() {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    let tasksData = [];

    if (tasksJson) {
        tasksData = JSON.parse(tasksJson);
        
        // マイグレーション実行
        try {
            tasksData = executeMigrations(tasksData);
        } catch (error) {
            console.error('マイグレーション実行中にエラーが発生:', error);
            // エラーが発生した場合は、基本的なマイグレーション処理を実行
            tasksData = tasksData.map(task => ({
                ...task,
                actual_time: task.actual_time || 0
            }));
        }
    }
    
    // 最終的なデータ検証と正規化
    return tasksData.map(task => ({ 
        ...task, 
        completed: task.completed || false,
        priority: task.priority || 'medium',
        category: task.category || 'task',
        actual_time: typeof task.actual_time === 'number' ? task.actual_time : 0,
        is_recurring: typeof task.is_recurring === 'boolean' ? task.is_recurring : false,
        recurrence_pattern: task.recurrence_pattern || null,
        recurrence_end_date: task.recurrence_end_date || null,
        signifier: task.signifier || null
    })).map(task => {
        // 時間データのバリデーション
        const validationResult = validateTaskTimeData(task);
        return validationResult.task;
    });
}


/**
 * Save tasks to localStorage.
 */
function saveTasks() {
    // カテゴリ情報の検証を行ってから保存
    const validatedTasks = tasks.map(task => ({
        ...task,
        category: validateCategory(task.category)
    }));
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(validatedTasks));
}

/**
 * Get category information by category key.
 * @param {string} categoryKey - The category key.
 * @returns {object} Category information with name, color, and bgColor.
 */
function getCategoryInfo(categoryKey) {
    return TASK_CATEGORIES[categoryKey] || TASK_CATEGORIES['task'];
}

/**
 * Validate and normalize category value.
 * @param {string} category - The category to validate.
 * @returns {string} Valid category key.
 */
function validateCategory(category) {
    if (category && TASK_CATEGORIES[category]) {
        return category;
    }
    console.warn(`Invalid category "${category}", falling back to default "task"`);
    return 'task';
}

/**
 * Determine if a task should be displayed based on category filter.
 * Validates: Requirements 1.3 (カテゴリ別の時間分析)
 * 
 * @param {object} task - The task to check.
 * @param {string} filter - The category filter (optional, defaults to currentCategoryFilter).
 * @returns {boolean} True if the task should be displayed, false otherwise.
 */
function shouldDisplayTask(task, filter = null) {
    const categoryFilter = filter !== null ? filter : currentCategoryFilter;
    
    // If no filter is set, display all tasks
    if (!categoryFilter) {
        return true;
    }
    
    // Check if task's category matches the filter
    return task.category === categoryFilter;
}

/**
 * Determine the severity of time overrun
 * @param {number} estimated - Estimated time
 * @param {number} actual - Actual time
 * @returns {string} Severity level: 'none', 'minor', 'moderate', 'severe'
 */
function getTimeOverrunSeverity(estimated, actual) {
    if (!actual || actual === 0 || actual <= estimated) {
        return 'none';
    }
    
    const overrunPercent = ((actual - estimated) / estimated) * 100;
    
    if (overrunPercent <= 25) {
        return 'minor';
    } else if (overrunPercent <= 50) {
        return 'moderate';
    } else {
        return 'severe';
    }
}

/**
 * Validate time data for a task
 * @param {object} task - The task to validate
 * @returns {object} Validation result with isValid flag and errors array
 */
function validateTaskTimeData(task) {
    const errors = [];
    const warnings = [];
    
    // Validate estimated_time
    if (task.estimated_time === undefined || task.estimated_time === null) {
        errors.push('estimated_time is missing');
        task.estimated_time = 0;
    } else if (typeof task.estimated_time !== 'number') {
        errors.push(`estimated_time must be a number, got ${typeof task.estimated_time}`);
        task.estimated_time = 0;
    } else if (task.estimated_time < 0) {
        errors.push('estimated_time cannot be negative');
        task.estimated_time = 0;
    } else if (!Number.isFinite(task.estimated_time)) {
        errors.push('estimated_time must be a finite number');
        task.estimated_time = 0;
    }
    
    // Validate actual_time
    if (task.actual_time === undefined || task.actual_time === null) {
        errors.push('actual_time is missing');
        task.actual_time = 0;
    } else if (typeof task.actual_time !== 'number') {
        errors.push(`actual_time must be a number, got ${typeof task.actual_time}`);
        task.actual_time = 0;
    } else if (task.actual_time < 0) {
        errors.push('actual_time cannot be negative');
        task.actual_time = 0;
    } else if (!Number.isFinite(task.actual_time)) {
        errors.push('actual_time must be a finite number');
        task.actual_time = 0;
    }
    
    // Check if actual_time exceeds estimated_time significantly
    if (task.actual_time > task.estimated_time * 1.5) {
        warnings.push(`actual_time (${task.actual_time}h) significantly exceeds estimated_time (${task.estimated_time}h)`);
    }
    
    // Round to 2 decimal places
    task.estimated_time = Math.round(task.estimated_time * 100) / 100;
    task.actual_time = Math.round(task.actual_time * 100) / 100;
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        task
    };
}

/**
 * Validate all tasks' time data
 * @param {object[]} tasksData - Array of tasks to validate
 * @returns {object} Validation result with summary
 */
function validateAllTasksTimeData(tasksData) {
    const validationResults = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    
    tasksData.forEach((task, index) => {
        const result = validateTaskTimeData(task);
        validationResults.push({
            taskIndex: index,
            taskId: task.id,
            taskName: task.name,
            ...result
        });
        
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
    });
    
    return {
        isValid: totalErrors === 0,
        totalErrors,
        totalWarnings,
        validationResults,
        summary: {
            totalTasks: tasksData.length,
            validTasks: validationResults.filter(r => r.isValid).length,
            invalidTasks: validationResults.filter(r => !r.isValid).length,
            tasksWithWarnings: validationResults.filter(r => r.warnings.length > 0).length
        }
    };
}

/**
 * Repair invalid time data in tasks
 * @param {object[]} tasksData - Array of tasks to repair
 * @returns {object} Repair result with details
 */
function repairTasksTimeData(tasksData) {
    const repairResults = [];
    let repairedCount = 0;
    
    tasksData.forEach((task, index) => {
        const originalEstimatedTime = task.estimated_time;
        const originalActualTime = task.actual_time;
        
        const result = validateTaskTimeData(task);
        
        if (!result.isValid || result.errors.length > 0) {
            repairedCount++;
            repairResults.push({
                taskIndex: index,
                taskId: task.id,
                taskName: task.name,
                originalEstimatedTime,
                originalActualTime,
                repairedEstimatedTime: task.estimated_time,
                repairedActualTime: task.actual_time,
                errors: result.errors
            });
        }
    });
    
    return {
        repairedCount,
        repairResults,
        summary: {
            totalTasks: tasksData.length,
            repairedTasks: repairedCount,
            successRate: ((tasksData.length - repairedCount) / tasksData.length * 100).toFixed(1)
        }
    };
}

// Statistics Engine は StatisticsEngine.js に移動（window.StatisticsEngine）

// TaskBulkMover, WeekdayManager は BulkOperations.js に移動（window.TaskBulkMover, window.WeekdayManager）


// --- D&D Handlers (Global Scope) ---

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const targetColumn = e.target.closest('.day-column');
    if (targetColumn && !targetColumn.classList.contains('hidden') && !targetColumn.classList.contains('hiding')) {
        targetColumn.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetColumn = e.target.closest('.day-column');
    if (targetColumn) {
        targetColumn.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetColumn = e.target.closest('.day-column');
    if (!targetColumn) return;

    // 非表示の曜日列へのドロップを防止
    if (targetColumn.classList.contains('hidden') || targetColumn.classList.contains('hiding')) {
        return;
    }

    targetColumn.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    const newDate = targetColumn.dataset.date === "null" ? null : targetColumn.dataset.date;

    const task = tasks.find(t => t.id == taskId);
    if (task) {
        task.assigned_date = newDate;
        saveTasks();
        if (document.body.renderWeek) document.body.renderWeek();
    }
}


/**

/**
 * Get migration status information
 * @returns {object}
 */
function getMigrationStatus() {
    const history = getMigrationHistory();
    return {
        currentVersion: history.version,
        targetVersion: CURRENT_MIGRATION_VERSION,
        lastMigrationDate: history.lastMigrationDate,
        migrationCount: history.migrations.length,
        migrations: history.migrations,
        isMigrationNeeded: history.version < CURRENT_MIGRATION_VERSION
    };
}

/**
 * Moves incomplete tasks from past weeks to the unassigned list.
 */
function carryOverOldTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    let tasksModified = false;
    tasks.forEach(task => {
        if (task.assigned_date && task.assigned_date < todayStr && !task.completed) {
            task.assigned_date = null; // 未割り当てに戻す
            tasksModified = true;
        }
    });

    if (tasksModified) {
        console.log("Carried over incomplete tasks from previous weeks.");
        saveTasks();
    }
}

/**

/**
 * Duplicate a template with a new name
 * @param {object} template - Template to duplicate
 * @param {string} searchTerm - Current search term for re-rendering
 * @param {string} sortBy - Current sort order for re-rendering
 */
function duplicateTemplate(template, searchTerm = '', sortBy = 'recent') {
    const newTemplateName = prompt('新しいテンプレート名を入力してください:', `${template.name} (コピー)`);
    
    if (!newTemplateName) return;
    
    const templates = loadTemplates();
    
    const newTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplateName,
        description: template.description,
        base_task: { ...template.base_task },
        created_date: new Date().toISOString().split('T')[0],
        usage_count: 0
    };
    
    templates.push(newTemplate);
    saveTemplates(templates);
    
    showNotification(`テンプレート「${newTemplateName}」を作成しました`, 'success');
    filterAndRenderTemplates(searchTerm, sortBy);
}

// RecurrenceEngine は RecurrenceEngine.js に移動（window.RecurrenceEngine）

// --- Main Application Logic ---

// スクリプトはHTMLの最後に配置されているため、DOMは完全に読み込まれている
// したがって、DOMContentLoadedイベントを待つ必要はない

// 1. データの初期化
tasks = loadTasks();
settings = loadSettings();
currentDate = new Date();

// 曜日管理の初期化
weekdayManager = new WeekdayManager();

// タスク一括移動の初期化
taskBulkMover = new TaskBulkMover();

// 繰り返しタスク生成エンジンの初期化
recurrenceEngine = new RecurrenceEngine();

// --- DOM Element Selections ---
const addTaskBtn = document.getElementById('add-task-btn');
const modal = document.getElementById('task-modal');
const closeModalBtn = modal.querySelector('.close-btn');
const taskForm = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const estimatedTimeInput = document.getElementById('estimated-time');
const taskPriorityInput = document.getElementById('task-priority');
const taskCategoryInput = document.getElementById('task-category');
const taskDateInput = document.getElementById('task-date');
const dueDateInput = document.getElementById('due-date');
const dueTimePeriodInput = document.getElementById('due-time-period');
const dueHourInput = document.getElementById('due-hour');
const taskDetailsInput = document.getElementById('task-details');
const duplicateTaskBtn = document.getElementById('duplicate-task-btn');

// 繰り返しタスク設定UI要素
const isRecurringCheckbox = document.getElementById('is-recurring');
const recurrenceOptions = document.getElementById('recurrence-options');
const recurrencePatternSelect = document.getElementById('recurrence-pattern');
const recurrenceEndDateInput = document.getElementById('recurrence-end-date');

const prevWeekBtn = document.getElementById('prev-week');
const todayBtn = document.getElementById('today');
const nextWeekBtn = document.getElementById('next-week');

// グローバル変数に代入
datePicker = document.getElementById('date-picker');

const weekTitle = document.getElementById('week-title');
const dayColumns = Array.from(document.querySelectorAll('#task-board .day-column'));
const unassignedColumn = document.getElementById('unassigned-tasks');
const idealDailyMinutesInput = document.getElementById('ideal-daily-minutes');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');

// エクスポート/インポート ボタンイベント
if (exportDataBtn) exportDataBtn.addEventListener('click', () => window.exportData?.());
if (importDataBtn) importDataBtn.addEventListener('click', () => importFileInput?.click());
if (importFileInput) importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) window.importData?.(file);
    e.target.value = '';
});
const themeToggleBtn = document.getElementById('theme-toggle');
const archiveToggleBtn = document.getElementById('archive-toggle');
const archiveView = document.getElementById('archive-view');
const closeArchiveBtn = document.getElementById('close-archive');
const clearArchiveBtn = document.getElementById('clear-archive');
const archiveList = document.getElementById('archive-list');
const categoryFilterSelect = document.getElementById('filter-category');

let editingTaskId = null;
let isRendering = false;
let selectedDate = null;
let migrationNotified = false;

// --- Re-export module functions as globals ---
if (window.ArchiveManager) {
    window.loadArchivedTasks = window.ArchiveManager.loadArchivedTasks;
    window.saveArchivedTasks = window.ArchiveManager.saveArchivedTasks;
    window.archiveCompletedTasks = window.ArchiveManager.archiveCompletedTasks;
}
if (window.StatisticsEngine) {
    window.calculateCompletionRate = window.StatisticsEngine.calculateCompletionRate;
    window.getCompletionRateForWeek = window.StatisticsEngine.getCompletionRateForWeek;
    window.calculateCategoryTimeAnalysis = window.StatisticsEngine.calculateCategoryTimeAnalysis;
    window.calculateDailyWorkTime = window.StatisticsEngine.calculateDailyWorkTime;
    window.calculateEstimatedVsActualAnalysis = window.StatisticsEngine.calculateEstimatedVsActualAnalysis;
}
if (window.DashboardManager) {
    window.updateDashboard = window.DashboardManager.updateDashboard;
    window.initializeDashboardToggle = window.DashboardManager.initializeDashboardToggle;
    window.calculateCompletionRateForDate = window.DashboardManager.calculateCompletionRateForDate;
    window.calculateCategoryTimeAnalysisForDate = window.DashboardManager.calculateCategoryTimeAnalysisForDate;
    window.calculateDailyWorkTimeForDate = window.DashboardManager.calculateDailyWorkTimeForDate;
}
if (window.ContextManager) {
    window.initializeWeekdaySettings = window.ContextManager.initializeWeekdaySettings;
    window.initializeContextMenu = window.ContextManager.initializeContextMenu;
    window.updateGridColumns = window.ContextManager.updateGridColumns;
    window.showBulkMoveNotification = window.ContextManager.showBulkMoveNotification;
}
if (window.ThemeManager) {
    window.initializeTheme = window.ThemeManager.initializeTheme;
    window.toggleTheme = window.ThemeManager.toggleTheme;
    window.updateThemeButton = window.ThemeManager.updateThemeButton;
    window.playTaskCompletionAnimation = window.ThemeManager.playTaskCompletionAnimation;
}
if (window.CalendarManager) {
    window.connectGoogleCalendar = window.CalendarManager.connectGoogleCalendar;
    window.connectOutlookCalendar = window.CalendarManager.connectOutlookCalendar;
    window.disconnectGoogleCalendar = window.CalendarManager.disconnectGoogleCalendar;
    window.disconnectOutlookCalendar = window.CalendarManager.disconnectOutlookCalendar;
    window.checkOAuthCallback = window.CalendarManager.checkOAuthCallback;
    window.showSettingsHelp = window.CalendarManager.showSettingsHelp;
    window.initCalendarSettings = window.CalendarManager.initCalendarSettings;
}
if (window.ExportImport) {
    window.exportData = window.ExportImport.exportData;
    window.importData = window.ExportImport.importData;
}
if (window.PWASetup) {
    window.registerServiceWorker = window.PWASetup.registerServiceWorker;
    window.initPWA = window.PWASetup.initPWA;
}

// Bullet Journal Signifiers
const SIGNIFIER_ORDER = [null, 'task', 'note', 'important', 'consider', 'idea'];
const SIGNIFIER_MAP = {
    task: '✅',
    note: '📝',
    important: '❗',
    consider: '🤔',
    idea: '💡'
};
const SIGNIFIER_LABELS = {
    task: '\u30BF\u30B9\u30AF',
    note: '\u30E1\u30E2',
    important: '\u91CD\u8981',
    consider: '\u691C\u8A0E',
    idea: '\u30A2\u30A4\u30C7\u30A2'
};

// アプリケーションバージョン（キャッシュ対策）
const APP_VERSION = '1.7.5';
const BUILD_DATE = '2026-04-23';

// バージョン情報をログ出力（キャッシュ確認用）
console.log(`%c🚀 アプリケーション読み込み (v${APP_VERSION}, ${BUILD_DATE})`, 'font-size: 12px; color: #666;');

// --- Initial Load ---
try { carryOverOldTasks(); } catch(e) { console.error('[Init] carryOverOldTasks failed:', e); }

// カテゴリデータの検証と修復
// verifyCategoryData → ArchiveManager に移動済み（省略可能）

// マイグレーションデータの検証と修復
// verifyMigrationData → ArchiveManager に移動済み（省略可能）

// 設定値をUIに反映
try { idealDailyMinutesInput.value = settings.ideal_daily_minutes; } catch(e) { console.error('[Init] settings reflect failed:', e); }

// ダークモードの初期化
try { if (window.ThemeManager) window.ThemeManager.initializeTheme(); } catch(e) { console.error('[Init] ThemeManager init failed:', e); }

// カテゴリフィルターの初期化
try { initializeCategoryFilter(); } catch(e) { console.error('[Init] CategoryFilter failed:', e); }

// 曜日設定UIの初期化
try { if (window.ContextManager) window.ContextManager.initializeWeekdaySettings(); } catch(e) { console.error('[Init] ContextManager weekdaySettings failed:', e); }

// 曜日設定ボタンのイベントリスナー
const weekdayFilterBtn = document.getElementById('weekday-filter-btn');
const weekdaySettings = document.getElementById('weekday-settings');
if (weekdayFilterBtn && weekdaySettings) {
    weekdayFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        weekdaySettings.style.display = weekdaySettings.style.display === 'none' ? 'block' : 'none';
    });
    
    // 外側をクリックしたら閉じる
    document.addEventListener('click', (e) => {
        if (!weekdayFilterBtn.contains(e.target) && !weekdaySettings.contains(e.target)) {
            weekdaySettings.style.display = 'none';
        }
    });
}

// その他メニューのイベントリスナー
const moreMenuBtn = document.getElementById('more-menu-btn');
const moreMenuDropdown = document.getElementById('more-menu-dropdown');
if (moreMenuBtn && moreMenuDropdown) {
    moreMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreMenuDropdown.style.display = moreMenuDropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // 外側をクリックしたら閉じる
    document.addEventListener('click', (e) => {
        if (!moreMenuBtn.contains(e.target) && !moreMenuDropdown.contains(e.target)) {
            moreMenuDropdown.style.display = 'none';
        }
    });
}

// コンテキストメニューの初期化
try { if (window.ContextManager) window.ContextManager.initializeContextMenu(); } catch(e) { console.error('[Init] ContextMenu failed:', e); }

// 初期グリッド列数を設定
try { if (window.ContextManager) window.ContextManager.updateGridColumns(); } catch(e) { console.error('[Init] GridColumns failed:', e); }

// 初期ロード時にタスクボードを描画する
try { renderWeek(); } catch(e) { console.error('[Init] renderWeek failed:', e); }

// テーマボタンのイベントリスナー
try { if (window.ThemeManager) window.ThemeManager.initThemeEventListeners(); } catch(e) { console.error('[Init] ThemeManager failed:', e); }

// アーカイブボタンのイベントリスナー
try { if (window.ArchiveManager) window.ArchiveManager.initArchiveEventListeners(); } catch(e) { console.error('[Init] ArchiveManager failed:', e); }

// カレンダー設定の初期化
try { if (window.CalendarManager) window.CalendarManager.initCalendarSettings(); } catch(e) { console.error('[Init] CalendarManager init failed:', e); }

// OAuth コールバック確認
try { if (window.CalendarManager) window.CalendarManager.checkOAuthCallback(); } catch(e) { console.error('[Init] CalendarManager OAuth failed:', e); }

// PWA 初期化
try { if (window.PWASetup) window.PWASetup.initPWA(); } catch(e) { console.error('[Init] PWASetup failed:', e); }

// WeeklyReview UI 初期化（hybrid モジュールは後でロードされる場合あり）
try { if (window.HybridWeeklyReviewUI) window.HybridWeeklyReviewUI.initialize(); } catch(e) { console.error('[Init] WeeklyReviewUI failed:', e); }

// MorningPages UI 初期化（hybrid モジュールは後でロードされる場合あり）
try { if (window.HybridMorningPagesUI) window.HybridMorningPagesUI.initialize(); } catch(e) { console.error('[Init] MorningPagesUI failed:', e); }

// Migration トグル
const migrationToggleBtn = document.getElementById('migration-toggle');
const migrationModal = document.getElementById('migration-modal');
const closeMigrationModalBtn = document.getElementById('close-migration-modal');
const migrationTaskListEl = document.getElementById('migration-task-list');
const migrateNextWeekBtn = document.getElementById('migrate-next-week-btn');
const migrateNextDayBtn = document.getElementById('migrate-next-day-btn');
const migrateUnassignedBtn = document.getElementById('migrate-unassigned-btn');

function populateMigrationList() {
    if (!migrationTaskListEl) return;
    while (migrationTaskListEl.firstChild) {
        migrationTaskListEl.removeChild(migrationTaskListEl.firstChild);
    }

    const monday = getMonday(currentDate);
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startStr = formatDate(monday);
    const endStr = formatDate(weekEnd);

    const incomplete = tasks.filter(t =>
        !t.completed && t.assigned_date && t.assigned_date >= startStr && t.assigned_date <= endStr
    );

    if (incomplete.length === 0) {
        const msg = document.createElement('p');
        msg.style.cssText = 'color:#888;text-align:center;padding:20px;';
        msg.textContent = '未完了のタスクはありません';
        migrationTaskListEl.appendChild(msg);
        return;
    }

    incomplete.forEach(task => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = task.id;
        checkbox.checked = true;
        checkbox.style.cursor = 'pointer';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = task.name;
        const dateSpan = document.createElement('span');
        dateSpan.textContent = task.assigned_date;
        dateSpan.style.cssText = 'font-size:0.8em;color:#888;margin-left:auto;';
        label.appendChild(checkbox);
        label.appendChild(nameSpan);
        label.appendChild(dateSpan);
        migrationTaskListEl.appendChild(label);
    });
}

function getSelectedMigrationIds() {
    if (!migrationTaskListEl) return [];
    return Array.from(migrationTaskListEl.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
}

function closeMigrationModal() {
    if (migrationModal) migrationModal.style.display = 'none';
}

function handleMigrate(direction) {
    const ids = getSelectedMigrationIds();
    if (ids.length === 0) return;

    if (window.HybridTaskMigration) {
        let count = 0;
        if (direction === 'nextWeek') {
            count = window.HybridTaskMigration.migrateTasksToNextWeek(ids);
        } else if (direction === 'nextDay') {
            count = window.HybridTaskMigration.migrateTasksToNextDay(ids);
        } else if (direction === 'unassigned') {
            count = window.HybridTaskMigration.migrateTasksToUnassigned(ids);
        }

        // Reload tasks from localStorage (TaskMigration saves directly)
        tasks = loadTasks();
        renderWeek();
        try { if (window.updateDashboard) window.updateDashboard(); } catch(e) {}
        closeMigrationModal();

        if (count > 0) {
            showNotification(count + '件のタスクを移行しました', 'success');
        }
    } else {
        showNotification('移行モジュールが読み込まれていません', 'error');
    }
}

if (migrationToggleBtn) {
    migrationToggleBtn.addEventListener('click', () => {
        if (migrationModal) {
            populateMigrationList();
            migrationModal.style.display = 'block';
        }
    });
}

if (closeMigrationModalBtn) {
    closeMigrationModalBtn.addEventListener('click', closeMigrationModal);
}

if (migrationModal) {
    migrationModal.addEventListener('click', (e) => {
        if (e.target === migrationModal) closeMigrationModal();
    });
}

if (migrateNextWeekBtn) {
    migrateNextWeekBtn.addEventListener('click', () => handleMigrate('nextWeek'));
}

if (migrateNextDayBtn) {
    migrateNextDayBtn.addEventListener('click', () => handleMigrate('nextDay'));
}

if (migrateUnassignedBtn) {
    migrateUnassignedBtn.addEventListener('click', () => handleMigrate('unassigned'));
}

// ダッシュボード初期化
try { if (window.DashboardManager) window.DashboardManager.initializeDashboardToggle(); } catch(e) { console.error('[Init] DashboardToggle failed:', e); }
try { if (window.DashboardManager) window.DashboardManager.updateDashboard(); } catch(e) { console.error('[Init] DashboardUpdate failed:', e); }

// テンプレート機能の初期化
try { initializeTemplatePanel(); } catch(e) { console.error('[Init] TemplatePanel failed:', e); }

// ジャーナル機能の初期化
try { if (window.HybridJournalManager) window.HybridJournalManager.initialize(); } catch(e) { console.error('[Init] JournalManager failed:', e); }

// ジャーナルトグルボタン
const journalToggleBtn = document.getElementById('journal-toggle');
if (journalToggleBtn) {
    journalToggleBtn.addEventListener('click', () => {
        if (!window.HybridJournalUI) return;
        const panel = document.getElementById('journal-timeline-panel');
        if (panel && panel.style.display !== 'none') {
            window.HybridJournalUI.closeTimeline();
        } else {
            window.HybridJournalUI.openTimeline();
        }
    });
}

// --- Modal Logic ---
addTaskBtn.addEventListener('click', () => {
    openTaskModal();
});

function initializeTemplatePanel() {
    const templateToggleBtn = document.getElementById('template-toggle');
    const templatePanel = document.getElementById('template-panel');
    const closeTemplatePanelBtn = document.getElementById('close-template-panel');
    const saveAsTemplateBtn = document.getElementById('save-as-template-btn');
    const templateSearchInput = document.getElementById('template-search');
    const templateSortSelect = document.getElementById('template-sort');
    
    if (!templateToggleBtn || !templatePanel) return;
    
    // Template panel toggle
    templateToggleBtn.addEventListener('click', () => {
        if (templatePanel.style.display === 'none') {
            templatePanel.style.display = 'block';
            renderTemplateList();
        } else {
            templatePanel.style.display = 'none';
        }
    });
        
        // Close template panel
        if (closeTemplatePanelBtn) {
            closeTemplatePanelBtn.addEventListener('click', () => {
                templatePanel.style.display = 'none';
            });
        }
        
        // Template search
        if (templateSearchInput) {
            templateSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                filterAndRenderTemplates(searchTerm, templateSortSelect?.value || 'recent');
            });
        }
        
        // Template sort
        if (templateSortSelect) {
            templateSortSelect.addEventListener('change', (e) => {
                const searchTerm = templateSearchInput?.value.toLowerCase() || '';
                filterAndRenderTemplates(searchTerm, e.target.value);
            });
        }
        
        // Save as template button
        if (saveAsTemplateBtn) {
            saveAsTemplateBtn.addEventListener('click', () => {
                if (editingTaskId) {
                    const task = tasks.find(t => t.id === editingTaskId);
                    if (task) {
                        const templateName = prompt('テンプレート名を入力してください:', task.name);
                        if (templateName) {
                            saveTaskAsTemplate(task, templateName);
                            showNotification(`テンプレート「${templateName}」を保存しました`, 'success');
                            closeTaskModal();
                        }
                    }
                }
            });
        }
    }
    
    function openTaskModal(presetDate = null) {
        editingTaskId = null;
        selectedDate = presetDate;
        taskForm.reset();
        
        // 事前設定された日付がある場合は設定
        if (presetDate) {
            taskDateInput.value = presetDate;
        }
        
        // 繰り返しタスク設定UIをリセット
        isRecurringCheckbox.checked = false;
        recurrenceOptions.style.display = 'none';
        recurrencePatternSelect.value = '';
        recurrenceEndDateInput.value = '';
        
        taskForm.querySelector('button[type="submit"]').textContent = '登録';
        
        // 複製ボタンを非表示
        duplicateTaskBtn.style.display = 'none';
        
        // テンプレート保存ボタンを非表示
        const saveAsTemplateBtn = document.getElementById('save-as-template-btn');
        if (saveAsTemplateBtn) {
            saveAsTemplateBtn.style.display = 'none';
        }
        
        // スクロール抑制とアニメーション
        document.body.classList.add('modal-open');
        modal.style.display = 'block';
        // アニメーション用の遅延
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // フォーカスを最初の入力フィールドに設定
        taskNameInput.focus();
    }
    
    // 日付入力フィールドをカレンダー専用にする
    function makeDateInputCalendarOnly(inputElement) {
        // キーボード入力を無効にする
        inputElement.addEventListener('keydown', function(e) {
            // Tabキー、Enterキー、Escapeキーは許可
            if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
                return;
            }
            // その他のキー入力を無効にする
            e.preventDefault();
        });
        
        // キーボード入力を完全に無効にする
        inputElement.addEventListener('keypress', function(e) {
            e.preventDefault();
        });
        
        // 入力イベントも無効にする
        inputElement.addEventListener('input', function(e) {
            // カレンダーからの入力は許可するため、手動入力のみブロック
        });
        
        // フィールドクリックでカレンダーを開く
        inputElement.addEventListener('click', function() {
            // readonly属性を一時的に解除してカレンダーを開く
            this.removeAttribute('readonly');
            if (typeof this.showPicker === 'function') {
                try {
                    this.showPicker();
                } catch (error) {
                    this.focus();
                }
            } else {
                this.focus();
            }
        });
        
        // フォーカス時にもカレンダーを開く
        inputElement.addEventListener('focus', function() {
            this.removeAttribute('readonly');
            if (typeof this.showPicker === 'function') {
                try {
                    this.showPicker();
                } catch (error) {
                    // カレンダーが開けない場合はそのまま
                }
            }
        });
        
        // カレンダーが閉じられた後にreadonly属性を復元
        inputElement.addEventListener('blur', function() {
            // 少し遅延させてからreadonly属性を復元
            setTimeout(() => {
                this.setAttribute('readonly', 'readonly');
            }, 100);
        });
        
        // 値が変更された後もreadonly属性を復元
        inputElement.addEventListener('change', function() {
            setTimeout(() => {
                this.setAttribute('readonly', 'readonly');
            }, 100);
        });
        
        // ラベルクリックでも日付ピッカーを開く
        const label = document.querySelector(`label[for="${inputElement.id}"]`);
        if (label) {
            label.style.cursor = 'pointer';
            label.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof inputElement.showPicker === 'function') {
                    try {
                        inputElement.showPicker();
                    } catch (error) {
                        inputElement.focus();
                    }
                } else {
                    inputElement.focus();
                }
            });
        }
    }
    
    // 日付入力フィールドをカレンダー専用に設定
    makeDateInputCalendarOnly(taskDateInput);
    makeDateInputCalendarOnly(dueDateInput);
    makeDateInputCalendarOnly(recurrenceEndDateInput);
    
    // 繰り返しタスク設定UI (9.1, 9.2, 9.3)
    // 繰り返しチェックボックスの変更イベント
    isRecurringCheckbox.addEventListener('change', function() {
        if (this.checked) {
            recurrenceOptions.style.display = 'block';
        } else {
            recurrenceOptions.style.display = 'none';
            recurrencePatternSelect.value = '';
            recurrenceEndDateInput.value = '';
        }
    });
    
    // パターン選択の変更イベント
    recurrencePatternSelect.addEventListener('change', function() {
        // パターンが選択されたときの処理（将来の拡張用）
        // 例：パターンに応じた説明文の表示など
    });
    
    // 午前午後選択時の時間選択表示制御
    dueTimePeriodInput.addEventListener('change', function() {
        if (this.value === 'morning' || this.value === 'afternoon') {
            dueHourInput.style.display = 'block';
            // 午前午後に応じて時間選択肢を調整
            updateHourOptions(this.value);
        } else {
            dueHourInput.style.display = 'none';
            dueHourInput.value = '';
        }
    });
    
    function updateHourOptions(period) {
        const morningHours = [
            { value: '', text: '時間指定なし' },
            { value: '9', text: '9時' },
            { value: '10', text: '10時' },
            { value: '11', text: '11時' },
            { value: '12', text: '12時' }
        ];
        
        const afternoonHours = [
            { value: '', text: '時間指定なし' },
            { value: '13', text: '13時' },
            { value: '14', text: '14時' },
            { value: '15', text: '15時' },
            { value: '16', text: '16時' },
            { value: '17', text: '17時' },
            { value: '18', text: '18時' },
            { value: '19', text: '19時' },
            { value: '20', text: '20時' },
            { value: '21', text: '21時' },
            { value: '22', text: '22時' }
        ];
        
        const hours = period === 'morning' ? morningHours : afternoonHours;
        dueHourInput.innerHTML = '';
        
        hours.forEach(hour => {
            const option = document.createElement('option');
            option.value = hour.value;
            option.textContent = hour.text;
            dueHourInput.appendChild(option);
        });
    }
    
    function buildDueDateString() {
        const date = dueDateInput.value;
        const period = dueTimePeriodInput.value;
        const hour = dueHourInput.value;
        
        if (!date) return null;
        
        if (period && hour) {
            return `${date}T${hour.padStart(2, '0')}:00`;
        } else if (period === 'morning') {
            return `${date}T09:00`;
        } else if (period === 'afternoon') {
            return `${date}T13:00`;
        } else {
            return `${date}T23:59`;
        }
    }
    
    function parseDueDateString(dueDateStr) {
        if (!dueDateStr) {
            return { date: '', period: '', hour: '' };
        }
        
        const [datePart, timePart] = dueDateStr.split('T');
        if (!timePart) {
            return { date: datePart, period: '', hour: '' };
        }
        
        const hour = parseInt(timePart.split(':')[0]);
        
        if (hour >= 9 && hour <= 12) {
            return { 
                date: datePart, 
                period: 'morning', 
                hour: hour.toString() 
            };
        } else if (hour >= 13 && hour <= 22) {
            return { 
                date: datePart, 
                period: 'afternoon', 
                hour: hour.toString() 
            };
        } else {
            return { date: datePart, period: '', hour: '' };
        }
    }

    closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTaskModal();
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeTaskModal();
        }
    });
    
    // Escキーでモーダルを閉じる
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeTaskModal();
        }
    });
    
    // モーダルを閉じる共通関数
    function closeTaskModal() {
        modal.classList.remove('show');
        // アニメーション完了後にモーダルを非表示
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // フォーカスを元の要素に戻す（アクセシビリティ向上）
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
        }, 300);
        selectedDate = null;
    }

    // グローバルに公開（HTML onclick用）
    window.closeTaskModal = closeTaskModal;
    
    // モーダル内でのTabキー循環（アクセシビリティ向上）
    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            const focusableElements = modal.querySelectorAll(
                'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    });
    
    // 複製ボタンのイベントリスナー
    duplicateTaskBtn.addEventListener('click', () => {
        if (editingTaskId) {
            duplicateTask(editingTaskId);
        }
    });

    function openEditModal(task) {
        editingTaskId = task.id;
        taskNameInput.value = task.name;
        estimatedTimeInput.value = task.estimated_time;
        
        // 実績時間フィールドの設定
        const actualTimeInput = document.getElementById('actual-time');
        if (actualTimeInput) {
            actualTimeInput.value = task.actual_time || 0;
        }
        
        taskPriorityInput.value = task.priority || 'medium';
        taskCategoryInput.value = validateCategory(task.category);
        // 💡 修正: nullの場合は空文字列を設定し、HTML inputで表示できるようにする
        taskDateInput.value = task.assigned_date || '';
        
        // 期限の解析と設定
        const dueDateParts = parseDueDateString(task.due_date);
        dueDateInput.value = dueDateParts.date;
        dueTimePeriodInput.value = dueDateParts.period;
        
        if (dueDateParts.period) {
            updateHourOptions(dueDateParts.period);
            dueHourInput.style.display = 'block';
            dueHourInput.value = dueDateParts.hour;
        } else {
            dueHourInput.style.display = 'none';
            dueHourInput.value = '';
        }
        
        taskDetailsInput.value = task.details || '';
        
        // 繰り返しタスク設定の復元
        isRecurringCheckbox.checked = task.is_recurring || false;
        if (task.is_recurring) {
            recurrenceOptions.style.display = 'block';
            recurrencePatternSelect.value = task.recurrence_pattern || '';
            recurrenceEndDateInput.value = task.recurrence_end_date || '';
        } else {
            recurrenceOptions.style.display = 'none';
            recurrencePatternSelect.value = '';
            recurrenceEndDateInput.value = '';
        }
        
        taskForm.querySelector('button[type="submit"]').textContent = '更新';
        
        // 複製ボタンを表示
        duplicateTaskBtn.style.display = 'block';
        
        // テンプレート保存ボタンを表示
        const saveAsTemplateBtn = document.getElementById('save-as-template-btn');
        if (saveAsTemplateBtn) {
            saveAsTemplateBtn.style.display = 'block';
        }
        
        // スクロール抑制とアニメーション
        document.body.classList.add('modal-open');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }


    // --- Form Submission Logic (タスク修正の成功ロジック) ---
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const assignedDateValue = taskDateInput.value || null;
        
        // 繰り返しタスクのバリデーション
        if (isRecurringCheckbox.checked && !assignedDateValue) {
            alert('繰り返しタスクには担当日の設定が必要です。');
            return;
        }
        
        // 実績時間フィールドの取得
        const actualTimeInput = document.getElementById('actual-time');
        const actualTime = actualTimeInput ? parseFloat(actualTimeInput.value) || 0 : 0;

        const taskData = {
            name: taskNameInput.value,
            estimated_time: parseFloat(estimatedTimeInput.value),
            actual_time: actualTime,
            priority: taskPriorityInput.value,
            category: validateCategory(taskCategoryInput.value),
            assigned_date: assignedDateValue,
            due_date: buildDueDateString(),
            details: taskDetailsInput.value,
            is_recurring: isRecurringCheckbox.checked,
            recurrence_pattern: isRecurringCheckbox.checked ? recurrencePatternSelect.value || null : null,
            recurrence_end_date: isRecurringCheckbox.checked ? recurrenceEndDateInput.value || null : null
        };

        if (editingTaskId) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex > -1) {
                // 既存タスクを更新
                tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            }
        } else {
            // 新規タスクを追加
            const newTask = {
                id: `task-${Date.now()}`,
                completed: false,
                ...taskData
            };
            tasks.push(newTask);
        }

        saveTasks();
        renderWeek();
        updateDashboard();
        closeTaskModal();
        taskForm.reset();
    });

    // --- Date and Rendering Logic ---

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        // 優先度クラスを追加
        taskElement.classList.add(`priority-${task.priority || 'medium'}`);
        // カテゴリクラスを追加
        const categoryKey = validateCategory(task.category);
        taskElement.classList.add(`category-${categoryKey}`);
        
        // 時間比較インジケーターを追加
        if (task.actual_time && task.actual_time > 0) {
            const timeDiff = task.actual_time - task.estimated_time;
            if (timeDiff > 0) {
                taskElement.classList.add('time-overrun-indicator');
                
                // 時間超過度合いに応じたクラスを追加
                const severity = getTimeOverrunSeverity(task.estimated_time, task.actual_time);
                if (severity === 'minor') {
                    taskElement.classList.add('time-overrun-minor');
                } else if (severity === 'moderate') {
                    taskElement.classList.add('time-overrun-moderate');
                } else if (severity === 'severe') {
                    taskElement.classList.add('time-overrun-severe');
                }
            } else if (timeDiff < 0) {
                taskElement.classList.add('time-underrun-indicator');
            } else {
                taskElement.classList.add('time-match-indicator');
            }
        }
        
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.category = categoryKey;
        taskElement.draggable = true;

        // カテゴリ情報を取得
        const categoryInfo = getCategoryInfo(categoryKey);

        const priorityLabels = { high: '高', medium: '中', low: '低' };
        const priorityLabel = priorityLabels[task.priority] || '中';
        
        // Create elements safely without innerHTML to prevent XSS
        const categoryBar = document.createElement('div');
        categoryBar.className = 'category-bar';
        categoryBar.style.backgroundColor = categoryInfo.color;
        
        const taskHeader = document.createElement('div');
        taskHeader.className = 'task-header';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        
        const taskNameDiv = document.createElement('div');
        taskNameDiv.className = 'task-name';

        // Bullet Journal Signifier - always show clickable icon
        const sigSpan = document.createElement('span');
        sigSpan.className = 'task-signifier';
        sigSpan.dataset.signifier = task.signifier || '';

        if (task.signifier) {
            sigSpan.textContent = SIGNIFIER_MAP[task.signifier] + ' ';
            sigSpan.title = SIGNIFIER_LABELS[task.signifier] + ' (\u30AF\u30EA\u30C3\u30AF\u3067\u5909\u66F4)';
        } else {
            sigSpan.textContent = '⬜ ';
            sigSpan.title = '\u30AF\u30EA\u30C3\u30AF\u3067\u8A18\u53F7\u3092\u8A2D\u5B9A';
            sigSpan.classList.add('task-signifier-empty');
        }

        sigSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const cur = SIGNIFIER_ORDER.indexOf(task.signifier);
            task.signifier = SIGNIFIER_ORDER[(cur + 1) % SIGNIFIER_ORDER.length];
            saveTasks();
            renderWeek();
        });
        taskNameDiv.appendChild(sigSpan);
        taskNameDiv.appendChild(document.createTextNode(task.name));
        
        const prioritySpan = document.createElement('span');
        prioritySpan.className = `task-priority ${task.priority || 'medium'}`;
        prioritySpan.textContent = priorityLabel;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'task-time';
        timeDiv.textContent = `${task.estimated_time}h`;
        
        if (task.actual_time && task.actual_time > 0) {
            const timeDiff = task.actual_time - task.estimated_time;
            const timeDiffPercent = ((timeDiff / task.estimated_time) * 100).toFixed(0);
            
            const timeSpan = document.createElement('span');
            if (timeDiff > 0) {
                const severity = getTimeOverrunSeverity(task.estimated_time, task.actual_time);
                timeSpan.className = `time-overrun time-overrun-${severity}`;
                timeSpan.textContent = `(+${timeDiff}h, +${timeDiffPercent}%)`;
            } else if (timeDiff < 0) {
                timeSpan.className = 'time-underrun';
                timeSpan.textContent = `(${timeDiff}h, ${timeDiffPercent}%)`;
            } else {
                timeSpan.className = 'time-match';
                timeSpan.textContent = '(一致)';
            }
            timeDiv.appendChild(document.createTextNode(' '));
            timeDiv.appendChild(timeSpan);
        }
        
        taskHeader.appendChild(checkbox);
        taskHeader.appendChild(taskNameDiv);
        taskHeader.appendChild(prioritySpan);
        taskHeader.appendChild(timeDiv);
        
        taskElement.appendChild(categoryBar);
        taskElement.appendChild(taskHeader);
        
        if (task.due_date) {
            const dueDateDiv = document.createElement('div');
            dueDateDiv.className = 'task-due-date';
            const dueDate = new Date(task.due_date);
            const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
            dueDateDiv.textContent = `期限: ${formattedDate}`;
            taskElement.appendChild(dueDateDiv);
        }

        // タスク修正/完了チェックボックスのイベントリスナー
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const newCompleted = e.target.checked;

            if (newCompleted) {
                // ジャーナル: 未完了エントリがあれば Next Step モーダルを先に表示
                if (window.HybridJournalManager && window.HybridJournalUI) {
                    const activeEntry = window.HybridJournalManager.getEntryByTaskId(task.id);
                    if (activeEntry) {
                        e.preventDefault();
                        checkbox.checked = false;
                        window.HybridJournalUI.showNextStepModal(activeEntry, () => {
                            task.completed = true;
                            checkbox.checked = true;
                            playTaskCompletionAnimation(taskElement, checkbox);
                            setTimeout(() => {
                                archiveCompletedTasks();
                                renderWeek();
                                updateDashboard();
                            }, 1800);
                        });
                        return;
                    }
                }

                task.completed = true;
                playTaskCompletionAnimation(taskElement, checkbox);
                setTimeout(() => {
                    archiveCompletedTasks();
                    renderWeek();
                    updateDashboard();
                }, 1800);
            } else {
                task.completed = false;
                saveTasks();
                renderWeek();
                updateDashboard();
            }
        });

        // タスク修正/編集モーダルを開くイベントリスナー
        taskElement.addEventListener('click', () => openEditModal(task));
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);

        return taskElement;
    }

    function addDragAndDropListeners() {
        const allColumns = document.querySelectorAll('.day-column');
        allColumns.forEach(col => {
            col.addEventListener('dragover', handleDragOver);
            col.addEventListener('dragleave', handleDragLeave);
            col.addEventListener('drop', handleDrop);
        });
    }
    
    function addDateClickListeners() {
        // 未割り当てエリア以外の日付列にクリックリスナーを追加
        dayColumns.forEach(col => {
            col.addEventListener('click', (e) => {
                // タスク要素やその子要素がクリックされた場合は無視
                if (e.target.closest('.task')) {
                    return;
                }
                
                // ドラッグ&ドロップ中は無視
                if (e.target.closest('.dragging')) {
                    return;
                }
                
                const dateStr = col.dataset.date;
                if (dateStr && dateStr !== 'null') {
                    openTaskModal(dateStr);
                }
            });
        });
    }

    function renderWeek() {
        if (isRendering) return;
        isRendering = true;

        const monday = getMonday(currentDate);
        
        // 繰り返しタスクを自動生成（修正版）
        const recurringStartDate = new Date(monday);
        const recurringEndDate = new Date(monday);
        recurringEndDate.setDate(monday.getDate() + 6);
        
        // 繰り返しタスクを取得
        const recurringTasks = tasks.filter(task => task.is_recurring && task.recurrence_pattern);
        
        if (recurringTasks.length > 0 && recurrenceEngine) {
            const generatedTasks = recurrenceEngine.generateAllRecurringTasks(
                recurringTasks,
                recurringStartDate,
                recurringEndDate
            );
            
            // 生成されたタスクを追加（厳密な重複チェック）
            let addedCount = 0;
            generatedTasks.forEach(generatedTask => {
                // 重複チェック：同じ名前、同じ日付、同じIDのタスクが存在しないか
                const isDuplicate = tasks.some(existingTask => 
                    existingTask.name === generatedTask.name &&
                    existingTask.assigned_date === generatedTask.assigned_date
                );
                
                // 生成されたタスクの日付が有効かチェック
                if (!isDuplicate && generatedTask.assigned_date && generatedTask.assigned_date !== 'null') {
                    tasks.push(generatedTask);
                    addedCount++;
                }
            });
            
            if (addedCount > 0) {
                saveTasks();
            }
        }

        dayColumns.forEach(col => {
            col.querySelectorAll('.task').forEach(task => task.remove());
            const totalTimeEl = col.querySelector('.daily-total-time');
            if (totalTimeEl) { totalTimeEl.textContent = ''; totalTimeEl.classList.remove('overload'); }
        });
        const unassignedList = unassignedColumn.querySelector('#unassigned-list');
        while (unassignedList.firstChild) {
            unassignedList.removeChild(unassignedList.firstChild);
        }

        const weekDates = [];
        const dailyTotals = {};
        const dailyCompletedTotals = {}; // 完了したタスクの時間

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            date.setHours(0, 0, 0, 0);
            const dateStr = formatDate(date);
            weekDates.push(date);
            dailyTotals[dateStr] = 0;
            dailyCompletedTotals[dateStr] = 0;
        }

        const startOfWeek = weekDates[0];
        const endOfWeek = weekDates[6];
        let weekTitleText = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
        
        // カテゴリフィルターが有効な場合、フィルター情報を追加
        if (currentCategoryFilter) {
            const categoryInfo = getCategoryInfo(currentCategoryFilter);
            const filteredTaskCount = tasks.filter(task => shouldDisplayTask(task)).length;
            weekTitleText += ` | フィルター: ${categoryInfo.name} (${filteredTaskCount}件)`;
        }
        
        // 曜日フィルター情報を追加
        if (weekdayManager) {
            const hiddenDays = weekdayManager.getHiddenWeekdays();
            if (hiddenDays.length > 0) {
                const hiddenLabels = hiddenDays.map(day => 
                    weekdayManager.dayLabels[weekdayManager.dayNames.indexOf(day)]
                );
                weekTitleText += ` | 非表示: ${hiddenLabels.join('・')}曜日`;
            }
        }
        
        weekTitle.textContent = weekTitleText;

        const startOfWeekStr = formatDate(startOfWeek);
        const endOfWeekStr = formatDate(endOfWeek);

        // 先に各カラムにdata-date属性を設定
        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);

            // data-date属性を先に設定
            column.dataset.date = dateStr;

            const h3 = column.querySelector('h3');
            h3.textContent = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()})`;
            
            // daily-total-time スパンを作成
            const totalTimeSpan = document.createElement('span');
            totalTimeSpan.className = 'daily-total-time';
            h3.appendChild(totalTimeSpan);
            
            // 曜日の表示/非表示を設定
            if (weekdayManager) {
                const dayName = weekdayManager.dayNames[index];
                const isVisible = weekdayManager.isWeekdayVisible(dayName);
                
                if (isVisible) {
                    column.classList.remove('hidden', 'hiding');
                    column.classList.add('showing');
                } else {
                    column.classList.add('hidden');
                    column.classList.remove('showing', 'hiding');
                }
            }
        });

        // 完了したタスク（アーカイブ）の時間を計算（カテゴリフィルターを適用）
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr && shouldDisplayTask(task)) {
                dailyCompletedTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
                dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
            }
        });

        // タスクを配置（カテゴリフィルターを適用）
        tasks.forEach(task => {
            // カテゴリフィルターをチェック
            if (!shouldDisplayTask(task)) {
                return; // フィルターに一致しないタスクはスキップ
            }
            
            const taskElement = createTaskElement(task);
            if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr) {
                const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
                if (column) {
                    column.appendChild(taskElement);
                    dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
                }
            } else if (task.assigned_date === null) {
                unassignedColumn.querySelector('#unassigned-list').appendChild(taskElement);
            }
        });

        // 合計時間を表示
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);
            const totalMinutes = dailyTotals[dateStr];
            const completedMinutes = dailyCompletedTotals[dateStr];

            const totalTimeEl = column.querySelector('.daily-total-time');
            if (totalTimeEl) {
                totalTimeEl.textContent = '';
                if (totalMinutes > 0) {
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    
                    if (completedMinutes > 0) {
                        const completedHours = Math.floor(completedMinutes / 60);
                        const completedMins = completedMinutes % 60;
                        
                        const totalTimeSpan = document.createElement('span');
                        totalTimeSpan.className = 'total-time';
                        totalTimeSpan.textContent = `(${hours}h ${minutes}m)`;
                        
                        const completedTimeSpan = document.createElement('span');
                        completedTimeSpan.className = 'completed-time';
                        completedTimeSpan.textContent = `完了: ${completedHours}h ${completedMins}m`;
                        
                        totalTimeEl.appendChild(totalTimeSpan);
                        totalTimeEl.appendChild(completedTimeSpan);
                    } else {
                        const totalTimeSpan = document.createElement('span');
                        totalTimeSpan.className = 'total-time';
                        totalTimeSpan.textContent = `(${hours}h ${minutes}m)`;
                        totalTimeEl.appendChild(totalTimeSpan);
                    }
                } else {
                    const totalTimeSpan = document.createElement('span');
                    totalTimeSpan.className = 'total-time';
                    totalTimeSpan.textContent = '(0h 0m)';
                    totalTimeEl.appendChild(totalTimeSpan);
                }

                if (totalMinutes > settings.ideal_daily_minutes) {
                    totalTimeEl.classList.add('overload');
                } else {
                    totalTimeEl.classList.remove('overload');
                }
            }
        });

        unassignedColumn.dataset.date = "null";
        addDragAndDropListeners();
        addDateClickListeners();

        datePicker.value = formatDate(currentDate);
        
        // グリッド列数を更新
        updateGridColumns();
        
        // ダッシュボードを更新
        updateDashboard();

        // ジャーナル: タスクカード再描画後に開始ボタンを注入
        if (window.HybridJournalUI) {
            window.HybridJournalUI.injectStartButtons();
        }

        // 前週の未完了タスクがあればマイグレーション通知
        checkIncompleteFromPreviousWeek(monday);

        isRendering = false;
    }
    document.body.renderWeek = renderWeek;

    function checkIncompleteFromPreviousWeek(currentMonday) {
        if (migrationNotified) return;
        if (!window.HybridTaskMigration) return;

        const prevMonday = new Date(currentMonday);
        prevMonday.setDate(prevMonday.getDate() - 7);
        const prevEnd = new Date(prevMonday);
        prevEnd.setDate(prevEnd.getDate() + 6);

        const prevStartStr = formatDate(prevMonday);
        const prevEndStr = formatDate(prevEnd);

        const incomplete = window.HybridTaskMigration.getIncompleteTasksForWeek(prevStartStr, prevEndStr);
        if (incomplete.length > 0) {
            migrationNotified = true;
            const btn = document.getElementById('migration-toggle');
            if (btn) {
                btn.classList.add('migration-alert');
                btn.title = '\u26A0 \u524D\u9031\u306B' + incomplete.length + '\u4EF6\u306E\u672A\u5B8C\u4E86\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u3059';
            }
        }
    }


    // --- Navigation Event Listeners ---
    prevWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate);
        newMonday.setDate(newMonday.getDate() - 7);
        currentDate = newMonday;
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate);
        // 💡 修正 4: 次週へ移動するように修正 (getDate() + 7)
        newMonday.setDate(newMonday.getDate() + 7);
        currentDate = newMonday;
        renderWeek();
    });

    // 💡 修正 5: 今週に戻るボタンのイベントリスナーを追加
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderWeek();
    });

    // 日付ピッカーのクリック・変更リスナーを追加
    datePicker.addEventListener('click', (e) => {
        // readonly属性を一時的に解除してカレンダーを開く
        datePicker.removeAttribute('readonly');
        if (typeof datePicker.showPicker === 'function') {
            try {
                datePicker.showPicker();
            } catch (error) {
                datePicker.focus();
            }
        } else {
            datePicker.focus();
        }
    });
    
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = new Date(e.target.value);
            renderWeek();
        }
        // カレンダー選択後にreadonly属性を復元
        setTimeout(() => {
            datePicker.setAttribute('readonly', 'readonly');
        }, 100);
    });
    
    datePicker.addEventListener('blur', (e) => {
        // フォーカスが外れた時にreadonly属性を復元
        setTimeout(() => {
            datePicker.setAttribute('readonly', 'readonly');
        }, 100);
    });

    // 💡 修正 7: idealDailyMinutesの変更リスナーを追加（設定の保存）
    idealDailyMinutesInput.addEventListener('change', (e) => {
        settings.ideal_daily_minutes = parseInt(e.target.value, 10) || 480;
        saveSettings();
        renderWeek(); // 合計時間の表示を更新
    });

    // カテゴリフィルターの変更リスナー
    categoryFilterSelect.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        updateFilterIndicator();
        renderWeek(); // フィルターを適用してタスクボードを再描画
    });

    /**
     * Update the visual indicator for active category filter.
     */
    function updateFilterIndicator() {
        const filterContainer = document.getElementById('category-filter');
        if (currentCategoryFilter) {
            filterContainer.classList.add('filter-active');
        } else {
            filterContainer.classList.remove('filter-active');
        }
    }

    /**
     * Initialize category filter state.
     */
    function initializeCategoryFilter() {
        // Set initial filter state
        currentCategoryFilter = '';
        categoryFilterSelect.value = '';
        updateFilterIndicator();
    }
    
// Weekday + ContextMenu → ContextManager.js（window.ContextManager）


/**
 * Filter and render templates based on search term and sort order
 * @param {string} searchTerm - Search term to filter templates
 * @param {string} sortBy - Sort order: 'recent', 'name', or 'usage'
 */
function filterAndRenderTemplates(searchTerm = '', sortBy = 'recent') {
    const templateList = document.getElementById('template-list');
    const templateEmpty = document.getElementById('template-empty');
    
    if (!templateList || !templateEmpty) return;
    
    let templates = getTemplates();
    
    // Filter by search term
    if (searchTerm) {
        templates = templates.filter(template => 
            template.name.toLowerCase().includes(searchTerm) ||
            template.base_task.name.toLowerCase().includes(searchTerm) ||
            template.base_task.details.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort templates
    switch (sortBy) {
        case 'name':
            templates.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
            break;
        case 'usage':
            templates.sort((a, b) => b.usage_count - a.usage_count);
            break;
        case 'recent':
        default:
            templates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            break;
    }
    
    if (templates.length === 0) {
        templateList.innerHTML = '';
        templateEmpty.style.display = 'block';
        return;
    }
    
    templateEmpty.style.display = 'none';
    templateList.innerHTML = '';
    
    templates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        
        const categoryInfo = getCategoryInfo(template.base_task.category);
        
        templateItem.innerHTML = `
            <div class="template-item-header">
                <div class="template-item-title">${template.name}</div>
                <div class="template-item-actions">
                    <button class="template-use-btn" data-template-id="${template.id}" title="このテンプレートから新規タスクを作成" aria-label="テンプレートを使用">使用</button>
                    <button class="template-duplicate-btn" data-template-id="${template.id}" title="このテンプレートを複製" aria-label="テンプレートを複製">複製</button>
                    <button class="template-delete-btn" data-template-id="${template.id}" title="このテンプレートを削除" aria-label="テンプレートを削除">削除</button>
                </div>
            </div>
            <div class="template-item-content">
                <div class="template-item-task-name">${template.base_task.name}</div>
                <div class="template-item-meta">
                    <span class="template-item-category" style="background-color: ${categoryInfo.bgColor}; color: ${categoryInfo.color};">
                        ${categoryInfo.name}
                    </span>
                    <span class="template-item-time">見積: ${template.base_task.estimated_time}h</span>
                    <span class="template-item-priority priority-${template.base_task.priority}">
                        優先度: ${['high', 'medium', 'low'].includes(template.base_task.priority) ? (['高', '中', '低'][['high', 'medium', 'low'].indexOf(template.base_task.priority)]) : '中'}
                    </span>
                </div>
                ${template.base_task.details ? `<div class="template-item-description">${template.base_task.details}</div>` : ''}
                <div class="template-item-footer">
                    <span class="template-item-created">作成: ${template.created_date}</span>
                    <span class="template-item-usage">使用回数: ${template.usage_count}</span>
                </div>
            </div>
        `;
        
        templateList.appendChild(templateItem);
    });
    
    // Add event listeners for template actions
    document.querySelectorAll('.template-use-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateId = e.target.dataset.templateId;
            const template = templates.find(t => t.id === templateId);
            if (template) {
                createAndAddTaskFromTemplate(template);
            }
        });
    });
    
    document.querySelectorAll('.template-duplicate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateId = e.target.dataset.templateId;
            const template = templates.find(t => t.id === templateId);
            if (template) {
                duplicateTemplate(template, searchTerm, sortBy);
            }
        });
    });
    
    document.querySelectorAll('.template-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateId = e.target.dataset.templateId;
            if (confirm('このテンプレートを削除してもよろしいですか？')) {
                deleteTemplate(templateId);
                filterAndRenderTemplates(searchTerm, sortBy);
            }
        });
    });
}

/**
 * Create and add task from template
 * @param {object} template
 */
function createAndAddTaskFromTemplate(template) {
    const newTask = createTaskFromTemplate(template);
    tasks.push(newTask);
    saveTasks();
    renderWeek();
    updateDashboard();
    
    // Close template panel
    const templatePanel = document.getElementById('template-panel');
    if (templatePanel) {
        templatePanel.style.display = 'none';
    }
    
    // Show notification
    showNotification(`テンプレート「${template.name}」から新規タスクを作成しました`, 'success');
}

/**
 * Show notification message
 * @param {string} message
 * @param {string} type - 'success', 'info', 'warning', 'error'
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#4a90e2'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 0.9em;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


/**
 * 指定された日付の週の完了率を計算
 */
function calculateCompletionRateForDate(targetDate) {
    const monday = getMonday(targetDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = formatDate(monday);
    const sundayStr = formatDate(sunday);
    
    const allTasks = loadTasks();
    const archivedTasks = loadArchivedTasks();
    const weekTasks = allTasks.concat(archivedTasks).filter(task => {
        if (!task.assigned_date) return false;
        return task.assigned_date >= mondayStr && task.assigned_date <= sundayStr;
    });
    
    const completedCount = weekTasks.filter(t => t.completed).length;
    const completionRate = weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
    
    return {
        total_tasks: weekTasks.length,
        completed_tasks: completedCount,
        completion_rate: completionRate,
        is_valid: true
    };
}

/**
 * 指定された日付の週のカテゴリ別時間分析を計算
 */
function calculateCategoryTimeAnalysisForDate(targetDate) {
    const monday = getMonday(targetDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = formatDate(monday);
    const sundayStr = formatDate(sunday);
    
    const allTasks = loadTasks();
    const archivedTasks = loadArchivedTasks();
    const weekTasks = allTasks.concat(archivedTasks).filter(task => {
        if (!task.assigned_date) return false;
        return task.assigned_date >= mondayStr && task.assigned_date <= sundayStr;
    });
    
    const categories = {};
    let totalEstimatedTime = 0;
    let totalActualTime = 0;
    
    weekTasks.forEach(task => {
        const category = task.category || 'task';
        if (!categories[category]) {
            categories[category] = {
                task_count: 0,
                completed_count: 0,
                estimated_time: 0,
                actual_time: 0
            };
        }
        
        categories[category].task_count++;
        if (task.completed) categories[category].completed_count++;
        categories[category].estimated_time += task.estimated_time || 0;
        categories[category].actual_time += task.actual_time || 0;
        
        totalEstimatedTime += task.estimated_time || 0;
        totalActualTime += task.actual_time || 0;
    });
    
    return {
        categories: categories,
        total_estimated_time: totalEstimatedTime / 60,
        total_actual_time: totalActualTime / 60
    };
}

/**
 * 指定された日付の週の日別作業時間を計算
 */
function calculateDailyWorkTimeForDate(targetDate) {
    const monday = getMonday(targetDate);
    const dailyBreakdown = {};
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = formatDate(date);
        
        const allTasks = loadTasks();
        const archivedTasks = loadArchivedTasks();
        const dayTasks = allTasks.concat(archivedTasks).filter(task => task.assigned_date === dateStr);
        
        const totalEstimatedTime = dayTasks.reduce((sum, task) => sum + (task.estimated_time || 0), 0);
        const totalActualTime = dayTasks.reduce((sum, task) => sum + (task.actual_time || 0), 0);
        const completedCount = dayTasks.filter(t => t.completed).length;
        
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        
        dailyBreakdown[dateStr] = {
            day_name: dayNames[date.getDay()],
            estimated_time: totalEstimatedTime / 60,
            actual_time: totalActualTime / 60,
            task_count: dayTasks.length,
            completed_count: completedCount
        };
    }
    
    return {
        daily_breakdown: dailyBreakdown
    };
}


// Calendar → CalendarManager.js（window.CalendarManager）



/**
 * 通知を表示
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// PWA は上記 DOMContentLoaded リスナー内で初期化済み


// ===== 古いクラスベース実装は削除済み =====
