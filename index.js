/**
 * Hybrid Integration Layer
 * Allows TypeScript modules to work alongside existing script.js
 * This enables gradual migration with type safety for new code
 */
import { stateManager } from './core/StateManager';
import { taskManager } from './core/TaskManager';
import { createTemplatePanel } from './components/TemplatePanel';
import { createDashboardComponent } from './components/DashboardComponent';
import { createArchiveComponent } from './components/ArchiveComponent';
import { logger } from './utils/logger';
/**
 * Initialize new TypeScript components
 * Call this after script.js has loaded its global state
 */
export function initializeTypeScriptComponents() {
    logger.info('Initializing TypeScript components...');
    // Template panel will use its own state
    const templatePanel = createTemplatePanel();
    window.templatePanel = templatePanel;
    // Dashboard component
    const dashboardComponent = createDashboardComponent();
    window.dashboardComponent = dashboardComponent;
    // Archive component
    const archiveComponent = createArchiveComponent();
    window.archiveComponent = archiveComponent;
    // Expose to window for gradual integration
    logger.info('TypeScript components initialized');
}
/**
 * Bridge function: Get current tasks from state manager
 */
export function getTasks() {
    return stateManager.getTasks();
}
/**
 * Bridge function: Create a new task using TypeScript task manager
 */
export function createTask(options) {
    const task = taskManager.createTask({
        name: options.name,
        estimated_time: options.estimated_time,
        priority: options.priority,
        category: options.category,
        date: options.date,
        details: options.details || ''
    });
    stateManager.addTask(task, true);
    return task;
}
/**
 * Bridge function: Update a task
 */
export function updateTask(taskId, updates) {
    return stateManager.updateTask(taskId, updates);
}
/**
 * Bridge function: Delete a task
 */
export function deleteTask(taskId) {
    return stateManager.deleteTask(taskId, true);
}
/**
 * Bridge function: Toggle task completion
 */
export function toggleTaskCompletion(taskId) {
    const task = stateManager.getTaskById(taskId);
    if (task) {
        const updated = taskManager.toggleTaskCompletion(task, undefined);
        stateManager.updateTask(taskId, updated, true);
    }
}
/**
 * Bridge function: Move task to unassigned
 */
export function moveToUnassigned(taskId) {
    const task = stateManager.getTaskById(taskId);
    if (task) {
        const updated = taskManager.moveToUnassigned(task);
        stateManager.updateTask(taskId, updated, true);
    }
}
/**
 * Bridge function: Get tasks by date
 */
export function getTasksByDate(date) {
    const tasks = stateManager.getTasks();
    return tasks.filter((t) => t.date === date);
}
/**
 * Bridge function: Get unassigned tasks
 */
export function getUnassignedTasks() {
    const tasks = stateManager.getTasks();
    return tasks.filter((t) => !t.assigned_date);
}
/**
 * Bridge function: Create task from template
 */
export function createTaskFromTemplate(templateId, date) {
    // This would be implemented with template storage
    logger.info(`Creating task from template ${templateId}`);
    // Placeholder for now
    return null;
}
/**
 * Bridge function: Validate task
 */
export function validateTask(task) {
    // Delegate to task manager
    return taskManager.validateTask(task);
}
/**
 * Bridge function: Get category info
 */
export function getCategoryInfo(category) {
    // Delegate to validation utility
    const categoryMap = {
        'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
        'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
        'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
        'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
        'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
        'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
    };
    return categoryMap[category] || categoryMap['task'];
}
/**
 * Export all bridge functions to window
 * This allows script.js to call TypeScript functions
 */
export function exposeBridgeFunctions() {
    window.TypeScriptBridge = {
        initialize: initializeTypeScriptComponents,
        getTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        moveToUnassigned,
        getTasksByDate,
        getUnassignedTasks,
        createTaskFromTemplate,
        validateTask,
        getCategoryInfo
    };
    logger.info('TypeScript bridge functions exposed to window');
}
// Auto-expose on load
if (typeof document !== 'undefined') {
    exposeBridgeFunctions();
}
//# sourceMappingURL=index.js.map