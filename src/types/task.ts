/**
 * Core type definitions for tasks in the Weekly Task Board
 */

/**
 * Task Category enum
 * Represents the category type of a task
 */
export enum TaskCategory {
  TASK = 'task',
  MEETING = 'meeting',
  REVIEW = 'review',
  BUGFIX = 'bugfix',
  DOCUMENT = 'document',
  RESEARCH = 'research'
}

/**
 * Task Priority enum
 * Represents the priority level of a task
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Recurrence Pattern type
 * Represents the recurrence pattern for recurring tasks
 */
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | null;

/**
 * Recurrence configuration interface
 */
export interface RecurrenceConfig {
  isRecurring: boolean;
  pattern: RecurrencePattern;
  endDate: string | null;
}

/**
 * Due date time period type
 */
export type DueTimePeriod = 'morning' | 'afternoon' | null;

/**
 * Due date configuration interface
 */
export interface DueDateConfig {
  date: string;
  timePeriod?: DueTimePeriod;
  hour?: number | null;
}

/**
 * Task interface
 * Represents a single task in the Weekly Task Board
 */
export interface Task {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  date: string;
  assigned_date: string | null;  // The date the task is assigned to (null for unassigned)
  due_date: string | null;
  due_time_period?: DueTimePeriod | null;
  due_hour?: number | null;
  details: string;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern;
  recurrence_end_date: string | null;
}

/**
 * Category information interface
 * Contains display properties for each task category
 */
export interface CategoryInfo {
  name: string;
  color: string;
  bgColor: string;
}

/**
 * Task Categories mapping type
 */
export type TaskCategories = Record<TaskCategory, CategoryInfo>;

/**
 * Task data validation result
 */
export interface TaskValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  task: Task;
}

/**
 * Batch validation result for multiple tasks
 */
export interface BatchValidationResult {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  validationResults: Array<TaskValidationResult & {
    taskIndex: number;
    taskId: string;
    taskName: string;
  }>;
  summary: {
    totalTasks: number;
    validTasks: number;
    invalidTasks: number;
    tasksWithWarnings: number;
  };
}

/**
 * Time overrun severity levels
 */
export type TimeOverrunSeverity = 'none' | 'minor' | 'moderate' | 'severe';
