/**
 * TaskBulkMover - Type-safe class for bulk task operations
 * Manages moving multiple tasks to unassigned status
 */

import type { Task } from '../types';
import { formatDate } from '../utils/date';
import { TaskStorage } from '../utils/storage';
import { logger } from '../utils/logger';

/**
 * Notification callback type
 */
export type NotificationCallback = (message: string, type: 'success' | 'error' | 'info') => void;

/**
 * TaskBulkMover class
 * Handles bulk operations on tasks including moving to unassigned
 */
export class TaskBulkMover {
  private dayNames: readonly string[];
  private dayLabels: readonly string[];
  private notifyCallback?: NotificationCallback;

  constructor(notifyCallback?: NotificationCallback) {
    this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
    this.notifyCallback = notifyCallback;
  }

  /**
   * Set notification callback
   * @param callback - The callback function for notifications
   */
  setNotifyCallback(callback: NotificationCallback): void {
    this.notifyCallback = callback;
  }

  /**
   * Move all incomplete tasks for a specific date to unassigned
   * @param dateString - Target date string (YYYY-MM-DD)
   * @param tasks - Array of all tasks
   * @returns Number of tasks moved
   */
  moveTasksToUnassigned(dateString: string, tasks: Task[]): number {
    if (!tasks || !dateString) return 0;

    try {
      let movedCount = 0;
      tasks.forEach(task => {
        if (task.assigned_date === dateString && !task.completed) {
          task.assigned_date = null;
          movedCount++;
        }
      });

      if (movedCount > 0) {
        TaskStorage.saveTasks(tasks);
      }

      return movedCount;
    } catch (error) {
      logger.error('TaskBulkMover', 'Task move error', error as any);
      this.notify('タスクの移動に失敗しました', 'error');
      return 0;
    }
  }

  /**
   * Get tasks for a specific date
   * @param dateString - Target date string (YYYY-MM-DD)
   * @param tasks - Array of all tasks
   * @returns Array of tasks for the specified date
   */
  getTasksForDate(dateString: string, tasks: Task[]): Task[] {
    if (!tasks || !dateString) return [];

    return tasks.filter(task =>
      task.assigned_date === dateString && !task.completed
    );
  }

  /**
   * Execute bulk move operation
   * @param tasksToMove - Array of tasks to move
   * @param tasks - Array of all tasks
   * @returns Number of tasks moved
   */
  executeBulkMove(tasksToMove: Task[], tasks: Task[]): number {
    let movedCount = 0;

    tasksToMove.forEach(task => {
      task.assigned_date = null;
      movedCount++;
    });

    if (movedCount > 0) {
      TaskStorage.saveTasks(tasks);
    }

    return movedCount;
  }

  /**
   * Show move result notification
   * @param movedCount - Number of tasks moved
   * @param dateString - Source date string
   */
  notifyMoveResult(movedCount: number, dateString: string): void {
    if (movedCount === 0) {
      this.notify('移動するタスクがありませんでした', 'info');
      return;
    }

    const date = new Date(dateString);
    const dayOfWeek = this.dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek})`;

    this.notify(
      `${dateStr}の${movedCount}個のタスクを未割り当てに移動しました`,
      'success'
    );
  }

  /**
   * Get weekday name from date string
   * @param dateString - Date string (YYYY-MM-DD)
   * @returns Weekday name (monday, tuesday, etc.)
   */
  getDayNameFromDate(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return this.dayNames[dayIndex];
    } catch {
      return null;
    }
  }

  /**
   * Get all day names
   * @returns Array of day names
   */
  getDayNames(): readonly string[] {
    return this.dayNames;
  }

  /**
   * Get all day labels
   * @returns Array of day labels (Japanese)
   */
  getDayLabels(): readonly string[] {
    return this.dayLabels;
  }

  /**
   * Show notification (internal method)
   * @param message - Notification message
   * @param type - Notification type
   */
  private notify(message: string, type: 'success' | 'error' | 'info'): void {
    if (this.notifyCallback) {
      this.notifyCallback(message, type);
    } else {
      if (type === 'error') {
        logger.error('TaskBulkMover', message);
      } else if (type === 'info') {
        logger.info('TaskBulkMover', message);
      } else {
        logger.info('TaskBulkMover', message);
      }
    }
  }
}

/**
 * Create a TaskBulkMover instance
 * @param notifyCallback - Optional notification callback
 * @returns New TaskBulkMover instance
 */
export function createTaskBulkMover(notifyCallback?: NotificationCallback): TaskBulkMover {
  return new TaskBulkMover(notifyCallback);
}
