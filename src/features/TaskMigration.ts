import type { Task } from '../types';
import { formatDate, addDays } from '../utils/date';

const STORAGE_KEY = 'weekly-task-board.tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage full or unavailable
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'task-' + crypto.randomUUID();
  }
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  return formatDate(addDays(d, days));
}

export function getIncompleteTasksForWeek(weekStart: string, weekEnd: string): Task[] {
  const tasks = loadTasks();
  return tasks.filter(
    (t) => !t.completed && t.assigned_date && t.assigned_date >= weekStart && t.assigned_date <= weekEnd
  );
}

function migrateTasks(taskIds: string[], dayOffset: number | null, baseDate?: string): number {
  if (!taskIds || taskIds.length === 0) return 0;

  const tasks = loadTasks();
  const idSet = new Set(taskIds);
  let migratedCount = 0;
  const updatedTasks: Task[] = [];

  for (const task of tasks) {
    if (idSet.has(task.id) && !task.completed) {
      const migrated: Task = { ...task };
      const originalName = migrated.name.replace(/^>\s*/, '');
      migrated.name = '> ' + originalName;
      migrated.completed = true;
      updatedTasks.push(migrated);

      const sourceDate = task.assigned_date || baseDate || task.date;
      const newDate = dayOffset !== null ? addDaysToStr(sourceDate, dayOffset) : null;

      const copy: Task = {
        ...task,
        id: generateId(),
        name: originalName,
        assigned_date: newDate,
        date: newDate || task.date,
        completed: false,
        actual_time: 0
      };
      updatedTasks.push(copy);
      migratedCount++;
    } else {
      updatedTasks.push(task);
    }
  }

  saveTasks(updatedTasks);
  return migratedCount;
}

export function migrateTasksToNextWeek(taskIds: string[], baseDate?: string): number {
  return migrateTasks(taskIds, 7, baseDate);
}

export function migrateTasksToNextDay(taskIds: string[], baseDate?: string): number {
  return migrateTasks(taskIds, 1, baseDate);
}

export function migrateTasksToUnassigned(taskIds: string[]): number {
  if (!taskIds || taskIds.length === 0) return 0;

  const tasks = loadTasks();
  const idSet = new Set(taskIds);
  let migratedCount = 0;
  const updatedTasks: Task[] = [];

  for (const task of tasks) {
    if (idSet.has(task.id) && !task.completed) {
      const copy: Task = {
        ...task,
        id: generateId(),
        name: task.name.replace(/^>\s*/, ''),
        assigned_date: null,
        completed: false,
        actual_time: 0
      };
      updatedTasks.push(copy);
      migratedCount++;
    } else {
      updatedTasks.push(task);
    }
  }

  saveTasks(updatedTasks);
  return migratedCount;
}
