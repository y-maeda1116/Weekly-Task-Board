/**
 * TaskManager - Type-safe class for task operations
 * Centralizes all task manipulation operations
 */

import type { Task, RecurrencePattern } from '../types';
import { TaskCategory, TaskPriority } from '../types';
import { formatDate, parseDate } from '../utils/date';
import { validateCategory, validateTaskTimeData } from '../utils/validation';
import { TASK_CATEGORIES } from '../constants/taskCategories';
import { logger } from '../utils/logger';

/**
 * Task creation options
 */
export interface TaskCreationOptions {
  id?: string;
  name: string;
  estimated_time: number;
  actual_time?: number;
  priority: TaskPriority;
  category: TaskCategory;
  date: string;
  due_date?: string | null;
  due_time_period?: 'morning' | 'afternoon' | null;
  due_hour?: number | null;
  details: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_end_date?: string | null;
}

/**
 * Task filter options
 */
export interface TaskFilterOptions {
  completed?: boolean;
  category?: TaskCategory | '';
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: TaskPriority;
  search?: string;
}

/**
 * TaskManager class
 * Handles all task-related operations
 */
export class TaskManager {
  /**
   * Create a new task
   * @param options - Task creation options
   * @returns Created task
   */
  createTask(options: TaskCreationOptions): Task {
    const now = Date.now();

    // Validate category
    const validatedCategory = validateCategory(options.category);

    const task: Task = {
      id: options.id || `task-${now}-${Math.random().toString(36).substring(2, 11)}`,
      name: options.name,
      estimated_time: options.estimated_time,
      actual_time: options.actual_time || 0,
      completed: false,
      priority: options.priority,
      category: validatedCategory,
      date: options.date,
      assigned_date: options.date,
      due_date: options.due_date || null,
      due_time_period: options.due_time_period || null,
      due_hour: options.due_hour || null,
      details: options.details,
      is_recurring: options.is_recurring || false,
      recurrence_pattern: options.recurrence_pattern || null,
      recurrence_end_date: options.recurrence_end_date || null
    };

    // Validate time data
    const validationResult = validateTaskTimeData(task);
    if (!validationResult.isValid) {
      logger.warn('TaskManager', 'Task validation failed', { errors: validationResult.errors });
    }

    if (validationResult.warnings.length > 0) {
      logger.info('TaskManager', 'Task validation warnings', { warnings: validationResult.warnings });
    }

    return validationResult.task;
  }

  /**
   * Create a new task from a template
   * @param template - The template task
   * @param date - The assigned date
   * @returns Created task
   */
  createTaskFromTemplate(template: Task, date: string): Task {
    return this.createTask({
      name: template.name,
      estimated_time: template.estimated_time,
      priority: template.priority,
      category: template.category,
      date,
      details: template.details
    });
  }

  /**
   * Create a new task from a TaskTemplate
   * @param template - The task template
   * @param date - The assigned date
   * @returns Created task
   */
  createTaskFromTaskTemplate(template: import('../types').TaskTemplate, date: string): Task {
    return this.createTask({
      name: template.name,
      estimated_time: template.estimated_time,
      priority: template.priority,
      category: template.category,
      date,
      details: template.details
    });
  }

  /**
   * Duplicate a task
   * @param task - The task to duplicate
   * @returns Duplicated task
   */
  duplicateTask(task: Task): Task {
    const duplicated: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: task.name,
      completed: false,
      actual_time: 0
    };

    return duplicated;
  }

  /**
   * Toggle task completion status
   * @param task - The task to toggle
   * @param completed - New completion status
   * @returns Updated task
   */
  toggleTaskCompletion(task: Task, completed?: boolean): Task {
    const newCompleted = completed !== undefined ? completed : !task.completed;
    task.completed = newCompleted;
    return task;
  }

  /**
   * Mark task as completed
   * @param task - The task to complete
   * @returns Updated task
   */
  completeTask(task: Task): Task {
    return this.toggleTaskCompletion(task, true);
  }

  /**
   * Mark task as incomplete
   * @param task - The task to uncomplete
   * @returns Updated task
   */
  incompleteTask(task: Task): Task {
    return this.toggleTaskCompletion(task, false);
  }

  /**
   * Update task time data
   * @param task - The task to update
   * @param estimatedTime - New estimated time (optional)
   * @param actualTime - New actual time (optional)
   * @returns Updated task
   */
  updateTaskTime(task: Task, estimatedTime?: number, actualTime?: number): Task {
    if (estimatedTime !== undefined) {
      task.estimated_time = estimatedTime;
    }
    if (actualTime !== undefined) {
      task.actual_time = actualTime;
    }
    return task;
  }

  /**
   * Update task priority
   * @param task - The task to update
   * @param priority - New priority
   * @returns Updated task
   */
  updateTaskPriority(task: Task, priority: TaskPriority): Task {
    task.priority = priority;
    return task;
  }

  /**
   * Update task category
   * @param task - The task to update
   * @param category - New category
   * @returns Updated task
   */
  updateTaskCategory(task: Task, category: TaskCategory): Task {
    task.category = validateCategory(category);
    return task;
  }

  /**
   * Update task details
   * @param task - The task to update
   * @param details - New details
   * @returns Updated task
   */
  updateTaskDetails(task: Task, details: string): Task {
    task.details = details;
    return task;
  }

  /**
   * Update task due date
   * @param task - The task to update
   * @param dueDate - New due date (YYYY-MM-DD)
   * @param timePeriod - Time period (morning/afternoon)
   * @param hour - Hour value (1-23)
   * @returns Updated task
   */
  updateTaskDueDate(
    task: Task,
    dueDate: string | null,
    timePeriod?: 'morning' | 'afternoon' | null,
    hour?: number | null
  ): Task {
    task.due_date = dueDate;
    task.due_time_period = timePeriod || null;
    task.due_hour = hour || null;
    return task;
  }

  /**
   * Update task assigned date
   * @param task - The task to update
   * @param date - New assigned date (YYYY-MM-DD) or null for unassigned
   * @returns Updated task
   */
  updateTaskAssignedDate(task: Task, date: string | null): Task {
    task.assigned_date = date;
    return task;
  }

  /**
   * Move task to unassigned
   * @param task - The task to move
   * @returns Updated task
   */
  moveToUnassigned(task: Task): Task {
    task.assigned_date = null;
    return task;
  }

  /**
   * Assign task to a specific date
   * @param task - The task to assign
   * @param date - The assigned date (YYYY-MM-DD)
   * @returns Updated task
   */
  assignToDate(task: Task, date: string): Task {
    task.assigned_date = date;
    task.date = date;
    return task;
  }

  /**
   * Filter tasks by criteria
   * @param tasks - Array of tasks to filter
   * @param options - Filter options
   * @returns Filtered tasks
   */
  filterTasks(tasks: Task[], options: TaskFilterOptions = {}): Task[] {
    let result = [...tasks];

    // Filter by completion status
    if (options.completed !== undefined) {
      result = result.filter(task => task.completed === options.completed);
    }

    // Filter by category
    if (options.category !== undefined && options.category !== '') {
      result = result.filter(task => task.category === options.category);
    }

    // Filter by date
    if (options.date !== undefined) {
      result = result.filter(task => task.date === options.date);
    }

    // Filter by date range
    if (options.dateFrom !== undefined) {
      const fromDate = new Date(options.dateFrom);
      result = result.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= fromDate;
      });
    }

    if (options.dateTo !== undefined) {
      const toDate = new Date(options.dateTo);
      result = result.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate <= toDate;
      });
    }

    // Filter by priority
    if (options.priority !== undefined) {
      result = result.filter(task => task.priority === options.priority);
    }

    // Filter by search term
    if (options.search !== undefined && options.search !== '') {
      const search = options.search.toLowerCase();
      result = result.filter(task =>
        task.name.toLowerCase().includes(search) ||
        task.details.toLowerCase().includes(search)
      );
    }

    return result;
  }

  /**
   * Get completed tasks
   * @param tasks - Array of tasks
   * @returns Completed tasks
   */
  getCompletedTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => task.completed);
  }

  /**
   * Get incomplete tasks
   * @param tasks - Array of tasks
   * @returns Incomplete tasks
   */
  getIncompleteTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => !task.completed);
  }

  /**
   * Get tasks by category
   * @param tasks - Array of tasks
   * @param category - The category
   * @returns Tasks in category
   */
  getTasksByCategory(tasks: Task[], category: TaskCategory): Task[] {
    return tasks.filter(task => task.category === category);
  }

  /**
   * Get tasks by date
   * @param tasks - Array of tasks
   * @param date - The date (YYYY-MM-DD)
   * @returns Tasks on that date
   */
  getTasksByDate(tasks: Task[], date: string): Task[] {
    return tasks.filter(task => task.date === date);
  }

  /**
   * Get unassigned tasks
   * @param tasks - Array of tasks
   * @returns Unassigned tasks
   */
  getUnassignedTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => !task.assigned_date || task.assigned_date === null);
  }

  /**
   * Get recurring tasks
   * @param tasks - Array of tasks
   * @returns Recurring tasks
   */
  getRecurringTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => task.is_recurring);
  }

  /**
   * Get tasks with due dates
   * @param tasks - Array of tasks
   * @returns Tasks with due dates
   */
  getTasksWithDueDate(tasks: Task[]): Task[] {
    return tasks.filter(task => task.due_date !== null);
  }

  /**
   * Get overdue tasks
   * @param tasks - Array of tasks
   * @returns Overdue tasks
   */
  getOverdueTasks(tasks: Task[]): Task[] {
    const today = formatDate(new Date());
    return tasks.filter(task =>
      task.due_date !== null &&
      task.due_date < today &&
      !task.completed
    );
  }

  /**
   * Sort tasks by due date
   * @param tasks - Array of tasks
   * @param ascending - Sort order
   * @returns Sorted tasks
   */
  sortByDueDate(tasks: Task[], ascending: boolean = true): Task[] {
    return [...tasks].sort((a, b) => {
      const aDue = a.due_date || '9999-12-31';
      const bDue = b.due_date || '9999-12-31';
      const comparison = aDue.localeCompare(bDue);
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Sort tasks by priority
   * @param tasks - Array of tasks
   * @param priorityOrder - Priority order (highest first)
   * @returns Sorted tasks
   */
  sortByPriority(
    tasks: Task[],
    priorityOrder: TaskPriority[] = [
      TaskPriority.URGENT,
      TaskPriority.HIGH,
      TaskPriority.MEDIUM,
      TaskPriority.LOW
    ]
  ): Task[] {
    const priorityMap = new Map(priorityOrder.map((p, i) => [p, i]));

    return [...tasks].sort((a, b) => {
      const aPriority = priorityMap.get(a.priority) ?? 99;
      const bPriority = priorityMap.get(b.priority) ?? 99;
      return aPriority - bPriority;
    });
  }

  /**
   * Sort tasks by date
   * @param tasks - Array of tasks
   * @param ascending - Sort order
   * @returns Sorted tasks
   */
  sortByDate(tasks: Task[], ascending: boolean = true): Task[] {
    return [...tasks].sort((a, b) => {
      const comparison = a.date.localeCompare(b.date);
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Sort tasks by name
   * @param tasks - Array of tasks
   * @param ascending - Sort order
   * @returns Sorted tasks
   */
  sortByName(tasks: Task[], ascending: boolean = true): Task[] {
    return [...tasks].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'ja');
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Calculate total estimated time
   * @param tasks - Array of tasks
   * @returns Total estimated time
   */
  getTotalEstimatedTime(tasks: Task[]): number {
    return tasks.reduce((sum, task) => sum + task.estimated_time, 0);
  }

  /**
   * Calculate total actual time
   * @param tasks - Array of tasks
   * @returns Total actual time
   */
  getTotalActualTime(tasks: Task[]): number {
    return tasks.reduce((sum, task) => sum + task.actual_time, 0);
  }

  /**
   * Calculate completion rate
   * @param tasks - Array of tasks
   * @returns Completion rate (0-100)
   */
  calculateCompletionRate(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }

  /**
   * Validate task for saving
   * @param task - The task to validate
   * @returns Validation result
   */
  validateTask(task: Partial<Task>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!task.name || task.name.trim() === '') {
      errors.push('Task name is required');
    }

    if (task.name && task.name.length > 500) {
      errors.push('Task name must be less than 500 characters');
    }

    if (task.estimated_time === undefined || task.estimated_time < 0) {
      errors.push('Estimated time must be a positive number');
    }

    if (task.actual_time !== undefined && task.actual_time < 0) {
      errors.push('Actual time cannot be negative');
    }

    if (task.estimated_time !== undefined && task.estimated_time > 168) {
      errors.push('Estimated time cannot exceed 168 hours (1 week)');
    }

    if (task.due_date && !isValidDateString(task.due_date)) {
      errors.push('Due date must be in YYYY-MM-DD format');
    }

    if (task.date && !isValidDateString(task.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if task should be displayed based on category filter
   * @param task - The task to check
   * @param filter - The category filter
   * @returns Whether task should be displayed
   */
  shouldDisplayTask(task: Task, filter: TaskCategory | ''): boolean {
    if (!filter) return true;
    return task.category === filter;
  }

  /**
   * Get task category info
   * @param task - The task
   * @returns Category information
   */
  getCategoryInfo(task: Task) {
    return TASK_CATEGORIES[task.category] || TASK_CATEGORIES.task;
  }

  /**
   * Format task for display
   * @param task - The task
   * @returns Formatted task object for rendering
   */
  formatTaskForDisplay(task: Task): {
    id: string;
    name: string;
    estimatedTime: string;
    actualTime: string;
    priority: string;
    category: string;
    categoryInfo: { name: string; color: string; bgColor: string };
    completed: boolean;
    isRecurring: boolean;
    dueDate: string | null;
    details: string;
    timeVariance: number;
    timeVariancePercentage: number;
    isOverTime: boolean;
  } {
    const variance = task.actual_time - task.estimated_time;
    const variancePercentage = task.estimated_time > 0
      ? (variance / task.estimated_time) * 100
      : 0;

    return {
      id: task.id,
      name: task.name,
      estimatedTime: task.estimated_time.toFixed(1) + 'h',
      actualTime: task.actual_time.toFixed(1) + 'h',
      priority: task.priority,
      category: task.category,
      categoryInfo: this.getCategoryInfo(task),
      completed: task.completed,
      isRecurring: task.is_recurring,
      dueDate: task.due_date,
      details: task.details,
      timeVariance: variance,
      timeVariancePercentage: variancePercentage,
      isOverTime: variance > 0
    };
  }
}

/**
 * Check if a string is a valid date in YYYY-MM-DD format
 */
function isValidDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Create a TaskManager instance
 * @returns New TaskManager instance
 */
export function createTaskManager(): TaskManager {
  return new TaskManager();
}

/**
 * Global task manager instance
 */
export const taskManager = createTaskManager();
