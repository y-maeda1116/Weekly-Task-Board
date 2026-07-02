import type { Task } from '../types';
import type { CategoryInfo } from '../types';
import { getMonday, formatDate } from '../utils/date';
import { loadTasksFromStorage } from '../app/storage';
import { TASK_CATEGORIES } from '../constants/taskCategories';
import { StorageService } from '../utils/storage';
import { StorageKeys } from '../types';

interface CompletionRateResult {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  is_valid: boolean;
}

interface CategoryBucket {
  task_count: number;
  completed_count: number;
  estimated_time: number;
  actual_time: number;
}

interface CategoryAnalysis {
  categories: Record<string, CategoryBucket>;
  total_estimated_time: number;
  total_actual_time: number;
}

interface DayEntry {
  day_name: string;
  estimated_time: number;
  actual_time: number;
  task_count: number;
  completed_count: number;
}

interface DailyWorkTime {
  daily_breakdown: Record<string, DayEntry>;
}

function loadAllTasks(): Task[] {
  const active = loadTasksFromStorage();
  const archivedRaw = StorageService.getItem<string>(StorageKeys.ARCHIVE);
  let archived: Task[] = [];
  if (archivedRaw) {
    try {
      archived = JSON.parse(archivedRaw) as Task[];
    } catch {
      archived = [];
    }
  }
  return [...active, ...archived];
}

function getCategoryInfo(categoryKey: string): CategoryInfo {
  return TASK_CATEGORIES[categoryKey as keyof typeof TASK_CATEGORIES]
    ?? TASK_CATEGORIES['task'];
}

function filterWeekTasks(tasks: Task[], targetDate: Date): Task[] {
  const monday = getMonday(targetDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = formatDate(monday);
  const sundayStr = formatDate(sunday);
  return tasks.filter(
    (t) => t.assigned_date !== null && t.assigned_date >= mondayStr && t.assigned_date <= sundayStr,
  );
}

export function calculateCompletionRateForDate(
  tasks: Task[],
  targetDate: Date,
): CompletionRateResult {
  const weekTasks = filterWeekTasks(tasks, targetDate);
  const completedCount = weekTasks.filter((t) => t.completed).length;
  const completionRate =
    weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
  return {
    total_tasks: weekTasks.length,
    completed_tasks: completedCount,
    completion_rate: completionRate,
    is_valid: true,
  };
}

export function calculateCategoryTimeAnalysisForDate(
  tasks: Task[],
  targetDate: Date,
): CategoryAnalysis {
  const weekTasks = filterWeekTasks(tasks, targetDate);
  const categories: Record<string, CategoryBucket> = {};
  let totalEstimated = 0;
  let totalActual = 0;

  for (const task of weekTasks) {
    const cat = task.category || 'task';
    if (!categories[cat]) {
      categories[cat] = { task_count: 0, completed_count: 0, estimated_time: 0, actual_time: 0 };
    }
    categories[cat].task_count++;
    if (task.completed) categories[cat].completed_count++;
    categories[cat].estimated_time += task.estimated_time || 0;
    categories[cat].actual_time += task.actual_time || 0;
    totalEstimated += task.estimated_time || 0;
    totalActual += task.actual_time || 0;
  }

  return {
    categories,
    total_estimated_time: totalEstimated / 60,
    total_actual_time: totalActual / 60,
  };
}

export function calculateDailyWorkTimeForDate(
  tasks: Task[],
  targetDate: Date,
): DailyWorkTime {
  const monday = getMonday(targetDate);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dailyBreakdown: Record<string, DayEntry> = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);

    const dayTasks = tasks.filter((t) => t.assigned_date === dateStr);
    const totalEst = dayTasks.reduce((s, t) => s + (t.estimated_time || 0), 0);
    const totalAct = dayTasks.reduce((s, t) => s + (t.actual_time || 0), 0);
    const completedCount = dayTasks.filter((t) => t.completed).length;

    dailyBreakdown[dateStr] = {
      // dayNames は7要素固定、date.getDay() は 0-6 のため存在が保証される
      day_name: dayNames[date.getDay()]!,
      estimated_time: totalEst / 60,
      actual_time: totalAct / 60,
      task_count: dayTasks.length,
      completed_count: completedCount,
    };
  }

  return { daily_breakdown: dailyBreakdown };
}

export function updateCategoryBreakdown(categoryAnalysis: CategoryAnalysis): void {
  const container = document.getElementById('category-breakdown');
  if (!container) return;
  container.textContent = '';

  for (const [categoryKey, category] of Object.entries(categoryAnalysis.categories)) {
    if (category.task_count === 0) continue;

    const info = getCategoryInfo(categoryKey);
    const rate =
      category.task_count > 0
        ? Math.round((category.completed_count / category.task_count) * 100)
        : 0;

    const item = document.createElement('div');
    item.className = 'category-item';
    item.style.borderLeftColor = info.color;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'category-item-name';
    nameDiv.style.color = info.color;
    nameDiv.textContent = info.name;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'category-item-stats';

    appendStatPair(statsDiv, '見積', category.estimated_time.toFixed(1) + 'h');
    appendStatPair(statsDiv, '実績', category.actual_time.toFixed(1) + 'h');
    appendStatPair(statsDiv, '完了率', rate + '%');
    appendStatPair(statsDiv, 'タスク数', `${category.completed_count}/${category.task_count}`);

    item.appendChild(nameDiv);
    item.appendChild(statsDiv);
    container.appendChild(item);
  }
}

function appendStatPair(
  parent: HTMLElement,
  label: string,
  value: string,
): void {
  const stat = document.createElement('div');
  stat.className = 'category-item-stat';
  const lbl = document.createElement('div');
  lbl.className = 'category-item-stat-label';
  lbl.textContent = label;
  const val = document.createElement('div');
  val.className = 'category-item-stat-value';
  val.textContent = value;
  stat.appendChild(lbl);
  stat.appendChild(val);
  parent.appendChild(stat);
}

export function updateDailyBreakdown(dailyWorkTime: DailyWorkTime | null): void {
  const container = document.getElementById('daily-breakdown');
  if (!container) return;
  container.textContent = '';
  if (!dailyWorkTime) return;

  const dailyData = dailyWorkTime.daily_breakdown;

  for (const [dateStr, day] of Object.entries(dailyData)) {
    const date = new Date(dateStr);
    const dateFormatted = `${date.getMonth() + 1}/${date.getDate()}`;

    const estimated = day.estimated_time || 0;
    const actual = day.actual_time || 0;
    const variance = actual - estimated;
    const varianceClass = variance > 0 ? 'overrun' : variance < 0 ? 'underrun' : 'match';
    const varianceText =
      variance > 0 ? '+' + variance.toFixed(1) + 'h' : variance.toFixed(1) + 'h';

    const dailyItem = document.createElement('div');
    dailyItem.className = 'daily-item';

    const dayDiv = document.createElement('div');
    dayDiv.className = 'daily-item-day';
    dayDiv.textContent = (day.day_name || '') + '曜日';

    const dateDiv = document.createElement('div');
    dateDiv.className = 'daily-item-date';
    dateDiv.textContent = dateFormatted;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'daily-item-stats';

    appendDailyStat(statsDiv, '見積', estimated.toFixed(1) + 'h');
    appendDailyStat(statsDiv, '実績', actual.toFixed(1) + 'h');

    const varStat = document.createElement('div');
    varStat.className = 'daily-item-stat';
    const varLbl = document.createElement('span');
    varLbl.className = 'daily-item-stat-label';
    varLbl.textContent = '差分';
    const varVal = document.createElement('span');
    varVal.className = 'daily-item-stat-value time-' + varianceClass;
    varVal.textContent = varianceText;
    varStat.appendChild(varLbl);
    varStat.appendChild(varVal);
    statsDiv.appendChild(varStat);

    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'daily-item-tasks';
    tasksDiv.textContent = `完了: ${day.completed_count || 0}/${day.task_count || 0}`;

    dailyItem.appendChild(dayDiv);
    dailyItem.appendChild(dateDiv);
    dailyItem.appendChild(statsDiv);
    dailyItem.appendChild(tasksDiv);
    container.appendChild(dailyItem);
  }
}

function appendDailyStat(
  parent: HTMLElement,
  label: string,
  value: string,
): void {
  const stat = document.createElement('div');
  stat.className = 'daily-item-stat';
  const lbl = document.createElement('span');
  lbl.className = 'daily-item-stat-label';
  lbl.textContent = label;
  const val = document.createElement('span');
  val.className = 'daily-item-stat-value';
  val.textContent = value;
  stat.appendChild(lbl);
  stat.appendChild(val);
  parent.appendChild(stat);
}

export function updateDashboard(): void {
  try {
    const picker = document.getElementById('dashboard-date-picker') as HTMLInputElement | null;
    const targetDate = picker?.value ? new Date(picker.value + 'T00:00:00') : new Date();

    const allTasks = loadAllTasks();
    const completionRate = calculateCompletionRateForDate(allTasks, targetDate);
    const categoryAnalysis = calculateCategoryTimeAnalysisForDate(allTasks, targetDate);
    const dailyWorkTime = calculateDailyWorkTimeForDate(allTasks, targetDate);

    const rateEl = document.getElementById('completion-rate-value');
    if (rateEl) rateEl.textContent = completionRate.completion_rate + '%';

    const completedEl = document.getElementById('completed-tasks-value');
    if (completedEl)
      completedEl.textContent = `${completionRate.completed_tasks}/${completionRate.total_tasks}`;

    const estEl = document.getElementById('estimated-time-value');
    if (estEl) {
      const h = Math.floor(categoryAnalysis.total_estimated_time);
      const m = Math.round((categoryAnalysis.total_estimated_time % 1) * 60);
      estEl.textContent = `${h}h ${m}m`;
    }

    const actEl = document.getElementById('actual-time-value');
    if (actEl) {
      const h = Math.floor(categoryAnalysis.total_actual_time);
      const m = Math.round((categoryAnalysis.total_actual_time % 1) * 60);
      actEl.textContent = `${h}h ${m}m`;
    }

    updateCategoryBreakdown(categoryAnalysis);
    updateDailyBreakdown(dailyWorkTime);
  } catch (error) {
    console.error('ダッシュボード更新エラー:', error);
  }
}

export function initializeDashboardToggle(): void {
  const toggleBtn = document.getElementById('statistics-toggle');
  const panel = document.getElementById('dashboard-panel');
  const closeBtn = document.getElementById('close-dashboard');
  const picker = document.getElementById('dashboard-date-picker') as HTMLInputElement | null;
  const prevBtn = document.getElementById('dashboard-prev-week');
  const nextBtn = document.getElementById('dashboard-next-week');

  if (!toggleBtn || !panel) return;

  let weekOffset = 0;

  const updatePickerDisplay = (): void => {
    if (!picker) return;
    const monday = getMonday(new Date());
    const weekMonday = new Date(monday);
    weekMonday.setDate(monday.getDate() + weekOffset * 7);
    picker.value = formatDate(weekMonday);
  };

  toggleBtn.addEventListener('click', () => {
    panel.style.display = 'block';
    weekOffset = 0;
    updatePickerDisplay();
    updateDashboard();
  });

  closeBtn?.addEventListener('click', () => {
    panel.style.display = 'none';
  });

  prevBtn?.addEventListener('click', () => {
    weekOffset--;
    updatePickerDisplay();
    updateDashboard();
  });

  nextBtn?.addEventListener('click', () => {
    weekOffset++;
    updatePickerDisplay();
    updateDashboard();
  });

  panel.addEventListener('click', (e: MouseEvent) => {
    if (e.target === panel) panel.style.display = 'none';
  });
}
