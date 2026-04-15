/**
 * Migration utilities for data schema updates
 */

import type { Task, MigrationHistory, MigrationEntry } from '../types';
import { TaskStorage, MigrationStorage } from './storage';
import { logger } from './logger';

/**
 * Current migration version
 */
export const CURRENT_MIGRATION_VERSION = '1.1';

/**
 * Migrate tasks to add actual_time field (v0.0 -> v1.0)
 * @param tasksData - The tasks to migrate
 * @returns Migrated tasks
 */
export function migrateTasksAddActualTime(tasksData: Task[]): Task[] {
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
 * Migrate tasks to add recurring task fields (v1.0 -> v1.1)
 * @param tasksData - The tasks to migrate
 * @returns Migrated tasks
 */
export function migrateTasksAddRecurringFields(tasksData: Task[]): Task[] {
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
 * Migration function type
 */
export type MigrationFunction = (tasks: Task[]) => Task[];

/**
 * Migration registry
 * Maps version to migration function
 */
export const MIGRATION_REGISTRY: Record<string, MigrationFunction> = {
  '1.0': migrateTasksAddActualTime,
  '1.1': migrateTasksAddRecurringFields
};

/**
 * Get pending migrations
 * @param history - Current migration history
 * @returns List of pending migrations
 */
export function getPendingMigrations(history: MigrationHistory): MigrationEntry[] {
  const allVersions = Object.keys(MIGRATION_REGISTRY).sort();
  const pending: MigrationEntry[] = [];

  for (const version of allVersions) {
    if (history.version < version) {
      pending.push({
        version,
        date: new Date().toISOString(),
        description: `Migration to version ${version}`
      });
    }
  }

  return pending;
}

/**
 * Execute all pending migrations
 * @param tasksData - The tasks to migrate
 * @returns Migrated tasks
 */
export function executeMigrations(tasksData: Task[]): Task[] {
  const history = MigrationStorage.getMigrationHistory();
  let migratedData = tasksData;

  // Version 0.0 -> 1.0: Add actual_time field
  if (history.version < '1.0') {
    logger.info('Migration', 'Running migration: v0.0 -> v1.0 (actual_time field addition)');
    migratedData = migrateTasksAddActualTime(migratedData);

    // Update migration history
    history.migrations.push({
      version: '1.0',
      date: new Date().toISOString(),
      description: 'Added actual_time field to all tasks'
    });
    history.version = '1.0';
    history.lastMigrationDate = new Date().toISOString();
    MigrationStorage.saveMigrationHistory(history);
  }

  // Version 1.0 -> 1.1: Add recurring task fields
  if (history.version < '1.1') {
    logger.info('Migration', 'Running migration: v1.0 -> v1.1 (recurring task fields addition)');
    migratedData = migrateTasksAddRecurringFields(migratedData);

    // Update migration history
    history.migrations.push({
      version: '1.1',
      date: new Date().toISOString(),
      description: 'Added is_recurring, recurrence_pattern, and recurrence_end_date fields to all tasks'
    });
    history.version = '1.1';
    history.lastMigrationDate = new Date().toISOString();
    MigrationStorage.saveMigrationHistory(history);
  }

  return migratedData;
}

/**
 * Load tasks with migration applied
 * @returns Tasks with all migrations applied
 */
export function loadTasksWithMigrations(): Task[] {
  let tasksData = TaskStorage.loadTasks();

  if (tasksData.length > 0) {
    // Create backup before migration
    const backupKey = MigrationStorage.backupTasksBeforeMigration(tasksData);
    logger.info('Migration', `Created backup before migration: ${backupKey}`);

    // Execute migrations
    try {
      tasksData = executeMigrations(tasksData);
    } catch (error) {
      logger.error('Migration', 'Error during migration execution', error as any);
      // Fallback to basic migration handling
      tasksData = tasksData.map(task => ({
        ...task,
        actual_time: task.actual_time || 0
      }));
    }
  }

  // Final data validation and normalization
  return tasksData.map(task => ({
    ...task,
    completed: task.completed || false,
    priority: task.priority || 'medium',
    category: task.category || 'task',
    actual_time: typeof task.actual_time === 'number' ? task.actual_time : 0,
    is_recurring: typeof task.is_recurring === 'boolean' ? task.is_recurring : false,
    recurrence_pattern: task.recurrence_pattern || null,
    recurrence_end_date: task.recurrence_end_date || null
  }));
}

/**
 * Validate and normalize task data after loading
 * @param task - The task to validate
 * @returns Normalized task
 */
export function normalizeTask(task: Task): Task {
  return {
    ...task,
    completed: task.completed || false,
    priority: task.priority || 'medium',
    category: task.category || 'task',
    actual_time: typeof task.actual_time === 'number' ? task.actual_time : 0,
    is_recurring: typeof task.is_recurring === 'boolean' ? task.is_recurring : false,
    recurrence_pattern: task.recurrence_pattern || null,
    recurrence_end_date: task.recurrence_end_date || null
  };
}

/**
 * Check if migration is needed
 * @returns True if migration is needed
 */
export function needsMigration(): boolean {
  const history = MigrationStorage.getMigrationHistory();
  return history.version < CURRENT_MIGRATION_VERSION;
}

/**
 * Get migration status
 * @returns Object with migration status information
 */
export function getMigrationStatus(): {
  currentVersion: string;
  targetVersion: string;
  needsMigration: boolean;
  lastMigrationDate: string | null;
  migrationsApplied: number;
} {
  const history = MigrationStorage.getMigrationHistory();
  return {
    currentVersion: history.version,
    targetVersion: CURRENT_MIGRATION_VERSION,
    needsMigration: history.version < CURRENT_MIGRATION_VERSION,
    lastMigrationDate: history.lastMigrationDate,
    migrationsApplied: history.migrations.length
  };
}
