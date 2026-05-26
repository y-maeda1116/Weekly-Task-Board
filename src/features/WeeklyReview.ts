import type { Task, SignifierType } from '../types';
import type { DayJournal } from '../types/journal';
import { loadTasksFromStorage, loadJournals, StorageKeys, JOURNALS_STORAGE_KEY } from '../app/storage';

interface CategoryAgg {
  count: number;
  estimatedTime: number;
  actualTime: number;
}

export interface WeekStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalEstimatedTime: number;
  totalActualTime: number;
  categoryBreakdown: Record<string, CategoryAgg>;
  perTaskTime: PerTaskTimeEntry[];
}

export interface PerTaskTimeEntry {
  taskId: string;
  taskName: string;
  estimated: number;
  actual: number;
  signifier: SignifierType | null;
  completed: boolean;
  category: string;
}

export interface JournalTimeStats {
  totalWorkMinutes: number;
  perDayMinutes: Record<string, number>;
}

const SIGNIFIER_SYMBOLS: Record<string, string> = {
  task: '・',
  note: '－',
  important: '！',
  consider: '？',
  idea: '☁',
};

function computeWeekStats(weekStart: string, weekEnd: string): WeekStats {
  const tasks = loadTasksFromStorage();
  const inWeek = tasks.filter((t) =>
    t.assigned_date && t.assigned_date >= weekStart && t.assigned_date <= weekEnd,
  );

  const completed = inWeek.filter((t) => t.completed);
  let totalEstimated = 0;
  let totalActual = 0;
  const categoryMap: Record<string, CategoryAgg> = {};
  const perTaskTime: PerTaskTimeEntry[] = [];

  for (const t of inWeek) {
    totalEstimated += t.estimated_time || 0;
    totalActual += t.actual_time || 0;

    perTaskTime.push({
      taskId: t.id,
      taskName: t.name,
      estimated: t.estimated_time || 0,
      actual: t.actual_time || 0,
      signifier: t.signifier ?? null,
      completed: t.completed,
      category: t.category || 'task',
    });

    const cat = t.category || 'task';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, estimatedTime: 0, actualTime: 0 };
    }
    categoryMap[cat].count++;
    categoryMap[cat].estimatedTime += t.estimated_time || 0;
    categoryMap[cat].actualTime += t.actual_time || 0;
  }

  return {
    totalTasks: inWeek.length,
    completedTasks: completed.length,
    completionRate: inWeek.length > 0
      ? Math.round((completed.length / inWeek.length) * 100)
      : 0,
    totalEstimatedTime: Math.round(totalEstimated * 10) / 10,
    totalActualTime: Math.round(totalActual * 10) / 10,
    categoryBreakdown: categoryMap,
    perTaskTime,
  };
}

function computeJournalTimeStats(weekStart: string, weekEnd: string): JournalTimeStats {
  const journals: DayJournal[] = loadJournals();
  let totalMinutes = 0;
  const perDayMinutes: Record<string, number> = {};

  for (const day of journals) {
    if (day.date < weekStart || day.date > weekEnd) continue;

    let dayMinutes = 0;
    for (const entry of day.entries) {
      if (entry.completedAt && entry.startedAt) {
        const start = new Date(entry.startedAt).getTime();
        const end = new Date(entry.completedAt).getTime();
        const diff = Math.round((end - start) / 60000);
        if (diff > 0) dayMinutes += diff;
      }
    }

    if (dayMinutes > 0) {
      perDayMinutes[day.date] = dayMinutes;
      totalMinutes += dayMinutes;
    }
  }

  return { totalWorkMinutes: totalMinutes, perDayMinutes };
}

function getCompletedTasksForWeek(weekStart: string, weekEnd: string): Task[] {
  const tasks = loadTasksFromStorage();
  return tasks.filter(
    (t) =>
      t.completed &&
      t.assigned_date !== null &&
      t.assigned_date >= weekStart &&
      t.assigned_date <= weekEnd,
  );
}

export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 1) return Math.round(hours * 60) + 'm';
  if (hours % 1 === 0) return hours + 'h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
}

function generateMarkdownReport(
  weekStart: string,
  weekEnd: string,
  topTaskIds?: string[],
): string {
  const stats = computeWeekStats(weekStart, weekEnd);
  const journalStats = computeJournalTimeStats(weekStart, weekEnd);
  const topIdSet = new Set(topTaskIds ?? []);

  const lines: string[] = [];
  lines.push(`## Weekly Report (${weekStart} ~ ${weekEnd})`);
  lines.push('');
  lines.push('### Summary');
  lines.push(`- Completion rate: ${stats.completionRate}%`);
  lines.push(`- Completed: ${stats.completedTasks}/${stats.totalTasks}`);
  lines.push(`- Estimated time: ${formatHours(stats.totalEstimatedTime)}`);
  lines.push(`- Actual time: ${formatHours(stats.totalActualTime)}`);
  lines.push(`- Journal work time: ${formatHours(journalStats.totalWorkMinutes / 60)}`);
  lines.push('');

  const completedTasks = getCompletedTasksForWeek(weekStart, weekEnd);
  if (topTaskIds && topTaskIds.length > 0) {
    lines.push('### Top Achievements');
    for (const t of completedTasks) {
      if (topIdSet.has(t.id)) {
        const sig = t.signifier ? SIGNIFIER_SYMBOLS[t.signifier] + ' ' : '';
        lines.push(`- ${sig}${t.name} (${formatHours(t.actual_time)})`);
      }
    }
    lines.push('');
  }

  if (stats.perTaskTime.length > 0) {
    lines.push('### Per-Task Time');
    lines.push('| Task | Est | Actual | Status |');
    lines.push('|------|-----|--------|--------|');
    for (const t of stats.perTaskTime) {
      const sig = t.signifier ? SIGNIFIER_SYMBOLS[t.signifier] + ' ' : '';
      const status = t.completed ? 'Done' : 'In progress';
      lines.push(
        `| ${sig}${t.taskName} | ${formatHours(t.estimated)} | ${formatHours(t.actual)} | ${status} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

function exportToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export {
  computeWeekStats,
  computeJournalTimeStats,
  getCompletedTasksForWeek,
  generateMarkdownReport,
  exportToClipboard,
};
