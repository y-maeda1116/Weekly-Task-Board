/**
 * Task Operations Module
 * Type-safe task completion, editing, and operations
 * Standalone version with no external dependencies
 */

/**
 * Task interface
 */
export interface Task {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  date: string;
  assigned_date: string | null;
  due_date: string | null;
  due_time_period: 'morning' | 'afternoon' | null;
  due_hour: number | null;
  details: string;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date: string | null;
}

/**
 * Task template interface
 */
export interface TaskTemplate {
  id: string;
  name: string;
  estimated_time: number;
  priority: string;
  category: string;
  details: string;
  created_at: string;
  usage_count: number;
  last_used: string;
}

/**
 * Logger class
 */
class HybridLogger {
  info(message: string, ...args: any[]): void {
    console.log(`[TaskOps] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[TaskOps] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[TaskOps] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  TASKS: 'weekly_tasks',
  ARCHIVED_TASKS: 'weekly_archived_tasks',
  TEMPLATES: 'weekly_task_templates',
  SETTINGS: 'weekly_settings'
};

/**
 * Get tasks from localStorage
 */
function getTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to load tasks:', error);
    return [];
  }
}

/**
 * Save tasks to localStorage
 */
function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    logger.error('Failed to save tasks:', error);
  }
}

/**
 * Get archived tasks from localStorage
 */
function getArchivedTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARCHIVED_TASKS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to load archived tasks:', error);
    return [];
  }
}

/**
 * Save archived tasks to localStorage
 */
function saveArchivedTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_TASKS, JSON.stringify(tasks));
  } catch (error) {
    logger.error('Failed to save archived tasks:', error);
  }
}

/**
 * Find task by ID
 */
function findTaskById(taskId: string): Task | undefined {
  const tasks = getTasks();
  return tasks.find(task => task.id === taskId);
}

/**
 * Create a new task
 */
function createTask(options: {
  name: string;
  estimated_time: number;
  priority: string;
  category: string;
  date: string;
  details?: string;
}): Task {
  const now = Date.now();
  return {
    id: `task-${now}-${Math.random().toString(36).substring(2, 11)}`,
    name: options.name,
    estimated_time: options.estimated_time,
    actual_time: 0,
    completed: false,
    priority: options.priority as 'low' | 'medium' | 'high',
    category: options.category,
    date: options.date,
    assigned_date: options.date,
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: options.details || '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };
}

/**
 * Add a new task
 */
function addTask(task: Task): boolean {
  try {
    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
    logger.info(`Task added: ${task.name} (${task.id})`);
    return true;
  } catch (error) {
    logger.error('Failed to add task:', error);
    return false;
  }
}

/**
 * Update an existing task
 */
function updateTask(taskId: string, updates: Partial<Task>): boolean {
  try {
    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === taskId);

    if (index === -1) {
      logger.warn(`Task not found: ${taskId}`);
      return false;
    }

    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    logger.info(`Task updated: ${taskId}`);
    return true;
  } catch (error) {
    logger.error('Failed to update task:', error);
    return false;
  }
}

/**
 * Delete a task
 */
function deleteTask(taskId: string): boolean {
  try {
    const tasks = getTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(filteredTasks);
    logger.info(`Task deleted: ${taskId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete task:', error);
    return false;
  }
}

/**
 * Toggle task completion
 */
function toggleTaskCompletion(taskId: string): boolean {
  const task = findTaskById(taskId);
  if (!task) {
    logger.warn(`Task not found: ${taskId}`);
    return false;
  }

  const newStatus = !task.completed;
  return updateTask(taskId, { completed: newStatus });
}

/**
 * Mark task as completed
 */
function markTaskCompleted(taskId: string): boolean {
  return updateTask(taskId, { completed: true });
}

/**
 * Mark task as incomplete
 */
function markTaskIncomplete(taskId: string): boolean {
  return updateTask(taskId, { completed: false });
}

/**
 * Update task actual time
 */
function updateTaskActualTime(taskId: string, actualTime: number): boolean {
  return updateTask(taskId, { actual_time: actualTime });
}

/**
 * Move task to different date
 */
function moveTask(taskId: string, newDate: string): boolean {
  return updateTask(taskId, { date: newDate, assigned_date: newDate });
}

/**
 * Move task to unassigned
 */
function moveTaskToUnassigned(taskId: string): boolean {
  return updateTask(taskId, { assigned_date: null });
}

/**
 * Bulk move tasks to unassigned for a specific date
 */
function bulkMoveToUnassigned(date: string): number {
  const tasks = getTasks();
  let movedCount = 0;

  const updatedTasks = tasks.map(task => {
    if (task.date === date && task.assigned_date === date) {
      movedCount++;
      return { ...task, assigned_date: null };
    }
    return task;
  });

  if (movedCount > 0) {
    saveTasks(updatedTasks);
    logger.info(`Moved ${movedCount} tasks to unassigned for date ${date}`);
  }

  return movedCount;
}

/**
 * Archive a completed task
 */
function archiveTask(taskId: string): boolean {
  const task = findTaskById(taskId);
  if (!task) {
    logger.warn(`Task not found: ${taskId}`);
    return false;
  }

  if (!task.completed) {
    logger.warn(`Cannot archive incomplete task: ${taskId}`);
    return false;
  }

  try {
    // Remove from active tasks
    const activeTasks = getTasks().filter(t => t.id !== taskId);
    saveTasks(activeTasks);

    // Add to archived tasks
    const archivedTasks = getArchivedTasks();
    archivedTasks.push(task);
    saveArchivedTasks(archivedTasks);

    logger.info(`Task archived: ${taskId}`);
    return true;
  } catch (error) {
    logger.error('Failed to archive task:', error);
    return false;
  }
}

/**
 * Restore an archived task
 */
function restoreTask(taskId: string): boolean {
  const archivedTasks = getArchivedTasks();
  const task = archivedTasks.find(t => t.id === taskId);

  if (!task) {
    logger.warn(`Archived task not found: ${taskId}`);
    return false;
  }

  try {
    // Remove from archived tasks
    const remainingArchived = archivedTasks.filter(t => t.id !== taskId);
    saveArchivedTasks(remainingArchived);

    // Add back to active tasks
    const activeTasks = getTasks();
    activeTasks.push(task);
    saveTasks(activeTasks);

    logger.info(`Task restored: ${taskId}`);
    return true;
  } catch (error) {
    logger.error('Failed to restore task:', error);
    return false;
  }
}

/**
 * Clear all archived tasks
 */
function clearArchivedTasks(): boolean {
  try {
    saveArchivedTasks([]);
    logger.info('All archived tasks cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear archived tasks:', error);
    return false;
  }
}

/**
 * Duplicate a task
 */
function duplicateTask(taskId: string, newDate?: string): Task | null {
  const task = findTaskById(taskId);
  if (!task) {
    logger.warn(`Task not found: ${taskId}`);
    return null;
  }

  const newTask = createTask({
    name: task.name,
    estimated_time: task.estimated_time,
    priority: task.priority,
    category: task.category,
    date: newDate || task.date,
    details: task.details
  });

  if (addTask(newTask)) {
    logger.info(`Task duplicated: ${taskId} -> ${newTask.id}`);
    return newTask;
  }

  return null;
}

/**
 * Get templates from localStorage
 */
function getTemplates(): TaskTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to load templates:', error);
    return [];
  }
}

/**
 * Save templates to localStorage
 */
function saveTemplates(templates: TaskTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    logger.error('Failed to save templates:', error);
  }
}

/**
 * Save task as template
 */
function saveAsTemplate(task: Task, templateName?: string): boolean {
  try {
    const templates = getTemplates();
    const now = new Date().toISOString();

    const template: TaskTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: templateName || task.name,
      estimated_time: task.estimated_time,
      priority: task.priority,
      category: task.category,
      details: task.details,
      created_at: now,
      usage_count: 0,
      last_used: now
    };

    templates.push(template);
    saveTemplates(templates);

    logger.info(`Template created: ${template.id}`);
    return true;
  } catch (error) {
    logger.error('Failed to save template:', error);
    return false;
  }
}

/**
 * Create task from template
 */
function createFromTemplate(templateId: string, date: string): Task | null {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    logger.warn(`Template not found: ${templateId}`);
    return null;
  }

  const task = createTask({
    name: template.name,
    estimated_time: template.estimated_time,
    priority: template.priority,
    category: template.category,
    date: date,
    details: template.details
  });

  if (addTask(task)) {
    // Update template usage
    template.usage_count++;
    template.last_used = new Date().toISOString();
    saveTemplates(templates);

    logger.info(`Task created from template: ${templateId}`);
    return task;
  }

  return null;
}

/**
 * Delete a template
 */
function deleteTemplate(templateId: string): boolean {
  try {
    const templates = getTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(filteredTemplates);
    logger.info(`Template deleted: ${templateId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete template:', error);
    return false;
  }
}

/**
 * Public API
 */
export const TaskOperations = {
  // Task CRUD
  createTask,
  addTask,
  updateTask,
  deleteTask,

  // Task finding
  findTaskById,
  getTasks,

  // Task completion
  toggleTaskCompletion,
  markTaskCompleted,
  markTaskIncomplete,

  // Task time
  updateTaskActualTime,

  // Task movement
  moveTask,
  moveTaskToUnassigned,
  bulkMoveToUnassigned,

  // Archive
  archiveTask,
  restoreTask,
  clearArchivedTasks,
  getArchivedTasks,

  // Duplicate
  duplicateTask,

  // Templates
  getTemplates,
  saveAsTemplate,
  createFromTemplate,
  deleteTemplate
};

// Expose to window for use by existing script.js
(window as any).HybridTaskOperations = TaskOperations;

console.log('Hybrid task operations module loaded');
