/**
 * App-wide actions shared across feature modules.
 * Replaces the former window.* globals (renderWeek, saveTasks, loadTasks, ...).
 */
import type { Task } from '../types';
import type { ArchiveCallbacks } from '../features/ArchiveManager';
import { appContext } from './AppContext';
import { loadTasksWithMigration, saveTasksValidated } from './taskStorage';
import { getMigrationHistory } from './migration';
import { updateDashboard } from '../features/DashboardManager';

let renderWeekFn: (() => void) | null = null;

export function setRenderWeek(fn: () => void): void {
  renderWeekFn = fn;
}

export function renderWeek(): void {
  renderWeekFn?.();
}

export { updateDashboard };

export function saveTasks(): void {
  saveTasksValidated(appContext.tasks);
}

export function setTasks(tasks: Task[]): void {
  appContext.tasks = tasks;
  saveTasksValidated(tasks);
}

export function reloadTasks(): Task[] {
  appContext.tasks = loadTasksWithMigration();
  return appContext.tasks;
}

export const archiveCallbacks: ArchiveCallbacks = {
  getTasks: () => appContext.tasks,
  saveTasks: setTasks,
  getMigrationHistory,
};
