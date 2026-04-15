/**
 * RecurrenceEngine - Type-safe class for recurring task generation
 * Generates new tasks based on daily, weekly, and monthly patterns
 */

import type { Task, RecurrencePattern } from '../types';
import { formatDate } from '../utils/date';
import { logger } from '../utils/logger';

/**
 * Recurrence pattern info
 */
export interface RecurrencePatternInfo {
  name: string;
  interval: number;
}

/**
 * RecurrenceEngine class
 * Handles all recurring task operations including generation and validation
 */
export class RecurrenceEngine {
  private readonly RECURRENCE_PATTERNS: Record<string, RecurrencePatternInfo>;

  constructor() {
    this.RECURRENCE_PATTERNS = {
      'daily': { name: '毎日', interval: 1 },
      'weekly': { name: '毎週', interval: 7 },
      'monthly': { name: '毎月', interval: 30 }
    };
  }

  /**
   * Generate a new task from a recurring task template
   * @param recurringTask - The recurring task template
   * @param targetDate - The date to generate the task for
   * @returns Generated task or null if generation is not possible
   */
  generateTaskFromRecurrence(recurringTask: Task, targetDate: Date): Task | null {
    // Validate recurring task
    if (!recurringTask.is_recurring || !recurringTask.recurrence_pattern) {
      logger.warn('RecurrenceEngine', `Task is not a recurring task: ${recurringTask.name}`);
      return null;
    }

    // Validate targetDate
    if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      logger.error('RecurrenceEngine', 'Invalid targetDate', { targetDate: String(targetDate) });
      return null;
    }

    // Check end date
    if (recurringTask.recurrence_end_date) {
      const endDate = new Date(recurringTask.recurrence_end_date);
      endDate.setHours(0, 0, 0, 0);
      const targetDateCopy = new Date(targetDate);
      targetDateCopy.setHours(0, 0, 0, 0);

      if (targetDateCopy > endDate) {
        return null;
      }
    }

    // Create new task
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: recurringTask.name,
      estimated_time: recurringTask.estimated_time,
      actual_time: 0,
      priority: recurringTask.priority,
      category: recurringTask.category,
      date: formatDate(targetDate),
      assigned_date: formatDate(targetDate),
      due_date: null,
      due_time_period: null,
      due_hour: null,
      details: recurringTask.details,
      completed: false,
      is_recurring: false,
      recurrence_pattern: null,
      recurrence_end_date: null
    };

    return newTask;
  }

  /**
   * Generate tasks for daily recurrence pattern
   * @param recurringTask - The recurring task template
   * @param startDate - Start date for generation
   * @param endDate - End date for generation
   * @returns Array of generated tasks
   */
  generateDailyTasks(recurringTask: Task, startDate: Date, endDate: Date): Task[] {
    const generatedTasks: Task[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
      if (newTask) {
        generatedTasks.push(newTask);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return generatedTasks;
  }

  /**
   * Generate tasks for weekly recurrence pattern
   * @param recurringTask - The recurring task template
   * @param startDate - Start date for generation
   * @param endDate - End date for generation
   * @returns Array of generated tasks
   */
  generateWeeklyTasks(recurringTask: Task, startDate: Date, endDate: Date): Task[] {
    const generatedTasks: Task[] = [];

    // Get original task's date
    if (!recurringTask.assigned_date && !recurringTask.date) {
      return generatedTasks;
    }

    const originalDate = new Date(recurringTask.assigned_date || recurringTask.date);
    originalDate.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Get original task's day of week
    const originalDayOfWeek = originalDate.getDay();

    // Find first target weekday from startDate
    let currentDate = new Date(start);
    const currentDayOfWeek = currentDate.getDay();
    const daysUntilTarget = (originalDayOfWeek - currentDayOfWeek + 7) % 7;
    currentDate.setDate(currentDate.getDate() + daysUntilTarget);

    // Generate tasks for target weekdays (only on/after original task date)
    while (currentDate <= end) {
      // Don't generate for dates before original task date
      if (currentDate >= originalDate) {
        const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
        if (newTask) {
          generatedTasks.push(newTask);
        }
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return generatedTasks;
  }

  /**
   * Generate tasks for monthly recurrence pattern
   * @param recurringTask - The recurring task template
   * @param startDate - Start date for generation
   * @param endDate - End date for generation
   * @returns Array of generated tasks
   */
  generateMonthlyTasks(recurringTask: Task, startDate: Date, endDate: Date): Task[] {
    const generatedTasks: Task[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const startDay = currentDate.getDate();

    while (currentDate <= end) {
      const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
      if (newTask) {
        generatedTasks.push(newTask);
      }

      // Advance month (reset date then advance month)
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);

      // Adjust for end of month (e.g., Jan 31 -> Feb 28)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      if (startDay > lastDayOfMonth) {
        currentDate.setDate(lastDayOfMonth);
      } else {
        currentDate.setDate(startDay);
      }
    }

    return generatedTasks;
  }

  /**
   * Update recurrence end date for a recurring task
   * @param recurringTask - The recurring task
   * @param newEndDate - New end date (YYYY-MM-DD format)
   * @returns Success of update
   */
  updateRecurrenceEndDate(recurringTask: Task, newEndDate: string | null): boolean {
    if (!recurringTask.is_recurring) {
      logger.warn('RecurrenceEngine', 'This task is not a recurring task');
      return false;
    }

    // Validate end date
    if (newEndDate) {
      const endDate = new Date(newEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(endDate.getTime())) {
        logger.warn('RecurrenceEngine', 'Invalid end date format', { newEndDate });
        return false;
      }

      if (endDate < today) {
        logger.warn('RecurrenceEngine', 'End date cannot be in the past');
        return false;
      }
    }

    recurringTask.recurrence_end_date = newEndDate;
    return true;
  }

  /**
   * Check if a recurring task is still active
   * @param recurringTask - The recurring task to check
   * @returns True if the task is still within its recurrence period
   */
  isRecurrenceActive(recurringTask: Task): boolean {
    if (!recurringTask.is_recurring) {
      return false;
    }

    if (recurringTask.recurrence_end_date) {
      const endDate = new Date(recurringTask.recurrence_end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return today <= endDate;
    }

    return true;
  }

  /**
   * Generate all recurring tasks for a date range
   * @param recurringTasks - Array of recurring task templates
   * @param startDate - Start date for generation
   * @param endDate - End date for generation
   * @returns Array of all generated tasks
   */
  generateAllRecurringTasks(recurringTasks: Task[], startDate: Date, endDate: Date): Task[] {
    const allGeneratedTasks: Task[] = [];

    recurringTasks.forEach(recurringTask => {
      if (!this.isRecurrenceActive(recurringTask)) {
        return;
      }

      let generatedTasks: Task[] = [];

      switch (recurringTask.recurrence_pattern) {
        case 'daily':
          generatedTasks = this.generateDailyTasks(recurringTask, startDate, endDate);
          break;
        case 'weekly':
          generatedTasks = this.generateWeeklyTasks(recurringTask, startDate, endDate);
          break;
        case 'monthly':
          generatedTasks = this.generateMonthlyTasks(recurringTask, startDate, endDate);
          break;
        default:
          logger.warn('RecurrenceEngine', `Unknown recurrence pattern: ${recurringTask.recurrence_pattern}`);
      }

      allGeneratedTasks.push(...generatedTasks);
    });

    return allGeneratedTasks;
  }

  /**
   * Get all available recurrence patterns
   * @returns Array of recurrence pattern keys
   */
  getAvailablePatterns(): string[] {
    return Object.keys(this.RECURRENCE_PATTERNS);
  }

  /**
   * Get pattern info for a specific pattern
   * @param pattern - The recurrence pattern
   * @returns Pattern info or null if not found
   */
  getPatternInfo(pattern: RecurrencePattern | string): RecurrencePatternInfo | null {
    if (!pattern) return null;
    const patternKey = pattern as RecurrencePattern;
    if (!patternKey) return null;
    return this.RECURRENCE_PATTERNS[patternKey] || null;
  }

  /**
   * Validate recurrence pattern
   * @param pattern - The pattern to validate
   * @returns True if pattern is valid
   */
  isValidPattern(pattern: string | null): pattern is RecurrencePattern {
    if (!pattern) return false;
    const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly'];
    return validPatterns.includes(pattern as RecurrencePattern);
  }

  /**
   * Calculate next occurrence date for a recurring task
   * @param recurringTask - The recurring task
   * @param fromDate - The date to calculate from
   * @returns Next occurrence date or null if pattern is invalid
   */
  getNextOccurrence(recurringTask: Task, fromDate: Date): Date | null {
    if (!recurringTask.is_recurring || !recurringTask.recurrence_pattern) {
      return null;
    }

    const pattern = this.RECURRENCE_PATTERNS[recurringTask.recurrence_pattern];
    if (!pattern) {
      return null;
    }

    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + pattern.interval);
    return nextDate;
  }

  /**
   * Get all occurrences for a recurring task within a date range
   * @param recurringTask - The recurring task
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Array of occurrence dates
   */
  getOccurrencesInRange(recurringTask: Task, startDate: Date, endDate: Date): Date[] {
    let current: Date | null = startDate;
    const occurrences: Date[] = [];

    while (current && current <= endDate) {
      occurrences.push(new Date(current));
      current = this.getNextOccurrence(recurringTask, current);

      // Check if we've hit the end date
      if (current && current > endDate) {
        break;
      }

      // Check if recurrence is still active
      if (current && !this.isRecurrenceActive({ ...recurringTask })) {
        break;
      }
    }

    return occurrences;
  }
}

/**
 * Create a RecurrenceEngine instance
 * @returns New RecurrenceEngine instance
 */
export function createRecurrenceEngine(): RecurrenceEngine {
  return new RecurrenceEngine();
}
