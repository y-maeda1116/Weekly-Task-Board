/**
 * Statistics calculation utilities
 */

import type {
  Task,
  CompletionRate,
  CategoryAnalysis,
  CategoryTimeData,
  DailyWorkTime,
  DailyWorkTimeData
} from '../types';
import { getCategoryInfo } from './validation';
import { getMonday, formatDate } from './date';
import type { TaskCategory } from '../types';

/**
 * Calculate completion rate for a specific date's week
 * @param targetDate - The date to calculate completion rate for
 * @param tasks - All tasks
 * @returns Completion rate object
 */
export function calculateCompletionRateForDate(targetDate: Date, tasks: Task[]): CompletionRate {
  const weekMonday = getMonday(targetDate);
  const weekSunday = new Date(weekMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);

  const weekTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    return taskDate >= weekMonday && taskDate <= weekSunday;
  });

  const totalTasks = weekTasks.length;
  const completedTasks = weekTasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completion_rate: completionRate,
    completed_tasks: completedTasks,
    total_tasks: totalTasks
  };
}

/**
 * Calculate category time analysis for a specific date's week
 * @param targetDate - The date to calculate analysis for
 * @param tasks - All tasks
 * @returns Category analysis object
 */
export function calculateCategoryTimeAnalysisForDate(targetDate: Date, tasks: Task[]): CategoryAnalysis {
  const weekMonday = getMonday(targetDate);
  const weekSunday = new Date(weekMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);

  const weekTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    return taskDate >= weekMonday && taskDate <= weekSunday;
  });

  const categories: Record<string, CategoryTimeData> = {};
  let totalEstimatedTime = 0;
  let totalActualTime = 0;

  // Initialize all categories
  Object.values(TaskCategory).forEach(category => {
    categories[category] = {
      estimated_time: 0,
      actual_time: 0,
      completed_count: 0,
      task_count: 0
    };
  });

  weekTasks.forEach(task => {
    const category = task.category || 'task';
    if (!categories[category]) {
      categories[category] = {
        estimated_time: 0,
        actual_time: 0,
        completed_count: 0,
        task_count: 0
      };
    }

    categories[category].estimated_time += task.estimated_time;
    categories[category].actual_time += task.actual_time;
    categories[category].task_count += 1;
    if (task.completed) {
      categories[category].completed_count += 1;
    }

    totalEstimatedTime += task.estimated_time;
    totalActualTime += task.actual_time;
  });

  return {
    categories,
    total_estimated_time: totalEstimatedTime,
    total_actual_time: totalActualTime
  };
}

/**
 * Calculate daily work time for a specific date's week
 * @param targetDate - The date to calculate daily work time for
 * @param tasks - All tasks
 * @returns Daily work time object
 */
export function calculateDailyWorkTimeForDate(targetDate: Date, tasks: Task[]): DailyWorkTime {
  const weekMonday = getMonday(targetDate);
  const weekSunday = new Date(weekMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);

  const dailyBreakdown: Record<string, DailyWorkTimeData> = {};
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekdayNames = ['月', '火', '水', '木', '金', '土', '日'];

  let totalEstimatedTime = 0;
  let totalActualTime = 0;

  // Initialize all days of the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekMonday);
    date.setDate(date.getDate() + i);
    const dateStr = formatDate(date);

    dailyBreakdown[dateStr] = {
      date: dateStr,
      day_name: weekdayNames[i],
      estimated_time: 0,
      actual_time: 0,
      completed_count: 0,
      task_count: 0
    };
  }

  // Aggregate tasks by day
  tasks.forEach(task => {
    const taskDate = new Date(task.date);
    const dateStr = formatDate(taskDate);

    if (dailyBreakdown[dateStr]) {
      dailyBreakdown[dateStr].estimated_time += task.estimated_time;
      dailyBreakdown[dateStr].actual_time += task.actual_time;
      dailyBreakdown[dateStr].task_count += 1;
      if (task.completed) {
        dailyBreakdown[dateStr].completed_count += 1;
      }

      totalEstimatedTime += task.estimated_time;
      totalActualTime += task.actual_time;
    }
  });

  return {
    daily_breakdown: dailyBreakdown,
    total_estimated_time: totalEstimatedTime,
    total_actual_time: totalActualTime
  };
}

/**
 * Calculate completion rate for all tasks
 * @param tasks - All tasks
 * @returns Completion rate object
 */
export function calculateCompletionRate(tasks: Task[]): CompletionRate {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completion_rate: completionRate,
    completed_tasks: completedTasks,
    total_tasks: totalTasks
  };
}

/**
 * Calculate category time analysis for all tasks
 * @param tasks - All tasks
 * @returns Category analysis object
 */
export function calculateCategoryTimeAnalysis(tasks: Task[]): CategoryAnalysis {
  const categories: Record<string, CategoryTimeData> = {};
  let totalEstimatedTime = 0;
  let totalActualTime = 0;

  // Initialize all categories
  Object.values(TaskCategory).forEach(category => {
    categories[category] = {
      estimated_time: 0,
      actual_time: 0,
      completed_count: 0,
      task_count: 0
    };
  });

  tasks.forEach(task => {
    const category = task.category || 'task';
    if (!categories[category]) {
      categories[category] = {
        estimated_time: 0,
        actual_time: 0,
        completed_count: 0,
        task_count: 0
      };
    }

    categories[category].estimated_time += task.estimated_time;
    categories[category].actual_time += task.actual_time;
    categories[category].task_count += 1;
    if (task.completed) {
      categories[category].completed_count += 1;
    }

    totalEstimatedTime += task.estimated_time;
    totalActualTime += task.actual_time;
  });

  return {
    categories,
    total_estimated_time: totalEstimatedTime,
    total_actual_time: totalActualTime
  };
}

/**
 * Calculate daily work time for all tasks
 * @param tasks - All tasks
 * @returns Daily work time object
 */
export function calculateDailyWorkTime(tasks: Task[]): DailyWorkTime {
  const dailyBreakdown: Record<string, DailyWorkTimeData> = {};
  let totalEstimatedTime = 0;
  let totalActualTime = 0;

  // Aggregate tasks by day
  tasks.forEach(task => {
    const dateStr = task.date;

    if (!dailyBreakdown[dateStr]) {
      const taskDate = new Date(dateStr);
      const dayName = ['日', '月', '火', '水', '木', '金', '土'][taskDate.getDay()];

      dailyBreakdown[dateStr] = {
        date: dateStr,
        day_name: dayName,
        estimated_time: 0,
        actual_time: 0,
        completed_count: 0,
        task_count: 0
      };
    }

    dailyBreakdown[dateStr].estimated_time += task.estimated_time;
    dailyBreakdown[dateStr].actual_time += task.actual_time;
    dailyBreakdown[dateStr].task_count += 1;
    if (task.completed) {
      dailyBreakdown[dateStr].completed_count += 1;
    }

    totalEstimatedTime += task.estimated_time;
    totalActualTime += task.actual_time;
  });

  return {
    daily_breakdown: dailyBreakdown,
    total_estimated_time: totalEstimatedTime,
    total_actual_time: totalActualTime
  };
}

/**
 * Calculate time variance for a task
 * @param task - The task to calculate variance for
 * @returns Object with variance information
 */
export function calculateTimeVariance(task: Task): {
  variance: number;
  variancePercentage: number;
  isOver: boolean;
} {
  const variance = task.actual_time - task.estimated_time;
  const variancePercentage = task.estimated_time > 0
    ? (variance / task.estimated_time) * 100
    : 0;

  return {
    variance,
    variancePercentage,
    isOver: variance > 0
  };
}

/**
 * Get tasks by category
 * @param tasks - All tasks
 * @param category - The category to filter by
 * @returns Tasks filtered by category
 */
export function getTasksByCategory(tasks: Task[], category: TaskCategory | string): Task[] {
  return tasks.filter(task => task.category === category);
}

/**
 * Get completed tasks
 * @param tasks - All tasks
 * @returns Completed tasks
 */
export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.completed);
}

/**
 * Get incomplete tasks
 * @param tasks - All tasks
 * @returns Incomplete tasks
 */
export function getIncompleteTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed);
}

/**
 * Get tasks by date range
 * @param tasks - All tasks
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Tasks in the date range
 */
export function getTasksByDateRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
  return tasks.filter(task => {
    const taskDate = new Date(task.date);
    return taskDate >= startDate && taskDate <= endDate;
  });
}

/**
 * Sort tasks by estimated time
 * @param tasks - All tasks
 * @param ascending - Sort order
 * @returns Sorted tasks
 */
export function sortTasksByEstimatedTime(tasks: Task[], ascending: boolean = false): Task[] {
  return [...tasks].sort((a, b) =>
    ascending
      ? a.estimated_time - b.estimated_time
      : b.estimated_time - a.estimated_time
  );
}

/**
 * Sort tasks by actual time
 * @param tasks - All tasks
 * @param ascending - Sort order
 * @returns Sorted tasks
 */
export function sortTasksByActualTime(tasks: Task[], ascending: boolean = false): Task[] {
  return [...tasks].sort((a, b) =>
    ascending
      ? a.actual_time - b.actual_time
      : b.actual_time - a.actual_time
  );
}
