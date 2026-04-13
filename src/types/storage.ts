/**
 * Storage type definitions for localStorage operations
 */

/**
 * Storage keys enum
 * Type-safe keys for localStorage access
 */
export enum StorageKeys {
  TASKS = 'weekly-task-board.tasks',
  SETTINGS = 'weekly-task-board.settings',
  ARCHIVE = 'weekly-task-board.archive',
  TEMPLATES = 'weekly-task-board.templates',
  MIGRATION_HISTORY = 'weekly-task-board.migration-history'
}

/**
 * Weekday visibility settings
 */
export interface WeekdayVisibility {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

/**
 * Settings interface
 * Application settings stored in localStorage
 */
export interface Settings {
  ideal_daily_minutes: number;
  weekday_visibility: WeekdayVisibility;
  morningPageEnabled?: boolean;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
  ideal_daily_minutes: 480,
  weekday_visibility: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  }
};

/**
 * Migration history entry
 */
export interface MigrationEntry {
  version: string;
  date: string;
  description: string;
}

/**
 * Migration history interface
 * Tracks which migrations have been applied
 */
export interface MigrationHistory {
  version: string;
  lastMigrationDate: string | null;
  migrations: MigrationEntry[];
}

/**
 * Backup key prefix
 */
export const BACKUP_KEY_PREFIX = 'weekly-task-board.backup-';
