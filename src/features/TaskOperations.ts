import type { Task } from '../types';
import type { TaskPriority, TaskCategory } from '../types/task';
import { StorageKeys } from '../types/storage';
import { saveTasksToStorage, loadTasksFromStorage } from '../app/storage';

export interface TaskTemplate {
  id: string;
  name: string;
  estimated_time: number;
  priority: TaskPriority;
  category: TaskCategory;
  details: string;
  created_at: string;
  usage_count: number;
  last_used: string;
}

export interface CreateTaskOptions {
  name: string;
  estimated_time: number;
  priority: TaskPriority;
  category: TaskCategory;
  date: string;
  details?: string;
}

export type TaskUpdates = Partial<Omit<Task, 'id'>>;

let tasksCache: Task[] | null = null;
let archivedCache: Task[] | null = null;
let templatesCache: TaskTemplate[] | null = null;

function invalidateTasksCache(): void {
  tasksCache = null;
}

function invalidateArchivedCache(): void {
  archivedCache = null;
}

function invalidateTemplatesCache(): void {
  templatesCache = null;
}

function getTasks(): Task[] {
  if (tasksCache !== null) return tasksCache;
  tasksCache = loadTasksFromStorage();
  return tasksCache;
}

function saveTasks(tasks: Task[]): void {
  tasksCache = tasks;
  saveTasksToStorage(tasks);
}

function getArchivedTasks(): Task[] {
  if (archivedCache !== null) return archivedCache;
  try {
    const data = localStorage.getItem(StorageKeys.ARCHIVE);
    const parsed: Task[] = data ? JSON.parse(data) : [];
    archivedCache = parsed;
    return archivedCache;
  } catch {
    archivedCache = [];
    return archivedCache;
  }
}

function saveArchivedTasks(tasks: Task[]): void {
  archivedCache = tasks;
  localStorage.setItem(StorageKeys.ARCHIVE, JSON.stringify(tasks));
}

function findTaskById(taskId: string): Task | undefined {
  return getTasks().find(task => task.id === taskId);
}

function createTask(options: CreateTaskOptions): Task {
  const now = Date.now();
  return {
    id: `task-${now}-${Math.random().toString(36).substring(2, 11)}`,
    name: options.name,
    estimated_time: options.estimated_time,
    actual_time: 0,
    completed: false,
    priority: options.priority,
    category: options.category,
    date: options.date,
    assigned_date: options.date,
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: options.details ?? '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null,
  };
}

function addTask(task: Task): boolean {
  try {
    const tasks = [...getTasks(), task];
    saveTasks(tasks);
    return true;
  } catch {
    return false;
  }
}

function updateTask(taskId: string, updates: TaskUpdates): boolean {
  try {
    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return false;
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, ...updates } : task
    );
    saveTasks(updatedTasks);
    return true;
  } catch {
    return false;
  }
}

function deleteTask(taskId: string): boolean {
  try {
    const filteredTasks = getTasks().filter(task => task.id !== taskId);
    saveTasks(filteredTasks);
    return true;
  } catch {
    return false;
  }
}

function toggleTaskCompletion(taskId: string): boolean {
  const task = findTaskById(taskId);
  if (!task) return false;
  return updateTask(taskId, { completed: !task.completed });
}

function markTaskCompleted(taskId: string): boolean {
  return updateTask(taskId, { completed: true });
}

function markTaskIncomplete(taskId: string): boolean {
  return updateTask(taskId, { completed: false });
}

function updateTaskActualTime(taskId: string, actualTime: number): boolean {
  return updateTask(taskId, { actual_time: actualTime });
}

function moveTask(taskId: string, newDate: string): boolean {
  return updateTask(taskId, { date: newDate, assigned_date: newDate });
}

function moveTaskToUnassigned(taskId: string): boolean {
  return updateTask(taskId, { assigned_date: null });
}

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
  }
  return movedCount;
}

function archiveTask(taskId: string): boolean {
  const task = findTaskById(taskId);
  if (!task || !task.completed) return false;
  try {
    const activeTasks = getTasks().filter(t => t.id !== taskId);
    saveTasks(activeTasks);
    const archivedTasks = [...getArchivedTasks(), task];
    saveArchivedTasks(archivedTasks);
    return true;
  } catch {
    return false;
  }
}

function restoreTask(taskId: string): boolean {
  const archivedTasks = getArchivedTasks();
  const task = archivedTasks.find(t => t.id === taskId);
  if (!task) return false;
  try {
    const remainingArchived = archivedTasks.filter(t => t.id !== taskId);
    saveArchivedTasks(remainingArchived);
    const activeTasks = [...getTasks(), task];
    saveTasks(activeTasks);
    return true;
  } catch {
    return false;
  }
}

function clearArchivedTasks(): boolean {
  try {
    saveArchivedTasks([]);
    return true;
  } catch {
    return false;
  }
}

function duplicateTask(taskId: string, newDate?: string): Task | null {
  const task = findTaskById(taskId);
  if (!task) return null;
  const newTask = createTask({
    name: task.name,
    estimated_time: task.estimated_time,
    priority: task.priority,
    category: task.category,
    date: newDate ?? task.date,
    details: task.details,
  });
  if (addTask(newTask)) {
    return newTask;
  }
  return null;
}

function getTemplates(): TaskTemplate[] {
  if (templatesCache !== null) return templatesCache;
  try {
    const data = localStorage.getItem(StorageKeys.TEMPLATES);
    const parsed: TaskTemplate[] = data ? JSON.parse(data) : [];
    templatesCache = parsed;
    return templatesCache;
  } catch {
    templatesCache = [];
    return templatesCache;
  }
}

function saveTemplatesToStorage(templates: TaskTemplate[]): void {
  templatesCache = templates;
  localStorage.setItem(StorageKeys.TEMPLATES, JSON.stringify(templates));
}

function saveAsTemplate(task: Task, templateName?: string): boolean {
  try {
    const templates = getTemplates();
    const now = new Date().toISOString();
    const template: TaskTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: templateName ?? task.name,
      estimated_time: task.estimated_time,
      priority: task.priority,
      category: task.category,
      details: task.details,
      created_at: now,
      usage_count: 0,
      last_used: now,
    };
    saveTemplatesToStorage([...templates, template]);
    return true;
  } catch {
    return false;
  }
}

function createFromTemplate(templateId: string, date: string): Task | null {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);
  if (!template) return null;
  const task = createTask({
    name: template.name,
    estimated_time: template.estimated_time,
    priority: template.priority,
    category: template.category,
    date,
    details: template.details,
  });
  if (addTask(task)) {
    const updatedTemplates = templates.map(t =>
      t.id === templateId
        ? { ...t, usage_count: t.usage_count + 1, last_used: new Date().toISOString() }
        : t
    );
    saveTemplatesToStorage(updatedTemplates);
    return task;
  }
  return null;
}

function deleteTemplate(templateId: string): boolean {
  try {
    const filteredTemplates = getTemplates().filter(t => t.id !== templateId);
    saveTemplatesToStorage(filteredTemplates);
    return true;
  } catch {
    return false;
  }
}

export {
  invalidateTasksCache,
  invalidateArchivedCache,
  invalidateTemplatesCache,
  getTasks,
  saveTasks,
  getArchivedTasks,
  saveArchivedTasks,
  findTaskById,
  createTask,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  markTaskCompleted,
  markTaskIncomplete,
  updateTaskActualTime,
  moveTask,
  moveTaskToUnassigned,
  bulkMoveToUnassigned,
  archiveTask,
  restoreTask,
  clearArchivedTasks,
  duplicateTask,
  getTemplates,
  saveTemplatesToStorage,
  saveAsTemplate,
  createFromTemplate,
  deleteTemplate,
};
