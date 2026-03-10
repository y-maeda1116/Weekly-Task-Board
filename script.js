// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';
const ARCHIVE_STORAGE_KEY = 'weekly-task-board.archive';
const TEMPLATES_STORAGE_KEY = 'weekly-task-board.templates';

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
 * Load tasks from localStorage, adding sample data if it's empty.
 * @returns {object[]}
 */
function loadTasks() {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    let tasksData = [];
    
    if (!tasksJson || JSON.parse(tasksJson).length === 0) {
        // LocalStorageが空の場合、現在の週に表示されるサンプルタスクを生成
        const today = new Date();
        const monday = getMonday(today);

        // 今週の月曜日から水曜日の日付を取得
        const mondayStr = formatDate(monday);
        const tuesday = new Date(monday);
        tuesday.setDate(monday.getDate() + 1);
        const tuesdayStr = formatDate(tuesday);
        const wednesday = new Date(monday);
        wednesday.setDate(monday.getDate() + 2);
        const wednesdayStr = formatDate(wednesday);

        tasksData = [];
    } else {
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
        recurrence_end_date: task.recurrence_end_date || null
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

/**
 * Statistics Engine - 統計計算エンジン
 * 週間のタスク統計を計算するための関数群
 */

/**
 * Calculate completion rate for the current week
 * Validates: Requirements 1.1, 1.2
 * 
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Completion rate statistics with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     total_tasks: number,
 *     completed_tasks: number,
 *     completion_rate: number (0-100),
 *     is_valid: boolean
 *   }
 */
function calculateCompletionRate(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);
        
        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);
        
        // Count total and completed tasks for the current week
        let totalTasks = 0;
        let completedTasks = 0;
        
        // Count active tasks assigned to this week
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                if (task.completed) {
                    completedTasks++;
                }
            }
        });
        
        // Count archived (completed) tasks from this week
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                completedTasks++;
            }
        });
        
        // Calculate completion rate
        let completionRate = 0;
        if (totalTasks > 0) {
            completionRate = (completedTasks / totalTasks) * 100;
            // Round to 2 decimal places
            completionRate = Math.round(completionRate * 100) / 100;
        }
        
        return {
            week_start: weekStartStr,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            completion_rate: completionRate,
            is_valid: true
        };
    } catch (error) {
        console.error('完了率計算エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            total_tasks: 0,
            completed_tasks: 0,
            completion_rate: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Get completion rate for a specific week
 * Validates: Requirements 1.1, 1.2
 * 
 * @param {number} weeksOffset - Number of weeks to offset from current week (0 = current, -1 = last week, 1 = next week)
 * @returns {object} Completion rate statistics
 */
function getCompletionRateForWeek(weeksOffset = 0) {
    const targetDate = new Date(currentDate);
    const monday = getMonday(targetDate);
    monday.setDate(monday.getDate() + (weeksOffset * 7));
    
    return calculateCompletionRate(monday);
}

/**
 * Calculate category-based time analysis for the current week
 * Validates: Requirements 1.3
 * 
 * Analyzes time spent on each category by calculating:
 * - Total estimated time per category
 * - Total actual time per category
 * - Time variance (actual - estimated) per category
 * 
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Category breakdown with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     categories: {
 *       [categoryKey]: {
 *         name: string,
 *         estimated_time: number,
 *         actual_time: number,
 *         variance: number (actual - estimated),
 *         task_count: number,
 *         completed_count: number
 *       }
 *     },
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     is_valid: boolean
 *   }
 */
function calculateCategoryTimeAnalysis(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);
        
        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);
        
        // Initialize category breakdown object
        const categoryBreakdown = {};
        let totalEstimatedTime = 0;
        let totalActualTime = 0;
        
        // Initialize all categories
        Object.keys(TASK_CATEGORIES).forEach(categoryKey => {
            categoryBreakdown[categoryKey] = {
                name: TASK_CATEGORIES[categoryKey].name,
                estimated_time: 0,
                actual_time: 0,
                variance: 0,
                task_count: 0,
                completed_count: 0
            };
        });
        
        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const category = validateCategory(task.category);
                
                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = {
                        name: TASK_CATEGORIES[category].name,
                        estimated_time: 0,
                        actual_time: 0,
                        variance: 0,
                        task_count: 0,
                        completed_count: 0
                    };
                }
                
                categoryBreakdown[category].estimated_time += task.estimated_time || 0;
                categoryBreakdown[category].actual_time += task.actual_time || 0;
                categoryBreakdown[category].task_count++;
                
                if (task.completed) {
                    categoryBreakdown[category].completed_count++;
                }
            }
        });
        
        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const category = validateCategory(task.category);
                
                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = {
                        name: TASK_CATEGORIES[category].name,
                        estimated_time: 0,
                        actual_time: 0,
                        variance: 0,
                        task_count: 0,
                        completed_count: 0
                    };
                }
                
                categoryBreakdown[category].estimated_time += task.estimated_time || 0;
                categoryBreakdown[category].actual_time += task.actual_time || 0;
                categoryBreakdown[category].task_count++;
                categoryBreakdown[category].completed_count++;
            }
        });
        
        // Calculate variance and totals
        Object.keys(categoryBreakdown).forEach(categoryKey => {
            const category = categoryBreakdown[categoryKey];
            category.variance = category.actual_time - category.estimated_time;
            category.variance = Math.round(category.variance * 100) / 100;
            
            totalEstimatedTime += category.estimated_time;
            totalActualTime += category.actual_time;
        });
        
        // Round totals to 2 decimal places
        totalEstimatedTime = Math.round(totalEstimatedTime * 100) / 100;
        totalActualTime = Math.round(totalActualTime * 100) / 100;
        
        return {
            week_start: weekStartStr,
            categories: categoryBreakdown,
            total_estimated_time: totalEstimatedTime,
            total_actual_time: totalActualTime,
            is_valid: true
        };
    } catch (error) {
        console.error('カテゴリ別時間分析エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            categories: {},
            total_estimated_time: 0,
            total_actual_time: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Calculate daily work time for the current week
 * Validates: Requirements 1.4
 * 
 * Calculates the total estimated and actual time for each day of the week.
 * 
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Daily breakdown with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     daily_breakdown: {
 *       [dateString]: {
 *         date: string (YYYY-MM-DD),
 *         day_name: string (月, 火, etc.),
 *         estimated_time: number,
 *         actual_time: number,
 *         variance: number (actual - estimated),
 *         task_count: number,
 *         completed_count: number
 *       }
 *     },
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     is_valid: boolean
 *   }
 */
function calculateDailyWorkTime(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);
        
        // Day names in Japanese
        const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
        
        // Initialize daily breakdown
        const dailyBreakdown = {};
        let totalEstimatedTime = 0;
        let totalActualTime = 0;
        
        // Initialize all days of the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = formatDate(date);
            
            dailyBreakdown[dateStr] = {
                date: dateStr,
                day_name: dayNames[i],
                estimated_time: 0,
                actual_time: 0,
                variance: 0,
                task_count: 0,
                completed_count: 0
            };
        }
        
        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr) {
                const endOfWeek = new Date(monday);
                endOfWeek.setDate(monday.getDate() + 6);
                const endOfWeekStr = formatDate(endOfWeek);
                
                if (task.assigned_date <= endOfWeekStr) {
                    const dateStr = task.assigned_date;
                    
                    if (dailyBreakdown[dateStr]) {
                        dailyBreakdown[dateStr].estimated_time += task.estimated_time || 0;
                        dailyBreakdown[dateStr].actual_time += task.actual_time || 0;
                        dailyBreakdown[dateStr].task_count++;
                        
                        if (task.completed) {
                            dailyBreakdown[dateStr].completed_count++;
                        }
                    }
                }
            }
        });
        
        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr) {
                const endOfWeek = new Date(monday);
                endOfWeek.setDate(monday.getDate() + 6);
                const endOfWeekStr = formatDate(endOfWeek);
                
                if (task.assigned_date <= endOfWeekStr) {
                    const dateStr = task.assigned_date;
                    
                    if (dailyBreakdown[dateStr]) {
                        dailyBreakdown[dateStr].estimated_time += task.estimated_time || 0;
                        dailyBreakdown[dateStr].actual_time += task.actual_time || 0;
                        dailyBreakdown[dateStr].task_count++;
                        dailyBreakdown[dateStr].completed_count++;
                    }
                }
            }
        });
        
        // Calculate variance and totals
        Object.keys(dailyBreakdown).forEach(dateStr => {
            const day = dailyBreakdown[dateStr];
            day.variance = day.actual_time - day.estimated_time;
            day.variance = Math.round(day.variance * 100) / 100;
            
            totalEstimatedTime += day.estimated_time;
            totalActualTime += day.actual_time;
        });
        
        // Round totals to 2 decimal places
        totalEstimatedTime = Math.round(totalEstimatedTime * 100) / 100;
        totalActualTime = Math.round(totalActualTime * 100) / 100;
        
        return {
            week_start: weekStartStr,
            daily_breakdown: dailyBreakdown,
            total_estimated_time: totalEstimatedTime,
            total_actual_time: totalActualTime,
            is_valid: true
        };
    } catch (error) {
        console.error('日別作業時間計算エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            daily_breakdown: {},
            total_estimated_time: 0,
            total_actual_time: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Calculate estimated vs actual time analysis for the current week
 * Validates: Requirements 1.5
 * 
 * Compares estimated and actual times to identify:
 * - Overall time variance
 * - Tasks with time overruns
 * - Estimation accuracy
 * 
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Estimated vs actual analysis with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     total_variance: number (actual - estimated),
 *     variance_percentage: number (variance / estimated * 100),
 *     overrun_tasks: Array<{
 *       id: string,
 *       name: string,
 *       estimated_time: number,
 *       actual_time: number,
 *       overrun_time: number,
 *       overrun_percentage: number,
 *       severity: string (minor, moderate, severe)
 *     }>,
 *     on_track_tasks: number,
 *     overrun_task_count: number,
 *     estimation_accuracy: number (0-100, higher is better),
 *     is_valid: boolean
 *   }
 */
function calculateEstimatedVsActualAnalysis(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);
        
        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);
        
        let totalEstimatedTime = 0;
        let totalActualTime = 0;
        let onTrackTasks = 0;
        const overrunTasks = [];
        
        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const estimatedTime = task.estimated_time || 0;
                const actualTime = task.actual_time || 0;
                
                totalEstimatedTime += estimatedTime;
                totalActualTime += actualTime;
                
                // Check for time overrun
                if (actualTime > estimatedTime) {
                    const overrunTime = actualTime - estimatedTime;
                    const overrunPercentage = estimatedTime > 0 ? (overrunTime / estimatedTime) * 100 : 0;
                    const severity = getTimeOverrunSeverity(estimatedTime, actualTime);
                    
                    overrunTasks.push({
                        id: task.id,
                        name: task.name,
                        estimated_time: estimatedTime,
                        actual_time: actualTime,
                        overrun_time: Math.round(overrunTime * 100) / 100,
                        overrun_percentage: Math.round(overrunPercentage * 100) / 100,
                        severity: severity
                    });
                } else {
                    onTrackTasks++;
                }
            }
        });
        
        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const estimatedTime = task.estimated_time || 0;
                const actualTime = task.actual_time || 0;
                
                totalEstimatedTime += estimatedTime;
                totalActualTime += actualTime;
                
                // Archived tasks are considered on track (completed)
                onTrackTasks++;
            }
        });
        
        // Calculate variance
        const totalVariance = totalActualTime - totalEstimatedTime;
        const variancePercentage = totalEstimatedTime > 0 ? (totalVariance / totalEstimatedTime) * 100 : 0;
        
        // Calculate estimation accuracy (0-100, higher is better)
        // Perfect estimation = 100, 50% overrun = 0
        let estimationAccuracy = 100;
        if (variancePercentage > 0) {
            estimationAccuracy = Math.max(0, 100 - variancePercentage);
        } else if (variancePercentage < 0) {
            // Underestimation is also penalized, but less severely
            estimationAccuracy = Math.max(0, 100 + (variancePercentage / 2));
        }
        estimationAccuracy = Math.round(estimationAccuracy * 100) / 100;
        
        return {
            week_start: weekStartStr,
            total_estimated_time: Math.round(totalEstimatedTime * 100) / 100,
            total_actual_time: Math.round(totalActualTime * 100) / 100,
            total_variance: Math.round(totalVariance * 100) / 100,
            variance_percentage: Math.round(variancePercentage * 100) / 100,
            overrun_tasks: overrunTasks,
            on_track_tasks: onTrackTasks,
            overrun_task_count: overrunTasks.length,
            estimation_accuracy: estimationAccuracy,
            is_valid: true
        };
    } catch (error) {
        console.error('見積もり vs 実績分析エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            total_estimated_time: 0,
            total_actual_time: 0,
            total_variance: 0,
            variance_percentage: 0,
            overrun_tasks: [],
            on_track_tasks: 0,
            overrun_task_count: 0,
            estimation_accuracy: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * TaskBulkMover - タスクの一括移動を管理するクラス
 */
class TaskBulkMover {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
    }
    
    /**
     * 指定日のタスクを未割り当てに移動
     * @param {string} dateString - 移動対象の日付文字列 (YYYY-MM-DD)
     * @returns {number} 移動したタスク数
     */
    moveTasksToUnassigned(dateString) {
        if (!tasks || !dateString) return 0;
        
        try {
            let movedCount = 0;
            tasks.forEach(task => {
                if (task.assigned_date === dateString && !task.completed) {
                    task.assigned_date = null;
                    movedCount++;
                }
            });
            
            if (movedCount > 0) {
                saveTasks();
            }
            
            return movedCount;
        } catch (error) {
            console.error('タスク移動エラー:', error);
            showBulkMoveNotification('タスクの移動に失敗しました', 'error');
            return 0;
        }
    }
    
    /**
     * 指定日のタスクを取得
     * @param {string} dateString - 対象の日付文字列 (YYYY-MM-DD)
     * @returns {Array} その日のタスク配列
     */
    getTasksForDate(dateString) {
        if (!tasks || !dateString) return [];
        
        return tasks.filter(task => 
            task.assigned_date === dateString && !task.completed
        );
    }
    
    /**
     * 一括移動の実行
     * @param {Array} tasksToMove - 移動するタスク配列
     * @returns {number} 移動したタスク数
     */
    executeBulkMove(tasksToMove) {
        let movedCount = 0;
        
        tasksToMove.forEach(task => {
            task.assigned_date = null;
            movedCount++;
        });
        
        if (movedCount > 0) {
            saveTasks();
        }
        
        return movedCount;
    }
    
    /**
     * 移動結果の通知
     * @param {number} movedCount - 移動したタスク数
     * @param {string} dateString - 移動元の日付
     */
    notifyMoveResult(movedCount, dateString) {
        if (movedCount === 0) {
            showBulkMoveNotification('移動するタスクがありませんでした', 'info');
            return;
        }
        
        const date = new Date(dateString);
        const dayOfWeek = this.dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]; // 日曜日を6に調整
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek})`;
        
        showBulkMoveNotification(
            `${dateStr}の${movedCount}個のタスクを未割り当てに移動しました`,
            'success'
        );
    }
    
    /**
     * 日付から曜日名を取得
     * @param {string} dateString - 日付文字列 (YYYY-MM-DD)
     * @returns {string} 曜日名
     */
    getDayNameFromDate(dateString) {
        const date = new Date(dateString);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // 日曜日を6に調整
        return this.dayNames[dayIndex];
    }
}

/**
 * WeekdayManager - 曜日の表示/非表示状態を管理するクラス
 */
class WeekdayManager {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        this.weekdaySettings = {};
        this.loadSettings();
    }
    
    /**
     * 設定の読み込み
     */
    loadSettings() {
        if (settings && settings.weekday_visibility) {
            this.weekdaySettings = { ...settings.weekday_visibility };
        } else {
            // デフォルト設定
            this.weekdaySettings = {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: true,
                sunday: true
            };
        }
    }
    
    /**
     * 設定の保存
     */
    saveSettings() {
        try {
            if (settings) {
                settings.weekday_visibility = { ...this.weekdaySettings };
                saveSettings();
            }
        } catch (error) {
            console.error('曜日設定の保存に失敗:', error);
            showBulkMoveNotification('設定の保存に失敗しました', 'error');
        }
    }
    
    /**
     * 曜日の表示/非表示切り替え
     * @param {string} dayName - 曜日名 (monday, tuesday, etc.)
     * @param {boolean} visible - 表示するかどうか
     */
    toggleWeekday(dayName, visible) {
        if (this.dayNames.includes(dayName)) {
            this.weekdaySettings[dayName] = visible;
            this.saveSettings();
            
            // 非表示にする場合、その曜日のタスクを未割り当てに移動
            if (!visible) {
                this.moveTasksToUnassigned(dayName);
            }
        }
    }
    
    /**
     * 表示中の曜日一覧を取得
     * @returns {string[]} 表示中の曜日名配列
     */
    getVisibleWeekdays() {
        return this.dayNames.filter(day => this.weekdaySettings[day]);
    }
    
    /**
     * 非表示の曜日一覧を取得
     * @returns {string[]} 非表示の曜日名配列
     */
    getHiddenWeekdays() {
        return this.dayNames.filter(day => !this.weekdaySettings[day]);
    }
    
    /**
     * 曜日が表示されているかチェック
     * @param {string} dayName - 曜日名
     * @returns {boolean} 表示されているかどうか
     */
    isWeekdayVisible(dayName) {
        return this.weekdaySettings[dayName] || false;
    }
    
    /**
     * 指定曜日のタスクを未割り当てに移動
     * @param {string} dayName - 曜日名
     * @returns {number} 移動したタスク数
     */
    moveTasksToUnassigned(dayName) {
        if (!tasks) return 0;
        
        const monday = getMonday(currentDate);
        const dayIndex = this.dayNames.indexOf(dayName);
        if (dayIndex === -1) return 0;
        
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIndex);
        const targetDateStr = formatDate(targetDate);
        
        let movedCount = 0;
        tasks.forEach(task => {
            if (task.assigned_date === targetDateStr) {
                task.assigned_date = null;
                movedCount++;
            }
        });
        
        if (movedCount > 0) {
            saveTasks();
            console.log(`${movedCount}個のタスクを未割り当てに移動しました`);
        }
        
        return movedCount;
    }
    
    /**
     * 曜日設定のバリデーション
     * @param {object} settings - 検証する設定オブジェクト
     * @returns {object} 検証済み設定オブジェクト
     */
    validateSettings(settings) {
        const validatedSettings = {};
        
        this.dayNames.forEach(day => {
            validatedSettings[day] = typeof settings[day] === 'boolean' ? settings[day] : true;
        });
        
        return validatedSettings;
    }
}

/**
 * Migrate archived tasks to add actual_time field
 * @param {object[]} archivedTasks
 * @returns {object[]}
 */
function migrateArchivedTasksAddActualTime(archivedTasks) {
    return archivedTasks.map(task => {
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
 * Migrate archived tasks to add recurring task fields
 * @param {object[]} archivedTasks
 * @returns {object[]}
 */
function migrateArchivedTasksAddRecurringFields(archivedTasks) {
    return archivedTasks.map(task => {
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
 * Load archived tasks from localStorage.
 * @returns {object[]}
 */
function loadArchivedTasks() {
    const archivedJson = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!archivedJson) {
        return [];
    }
    
    try {
        let archivedTasks = JSON.parse(archivedJson);
        
        // マイグレーション実行
        const history = getMigrationHistory();
        if (history.version >= '1.0') {
            archivedTasks = migrateArchivedTasksAddActualTime(archivedTasks);
        }
        if (history.version >= '1.1') {
            archivedTasks = migrateArchivedTasksAddRecurringFields(archivedTasks);
        }
        
        return archivedTasks;
    } catch (error) {
        console.error('アーカイブタスクの読み込みに失敗:', error);
        return [];
    }
}

/**
 * Save archived tasks to localStorage.
 * @param {object[]} archivedTasks
 */
function saveArchivedTasks(archivedTasks) {
    // マイグレーション適用
    let migratedTasks = migrateArchivedTasksAddActualTime(archivedTasks);
    migratedTasks = migrateArchivedTasksAddRecurringFields(migratedTasks);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(migratedTasks));
}

/**
 * Move completed tasks to archive.
 */
function archiveCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return;

    const archivedTasks = loadArchivedTasks();
    const currentDate = new Date().toISOString();

    // 完了タスクにアーカイブ日時を追加
    completedTasks.forEach(task => {
        task.archived_date = currentDate;
        archivedTasks.push(task);
    });

    // 完了タスクを通常のタスクリストから削除
    tasks = tasks.filter(task => !task.completed);

    saveArchivedTasks(archivedTasks);
    saveTasks();
}


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
 * Verify and repair category information in LocalStorage data.
 */
function verifyCategoryData() {
    let dataModified = false;
    
    // タスクデータのカテゴリ検証
    tasks.forEach(task => {
        const originalCategory = task.category;
        task.category = validateCategory(task.category);
        if (originalCategory !== task.category) {
            dataModified = true;
            console.log(`Task "${task.name}" category corrected from "${originalCategory}" to "${task.category}"`);
        }
    });
    
    // アーカイブデータのカテゴリ検証
    const archivedTasks = loadArchivedTasks();
    let archiveModified = false;
    archivedTasks.forEach(task => {
        const originalCategory = task.category;
        task.category = validateCategory(task.category);
        if (originalCategory !== task.category) {
            archiveModified = true;
            console.log(`Archived task "${task.name}" category corrected from "${originalCategory}" to "${task.category}"`);
        }
    });
    
    if (dataModified) {
        console.log("Category data verification completed - tasks updated.");
        saveTasks();
    }
    
    if (archiveModified) {
        console.log("Category data verification completed - archive updated.");
        saveArchivedTasks(archivedTasks);
    }
    
    return dataModified || archiveModified;
}

/**
 * Verify and repair migration data in LocalStorage.
 */
function verifyMigrationData() {
    let dataModified = false;
    
    // タスクデータのactual_timeフィールド検証
    tasks.forEach(task => {
        if (task.actual_time === undefined || typeof task.actual_time !== 'number') {
            task.actual_time = 0;
            dataModified = true;
            console.log(`Task "${task.name}" actual_time field corrected`);
        }
    });
    
    // タスクデータの繰り返しフィールド検証
    tasks.forEach(task => {
        if (task.is_recurring === undefined || typeof task.is_recurring !== 'boolean') {
            task.is_recurring = false;
            dataModified = true;
            console.log(`Task "${task.name}" is_recurring field corrected`);
        }
        if (task.recurrence_pattern === undefined) {
            task.recurrence_pattern = null;
            dataModified = true;
            console.log(`Task "${task.name}" recurrence_pattern field corrected`);
        }
        if (task.recurrence_end_date === undefined) {
            task.recurrence_end_date = null;
            dataModified = true;
            console.log(`Task "${task.name}" recurrence_end_date field corrected`);
        }
    });
    
    // タスクデータの時間バリデーション
    const timeValidationResult = validateAllTasksTimeData(tasks);
    if (!timeValidationResult.isValid) {
        console.warn(`Time data validation found ${timeValidationResult.totalErrors} errors`);
        const repairResult = repairTasksTimeData(tasks);
        if (repairResult.repairedCount > 0) {
            dataModified = true;
            console.log(`Repaired ${repairResult.repairedCount} tasks with invalid time data`);
        }
    }
    
    // アーカイブデータのactual_timeフィールド検証
    const archivedTasks = loadArchivedTasks();
    let archiveModified = false;
    archivedTasks.forEach(task => {
        if (task.actual_time === undefined || typeof task.actual_time !== 'number') {
            task.actual_time = 0;
            archiveModified = true;
            console.log(`Archived task "${task.name}" actual_time field corrected`);
        }
    });
    
    // アーカイブデータの繰り返しフィールド検証
    archivedTasks.forEach(task => {
        if (task.is_recurring === undefined || typeof task.is_recurring !== 'boolean') {
            task.is_recurring = false;
            archiveModified = true;
            console.log(`Archived task "${task.name}" is_recurring field corrected`);
        }
        if (task.recurrence_pattern === undefined) {
            task.recurrence_pattern = null;
            archiveModified = true;
            console.log(`Archived task "${task.name}" recurrence_pattern field corrected`);
        }
        if (task.recurrence_end_date === undefined) {
            task.recurrence_end_date = null;
            archiveModified = true;
            console.log(`Archived task "${task.name}" recurrence_end_date field corrected`);
        }
    });
    
    // アーカイブデータの時間バリデーション
    const archivedTimeValidationResult = validateAllTasksTimeData(archivedTasks);
    if (!archivedTimeValidationResult.isValid) {
        console.warn(`Archived time data validation found ${archivedTimeValidationResult.totalErrors} errors`);
        const repairResult = repairTasksTimeData(archivedTasks);
        if (repairResult.repairedCount > 0) {
            archiveModified = true;
            console.log(`Repaired ${repairResult.repairedCount} archived tasks with invalid time data`);
        }
    }
    
    if (dataModified) {
        console.log("Migration data verification completed - tasks updated.");
        saveTasks();
    }
    
    if (archiveModified) {
        console.log("Migration data verification completed - archive updated.");
        saveArchivedTasks(archivedTasks);
    }
    
    return dataModified || archiveModified;
}

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
 * Template Management Functions
 * テンプレート機能の実装 (10.1, 10.2, 10.3, 10.4)
 */

/**
 * Load templates from localStorage
 * @returns {object[]}
 */
function loadTemplates() {
    const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!templatesJson) {
        return [];
    }
    try {
        return JSON.parse(templatesJson);
    } catch (error) {
        console.warn('テンプレートの読み込みに失敗:', error);
        return [];
    }
}

/**
 * Save templates to localStorage
 * @param {object[]} templates
 */
function saveTemplates(templates) {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Save current task as a template (10.1)
 * @param {object} task - Task to save as template
 * @param {string} templateName - Name for the template
 * @returns {object} Created template
 */
function saveTaskAsTemplate(task, templateName) {
    const templates = loadTemplates();
    
    const template = {
        id: `template-${Date.now()}`,
        name: templateName,
        description: task.details || '',
        base_task: {
            name: task.name,
            estimated_time: task.estimated_time,
            priority: task.priority,
            category: task.category,
            details: task.details,
            is_recurring: task.is_recurring,
            recurrence_pattern: task.recurrence_pattern,
            recurrence_end_date: task.recurrence_end_date
        },
        created_date: formatDate(new Date()),
        usage_count: 0
    };
    
    templates.push(template);
    saveTemplates(templates);
    
    return template;
}

/**
 * Get all templates (10.2)
 * @returns {object[]}
 */
function getTemplates() {
    return loadTemplates();
}

/**
 * Create new task from template (10.3)
 * @param {object} template - Template to use
 * @param {string} assignedDate - Date to assign the task (optional)
 * @returns {object} Created task
 */
function createTaskFromTemplate(template, assignedDate = null) {
    const newTask = {
        id: `task-${Date.now()}`,
        name: template.base_task.name,
        estimated_time: template.base_task.estimated_time,
        actual_time: 0,
        priority: template.base_task.priority,
        category: template.base_task.category,
        assigned_date: assignedDate || null,
        due_date: null,
        details: template.base_task.details,
        completed: false,
        is_recurring: template.base_task.is_recurring,
        recurrence_pattern: template.base_task.recurrence_pattern,
        recurrence_end_date: template.base_task.recurrence_end_date
    };
    
    // Update template usage count
    const templates = loadTemplates();
    const templateIndex = templates.findIndex(t => t.id === template.id);
    if (templateIndex > -1) {
        templates[templateIndex].usage_count++;
        saveTemplates(templates);
    }
    
    return newTask;
}

/**
 * Delete template (10.4)
 * @param {string} templateId - Template ID to delete
 * @returns {boolean} Success status
 */
function deleteTemplate(templateId) {
    const templates = loadTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    
    if (filteredTemplates.length < templates.length) {
        saveTemplates(filteredTemplates);
        return true;
    }
    
    return false;
}

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

/**
 * RecurrenceEngine - 繰り返しタスク生成エンジン
 * 毎日、毎週、毎月のパターンで新規タスクを自動生成
 */
class RecurrenceEngine {
    constructor() {
        this.RECURRENCE_PATTERNS = {
            'daily': { name: '毎日', interval: 1 },
            'weekly': { name: '毎週', interval: 7 },
            'monthly': { name: '毎月', interval: 30 }
        };
    }
    
    /**
     * 繰り返しタスクから新規タスクを生成
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} targetDate - 生成対象の日付
     * @returns {object|null} 生成されたタスク、または生成不可の場合はnull
     */
    generateTaskFromRecurrence(recurringTask, targetDate) {
        // 繰り返しタスクの有効性チェック
        if (!recurringTask.is_recurring || !recurringTask.recurrence_pattern) {
            return null;
        }
        
        // targetDate のバリデーション
        if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
            console.error('Invalid targetDate:', targetDate);
            return null;
        }
        
        // 終了日チェック
        if (recurringTask.recurrence_end_date) {
            const endDate = new Date(recurringTask.recurrence_end_date);
            endDate.setHours(0, 0, 0, 0);
            targetDate.setHours(0, 0, 0, 0);
            
            if (targetDate > endDate) {
                return null;
            }
        }
        
        // 新規タスクを生成
        const newTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: recurringTask.name,
            estimated_time: recurringTask.estimated_time,
            actual_time: 0,
            priority: recurringTask.priority,
            category: recurringTask.category,
            assigned_date: formatDate(targetDate),
            due_date: null,
            details: recurringTask.details,
            completed: false,
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null
        };
        
        return newTask;
    }
    
    /**
     * 毎日パターンの生成 (8.1)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateDailyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        while (currentDate <= end) {
            const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
            if (newTask) {
                generatedTasks.push(newTask);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return generatedTasks;
    }
    
    /**
     * 毎週パターンの生成 (8.2)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateWeeklyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];
        
        // 元のタスクの日付を取得
        if (!recurringTask.assigned_date) {
            return generatedTasks;
        }
        
        const originalDate = new Date(recurringTask.assigned_date);
        originalDate.setHours(0, 0, 0, 0);
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        // 元のタスクの曜日を取得
        const originalDayOfWeek = originalDate.getDay();
        
        // startDateから最初の該当曜日を見つける
        let currentDate = new Date(start);
        const currentDayOfWeek = currentDate.getDay();
        const daysUntilTarget = (originalDayOfWeek - currentDayOfWeek + 7) % 7;
        currentDate.setDate(currentDate.getDate() + daysUntilTarget);
        
        // 該当曜日のタスクを生成（元のタスクの日付以降のみ）
        while (currentDate <= end) {
            // 元のタスクの日付よりも前の日付には生成しない
            if (currentDate >= originalDate) {
                const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
                if (newTask) {
                    generatedTasks.push(newTask);
                }
            }
            currentDate.setDate(currentDate.getDate() + 7);
        }
        
        return generatedTasks;
    }
    
    /**
     * 毎月パターンの生成 (8.3)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateMonthlyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        const startDay = currentDate.getDate();
        
        while (currentDate <= end) {
            const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
            if (newTask) {
                generatedTasks.push(newTask);
            }
            
            // 月を進める（日付をリセットしてから月を進める）
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            // 月末の日付調整（例：1月31日 -> 2月28日）
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            if (startDay > lastDayOfMonth) {
                currentDate.setDate(lastDayOfMonth);
            } else {
                currentDate.setDate(startDay);
            }
        }
        
        return generatedTasks;
    }
    
    /**
     * 終了日の処理 (8.4)
     * 繰り返しタスクの終了日を検証・更新
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {string} newEndDate - 新しい終了日 (YYYY-MM-DD形式)
     * @returns {boolean} 更新成功の可否
     */
    updateRecurrenceEndDate(recurringTask, newEndDate) {
        if (!recurringTask.is_recurring) {
            console.warn('This task is not a recurring task');
            return false;
        }
        
        // 終了日の妥当性チェック
        if (newEndDate) {
            const endDate = new Date(newEndDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (endDate < today) {
                console.warn('End date cannot be in the past');
                return false;
            }
        }
        
        recurringTask.recurrence_end_date = newEndDate || null;
        return true;
    }
    
    /**
     * 繰り返しタスクの有効期限をチェック
     * @param {object} recurringTask - 繰り返しタスク設定
     * @returns {boolean} 有効期限内かどうか
     */
    isRecurrenceActive(recurringTask) {
        if (!recurringTask.is_recurring) {
            return false;
        }
        
        if (recurringTask.recurrence_end_date) {
            const endDate = new Date(recurringTask.recurrence_end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return today <= endDate;
        }
        
        return true;
    }
    
    /**
     * 指定期間内の繰り返しタスクをすべて生成
     * @param {object[]} recurringTasks - 繰り返しタスク配列
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたすべてのタスク
     */
    generateAllRecurringTasks(recurringTasks, startDate, endDate) {
        const allGeneratedTasks = [];
        
        recurringTasks.forEach(recurringTask => {
            if (!this.isRecurrenceActive(recurringTask)) {
                return;
            }
            
            let generatedTasks = [];
            
            switch (recurringTask.recurrence_pattern) {
                case 'daily':
                    generatedTasks = this.generateDailyTasks(recurringTask, startDate, endDate);
                    break;
                case 'weekly':
                    generatedTasks = this.generateWeeklyTasks(recurringTask, startDate, endDate);
                    break;
                case 'monthly':
                    generatedTasks = this.generateMonthlyTasks(recurringTask, startDate, endDate);
                    break;
                default:
                    console.warn(`Unknown recurrence pattern: ${recurringTask.recurrence_pattern}`);
            }
            
            allGeneratedTasks.push(...generatedTasks);
        });
        
        return allGeneratedTasks;
    }
}

// グローバルインスタンス
let recurrenceEngine;

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

// アプリケーションバージョン（キャッシュ対策）
const APP_VERSION = '1.2.0';
const BUILD_DATE = '2025-03-10';

// バージョン情報をログ出力（キャッシュ確認用）
console.log(`%c🚀 アプリケーション読み込み (v${APP_VERSION}, ${BUILD_DATE})`, 'font-size: 12px; color: #666;');

// --- Initial Load ---
carryOverOldTasks();

// カテゴリデータの検証と修復
verifyCategoryData();

// マイグレーションデータの検証と修復
verifyMigrationData();

// 設定値をUIに反映
idealDailyMinutesInput.value = settings.ideal_daily_minutes;

// ダークモードの初期化
initializeTheme();

// カテゴリフィルターの初期化
initializeCategoryFilter();

// 曜日設定UIの初期化
initializeWeekdaySettings();

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
initializeContextMenu();

// 初期グリッド列数を設定
updateGridColumns();

// 初期ロード時にタスクボードを描画する
renderWeek();

// ダッシュボード初期化
initializeDashboardToggle();
updateDashboard();

// テンプレート機能の初期化
initializeTemplatePanel();

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
        taskNameDiv.textContent = task.name;
        
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
            task.completed = e.target.checked;
            
            if (task.completed) {
                // 派手な完了アニメーションを実行
                playTaskCompletionAnimation(taskElement, checkbox);
                
                // アニメーション完了後にアーカイブ
                setTimeout(() => {
                    archiveCompletedTasks();
                    renderWeek();
                    updateDashboard();
                }, 1800);
            } else {
                // チェック解除時は即座に更新
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
        
        isRendering = false;
    }
    document.body.renderWeek = renderWeek;


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
    
    /**
     * Initialize weekday settings UI.
     */
    function initializeWeekdaySettings() {
        const weekdayCheckboxes = document.querySelectorAll('#weekday-checkboxes input[type="checkbox"]');
        
        // チェックボックスの初期状態を設定
        weekdayCheckboxes.forEach((checkbox, index) => {
            const dayName = weekdayManager.dayNames[index];
            checkbox.checked = weekdayManager.isWeekdayVisible(dayName);
            
            // イベントリスナーを追加
            checkbox.addEventListener('change', (e) => {
                handleWeekdayChange(dayName, e.target.checked);
            });
        });
    }
    
    /**
     * Handle weekday visibility change with optimized performance.
     * @param {string} dayName - 曜日名
     * @param {boolean} visible - 表示するかどうか
     */
    function handleWeekdayChange(dayName, visible) {
        weekdayManager.toggleWeekday(dayName, visible);
        
        updateWeekdayVisibility();
        
        // アニメーション完了後にrenderWeekを実行
        setTimeout(() => {
            renderWeek();
        }, 450);
        
        // 移動したタスク数を通知
        if (!visible) {
            const movedCount = weekdayManager.moveTasksToUnassigned(dayName);
            if (movedCount > 0) {
                showWeekdayNotification(`${weekdayManager.dayLabels[weekdayManager.dayNames.indexOf(dayName)]}曜日の${movedCount}個のタスクを未割り当てに移動しました`);
            }
        }
    }
    
    /**
     * Update weekday column visibility with smooth animations.
     */
    function updateWeekdayVisibility() {
        const dayColumns = document.querySelectorAll('.day-column');
        const taskBoard = document.getElementById('task-board');
        
        dayColumns.forEach((column, index) => {
            if (index >= weekdayManager.dayNames.length) return; // 未割り当て列をスキップ
            
            const dayName = weekdayManager.dayNames[index];
            const isVisible = weekdayManager.isWeekdayVisible(dayName);
            
            if (isVisible) {
                // 表示する場合
                if (column.classList.contains('hidden')) {
                    column.classList.remove('hidden');
                    column.classList.add('showing');
                    
                    // アニメーション完了後にshowingクラスを削除
                    setTimeout(() => {
                        column.classList.remove('showing');
                    }, 400);
                }
            } else {
                // 非表示にする場合
                if (!column.classList.contains('hidden')) {
                    column.classList.add('hiding');
                    
                    // アニメーション完了後にhiddenクラスを追加
                    setTimeout(() => {
                        column.classList.add('hidden');
                        column.classList.remove('hiding');
                    }, 400);
                }
            }
        });
        
        // グリッド列数を動的に調整（アニメーション完了後）
        setTimeout(() => {
            updateGridColumns();
        }, 400);
    }
    
    /**
     * Update grid columns based on visible weekdays count.
     */
    function updateGridColumns() {
        const taskBoard = document.getElementById('task-board');
        const visibleCount = weekdayManager.getVisibleWeekdays().length;
        
        // 既存のweekdaysクラスを削除
        taskBoard.classList.remove('weekdays-1', 'weekdays-2', 'weekdays-3', 'weekdays-4', 'weekdays-5', 'weekdays-6');
        
        // 表示曜日数に応じてクラスを追加
        if (visibleCount < 7) {
            taskBoard.classList.add(`weekdays-${visibleCount}`);
        }
    }
    
    /**
     * Show weekday notification.
     * @param {string} message - 通知メッセージ
     */
    function showWeekdayNotification(message) {
        showBulkMoveNotification(message, 'info');
    }
    
    /**
     * Show bulk move notification.
     * @param {string} message - 通知メッセージ
     * @param {string} type - 通知タイプ ('success', 'info', 'warning', 'error')
     */
    function showBulkMoveNotification(message, type = 'info') {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.bulk-move-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `bulk-move-notification ${type}`;
        
        // アイコンを追加
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // アニメーション表示
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 4秒後に非表示
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    /**
     * Initialize context menu functionality.
     */
    function initializeContextMenu() {
        const contextMenu = document.getElementById('day-context-menu');
        let currentTargetDate = null;
        let currentTargetColumn = null;
        
        // 日付列の右クリックイベント
        dayColumns.forEach(column => {
            column.addEventListener('contextmenu', (e) => {
                // タスク要素上での右クリックは無視
                if (e.target.closest('.task')) {
                    return;
                }
                
                e.preventDefault();
                
                const dateStr = column.dataset.date;
                if (!dateStr || dateStr === 'null') return;
                
                currentTargetDate = dateStr;
                currentTargetColumn = column;
                
                showContextMenu(e.pageX, e.pageY, dateStr);
            });
        });
        
        // コンテキストメニューのクリックイベント
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action || !currentTargetDate) return;
            
            handleContextMenuAction(action, currentTargetDate, currentTargetColumn);
            hideContextMenu();
        });
        
        // 外部クリックでメニューを閉じる
        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                hideContextMenu();
            }
        });
        
        // Escキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideContextMenu();
            }
        });
        
        /**
         * Show context menu at specified position.
         * @param {number} x - X座標
         * @param {number} y - Y座標
         * @param {string} dateStr - 対象日付
         */
        function showContextMenu(x, y, dateStr) {
            const tasksCount = taskBulkMover.getTasksForDate(dateStr).length;
            
            // タスク数に応じてメニュー項目を更新
            const moveItem = contextMenu.querySelector('[data-action="move-all-tasks"]');
            if (tasksCount === 0) {
                moveItem.innerHTML = '📤 移動するタスクがありません';
                moveItem.style.opacity = '0.5';
                moveItem.style.cursor = 'not-allowed';
            } else {
                moveItem.innerHTML = `📤 ${tasksCount}個のタスクを未割り当てに移動`;
                moveItem.style.opacity = '1';
                moveItem.style.cursor = 'pointer';
            }
            
            // 曜日非表示項目の更新
            const date = new Date(dateStr);
            const dayName = taskBulkMover.getDayNameFromDate(dateStr);
            const dayLabel = taskBulkMover.dayLabels[taskBulkMover.dayNames.indexOf(dayName)];
            
            const hideItem = contextMenu.querySelector('[data-action="hide-day"]');
            hideItem.innerHTML = `👁️ ${dayLabel}曜日を非表示`;
            
            // メニューを表示
            contextMenu.style.display = 'block';
            
            // 画面外に出ないように位置調整
            const menuRect = contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let adjustedX = x;
            let adjustedY = y;
            
            if (x + menuRect.width > viewportWidth) {
                adjustedX = viewportWidth - menuRect.width - 10;
            }
            
            if (y + menuRect.height > viewportHeight) {
                adjustedY = viewportHeight - menuRect.height - 10;
            }
            
            contextMenu.style.left = `${adjustedX}px`;
            contextMenu.style.top = `${adjustedY}px`;
        }
        
        /**
         * Hide context menu.
         */
        function hideContextMenu() {
            contextMenu.style.display = 'none';
            currentTargetDate = null;
            currentTargetColumn = null;
        }
        
        /**
         * Handle context menu action.
         * @param {string} action - アクション名
         * @param {string} dateStr - 対象日付
         * @param {HTMLElement} column - 対象列要素
         */
        function handleContextMenuAction(action, dateStr, column) {
            switch (action) {
                case 'move-all-tasks':
                    handleBulkMoveAction(dateStr);
                    break;
                    
                case 'hide-day':
                    handleHideDayAction(dateStr);
                    break;
                    
                case 'cancel':
                    // 何もしない（メニューが閉じるだけ）
                    break;
            }
        }
        
        /**
         * Handle bulk move action.
         * @param {string} dateStr - 対象日付
         */
        function handleBulkMoveAction(dateStr) {
            const tasksToMove = taskBulkMover.getTasksForDate(dateStr);
            
            if (tasksToMove.length === 0) {
                showBulkMoveNotification('移動するタスクがありません', 'info');
                return;
            }
            
            // 確認ダイアログ
            const date = new Date(dateStr);
            const dayLabel = taskBulkMover.dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
            const dateLabel = `${date.getMonth() + 1}/${date.getDate()}(${dayLabel})`;
            
            if (confirm(`${dateLabel}の${tasksToMove.length}個のタスクを未割り当てに移動しますか？`)) {
                const movedCount = taskBulkMover.moveTasksToUnassigned(dateStr);
                taskBulkMover.notifyMoveResult(movedCount, dateStr);
                renderWeek();
            }
        }
        
        /**
         * Handle hide day action.
         * @param {string} dateStr - 対象日付
         */
        function handleHideDayAction(dateStr) {
            const dayName = taskBulkMover.getDayNameFromDate(dateStr);
            const dayLabel = taskBulkMover.dayLabels[taskBulkMover.dayNames.indexOf(dayName)];
            
            if (confirm(`${dayLabel}曜日を非表示にしますか？\nその曜日のタスクは未割り当てに移動されます。`)) {
                // 曜日設定のチェックボックスを更新
                const checkbox = document.getElementById(`show-${dayName}`);
                if (checkbox) {
                    checkbox.checked = false;
                    handleWeekdayChange(dayName, false);
                }
            }
        }
    }

    // --- データのエクスポート/インポートロジック ---

    function exportData() {
        const archivedTasks = loadArchivedTasks();
        
        // カテゴリ情報と繰り返しタスク情報を含むデータの準備
        const data = { 
            tasks: tasks, 
            settings: settings,
            archive: archivedTasks,
            exportInfo: {
                exportDate: new Date().toISOString(),
                version: "1.1",
                categoriesIncluded: true,
                recurringTasksIncluded: true
            }
        };
        
        // エクスポート前にカテゴリ情報と繰り返しタスク情報の存在を確認
        const tasksWithCategories = tasks.filter(task => task.category).length;
        const archivedWithCategories = archivedTasks.filter(task => task.category).length;
        const tasksWithRecurrence = tasks.filter(task => task.is_recurring).length;
        const archivedWithRecurrence = archivedTasks.filter(task => task.is_recurring).length;
        
        console.log(`Exporting ${tasks.length} tasks (${tasksWithCategories} with categories, ${tasksWithRecurrence} recurring) and ${archivedTasks.length} archived tasks (${archivedWithCategories} with categories, ${archivedWithRecurrence} recurring)`);
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-task-board-data-${formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // エクスポート完了メッセージ
        console.log("Data export completed with category information and recurring task data included.");
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let importStats = {
                    tasksImported: 0,
                    tasksWithCategories: 0,
                    tasksWithRecurrence: 0,
                    archivedImported: 0,
                    archivedWithCategories: 0,
                    archivedWithRecurrence: 0,
                    categoriesFixed: 0,
                    recurringTasksImported: 0
                };
                
                if (importedData.tasks) {
                    // タスク配列を上書き（カテゴリ情報と繰り返しタスク情報の検証を含む）
                    tasks = importedData.tasks.map(task => {
                        const originalCategory = task.category;
                        const validatedCategory = validateCategory(task.category);
                        
                        if (originalCategory !== validatedCategory) {
                            importStats.categoriesFixed++;
                        }
                        if (validatedCategory !== 'task') {
                            importStats.tasksWithCategories++;
                        }
                        
                        // 繰り返しタスク情報の検証
                        const isRecurring = task.is_recurring === true;
                        if (isRecurring) {
                            importStats.tasksWithRecurrence++;
                            importStats.recurringTasksImported++;
                        }
                        
                        return { 
                            ...task, 
                            completed: task.completed || false,
                            category: validatedCategory,
                            is_recurring: isRecurring,
                            recurrence_pattern: isRecurring ? (task.recurrence_pattern || null) : null,
                            recurrence_end_date: isRecurring ? (task.recurrence_end_date || null) : null
                        };
                    });
                    importStats.tasksImported = tasks.length;
                    saveTasks();
                    console.log(`Imported ${importStats.tasksImported} tasks, ${importStats.tasksWithCategories} with categories, ${importStats.tasksWithRecurrence} recurring`);
                }
                
                if (importedData.settings) {
                    // 設定オブジェクトを上書き
                    settings = { ...settings, ...importedData.settings };
                    saveSettings();
                    idealDailyMinutesInput.value = settings.ideal_daily_minutes; // UIを更新
                    console.log('Settings imported successfully');
                }
                
                if (importedData.archive) {
                    // アーカイブデータを上書き（カテゴリ情報と繰り返しタスク情報の検証を含む）
                    const validatedArchive = importedData.archive.map(task => {
                        const originalCategory = task.category;
                        const validatedCategory = validateCategory(task.category);
                        
                        if (originalCategory !== validatedCategory) {
                            importStats.categoriesFixed++;
                        }
                        if (validatedCategory !== 'task') {
                            importStats.archivedWithCategories++;
                        }
                        
                        // 繰り返しタスク情報の検証
                        const isRecurring = task.is_recurring === true;
                        if (isRecurring) {
                            importStats.archivedWithRecurrence++;
                            importStats.recurringTasksImported++;
                        }
                        
                        return {
                            ...task,
                            category: validatedCategory,
                            is_recurring: isRecurring,
                            recurrence_pattern: isRecurring ? (task.recurrence_pattern || null) : null,
                            recurrence_end_date: isRecurring ? (task.recurrence_end_date || null) : null
                        };
                    });
                    importStats.archivedImported = validatedArchive.length;
                    saveArchivedTasks(validatedArchive);
                    console.log(`Imported ${importStats.archivedImported} archived tasks, ${importStats.archivedWithCategories} with categories, ${importStats.archivedWithRecurrence} recurring`);
                }
                
                renderWeek();
                
                // 詳細なインポート結果を表示
                let message = 'データのインポートが完了しました。';
                if (importStats.categoriesFixed > 0) {
                    message += `\n${importStats.categoriesFixed}個のカテゴリが修正されました。`;
                }
                if (importStats.recurringTasksImported > 0) {
                    message += `\n${importStats.recurringTasksImported}個の繰り返しタスク情報がインポートされました。`;
                }
                alert(message);
                
                console.log('Import completed:', importStats);
                
            } catch (error) {
                alert('インポート中にエラーが発生しました: ' + error.message);
                console.error('Import Error:', error);
            }
        };
        reader.readAsText(file);
    }

    // --- ダークモード機能 ---
    
    function initializeTheme() {
        // LocalStorageからテーマ設定を読み込み
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    }
    
    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '☀️ ライト';
        } else {
            themeToggleBtn.innerHTML = '🌙 ダーク';
        }
    }

    // --- タスク完了アニメーション ---
    
    function playTaskCompletionAnimation(taskElement, checkbox) {
        // チェックボックスの成功アニメーション
        checkbox.classList.add('success-animation');
        
        // 光る効果
        taskElement.classList.add('glow-effect');
        
        // 紙吹雪エフェクト
        createConfettiEffect(taskElement);
        
        // 成功メッセージ表示
        showSuccessMessage();
        
        // タスク要素の渦巻きアニメーション（少し遅延）
        setTimeout(() => {
            taskElement.classList.add('completing');
        }, 400);
        
        // データ保存
        saveTasks();
    }
    
    function createConfettiEffect(taskElement) {
        const rect = taskElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const colors = ['red', 'orange', 'green', 'blue', 'purple'];
        const confettiCount = 20; // 紙吹雪の数を増加
        
        // 爆発する紙吹雪
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            // ランダムな位置に配置（より広範囲に）
            const angle = (360 / confettiCount) * i + Math.random() * 30;
            const distance = 40 + Math.random() * 80;
            const x = centerX + Math.cos(angle * Math.PI / 180) * distance;
            const y = centerY + Math.sin(angle * Math.PI / 180) * distance;
            
            confetti.style.left = x + 'px';
            confetti.style.top = y + 'px';
            
            // ランダムなサイズ
            const size = 6 + Math.random() * 8;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            document.body.appendChild(confetti);
            
            // アニメーション開始（ランダムな遅延）
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    confetti.classList.add('explode');
                } else {
                    confetti.classList.add('fall');
                }
            }, Math.random() * 200);
            
            // 要素を削除
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 2200);
        }
        
        // 追加の中央爆発エフェクト
        createCenterBurst(centerX, centerY);
    }
    
    function createCenterBurst(centerX, centerY) {
        const burstCount = 8;
        const colors = ['red', 'orange', 'green', 'blue', 'purple'];
        
        for (let i = 0; i < burstCount; i++) {
            const burst = document.createElement('div');
            burst.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            // 中央から放射状に配置
            const angle = (360 / burstCount) * i;
            const x = centerX;
            const y = centerY;
            
            burst.style.left = x + 'px';
            burst.style.top = y + 'px';
            burst.style.width = '12px';
            burst.style.height = '12px';
            
            // 放射状に移動するアニメーション
            const distance = 100 + Math.random() * 50;
            const endX = centerX + Math.cos(angle * Math.PI / 180) * distance;
            const endY = centerY + Math.sin(angle * Math.PI / 180) * distance;
            
            document.body.appendChild(burst);
            
            // カスタムアニメーション
            setTimeout(() => {
                burst.style.transition = 'all 1s ease-out';
                burst.style.transform = `translate(${endX - centerX}px, ${endY - centerY}px) rotate(720deg) scale(0)`;
                burst.style.opacity = '0';
            }, 100);
            
            // 要素を削除
            setTimeout(() => {
                if (burst.parentNode) {
                    burst.parentNode.removeChild(burst);
                }
            }, 1200);
        }
    }
    
    function showSuccessMessage() {
        const messages = [
            'タスク完了！お疲れさまでした！',
            '素晴らしい！また一つ達成しました！',
            'やったね！タスククリア！',
            '完了！次のタスクも頑張りましょう！',
            'ナイス！効率的ですね！'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // メッセージ表示
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // メッセージ非表示・削除
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }

    // --- アーカイブ機能 ---
    
    function showArchiveView() {
        renderArchive();
        archiveView.style.display = 'block';
        document.body.style.overflow = 'hidden'; // スクロールを無効化
    }
    
    function hideArchiveView() {
        archiveView.style.display = 'none';
        document.body.style.overflow = 'auto'; // スクロールを有効化
    }
    
    function renderArchive() {
        const archivedTasks = loadArchivedTasks();
        archiveList.innerHTML = '';
        
        if (archivedTasks.length === 0) {
            archiveList.innerHTML = '<div class="archive-empty">アーカイブされたタスクはありません</div>';
            return;
        }
        
        // 新しい順にソート
        archivedTasks.sort((a, b) => new Date(b.archived_date) - new Date(a.archived_date));
        
        archivedTasks.forEach(task => {
            const taskElement = createArchivedTaskElement(task);
            archiveList.appendChild(taskElement);
        });
    }
    
    function createArchivedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'archived-task';
        
        // カテゴリ情報を取得
        const categoryKey = validateCategory(task.category);
        const categoryInfo = getCategoryInfo(categoryKey);
        taskElement.classList.add(`category-${categoryKey}`);
        
        const archivedDate = new Date(task.archived_date);
        const formattedArchivedDate = `${archivedDate.getFullYear()}/${archivedDate.getMonth() + 1}/${archivedDate.getDate()} ${String(archivedDate.getHours()).padStart(2, '0')}:${String(archivedDate.getMinutes()).padStart(2, '0')}`;
        
        let datesHTML = '';
        if (task.assigned_date) {
            const assignedDate = new Date(task.assigned_date);
            datesHTML += `担当日: ${assignedDate.getMonth() + 1}/${assignedDate.getDate()}`;
        }
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            if (datesHTML) datesHTML += ' | ';
            datesHTML += `期限: ${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        }
        
        // Create elements safely without innerHTML to prevent XSS
        const categoryBar = document.createElement('div');
        categoryBar.className = 'category-bar';
        categoryBar.style.backgroundColor = categoryInfo.color;
        
        const archivedTaskHeader = document.createElement('div');
        archivedTaskHeader.className = 'archived-task-header';
        
        const archivedTaskName = document.createElement('div');
        archivedTaskName.className = 'archived-task-name';
        archivedTaskName.textContent = task.name;
        
        const archivedTaskTime = document.createElement('div');
        archivedTaskTime.className = 'archived-task-time';
        archivedTaskTime.textContent = `${task.estimated_time}h`;
        
        archivedTaskHeader.appendChild(archivedTaskName);
        archivedTaskHeader.appendChild(archivedTaskTime);
        
        taskElement.appendChild(categoryBar);
        taskElement.appendChild(archivedTaskHeader);
        
        if (datesHTML) {
            const archivedTaskDates = document.createElement('div');
            archivedTaskDates.className = 'archived-task-dates';
            archivedTaskDates.textContent = datesHTML;
            taskElement.appendChild(archivedTaskDates);
        }
        
        if (task.details) {
            const archivedTaskDetails = document.createElement('div');
            archivedTaskDetails.className = 'archived-task-details';
            archivedTaskDetails.textContent = task.details;
            taskElement.appendChild(archivedTaskDetails);
        }
        
        const archivedTaskCompletedDate = document.createElement('div');
        archivedTaskCompletedDate.className = 'archived-task-completed-date';
        archivedTaskCompletedDate.textContent = `完了: ${formattedArchivedDate}`;
        taskElement.appendChild(archivedTaskCompletedDate);
        
        const archivedTaskActions = document.createElement('div');
        archivedTaskActions.className = 'archived-task-actions';
        
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'restore-task-btn';
        restoreBtn.dataset.taskId = task.id;
        restoreBtn.textContent = '↩️ 復元';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task-btn';
        deleteBtn.dataset.taskId = task.id;
        deleteBtn.textContent = '🗑️ 削除';
        
        archivedTaskActions.appendChild(restoreBtn);
        archivedTaskActions.appendChild(deleteBtn);
        taskElement.appendChild(archivedTaskActions);
        
        // 復元ボタンのイベントリスナー
        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            restoreTaskFromArchive(task.id, taskElement);
        });
        
        // 削除ボタンのイベントリスナー
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTaskFromArchive(task.id, taskElement);
        });
        
        return taskElement;
    }
    
    function clearAllArchive() {
        if (confirm('アーカイブされた全てのタスクを削除しますか？この操作は取り消せません。')) {
            saveArchivedTasks([]);
            renderArchive();
        }
    }
    
    function restoreTaskFromArchive(taskId, taskElement) {
        const archivedTasks = loadArchivedTasks();
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return;
        
        const taskToRestore = archivedTasks[taskIndex];
        
        // 復元アニメーション
        taskElement.classList.add('restoring');
        
        setTimeout(() => {
            // アーカイブから削除
            archivedTasks.splice(taskIndex, 1);
            saveArchivedTasks(archivedTasks);
            
            // タスクを未完了状態で復元
            const restoredTask = {
                ...taskToRestore,
                completed: false
            };
            delete restoredTask.archived_date;
            
            // 通常のタスクリストに追加
            tasks.push(restoredTask);
            saveTasks();
            
            // アーカイブビューを更新
            renderArchive();
            
            // 成功メッセージ
            showRestoreMessage(taskToRestore.name);
            
        }, 800);
    }
    
    function deleteTaskFromArchive(taskId, taskElement) {
        const archivedTasks = loadArchivedTasks();
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return;
        
        const taskToDelete = archivedTasks[taskIndex];
        
        if (confirm(`「${taskToDelete.name}」を完全に削除しますか？この操作は取り消せません。`)) {
            // 削除アニメーション
            taskElement.classList.add('restoring');
            
            setTimeout(() => {
                // アーカイブから削除
                archivedTasks.splice(taskIndex, 1);
                saveArchivedTasks(archivedTasks);
                
                // アーカイブビューを更新
                renderArchive();
                
            }, 800);
        }
    }
    
    function showRestoreMessage(taskName) {
        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = `「${taskName}」を復元しました！`;
        messageElement.style.background = 'linear-gradient(135deg, #4a90e2, #5aa3f0)';
        
        document.body.appendChild(messageElement);
        
        // メッセージ表示
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // メッセージ非表示・削除
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }
    
    function duplicateTask(taskId) {
        const originalTask = tasks.find(task => task.id === taskId);
        if (!originalTask) return;
        
        // フォームから現在の値を取得
        const currentTaskData = {
            name: taskNameInput.value,
            estimated_time: parseFloat(estimatedTimeInput.value),
            priority: taskPriorityInput.value,
            category: validateCategory(taskCategoryInput.value),
            assigned_date: taskDateInput.value || null,
            due_date: buildDueDateString(),
            details: taskDetailsInput.value,
        };
        
        // 新しいタスクを作成（フォームの値を使用）
        const duplicatedTask = {
            ...currentTaskData,
            id: `task-${Date.now()}`,
            completed: false,
            name: currentTaskData.name
        };
        
        // タスクリストに追加
        tasks.push(duplicatedTask);
        saveTasks();
        
        // 画面を更新
        renderWeek();
        
        // モーダルを閉じる
        closeTaskModal();
        
        // 成功メッセージを表示
        showDuplicateMessage(currentTaskData.name);
    }
    
    function showDuplicateMessage(taskName) {
        const messageElement = document.createElement('div');
        messageElement.className = 'duplicate-message';
        messageElement.textContent = `「${taskName}」を複製しました！`;
        
        document.body.appendChild(messageElement);
        
        // メッセージ表示
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // メッセージ非表示・削除
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }

    // イベントリスナー
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
        }
    });
    themeToggleBtn.addEventListener('click', toggleTheme);
    archiveToggleBtn.addEventListener('click', showArchiveView);
    closeArchiveBtn.addEventListener('click', hideArchiveView);
    clearArchiveBtn.addEventListener('click', clearAllArchive);


/**
 * ダッシュボード更新関数
 * 週間統計情報を計算してダッシュボードに表示
 */
function updateDashboard() {
    try {
        // 統計パネルの日付を取得
        const dashboardDatePicker = document.getElementById('dashboard-date-picker');
        let targetDate = new Date();
        
        if (dashboardDatePicker && dashboardDatePicker.value) {
            targetDate = new Date(dashboardDatePicker.value + 'T00:00:00');
        }
        
        // 統計情報を計算（指定された週のデータを使用）
        const completionRate = calculateCompletionRateForDate(targetDate);
        const categoryAnalysis = calculateCategoryTimeAnalysisForDate(targetDate);
        const dailyWorkTime = calculateDailyWorkTimeForDate(targetDate);
        
        // 完了率を更新
        const completionRateValue = document.getElementById('completion-rate-value');
        if (completionRateValue) {
            completionRateValue.textContent = `${completionRate.completion_rate}%`;
        }
        
        // 完了タスク数を更新
        const completedTasksValue = document.getElementById('completed-tasks-value');
        if (completedTasksValue) {
            completedTasksValue.textContent = `${completionRate.completed_tasks}/${completionRate.total_tasks}`;
        }
        
        // 見積時間を更新
        const estimatedTimeValue = document.getElementById('estimated-time-value');
        if (estimatedTimeValue) {
            const estimatedHours = Math.floor(categoryAnalysis.total_estimated_time);
            const estimatedMinutes = Math.round((categoryAnalysis.total_estimated_time % 1) * 60);
            estimatedTimeValue.textContent = `${estimatedHours}h ${estimatedMinutes}m`;
        }
        
        // 実績時間を更新
        const actualTimeValue = document.getElementById('actual-time-value');
        if (actualTimeValue) {
            const actualHours = Math.floor(categoryAnalysis.total_actual_time);
            const actualMinutes = Math.round((categoryAnalysis.total_actual_time % 1) * 60);
            actualTimeValue.textContent = `${actualHours}h ${actualMinutes}m`;
        }
        
        // カテゴリ別時間分析を更新
        updateCategoryBreakdown(categoryAnalysis);
        
        // 日別作業時間を更新
        updateDailyBreakdown(dailyWorkTime);
        
    } catch (error) {
        console.error('ダッシュボード更新エラー:', error);
    }
}

/**
 * カテゴリ別時間分析を表示
 * @param {object} categoryAnalysis - カテゴリ別分析データ
 */
function updateCategoryBreakdown(categoryAnalysis) {
    const categoryBreakdownEl = document.getElementById('category-breakdown');
    if (!categoryBreakdownEl) return;
    
    categoryBreakdownEl.innerHTML = '';
    
    // カテゴリ情報を取得して表示
    Object.keys(categoryAnalysis.categories).forEach(categoryKey => {
        const category = categoryAnalysis.categories[categoryKey];
        
        // タスク数が0の場合はスキップ
        if (category.task_count === 0) {
            return;
        }
        
        const categoryInfo = getCategoryInfo(categoryKey);
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.style.borderLeftColor = categoryInfo.color;
        
        const completionRate = category.task_count > 0 
            ? Math.round((category.completed_count / category.task_count) * 100) 
            : 0;
        
        categoryItem.innerHTML = `
            <div class="category-item-name" style="color: ${categoryInfo.color};">
                ${categoryInfo.name}
            </div>
            <div class="category-item-stats">
                <div class="category-item-stat">
                    <div class="category-item-stat-label">見積</div>
                    <div class="category-item-stat-value">${category.estimated_time.toFixed(1)}h</div>
                </div>
                <div class="category-item-stat">
                    <div class="category-item-stat-label">実績</div>
                    <div class="category-item-stat-value">${category.actual_time.toFixed(1)}h</div>
                </div>
                <div class="category-item-stat">
                    <div class="category-item-stat-label">完了率</div>
                    <div class="category-item-stat-value">${completionRate}%</div>
                </div>
                <div class="category-item-stat">
                    <div class="category-item-stat-label">タスク数</div>
                    <div class="category-item-stat-value">${category.completed_count}/${category.task_count}</div>
                </div>
            </div>
        `;
        
        categoryBreakdownEl.appendChild(categoryItem);
    });
}

/**
 * 日別作業時間を表示
 * @param {object} dailyWorkTime - 日別作業時間データ
 */
function updateDailyBreakdown(dailyWorkTime) {
    const dailyBreakdownEl = document.getElementById('daily-breakdown');
    if (!dailyBreakdownEl) return;
    
    dailyBreakdownEl.innerHTML = '';
    
    // dailyWorkTimeがnullまたはundefinedの場合は処理を中止
    if (!dailyWorkTime) return;
    
    // 日別データを表示
    const dailyData = dailyWorkTime.daily_breakdown || dailyWorkTime;
    
    Object.keys(dailyData).forEach(dateStr => {
        const day = dailyData[dateStr];
        
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        
        // 日付をフォーマット
        const date = new Date(dateStr);
        const dateFormatted = `${date.getMonth() + 1}/${date.getDate()}`;
        
        // 見積時間と実績時間の差分を計算
        const estimatedTime = day.estimated_time || 0;
        const actualTime = day.actual_time || 0;
        const variance = actualTime - estimatedTime;
        const varianceClass = variance > 0 ? 'overrun' : variance < 0 ? 'underrun' : 'match';
        const varianceText = variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`;
        
        dailyItem.innerHTML = `
            <div class="daily-item-day">${day.day_name || ''}曜日</div>
            <div class="daily-item-date">${dateFormatted}</div>
            <div class="daily-item-stats">
                <div class="daily-item-stat">
                    <span class="daily-item-stat-label">見積</span>
                    <span class="daily-item-stat-value">${estimatedTime.toFixed(1)}h</span>
                </div>
                <div class="daily-item-stat">
                    <span class="daily-item-stat-label">実績</span>
                    <span class="daily-item-stat-value">${actualTime.toFixed(1)}h</span>
                </div>
                <div class="daily-item-stat">
                    <span class="daily-item-stat-label">差分</span>
                    <span class="daily-item-stat-value time-${varianceClass}">${varianceText}</span>
                </div>
            </div>
            <div class="daily-item-tasks">
                完了: ${day.completed_count || 0}/${day.task_count || 0}
            </div>
        `;
        
        dailyBreakdownEl.appendChild(dailyItem);
    });
}

/**
 * ダッシュボード表示切り替え機能
 */
function initializeDashboardToggle() {
    const statisticsToggleBtn = document.getElementById('statistics-toggle');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const closeDashboardBtn = document.getElementById('close-dashboard');
    const dashboardDatePicker = document.getElementById('dashboard-date-picker');
    const dashboardPrevWeekBtn = document.getElementById('dashboard-prev-week');
    const dashboardNextWeekBtn = document.getElementById('dashboard-next-week');
    
    if (!statisticsToggleBtn || !dashboardPanel) return;
    
    let dashboardWeekOffset = 0;
    
    // 日付ピッカーの更新表示
    function updateDashboardDateDisplay() {
        if (dashboardDatePicker) {
            const monday = getMonday(new Date());
            const weekMonday = new Date(monday);
            weekMonday.setDate(monday.getDate() + (dashboardWeekOffset * 7));
            dashboardDatePicker.value = formatDate(weekMonday);
        }
    }
    
    // 統計ボタンクリックで統計パネルを表示
    statisticsToggleBtn.addEventListener('click', () => {
        dashboardPanel.style.display = 'block';
        dashboardWeekOffset = 0;
        updateDashboardDateDisplay();
        updateDashboard();
    });
    
    // 閉じるボタンで統計パネルを非表示
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', () => {
            dashboardPanel.style.display = 'none';
        });
    }
    
    // 前週ボタン
    if (dashboardPrevWeekBtn) {
        dashboardPrevWeekBtn.addEventListener('click', () => {
            dashboardWeekOffset--;
            updateDashboardDateDisplay();
            updateDashboard();
        });
    }
    
    // 次週ボタン
    if (dashboardNextWeekBtn) {
        dashboardNextWeekBtn.addEventListener('click', () => {
            dashboardWeekOffset++;
            updateDashboardDateDisplay();
            updateDashboard();
        });
    }
    
    // パネル外をクリックで閉じる
    dashboardPanel.addEventListener('click', (e) => {
        if (e.target === dashboardPanel) {
            dashboardPanel.style.display = 'none';
        }
    });
}

/**
 * Render template list in template panel
 */
function renderTemplateList() {
    filterAndRenderTemplates('', 'recent');
}

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


// ===== カレンダー同期機能（PKCE OAuth 方式）=====

/**
 * PKCE OAuth で Google Calendar に接続
 */
async function connectGoogleCalendar() {
    const clientIdInput = document.getElementById('google-client-id');
    const clientId = clientIdInput?.value?.trim();

    if (!clientId || clientId === 'your-client-id.apps.googleusercontent.com') {
        showAuthStatus('google', 'error', 'Client ID を入力してください');
        return;
    }

    // Client ID を保存
    localStorage.setItem('calendar_client_id_google', clientId);

    // PKCE のコード verifier と challenge を生成
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('google_code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // state を保存
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'google');

    // OAuth URL を生成して遷移
    const authUrl = generateGoogleOAuthUrl(
        clientId,
        'http://localhost:3000/google-callback',
        codeChallenge,
        state
    );

    window.location.href = authUrl;
}

/**
 * PKCE OAuth で Outlook Calendar に接続
 */
async function connectOutlookCalendar() {
    const clientIdInput = document.getElementById('outlook-client-id');
    const clientId = clientIdInput?.value?.trim();

    if (!clientId || clientId === 'your-client-id' || clientId === 'YOUR_CLIENT_ID') {
        showAuthStatus('outlook', 'error', 'Client ID を入力してください');
        return;
    }

    // Client ID を保存
    localStorage.setItem('calendar_client_id_outlook', clientId);

    // PKCE のコード verifier と challenge を生成
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('outlook_code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // state を保存
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'outlook');

    // OAuth URL を生成して遷移
    const authUrl = generateOutlookOAuthUrl(
        clientId,
        'http://localhost:3000/outlook-callback',
        codeChallenge,
        state
    );

    window.location.href = authUrl;
}

/**
 * OAuth コールバックを処理
 */
async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // エラーチェック
    if (error) {
        console.error('OAuth エラー:', error);
        const provider = sessionStorage.getItem('oauth_provider');
        showAuthStatus(provider, 'error', `認証エラー: ${error}`);
        clearOAuthSessionStorage();
        return;
    }

    // State 検証
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
        console.error('State 検証失敗');
        showAuthStatus('all', 'error', 'セッションが無効です。もう一度やり直してください。');
        clearOAuthSessionStorage();
        return;
    }

    const provider = sessionStorage.getItem('oauth_provider');

    try {
        if (provider === 'google') {
            await handleGoogleCallback(code);
        } else if (provider === 'outlook') {
            await handleOutlookCallback(code);
        }
    } catch (err) {
        console.error('コールバック処理エラー:', err);
        showAuthStatus(provider, 'error', `エラー: ${err.message}`);
    } finally {
        // URL パラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        clearOAuthSessionStorage();
    }
}

/**
 * Google コールバックを処理
 */
async function handleGoogleCallback(code: string) {
    const clientId = localStorage.getItem('calendar_client_id_google');
    const codeVerifier = sessionStorage.getItem('google_code_verifier');

    if (!clientId || !codeVerifier) {
        throw new Error('認証情報が見つかりません');
    }

    showAuthStatus('google', 'info', '認証中...');

    const tokenData = await exchangeCodeForTokenGoogle(
        clientId,
        'http://localhost:3000/google-callback',
        code,
        codeVerifier
    );

    // トークンを保存
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    localStorage.setItem('calendar_token_google', JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        provider: 'google'
    }));

    showAuthStatus('google', 'authenticated', '✅ Google Calendar に接続しました！');

    // Google 同期ボタンを有効化
    const googleSyncBtn = document.getElementById('google-sync-btn');
    if (googleSyncBtn) googleSyncBtn.style.display = 'inline-block';

    // モタン状態を更新
    updateCalendarAuthButtons();
}

/**
 * Outlook コールバックを処理
 */
async function handleOutlookCallback(code: string) {
    const clientId = localStorage.getItem('calendar_client_id_outlook');
    const codeVerifier = sessionStorage.getItem('outlook_code_verifier');

    if (!clientId || !codeVerifier) {
        throw new Error('認証情報が見つかりません');
    }

    showAuthStatus('outlook', 'info', '認証中...');

    const tokenData = await exchangeCodeForTokenOutlook(
        clientId,
        'http://localhost:3000/outlook-callback',
        code,
        codeVerifier
    );

    // トークンを保存
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    localStorage.setItem('calendar_token_outlook', JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        provider: 'outlook'
    }));

    showAuthStatus('outlook', 'authenticated', '✅ Outlook Calendar に接続しました！');

    // Outlook 同期ボタンを有効化
    const outlookSyncBtn = document.getElementById('outlook-sync-btn');
    if (outlookSyncBtn) outlookSyncBtn.style.display = 'inline-block';

    // ボタン状態を更新
    updateCalendarAuthButtons();
}

/**
 * Google Calendar を切断
 */
function disconnectGoogleCalendar() {
    localStorage.removeItem('calendar_token_google');
    localStorage.removeItem('calendar_client_id_google');

    showAuthStatus('google', 'not-configured', '⚪ 未設定');

    // ボタンを無効化
    updateCalendarAuthButtons();

    // 同期ボタンを非表示
    const googleSyncBtn = document.getElementById('google-sync-btn');
    if (googleSyncBtn) googleSyncBtn.style.display = 'none';
}

/**
 * Outlook Calendar を切断
 */
function disconnectOutlookCalendar() {
    localStorage.removeItem('calendar_token_outlook');
    localStorage.removeItem('calendar_client_id_outlook');

    showAuthStatus('outlook', 'not-configured', '⚪ 未設定');

    // ボタンを無効化
    updateCalendarAuthButtons();

    // 同期ボタンを非表示
    const outlookSyncBtn = document.getElementById('outlook-sync-btn');
    if (outlookSyncBtn) outlookSyncBtn.style.display = 'none';
}

/**
 * 認証状態を UI に表示
 */
function showAuthStatus(provider: 'google' | 'outlook' | 'all', type: 'not-configured' | 'configured' | 'authenticated' | 'info' | 'error', message: string) {
    if (provider === 'all') {
        // 両方のステータスを更新
        showAuthStatus('google', type, message);
        showAuthStatus('outlook', type, message);
        return;
    }

    const statusEl = document.getElementById(`${provider}-auth-status`);
    if (!statusEl) return;

    // クラスをクリア
    statusEl.className = 'auth-status';

    // ステータスに応じてメッセージを更新
    if (type === 'not-configured') {
        statusEl.classList.add('not-configured');
        statusEl.innerHTML = '⚪ 未設定';
    } else if (type === 'configured') {
        statusEl.classList.add('configured');
        statusEl.innerHTML = '✅ 設定済み';
    } else if (type === 'authenticated') {
        statusEl.classList.add('authenticated');
        statusEl.innerHTML = message;
    } else if (type === 'info') {
        statusEl.style.backgroundColor = '#d1ecf1';
        statusEl.style.color = '#0c5460';
        statusEl.textContent = message;
    } else if (type === 'error') {
        statusEl.style.backgroundColor = '#f8d7da';
        statusEl.style.color = '#721c24';
        statusEl.textContent = message;
    }
}

/**
 * カレンダー認証ボタンの状態を更新
 */
function updateCalendarAuthButtons() {
    // Google
    const googleClientId = localStorage.getItem('calendar_client_id_google');
    const googleToken = loadTokenFromLocalStorage('google');

    const connectGoogleBtn = document.querySelector('.btn-connect-google');
    const disconnectGoogleBtn = document.querySelector('#google-auth-status + ' + ' + '.btn-disconnect');

    if (connectGoogleBtn) {
        connectGoogleBtn.disabled = !googleClientId || googleToken !== null;
    }

    if (googleToken) {
        showAuthStatus('google', 'authenticated', '✅ 接続済み');
    } else if (googleClientId) {
        showAuthStatus('google', 'configured', '✅ 設定済み');
    } else {
        showAuthStatus('google', 'not-configured', '⚪ 未設定');
    }

    // Outlook
    const outlookClientId = localStorage.getItem('calendar_client_id_outlook');
    const outlookToken = loadTokenFromLocalStorage('outlook');

    const connectOutlookBtn = document.querySelector('.btn-connect-outlook');

    if (connectOutlookBtn) {
        connectOutlookBtn.disabled = !outlookClientId || outlookToken !== null;
    }

    if (outlookToken) {
        showAuthStatus('outlook', 'authenticated', '✅ 接続済み');
    } else if (outlookClientId) {
        showAuthStatus('outlook', 'configured', '✅ 設定済み');
    } else {
        showAuthStatus('outlook', 'not-configured', '⚪ 未設定');
    }
}

/**
 * LocalStorage からトークンを読み込む
 */
function loadTokenFromLocalStorage(provider: 'google' | 'outlook') {
    const key = `calendar_token_${provider}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    try {
        const tokenData = JSON.parse(data);

        // トークンの有効期限をチェック
        if (Date.now() >= tokenData.expires_at) {
            localStorage.removeItem(key);
            return null;
        }

        return tokenData;
    } catch (error) {
        console.error('トークン読み込みエラー:', error);
        localStorage.removeItem(key);
        return null;
    }
}

/**
 * OAuth セッションストレージをクリア
 */
function clearOAuthSessionStorage() {
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');
    sessionStorage.removeItem('google_code_verifier');
    sessionStorage.removeItem('outlook_code_verifier');
}

/**
 * カレンダー設定パネルを開く
 */
function openCalendarSettings() {
    document.getElementById('calendar-settings-panel').style.display = 'flex';
    updateCalendarAuthButtons();
}

/**
 * カレンダー設定パネルを閉じる
 */
function closeCalendarSettings() {
    document.getElementById('calendar-settings-panel').style.display = 'none';
}

// ===== PKCE ユーティリティ関数 =====

/**
 * SHA-256 ハッシュを生成
 */
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64 URL エンコード
 */
function base64UrlEncode(str) {
    return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * PKCE 用の code verifier を生成
 */
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(
        Array.from(array, byte => String.fromCharCode(byte)).join('')
    );
}

/**
 * code verifier から code challenge を生成
 */
async function generateCodeChallenge(verifier) {
    const hash = await sha256(verifier);
    return base64UrlEncode(hash);
}

/**
 * PKCE 認証 URL を生成（Google Calendar 用）
 */
function generateGoogleOAuthUrl(clientId, redirectUri, codeChallenge, state) {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  return authUrl.toString();
}

/**
 * PKCE 認証 URL を生成（Outlook Calendar 用）
 */
function generateOutlookOAuthUrl(clientId, redirectUri, codeChallenge, state) {
  const scopes = [
    'Calendars.Read',
    'offline_access'
  ];

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('response_mode', 'query');

  return authUrl.toString();
}

/**
 * ランダムな state パラメータを生成
 */
function generateState() {
    return base64UrlEncode(
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

/**
 * PKCE でトークンを取得（Google Calendar 用）
 */
async function exchangeCodeForTokenGoogle(clientId, redirectUri, code, codeVerifier) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            code: code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`トークン取得失敗: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
}

/**
 * PKCE でトークンを取得（Outlook Calendar 用）
 */
async function exchangeCodeForTokenOutlook(clientId, redirectUri, code, codeVerifier) {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            code: code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`トークン取得失敗: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
}


// ===== カレンダー設定パネル初期化 =====

document.addEventListener('DOMContentLoaded', () => {
    console.log(`%c✅ DOM準備完了 (v${APP_VERSION}, ${BUILD_DATE})`, 'font-size: 12px; color: #28a745;');
    // カレンダー設定ボタン
    const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
    if (calendarSettingsBtn) {
        calendarSettingsBtn.addEventListener('click', openCalendarSettings);
    }

    // Client ID 入力フィールド
    const googleClientIdInput = document.getElementById('google-client-id');
    const outlookClientIdInput = document.getElementById('outlook-client-id');

    // 保存された Client ID を読み込んで表示
    const savedGoogleClientId = localStorage.getItem('calendar_client_id_google');
    const savedOutlookClientId = localStorage.getItem('calendar_client_id_outlook');

    if (googleClientIdInput && savedGoogleClientId) {
        googleClientIdInput.value = savedGoogleClientId;
    }

    if (outlookClientIdInput && savedOutlookClientId) {
        outlookClientIdInput.value = savedOutlookClientId;
    }

    // Google Client ID 入力イベント
    if (googleClientIdInput) {
        googleClientIdInput.addEventListener('input', () => {
            const clientId = googleClientIdInput.value.trim();
            const connectBtn = document.querySelector('.btn-connect-google');

            if (connectBtn) {
                connectBtn.disabled = !clientId || clientId === 'your-client-id.apps.googleusercontent.com';
            }
        });
    }

    // Outlook Client ID 入力イベント
    if (outlookClientIdInput) {
        outlookClientIdInput.addEventListener('input', () => {
            const clientId = outlookClientIdInput.value.trim();
            const connectBtn = document.querySelector('.btn-connect-outlook');

            if (connectBtn) {
                connectBtn.disabled = !clientId || clientId === 'YOUR_CLIENT_ID';
            }
        });
    }

    // URL パラメータをチェック（OAuth コールバック）
    checkOAuthCallback();

    // 保存された認証状態を復元
    updateCalendarAuthButtons();

    // 同期ボタンの表示状態を更新
    const googleToken = loadTokenFromLocalStorage('google');
    const outlookToken = loadTokenFromLocalStorage('outlook');

    const googleSyncBtn = document.getElementById('google-sync-btn');
    if (googleSyncBtn && googleToken) {
        googleSyncBtn.style.display = 'inline-block';
    }

    const outlookSyncBtn = document.getElementById('outlook-sync-btn');
    if (outlookSyncBtn && outlookToken) {
        outlookSyncBtn.style.display = 'inline-block';
    }

    // PWA を初期化
    initPWA();

    console.log(`%c✨ 初期化完了 (v${APP_VERSION}, ${BUILD_DATE})`, 'font-size: 12px; color: #4a90e2; font-weight: bold;');
});

/**
 * ページ読み込み時に OAuth コールバックをチェック
 */
function checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
        // OAuth コールバック処理
        handleOAuthCallback();
    }
}


// ===== カレンダー設定ヘルプ =====

/**
 * 設定方法のヘルプを表示
 */
function showSettingsHelp() {
    const helpContent = `
📋 カレンダー同期設定方法

🔵 Google Calendar の設定:
1. Google Cloud Console (https://console.cloud.google.com) にアクセス
2. 新しいプロジェクトを作成
3. 「APIとサービス」→「ライブラリ」で「Google Calendar API」を有効化
4. 「APIとサービス」→「認証情報」で「OAuth 2.0 クライアントID」を作成
   - アプリケーションの種類: Webアプリケーション
   - 承認済みのリダイレクト URI: http://localhost:3000/google-callback
5. 作成された Client ID をコピーして入力欄に貼り付け

📅 Outlook Calendar の設定:
1. Azure Portal (https://portal.azure.com) にアクセス
2.「Azure Active Directory」→「アプリの登録」で「新規登録」
3. 名前を入力し、リダイレクト URI を追加:
   - http://localhost:3000/outlook-callback
4. 作成された「アプリケーション (クライアント) ID」をコピー
5. 「認証」で「ID トークン」のチェックを外し、「アクセストークン」を使用するよう設定
6. Client ID を入力欄に貼り付け

⚠️ 注意:
- Client Secret は不要です（PKCE方式を使用）
- リダイレクト URI は正確に入力してください
    `;

    alert(helpContent);
}


// ===== PWA (Progressive Web App) 機能 =====

/**
 * Service Worker の登録
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js', {
                scope: './'
            });
            console.log('✅ Service Worker 登録成功:', registration.scope);

            // Service Worker の更新をチェック
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 新しい Service Worker が利用可能
                            showUpdateNotification();
                        }
                    });
                }
            });

        } catch (error) {
            console.error('❌ Service Worker 登録失敗:', error);
        }
    }
}

/**
 * 更新通知を表示
 */
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <span>🔄 新しいバージョンが利用可能です</span>
        <button id="update-btn">更新</button>
        <button id="dismiss-btn">後で</button>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-btn').addEventListener('click', () => {
        // Service Worker にスキップを指示
        navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            }
        });
        window.location.reload();
    });

    document.getElementById('dismiss-btn').addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * PWA インストールプロンプトを表示
 */
let deferredPrompt = null;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // デフォルトのプロンプトを防止
        e.preventDefault();
        deferredPrompt = e;

        // インストールボタンを表示
        showInstallButton();
    });

    // インストール完了を検知
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallButton();
        showNotification('🎉 アプリをインストールしました！', 'success');
    });
}

/**
 * インストールボタンを表示
 */
function showInstallButton() {
    // 既存のボタンがあれば削除
    const existingBtn = document.getElementById('install-app-btn');
    if (existingBtn) existingBtn.remove();

    const installBtn = document.createElement('button');
    installBtn.id = 'install-app-btn';
    installBtn.className = 'install-btn';
    installBtn.innerHTML = '📱 アプリをインストール';
    installBtn.title = 'ホーム画面に追加';

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // インストールプロンプトを表示
            deferredPrompt.prompt();

            // ユーザーの選択を待機
            const { outcome } = await deferredPrompt.userChoice;

            console.log(`インストール結果: ${outcome}`);
            deferredPrompt = null;

            if (outcome === 'accepted') {
                hideInstallButton();
            }
        }
    });

    // ヘッダーコントロールに追加
    const headerControls = document.getElementById('header-controls');
    if (headerControls) {
        headerControls.appendChild(installBtn);
    }
}

/**
 * インストールボタンを非表示
 */
function hideInstallButton() {
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.remove();
    }
}

/**
 * PWA 機能を初期化
 */
function initPWA() {
    // Service Worker 登録
    registerServiceWorker();

    // インストールプロンプト設定
    setupInstallPrompt();

    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
        showNotification('🌐 オンラインに接続しました', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('📡 オフラインです。キャッシュされたデータを表示します', 'warning');
    });
}

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
