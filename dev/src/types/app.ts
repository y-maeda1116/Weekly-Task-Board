/**
 * Application state type definitions
 */

import type { Task, TaskCategory } from './task';

/**
 * Application state interface
 * Represents the global state of the application
 */
export interface AppState {
  tasks: Task[];
  settings: import('./storage').Settings;
  currentDate: Date;
  categoryFilter: TaskCategory | '';
  selectedTaskId: string | null;
  isEditMode: boolean;
  isDarkTheme: boolean;
  dashboardVisible: boolean;
  templatePanelVisible: boolean;
  archiveVisible: boolean;
}

/**
 * Category time analysis result
 */
export interface CategoryAnalysis {
  categories: Record<string, CategoryTimeData>;
  total_estimated_time: number;
  total_actual_time: number;
}

/**
 * Category time data
 */
export interface CategoryTimeData {
  estimated_time: number;
  actual_time: number;
  completed_count: number;
  task_count: number;
}

/**
 * Completion rate result
 */
export interface CompletionRate {
  completion_rate: number;
  completed_tasks: number;
  total_tasks: number;
}

/**
 * Daily work time result
 */
export interface DailyWorkTime {
  daily_breakdown: Record<string, DailyWorkTimeData>;
  total_estimated_time: number;
  total_actual_time: number;
}

/**
 * Daily work time data
 */
export interface DailyWorkTimeData {
  date: string;
  day_name: string;
  estimated_time: number;
  actual_time: number;
  completed_count: number;
  task_count: number;
}

/**
 * Statistics summary
 */
export interface StatisticsSummary {
  completionRate: CompletionRate;
  categoryAnalysis: CategoryAnalysis;
  dailyWorkTime: DailyWorkTime;
}

/**
 * Week navigation options
 */
export interface WeekNavigation {
  currentDate: Date;
  offset: number;
}

/**
 * Template interface
 */
export interface TaskTemplate {
  id: string;
  name: string;
  estimated_time: number;
  priority: import('./task').TaskPriority;
  category: TaskCategory;
  details: string;
  created_at: string;
  usage_count: number;
  last_used_at: string | null;
}

/**
 * Template sort options
 */
export type TemplateSortOption = 'recent' | 'name' | 'usage';

/**
 * Archive task interface
 * Extends Task with archive metadata
 */
export interface ArchivedTask extends Task {
  archivedAt: string;
  completedAt: string;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';
