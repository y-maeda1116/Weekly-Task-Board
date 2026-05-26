import type { Task } from '../types';
import type { MigrationHistory } from '../types/storage';
import { StorageKeys } from '../types/storage';

const CURRENT_MIGRATION_VERSION = '1.1';

function getMigrationHistory(): MigrationHistory {
  const raw = localStorage.getItem(StorageKeys.MIGRATION_HISTORY);
  if (!raw) {
    return { version: '0.0', lastMigrationDate: null, migrations: [] };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { version: '0.0', lastMigrationDate: null, migrations: [] };
  }
}

function saveMigrationHistory(history: MigrationHistory): void {
  localStorage.setItem(StorageKeys.MIGRATION_HISTORY, JSON.stringify(history));
}

export function backupTasksBeforeMigration(): string {
  const timestamp = new Date().toISOString();
  const backupKey = `weekly-task-board.backup-${timestamp}`;
  const currentTasks = localStorage.getItem(StorageKeys.TASKS);
  if (currentTasks) {
    localStorage.setItem(backupKey, currentTasks);
  }
  return backupKey;
}

function migrateTasksAddActualTime(tasksData: any[]): any[] {
  return tasksData.map(task => {
    if (task.actual_time === undefined) {
      return { ...task, actual_time: 0 };
    }
    return task;
  });
}

function migrateTasksAddRecurringFields(tasksData: any[]): any[] {
  return tasksData.map(task => {
    const updated = { ...task };
    if (updated.is_recurring === undefined) updated.is_recurring = false;
    if (updated.recurrence_pattern === undefined) updated.recurrence_pattern = null;
    if (updated.recurrence_end_date === undefined) updated.recurrence_end_date = null;
    return updated;
  });
}

export function executeMigrations(tasksData: any[]): any[] {
  const history = getMigrationHistory();
  let migrated = tasksData;
  const currentVer = parseFloat(history.version) || 0;

  if (currentVer < 1.0) {
    migrated = migrateTasksAddActualTime(migrated);
    history.migrations.push({
      version: '1.0',
      date: new Date().toISOString(),
      description: 'Added actual_time field to all tasks',
    });
    history.version = '1.0';
    history.lastMigrationDate = new Date().toISOString();
    saveMigrationHistory(history);
  }

  if (currentVer < 1.1) {
    migrated = migrateTasksAddRecurringFields(migrated);
    history.migrations.push({
      version: '1.1',
      date: new Date().toISOString(),
      description: 'Added is_recurring, recurrence_pattern, and recurrence_end_date fields',
    });
    history.version = '1.1';
    history.lastMigrationDate = new Date().toISOString();
    saveMigrationHistory(history);
  }

  return migrated;
}

export function getMigrationStatus(): { version: string; lastDate: string | null; count: number } {
  const history = getMigrationHistory();
  return {
    version: history.version,
    lastDate: history.lastMigrationDate,
    count: history.migrations.length,
  };
}
