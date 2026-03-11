/**
 * Validation utility functions
 */

import type { Task, TaskCategory, TaskValidationResult, BatchValidationResult, TimeOverrunSeverity } from '../types';
import { TASK_CATEGORIES } from '../constants/taskCategories';

/**
 * Validate and normalize category value
 * @param category - The category to validate
 * @returns Valid category key
 */
export function validateCategory(category: string | TaskCategory | undefined): TaskCategory {
  if (category && TASK_CATEGORIES[category as TaskCategory]) {
    return category as TaskCategory;
  }
  console.warn(`Invalid category "${category}", falling back to default "task"`);
  return TaskCategory.TASK;
}

/**
 * Get category information by category key
 * @param categoryKey - The category key
 * @returns Category information with name, color, and bgColor
 */
export function getCategoryInfo(categoryKey: TaskCategory | string) {
  return TASK_CATEGORIES[categoryKey as TaskCategory] || TASK_CATEGORIES[TaskCategory.TASK];
}

/**
 * Determine the severity of time overrun
 * @param estimated - Estimated time in hours
 * @param actual - Actual time in hours
 * @returns Severity level: 'none', 'minor', 'moderate', 'severe'
 */
export function getTimeOverrunSeverity(estimated: number, actual: number): TimeOverrunSeverity {
  if (!actual || actual === 0 || actual <= estimated) {
    return 'none';
  }

  const overrunPercent = ((actual - estimated) / estimated) * 100;

  if (overrunPercent <= 25) {
    return 'minor';
  } else if (overrunPercent <= 50) {
    return 'moderate';
  } else {
    return 'severe';
  }
}

/**
 * Validate time data for a task
 * @param task - The task to validate
 * @returns Validation result with isValid flag and errors array
 */
export function validateTaskTimeData(task: Task): TaskValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate estimated_time
  if (task.estimated_time === undefined || task.estimated_time === null) {
    errors.push('estimated_time is missing');
    task.estimated_time = 0;
  } else if (typeof task.estimated_time !== 'number') {
    errors.push(`estimated_time must be a number, got ${typeof task.estimated_time}`);
    task.estimated_time = 0;
  } else if (task.estimated_time < 0) {
    errors.push('estimated_time cannot be negative');
    task.estimated_time = 0;
  } else if (!Number.isFinite(task.estimated_time)) {
    errors.push('estimated_time must be a finite number');
    task.estimated_time = 0;
  }

  // Validate actual_time
  if (task.actual_time === undefined || task.actual_time === null) {
    errors.push('actual_time is missing');
    task.actual_time = 0;
  } else if (typeof task.actual_time !== 'number') {
    errors.push(`actual_time must be a number, got ${typeof task.actual_time}`);
    task.actual_time = 0;
  } else if (task.actual_time < 0) {
    errors.push('actual_time cannot be negative');
    task.actual_time = 0;
  } else if (!Number.isFinite(task.actual_time)) {
    errors.push('actual_time must be a finite number');
    task.actual_time = 0;
  }

  // Check if actual_time exceeds estimated_time significantly
  if (task.actual_time > task.estimated_time * 1.5) {
    warnings.push(
      `actual_time (${task.actual_time}h) significantly exceeds estimated_time (${task.estimated_time}h)`
    );
  }

  // Round to 2 decimal places
  task.estimated_time = Math.round(task.estimated_time * 100) / 100;
  task.actual_time = Math.round(task.actual_time * 100) / 100;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    task
  };
}

/**
 * Validate all tasks' time data
 * @param tasksData - Array of tasks to validate
 * @returns Validation result with summary
 */
export function validateAllTasksTimeData(tasksData: Task[]): BatchValidationResult {
  const validationResults: Array<TaskValidationResult & {
    taskIndex: number;
    taskId: string;
    taskName: string;
  }> = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  tasksData.forEach((task, index) => {
    const result = validateTaskTimeData({ ...task });
    validationResults.push({
      taskIndex: index,
      taskId: task.id,
      taskName: task.name,
      ...result
    });

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return {
    isValid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    validationResults,
    summary: {
      totalTasks: tasksData.length,
      validTasks: validationResults.filter(r => r.isValid).length,
      invalidTasks: validationResults.filter(r => !r.isValid).length,
      tasksWithWarnings: validationResults.filter(r => r.warnings.length > 0).length
    }
  };
}

/**
 * Repair invalid time data in tasks
 * @param tasksData - Array of tasks to repair
 * @returns Repair result with details
 */
export function repairTasksTimeData(tasksData: Task[]): {
  repairedCount: number;
  repairResults: Array<{
    taskIndex: number;
    taskId: string;
    taskName: string;
    originalEstimatedTime: number;
    originalActualTime: number;
    repairedEstimatedTime: number;
    repairedActualTime: number;
    errors: string[];
  }>;
  summary: {
    totalTasks: number;
    repairedTasks: number;
    successRate: string;
  };
} {
  const repairResults: Array<{
    taskIndex: number;
    taskId: string;
    taskName: string;
    originalEstimatedTime: number;
    originalActualTime: number;
    repairedEstimatedTime: number;
    repairedActualTime: number;
    errors: string[];
  }> = [];
  let repairedCount = 0;

  tasksData.forEach((task, index) => {
    const originalEstimatedTime = task.estimated_time;
    const originalActualTime = task.actual_time;

    const result = validateTaskTimeData({ ...task });

    if (!result.isValid || result.errors.length > 0) {
      repairedCount++;
      repairResults.push({
        taskIndex: index,
        taskId: task.id,
        taskName: task.name,
        originalEstimatedTime,
        originalActualTime,
        repairedEstimatedTime: task.estimated_time,
        repairedActualTime: task.actual_time,
        errors: result.errors
      });
    }
  });

  return {
    repairedCount,
    repairResults,
    summary: {
      totalTasks: tasksData.length,
      repairedTasks: repairedCount,
      successRate: ((tasksData.length - repairedCount) / tasksData.length * 100).toFixed(1)
    }
  };
}

/**
 * Validate a task object
 * @param task - The task to validate
 * @returns True if the task is valid
 */
export function isValidTask(task: unknown): task is Task {
  if (!task || typeof task !== 'object') {
    return false;
  }

  const t = task as Partial<Task>;
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.estimated_time === 'number' &&
    typeof t.actual_time === 'number' &&
    typeof t.completed === 'boolean' &&
    typeof t.priority === 'string' &&
    typeof t.category === 'string' &&
    typeof t.date === 'string'
  );
}

/**
 * Validate task ID format
 * @param id - The task ID to validate
 * @returns True if the ID is valid
 */
export function isValidTaskId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('task-');
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateStr - The date string to validate
 * @returns True if the date string is valid
 */
export function isValidDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate time period value
 * @param period - The time period to validate
 * @returns True if the time period is valid
 */
export function isValidTimePeriod(period: string | null | undefined): boolean {
  return period === null || period === undefined || period === '' || period === 'morning' || period === 'afternoon';
}

/**
 * Validate priority value
 * @param priority - The priority to validate
 * @returns True if the priority is valid
 */
export function isValidPriority(priority: string | undefined): priority is TaskPriority {
  const validPriorities: TaskPriority[] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];
  return validPriorities.includes(priority as TaskPriority);
}

/**
 * Sanitize user input
 * @param input - The input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validate task name
 * @param name - The task name to validate
 * @returns True if the name is valid
 */
export function isValidTaskName(name: string): boolean {
  const sanitized = sanitizeInput(name);
  return typeof name === 'string' && name.length > 0 && name === sanitized && name.length <= 500;
}

/**
 * Validate estimated time
 * @param time - The time in hours
 * @returns True if the time is valid
 */
export function isValidEstimatedTime(time: number): boolean {
  return typeof time === 'number' && time >= 0 && time <= 168 && Number.isFinite(time);
}

/**
 * Validate actual time
 * @param time - The time in hours
 * @returns True if the time is valid
 */
export function isValidActualTime(time: number): boolean {
  return typeof time === 'number' && time >= 0 && Number.isFinite(time);
}
