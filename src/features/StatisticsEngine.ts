import type { Task, TimeOverrunSeverity } from '../types';
import { TaskCategory } from '../types';
import type { CategoryInfo, TaskCategories } from '../types/task';
import { getMonday, formatDate } from '../utils/date';
import { TASK_CATEGORIES } from '../constants/taskCategories';
import { validateCategory, getTimeOverrunSeverity } from '../utils/validation';
import { TaskStorage } from '../utils/storage';

interface CompletionRateResult {
  week_start: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  is_valid: boolean;
  error?: string;
}

interface CategoryBreakdownEntry {
  name: string;
  estimated_time: number;
  actual_time: number;
  variance: number;
  task_count: number;
  completed_count: number;
}

interface CategoryTimeAnalysisResult {
  week_start: string;
  categories: Record<string, CategoryBreakdownEntry>;
  total_estimated_time: number;
  total_actual_time: number;
  is_valid: boolean;
  error?: string;
}

interface DailyBreakdownEntry {
  date: string;
  day_name: string;
  estimated_time: number;
  actual_time: number;
  variance: number;
  task_count: number;
  completed_count: number;
}

interface DailyWorkTimeResult {
  week_start: string;
  daily_breakdown: Record<string, DailyBreakdownEntry>;
  total_estimated_time: number;
  total_actual_time: number;
  is_valid: boolean;
  error?: string;
}

interface OverrunTask {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  overrun_time: number;
  overrun_percentage: number;
  severity: TimeOverrunSeverity;
}

interface EstimatedVsActualResult {
  week_start: string;
  total_estimated_time: number;
  total_actual_time: number;
  total_variance: number;
  variance_percentage: number;
  overrun_tasks: OverrunTask[];
  on_track_tasks: number;
  overrun_task_count: number;
  estimation_accuracy: number;
  is_valid: boolean;
  error?: string;
}

function loadArchivedTasks(): Task[] {
  return TaskStorage.loadArchivedTasks() as unknown as Task[];
}

function getWeekBounds(monday: Date): { weekStartStr: string; endOfWeekStr: string } {
  const weekStartStr = formatDate(monday);
  const endOfWeek = new Date(monday);
  endOfWeek.setDate(monday.getDate() + 6);
  return { weekStartStr, endOfWeekStr: formatDate(endOfWeek) };
}

function isInWeek(assignedDate: string | null, weekStart: string, weekEnd: string): boolean {
  return !!assignedDate && assignedDate >= weekStart && assignedDate <= weekEnd;
}

function makeCategoryEntry(name: string): CategoryBreakdownEntry {
  return {
    name,
    estimated_time: 0,
    actual_time: 0,
    variance: 0,
    task_count: 0,
    completed_count: 0,
  };
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveMonday(weekStartDate: Date | null, currentDate: Date): Date {
  return weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
}

function completionRateError(currentDate: Date): CompletionRateResult {
  return {
    week_start: formatDate(getMonday(currentDate)),
    total_tasks: 0,
    completed_tasks: 0,
    completion_rate: 0,
    is_valid: false,
    error: '完了率計算エラー',
  };
}

export function calculateCompletionRate(
  tasks: Task[],
  currentDate: Date,
  weekStartDate: Date | null = null,
): CompletionRateResult {
  try {
    const monday = resolveMonday(weekStartDate, currentDate);
    const { weekStartStr, endOfWeekStr } = getWeekBounds(monday);

    let totalTasks = 0;
    let completedTasks = 0;

    for (const task of tasks) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        totalTasks++;
        if (task.completed) completedTasks++;
      }
    }

    const archived = loadArchivedTasks();
    for (const task of archived) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        totalTasks++;
        completedTasks++;
      }
    }

    const completionRate = totalTasks > 0 ? roundTo2((completedTasks / totalTasks) * 100) : 0;

    return {
      week_start: weekStartStr,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: completionRate,
      is_valid: true,
    };
  } catch {
    return completionRateError(currentDate);
  }
}

export function getCompletionRateForWeek(
  tasks: Task[],
  currentDate: Date,
  weeksOffset: number = 0,
): CompletionRateResult {
  const targetDate = new Date(currentDate);
  const monday = getMonday(targetDate);
  monday.setDate(monday.getDate() + weeksOffset * 7);
  return calculateCompletionRate(tasks, currentDate, monday);
}

function initCategoryBreakdown(): Record<string, CategoryBreakdownEntry> {
  const breakdown: Record<string, CategoryBreakdownEntry> = {};
  for (const key of Object.keys(TASK_CATEGORIES) as TaskCategory[]) {
    breakdown[key] = makeCategoryEntry(TASK_CATEGORIES[key].name);
  }
  return breakdown;
}

function ensureCategoryEntry(
  breakdown: Record<string, CategoryBreakdownEntry>,
  categoryKey: string,
): void {
  if (!breakdown[categoryKey]) {
    const info = TASK_CATEGORIES[categoryKey as keyof TaskCategories];
    breakdown[categoryKey] = makeCategoryEntry(info?.name ?? categoryKey);
  }
}

function accumulateCategoryFromTask(
  breakdown: Record<string, CategoryBreakdownEntry>,
  task: Task,
  countAsCompleted: boolean,
): void {
  const category = validateCategory(task.category);
  ensureCategoryEntry(breakdown, category);
  const entry = breakdown[category]!;
  entry.estimated_time += task.estimated_time || 0;
  entry.actual_time += task.actual_time || 0;
  entry.task_count++;
  if (countAsCompleted || task.completed) entry.completed_count++;
}

export function calculateCategoryTimeAnalysis(
  tasks: Task[],
  currentDate: Date,
  weekStartDate: Date | null = null,
): CategoryTimeAnalysisResult {
  try {
    const monday = resolveMonday(weekStartDate, currentDate);
    const { weekStartStr, endOfWeekStr } = getWeekBounds(monday);

    const categoryBreakdown = initCategoryBreakdown();

    for (const task of tasks) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        accumulateCategoryFromTask(categoryBreakdown, task, false);
      }
    }

    const archived = loadArchivedTasks();
    for (const task of archived) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        accumulateCategoryFromTask(categoryBreakdown, task, true);
      }
    }

    let totalEstimated = 0;
    let totalActual = 0;
    for (const key of Object.keys(categoryBreakdown)) {
      const entry = categoryBreakdown[key]!;
      entry.variance = roundTo2(entry.actual_time - entry.estimated_time);
      totalEstimated += entry.estimated_time;
      totalActual += entry.actual_time;
    }

    return {
      week_start: weekStartStr,
      categories: categoryBreakdown,
      total_estimated_time: roundTo2(totalEstimated),
      total_actual_time: roundTo2(totalActual),
      is_valid: true,
    };
  } catch {
    return {
      week_start: formatDate(getMonday(currentDate)),
      categories: {},
      total_estimated_time: 0,
      total_actual_time: 0,
      is_valid: false,
      error: 'カテゴリ別時間分析エラー',
    };
  }
}

const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'] as const;

function initDailyBreakdown(monday: Date): Record<string, DailyBreakdownEntry> {
  const breakdown: Record<string, DailyBreakdownEntry> = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);
    breakdown[dateStr] = {
      date: dateStr,
      day_name: DAY_NAMES[i]!,
      estimated_time: 0,
      actual_time: 0,
      variance: 0,
      task_count: 0,
      completed_count: 0,
    };
  }
  return breakdown;
}

function accumulateDailyFromTask(
  breakdown: Record<string, DailyBreakdownEntry>,
  task: Task,
  countAsCompleted: boolean,
): void {
  const dateStr = task.assigned_date;
  if (!dateStr || !breakdown[dateStr]) return;
  const entry = breakdown[dateStr];
  entry.estimated_time += task.estimated_time || 0;
  entry.actual_time += task.actual_time || 0;
  entry.task_count++;
  if (countAsCompleted || task.completed) entry.completed_count++;
}

export function calculateDailyWorkTime(
  tasks: Task[],
  currentDate: Date,
  weekStartDate: Date | null = null,
): DailyWorkTimeResult {
  try {
    const monday = resolveMonday(weekStartDate, currentDate);
    const { weekStartStr, endOfWeekStr } = getWeekBounds(monday);
    const dailyBreakdown = initDailyBreakdown(monday);

    for (const task of tasks) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        accumulateDailyFromTask(dailyBreakdown, task, false);
      }
    }

    const archived = loadArchivedTasks();
    for (const task of archived) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        accumulateDailyFromTask(dailyBreakdown, task, true);
      }
    }

    let totalEstimated = 0;
    let totalActual = 0;
    for (const key of Object.keys(dailyBreakdown)) {
      const day = dailyBreakdown[key]!;
      day.variance = roundTo2(day.actual_time - day.estimated_time);
      totalEstimated += day.estimated_time;
      totalActual += day.actual_time;
    }

    return {
      week_start: weekStartStr,
      daily_breakdown: dailyBreakdown,
      total_estimated_time: roundTo2(totalEstimated),
      total_actual_time: roundTo2(totalActual),
      is_valid: true,
    };
  } catch {
    return {
      week_start: formatDate(getMonday(currentDate)),
      daily_breakdown: {},
      total_estimated_time: 0,
      total_actual_time: 0,
      is_valid: false,
      error: '日別作業時間計算エラー',
    };
  }
}

export function calculateEstimatedVsActualAnalysis(
  tasks: Task[],
  currentDate: Date,
  weekStartDate: Date | null = null,
): EstimatedVsActualResult {
  try {
    const monday = resolveMonday(weekStartDate, currentDate);
    const { weekStartStr, endOfWeekStr } = getWeekBounds(monday);

    let totalEstimated = 0;
    let totalActual = 0;
    let onTrackTasks = 0;
    const overrunTasks: OverrunTask[] = [];

    for (const task of tasks) {
      if (!isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) continue;

      const estimatedTime = task.estimated_time || 0;
      const actualTime = task.actual_time || 0;
      totalEstimated += estimatedTime;
      totalActual += actualTime;

      if (actualTime > estimatedTime) {
        overrunTasks.push({
          id: task.id,
          name: task.name,
          estimated_time: estimatedTime,
          actual_time: actualTime,
          overrun_time: roundTo2(actualTime - estimatedTime),
          overrun_percentage: roundTo2(
            estimatedTime > 0 ? ((actualTime - estimatedTime) / estimatedTime) * 100 : 0,
          ),
          severity: getTimeOverrunSeverity(estimatedTime, actualTime),
        });
      } else {
        onTrackTasks++;
      }
    }

    const archived = loadArchivedTasks();
    for (const task of archived) {
      if (isInWeek(task.assigned_date, weekStartStr, endOfWeekStr)) {
        totalEstimated += task.estimated_time || 0;
        totalActual += task.actual_time || 0;
        onTrackTasks++;
      }
    }

    const totalVariance = totalActual - totalEstimated;
    const variancePercentage =
      totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    let estimationAccuracy = 100;
    if (variancePercentage > 0) {
      estimationAccuracy = Math.max(0, 100 - variancePercentage);
    } else if (variancePercentage < 0) {
      estimationAccuracy = Math.max(0, 100 + variancePercentage / 2);
    }

    return {
      week_start: weekStartStr,
      total_estimated_time: roundTo2(totalEstimated),
      total_actual_time: roundTo2(totalActual),
      total_variance: roundTo2(totalVariance),
      variance_percentage: roundTo2(variancePercentage),
      overrun_tasks: overrunTasks,
      on_track_tasks: onTrackTasks,
      overrun_task_count: overrunTasks.length,
      estimation_accuracy: roundTo2(estimationAccuracy),
      is_valid: true,
    };
  } catch {
    return {
      week_start: formatDate(getMonday(currentDate)),
      total_estimated_time: 0,
      total_actual_time: 0,
      total_variance: 0,
      variance_percentage: 0,
      overrun_tasks: [],
      on_track_tasks: 0,
      overrun_task_count: 0,
      estimation_accuracy: 0,
      is_valid: false,
      error: '見積もり vs 実績分析エラー',
    };
  }
}
