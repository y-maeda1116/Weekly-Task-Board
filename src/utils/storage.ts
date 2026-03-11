/**
 * Type-safe localStorage utility functions
 */

import { StorageKeys } from '../types';
import type {
  Settings,
  MigrationHistory,
  Task,
  ArchivedTask,
  TaskTemplate
} from '../types';

/**
 * StorageService class
 * Provides type-safe localStorage operations
 */
export class StorageService {
  /**
   * Get item from localStorage with type safety
   */
  static getItem<T = string>(key: StorageKeys | string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      // Try to parse as JSON if it looks like an object/array
      if (item.trim().startsWith('{') || item.trim().startsWith('[')) {
        return JSON.parse(item) as T;
      }

      return item as T;
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage with type safety
   */
  static setItem<T>(key: StorageKeys | string, value: T): boolean {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: StorageKeys | string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  static hasItem(key: StorageKeys | string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  static getKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get storage size in bytes
   */
  static getSize(): number {
    try {
      let size = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
      return size;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }
}

/**
 * Task storage functions
 */
export namespace TaskStorage {
  /**
   * Load tasks from localStorage
   */
  export function loadTasks(): Task[] {
    const tasksJson = StorageService.getItem<string>(StorageKeys.TASKS);
    if (!tasksJson) return [];

    try {
      return JSON.parse(tasksJson) as Task[];
    } catch (error) {
      console.error('Error parsing tasks from localStorage:', error);
      return [];
    }
  }

  /**
   * Save tasks to localStorage
   */
  export function saveTasks(tasks: Task[]): boolean {
    return StorageService.setItem(StorageKeys.TASKS, tasks);
  }

  /**
   * Load archived tasks from localStorage
   */
  export function loadArchivedTasks(): ArchivedTask[] {
    const archiveJson = StorageService.getItem<string>(StorageKeys.ARCHIVE);
    if (!archiveJson) return [];

    try {
      return JSON.parse(archiveJson) as ArchivedTask[];
    } catch (error) {
      console.error('Error parsing archived tasks from localStorage:', error);
      return [];
    }
  }

  /**
   * Save archived tasks to localStorage
   */
  export function saveArchivedTasks(archive: ArchivedTask[]): boolean {
    return StorageService.setItem(StorageKeys.ARCHIVE, archive);
  }

  /**
   * Clear archived tasks
   */
  export function clearArchivedTasks(): boolean {
    return StorageService.removeItem(StorageKeys.ARCHIVE);
  }
}

/**
 * Settings storage functions
 */
export namespace SettingsStorage {
  /**
   * Load settings from localStorage with defaults
   */
  export function loadSettings(): Settings {
    const settingsJson = StorageService.getItem<string>(StorageKeys.SETTINGS);
    if (!settingsJson) {
      return {
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
    }

    try {
      const settings = JSON.parse(settingsJson) as Settings;
      // Ensure weekday_visibility exists
      if (!settings.weekday_visibility) {
        settings.weekday_visibility = {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        };
      }
      return settings;
    } catch (error) {
      console.error('Error parsing settings from localStorage:', error);
      return {
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
    }
  }

  /**
   * Save settings to localStorage
   */
  export function saveSettings(settings: Settings): boolean {
    return StorageService.setItem(StorageKeys.SETTINGS, settings);
  }
}

/**
 * Template storage functions
 */
export namespace TemplateStorage {
  /**
   * Load templates from localStorage
   */
  export function loadTemplates(): TaskTemplate[] {
    const templatesJson = StorageService.getItem<string>(StorageKeys.TEMPLATES);
    if (!templatesJson) return [];

    try {
      return JSON.parse(templatesJson) as TaskTemplate[];
    } catch (error) {
      console.error('Error parsing templates from localStorage:', error);
      return [];
    }
  }

  /**
   * Save templates to localStorage
   */
  export function saveTemplates(templates: TaskTemplate[]): boolean {
    return StorageService.setItem(StorageKeys.TEMPLATES, templates);
  }
}

/**
 * Migration storage functions
 */
export namespace MigrationStorage {
  /**
   * Get migration history from localStorage
   */
  export function getMigrationHistory(): MigrationHistory {
    const historyJson = StorageService.getItem<string>(StorageKeys.MIGRATION_HISTORY);
    if (!historyJson) {
      return {
        version: '0.0',
        lastMigrationDate: null,
        migrations: []
      };
    }

    try {
      return JSON.parse(historyJson) as MigrationHistory;
    } catch (error) {
      console.error('Error parsing migration history from localStorage:', error);
      return {
        version: '0.0',
        lastMigrationDate: null,
        migrations: []
      };
    }
  }

  /**
   * Save migration history to localStorage
   */
  export function saveMigrationHistory(history: MigrationHistory): boolean {
    return StorageService.setItem(StorageKeys.MIGRATION_HISTORY, history);
  }

  /**
   * Backup current tasks data before migration
   */
  export function backupTasksBeforeMigration(tasks: Task[]): string {
    const timestamp = new Date().toISOString();
    const backupKey = `weekly-task-board.backup-${timestamp}`;
    StorageService.setItem(backupKey, tasks);
    return backupKey;
  }
}
