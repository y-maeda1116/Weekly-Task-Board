/**
 * Hybrid Integration Layer - Standalone Version
 * Allows TypeScript modules to work alongside existing script.js
 */

// Direct imports to avoid module resolution issues
import { stateManager } from '../core/StateManager';
import { taskManager } from '../core/TaskManager';
import { TaskPriority, TaskCategory } from '../types';

// Expose functions to window for use by script.js
(window as any).HybridBridge = {
  /**
   * Create a new task using TypeScript
   */
  createTask: function(options: {
    name: string;
    estimated_time: number;
    priority: string;
    category: string;
    date: string;
    details?: string;
  }) {
    const task = taskManager.createTask({
      name: options.name,
      estimated_time: options.estimated_time,
      priority: options.priority as TaskPriority,
      category: options.category as TaskCategory,
      date: options.date,
      details: options.details || ''
    });

    stateManager.addTask(task, true);

    return task;
  },

  /**
   * Update a task
   */
  updateTask: function(taskId: string, updates: any) {
    return stateManager.updateTask(taskId, updates, true);
  },

  /**
   * Delete a task
   */
  deleteTask: function(taskId: string) {
    return stateManager.deleteTask(taskId, true);
  },

  /**
   * Toggle task completion
   */
  toggleTaskCompletion: function(taskId: string) {
    const task = stateManager.getTaskById(taskId);
    if (task) {
      const updated = taskManager.toggleTaskCompletion(task, undefined);
      stateManager.updateTask(taskId, updated, true);
    }
  },

  /**
   * Get all tasks
   */
  getTasks: function() {
    return stateManager.getTasks();
  },

  /**
   * Get tasks by date
   */
  getTasksByDate: function(date: string) {
    const tasks = stateManager.getTasks();
    return tasks.filter((t: any) => t.date === date);
  },

  /**
   * Get unassigned tasks
   */
  getUnassignedTasks: function() {
    const tasks = stateManager.getTasks();
    return tasks.filter((t: any) => !t.assigned_date);
  },

  /**
   * Validate a task
   */
  validateTask: function(task: any) {
    return taskManager.validateTask(task);
  },

  /**
   * Get category info
   */
  getCategoryInfo: function(category: string) {
    const categoryMap: Record<string, any> = {
      'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
      'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
      'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
      'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
      'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
      'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
    };

    return categoryMap[category] || categoryMap['task'];
  }
};

console.log('Hybrid Bridge loaded successfully');
