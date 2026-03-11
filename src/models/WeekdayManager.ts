/**
 * WeekdayManager - Type-safe class for weekday visibility management
 * Manages which weekdays are visible/hidden in the task board
 */

import type { Weekday } from '../types';
import type { Settings, WeekdayVisibility } from '../types';
import { SettingsStorage } from '../utils/storage';
import { getMonday, formatDate } from '../utils/date';
import { TaskStorage } from '../utils/storage';
import type { Task } from '../types/task';
import { logger } from '../utils/logger';

/**
 * Weekday settings change callback type
 */
export type WeekdayChangeCallback = (dayName: Weekday, visible: boolean) => void;

/**
 * WeekdayManager class
 * Handles weekday visibility settings and related operations
 */
export class WeekdayManager {
  private dayNames: readonly Weekday[];
  private dayLabels: readonly string[];
  private weekdaySettings: WeekdayVisibility;
  private settings: Settings;
  private changeCallback?: WeekdayChangeCallback;

  constructor(settings?: Settings, changeCallback?: WeekdayChangeCallback) {
    this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
    this.changeCallback = changeCallback;
    this.settings = settings || SettingsStorage.loadSettings();
    this.loadSettings();
  }

  /**
   * Load settings from storage
   */
  loadSettings(): void {
    if (this.settings.weekday_visibility) {
      this.weekdaySettings = { ...this.settings.weekday_visibility };
    } else {
      // Default settings
      this.weekdaySettings = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      };
    }
  }

  /**
   * Reload settings from storage
   */
  reloadSettings(): void {
    this.settings = SettingsStorage.loadSettings();
    this.loadSettings();
  }

  /**
   * Save settings to storage
   */
  saveSettings(): boolean {
    try {
      this.settings.weekday_visibility = { ...this.weekdaySettings };
      const success = SettingsStorage.saveSettings(this.settings);
      if (!success) {
        logger.error('Failed to save weekday settings');
      }
      return success;
    } catch (error) {
      logger.error('Failed to save weekday settings:', error);
      return false;
    }
  }

  /**
   * Toggle weekday visibility
   * @param dayName - Weekday name (monday, tuesday, etc.)
   * @param visible - Whether the weekday should be visible
   * @param tasks - Optional task array to update
   * @returns Number of tasks moved to unassigned (0 if visible)
   */
  toggleWeekday(dayName: Weekday, visible: boolean, tasks?: Task[]): number {
    if (!this.dayNames.includes(dayName)) {
      logger.warn(`Invalid weekday name: ${dayName}`);
      return 0;
    }

    const previousVisibility = this.weekdaySettings[dayName];
    this.weekdaySettings[dayName] = visible;

    const saveSuccess = this.saveSettings();
    if (!saveSuccess) {
      // Revert on save failure
      this.weekdaySettings[dayName] = previousVisibility;
      return 0;
    }

    // Call change callback
    if (this.changeCallback) {
      this.changeCallback(dayName, visible);
    }

    // Move tasks to unassigned if hiding weekday
    if (!visible) {
      return this.moveTasksToUnassigned(dayName, tasks || []);
    }

    return 0;
  }

  /**
   * Get list of visible weekdays
   * @returns Array of visible weekday names
   */
  getVisibleWeekdays(): Weekday[] {
    return this.dayNames.filter(day => this.weekdaySettings[day]);
  }

  /**
   * Get list of hidden weekdays
   * @returns Array of hidden weekday names
   */
  getHiddenWeekdays(): Weekday[] {
    return this.dayNames.filter(day => !this.weekdaySettings[day]);
  }

  /**
   * Check if a weekday is visible
   * @param dayName - Weekday name
   * @returns True if weekday is visible
   */
  isWeekdayVisible(dayName: Weekday): boolean {
    return this.weekdaySettings[dayName] || false;
  }

  /**
   * Move tasks for a specific weekday to unassigned
   * @param dayName - Weekday name
   * @param tasks - Array of tasks
   * @returns Number of tasks moved
   */
  moveTasksToUnassigned(dayName: Weekday, tasks: Task[]): number {
    const currentDate = new Date(); // Use current date as reference
    const dayIndex = this.dayNames.indexOf(dayName);
    if (dayIndex === -1) return 0;

    // Calculate target date using Monday of current week
    const monday = getMonday(currentDate);
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    const targetDateStr = formatDate(targetDate);

    let movedCount = 0;
    tasks.forEach(task => {
      if (task.assigned_date === targetDateStr) {
        task.assigned_date = null;
        movedCount++;
      }
    });

    if (movedCount > 0) {
      const saveSuccess = TaskStorage.saveTasks(tasks);
      if (saveSuccess) {
        logger.info(`${movedCount} tasks moved to unassigned`);
      } else {
        logger.error('Failed to save tasks after moving to unassigned');
      }
    }

    return movedCount;
  }

  /**
   * Validate weekday settings
   * @param settings - Settings object to validate
   * @returns Validated settings object
   */
  validateSettings(settings: Partial<WeekdayVisibility>): WeekdayVisibility {
    const validatedSettings: WeekdayVisibility = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };

    this.dayNames.forEach(day => {
      validatedSettings[day] = typeof settings[day] === 'boolean' ? settings[day]! : true;
    });

    return validatedSettings;
  }

  /**
   * Get current weekday settings
   * @returns Current weekday visibility settings
   */
  getWeekdaySettings(): WeekdayVisibility {
    return { ...this.weekdaySettings };
  }

  /**
   * Set all weekdays visibility at once
   * @param visibility - Visibility value for all weekdays
   * @returns Success of operation
   */
  setAllWeekdaysVisible(visible: boolean): boolean {
    this.dayNames.forEach(day => {
      this.weekdaySettings[day] = visible;
    });
    return this.saveSettings();
  }

  /**
   * Reset weekday settings to defaults
   * @returns Success of operation
   */
  resetToDefaults(): boolean {
    this.weekdaySettings = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };
    return this.saveSettings();
  }

  /**
   * Get weekday label (Japanese)
   * @param dayName - Weekday name
   * @returns Japanese label
   */
  getWeekdayLabel(dayName: Weekday): string {
    const index = this.dayNames.indexOf(dayName);
    return index !== -1 ? this.dayLabels[index] : '';
  }

  /**
   * Get all day names
   * @returns Array of day names
   */
  getDayNames(): readonly Weekday[] {
    return this.dayNames;
  }

  /**
   * Get all day labels
   * @returns Array of day labels (Japanese)
   */
  getDayLabels(): readonly string[] {
    return this.dayLabels;
  }
}

/**
 * Create a WeekdayManager instance
 * @param settings - Optional initial settings
 * @param changeCallback - Optional callback for weekday changes
 * @returns New WeekdayManager instance
 */
export function createWeekdayManager(
  settings?: Settings,
  changeCallback?: WeekdayChangeCallback
): WeekdayManager {
  return new WeekdayManager(settings, changeCallback);
}
