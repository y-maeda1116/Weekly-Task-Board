import type { Task } from '../types';
import { StorageKeys } from '../types/storage';
import { executeMigrations } from './migration';
import { validateCategory } from '../utils/validation';

export function loadTasksWithMigration(): Task[] {
  const raw = localStorage.getItem(StorageKeys.TASKS);
  let data: any[] = [];

  if (raw) {
    try {
      data = JSON.parse(raw);
      data = executeMigrations(data);
    } catch {
      data = data.map(task => ({
        ...task,
        actual_time: task.actual_time || 0,
      }));
    }
  }

  return data.map(task => ({
    ...task,
    completed: task.completed || false,
    priority: task.priority || 'medium',
    category: task.category || 'task',
    actual_time: typeof task.actual_time === 'number' ? task.actual_time : 0,
    is_recurring: typeof task.is_recurring === 'boolean' ? task.is_recurring : false,
    recurrence_pattern: task.recurrence_pattern || null,
    recurrence_end_date: task.recurrence_end_date || null,
    signifier: task.signifier || null,
  }));
}

export function saveTasksValidated(tasks: Task[]): void {
  const validated = tasks.map(task => ({
    ...task,
    category: validateCategory(task.category),
  }));
  localStorage.setItem(StorageKeys.TASKS, JSON.stringify(validated));
}

export function shouldDisplayTask(task: Task, filter: string, currentCategoryFilter: string): boolean {
  const categoryFilter = filter || currentCategoryFilter;
  if (!categoryFilter) return true;
  return task.category === categoryFilter;
}
