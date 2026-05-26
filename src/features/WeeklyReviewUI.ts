import { getMonday, formatDate } from '../utils/date';
import {
  computeWeekStats,
  computeJournalTimeStats,
  getCompletedTasksForWeek,
  generateMarkdownReport,
  exportToClipboard,
  formatHours,
} from './WeeklyReview';
import type { WeekStats, JournalTimeStats, PerTaskTimeEntry } from './WeeklyReview';
import type { Task } from '../types';

const SIGNIFIER_SYMBOLS: Record<string, string> = {
  task: '・',
  note: '－',
  important: '！',
  consider: '？',
  idea: '☁',
};

const MAX_ACHIEVEMENTS = 3;
const EXPORT_SUCCESS_DURATION_MS = 2000;

let selectedAchievements: string[] = [];

function getWeekRange(currentDate: Date): { start: string; end: string } {
  const monday = getMonday(currentDate);
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  return { start: formatDate(monday), end: formatDate(end) };
}

function clearChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

interface StatCard {
  label: string;
  value: string;
  color: string;
}

function createStatCards(stats: WeekStats): StatCard[] {
  return [
    { label: '完了率', value: stats.completionRate + '%', color: '#27ae60' },
    { label: '完了タスク', value: stats.completedTasks + '/' + stats.totalTasks, color: '#3498db' },
    { label: '見積時間', value: formatHours(stats.totalEstimatedTime), color: '#f39c12' },
    { label: '実績時間', value: formatHours(stats.totalActualTime), color: '#9b59b6' },
  ];
}

function renderStats(stats: WeekStats): void {
  const container = document.getElementById('review-stats');
  if (!container) return;

  clearChildren(container);

  const cards = createStatCards(stats);
  for (const c of cards) {
    const card = document.createElement('div');
    card.className = 'review-stat-card';
    card.style.background = 'linear-gradient(135deg, ' + c.color + ', ' + c.color + 'cc)';

    const value = document.createElement('span');
    value.className = 'review-stat-value';
    value.textContent = c.value;

    const label = document.createElement('span');
    label.className = 'review-stat-label';
    label.textContent = c.label;

    card.appendChild(value);
    card.appendChild(label);
    container.appendChild(card);
  }
}

function renderJournalTime(journalStats: JournalTimeStats): void {
  const container = document.getElementById('review-journal-time');
  if (!container) return;

  clearChildren(container);

  const totalEl = document.createElement('div');
  totalEl.className = 'review-journal-total';
  totalEl.textContent = '⏱ ジャーナル作業時間: ' + formatHours(journalStats.totalWorkMinutes / 60);
  container.appendChild(totalEl);

  const days = Object.keys(journalStats.perDayMinutes).sort();
  if (days.length === 0) return;

  const dayList = document.createElement('div');
  dayList.className = 'review-journal-days';

  for (const dateStr of days) {
    const minutes = journalStats.perDayMinutes[dateStr];
    const item = document.createElement('div');
    item.className = 'review-journal-day-item';
    item.textContent = dateStr + ': ' + formatHours(minutes / 60);
    dayList.appendChild(item);
  }

  container.appendChild(dayList);
}

function createAchievementCheckbox(
  task: Task,
  item: HTMLElement,
): HTMLInputElement {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.dataset.taskId = task.id;

  cb.addEventListener('change', () => {
    if (cb.checked) {
      if (selectedAchievements.length >= MAX_ACHIEVEMENTS) {
        cb.checked = false;
        return;
      }
      selectedAchievements = [...selectedAchievements, task.id];
      item.classList.add('selected');
    } else {
      selectedAchievements = selectedAchievements.filter((id) => id !== task.id);
      item.classList.remove('selected');
    }
  });

  return cb;
}

function renderAchievementSelector(completedTasks: Task[]): void {
  const container = document.getElementById('review-achievement-list');
  if (!container) return;

  clearChildren(container);

  if (completedTasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'review-hint';
    empty.textContent = '完了タスクがありません';
    container.appendChild(empty);
    return;
  }

  for (const task of completedTasks) {
    const item = document.createElement('div');
    item.className = 'review-achievement-item';
    item.dataset.taskId = task.id;

    const cb = createAchievementCheckbox(task, item);

    const sig = task.signifier ? SIGNIFIER_SYMBOLS[task.signifier] + ' ' : '';
    const timeStr = task.actual_time > 0 ? ' (' + formatHours(task.actual_time) + ')' : '';

    const label = document.createElement('span');
    label.textContent = sig + task.name + timeStr;

    item.appendChild(cb);
    item.appendChild(label);
    item.addEventListener('click', (e) => {
      if (e.target !== cb) cb.click();
    });

    container.appendChild(item);
  }
}

function createTableHeader(): HTMLTableSectionElement {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Task', 'Est', 'Actual', 'Status'];

  for (const text of headers) {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  return thead;
}

function createTaskRow(entry: PerTaskTimeEntry): HTMLTableRowElement {
  const row = document.createElement('tr');
  const sig = entry.signifier ? SIGNIFIER_SYMBOLS[entry.signifier] + ' ' : '';

  const nameCell = document.createElement('td');
  nameCell.textContent = sig + entry.taskName;

  const estCell = document.createElement('td');
  estCell.textContent = formatHours(entry.estimated);

  const actCell = document.createElement('td');
  actCell.textContent = formatHours(entry.actual);

  const statusCell = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = 'review-status-badge ' + (entry.completed ? 'completed' : 'in-progress');
  badge.textContent = entry.completed ? 'Done' : 'WIP';
  statusCell.appendChild(badge);

  row.appendChild(nameCell);
  row.appendChild(estCell);
  row.appendChild(actCell);
  row.appendChild(statusCell);
  return row;
}

function renderTaskTimeTable(perTaskTime: PerTaskTimeEntry[]): void {
  const container = document.getElementById('review-task-time-table');
  if (!container) return;

  clearChildren(container);

  if (perTaskTime.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'review-hint';
    empty.textContent = 'タスクがありません';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'review-task-time-table';
  table.appendChild(createTableHeader());

  const tbody = document.createElement('tbody');
  const sorted = [...perTaskTime].sort((a, b) => (b.actual || 0) - (a.actual || 0));

  for (const entry of sorted) {
    tbody.appendChild(createTaskRow(entry));
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

function openReviewPanel(): void {
  const panel = document.getElementById('review-panel');
  if (!panel) return;

  const currentDate = (window as unknown as { currentDate?: Date }).currentDate ?? new Date();
  const range = getWeekRange(currentDate);
  const stats = computeWeekStats(range.start, range.end);
  const journalStats = computeJournalTimeStats(range.start, range.end);
  const completed = getCompletedTasksForWeek(range.start, range.end);

  selectedAchievements = [];

  renderStats(stats);
  renderJournalTime(journalStats);
  renderAchievementSelector(completed);
  renderTaskTimeTable(stats.perTaskTime);

  const rangeEl = document.getElementById('review-week-range');
  if (rangeEl) rangeEl.textContent = range.start + ' ~ ' + range.end;

  panel.style.display = 'block';
}

function closeReviewPanel(): void {
  const panel = document.getElementById('review-panel');
  if (panel) panel.style.display = 'none';
}

function handleExport(): void {
  const currentDate = (window as unknown as { currentDate?: Date }).currentDate ?? new Date();
  const range = getWeekRange(currentDate);
  const markdown = generateMarkdownReport(range.start, range.end, selectedAchievements);

  void exportToClipboard(markdown).then(() => {
    const btn = document.getElementById('review-export-btn');
    if (!btn) return;

    const originalText = btn.textContent ?? '';
    btn.textContent = '✓ コピー済み!';
    btn.style.background = '#27ae60';
    btn.style.color = '#fff';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
    }, EXPORT_SUCCESS_DURATION_MS);
  });
}

function initialize(): void {
  const toggleBtn = document.getElementById('review-toggle');
  const closeBtn = document.getElementById('close-review');
  const exportBtn = document.getElementById('review-export-btn');

  if (toggleBtn) toggleBtn.addEventListener('click', openReviewPanel);
  if (closeBtn) closeBtn.addEventListener('click', closeReviewPanel);
  if (exportBtn) exportBtn.addEventListener('click', handleExport);

  const panel = document.getElementById('review-panel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (e.target === panel) closeReviewPanel();
    });
  }
}

export {
  openReviewPanel,
  closeReviewPanel,
  initialize,
  renderStats,
  renderJournalTime,
  renderAchievementSelector,
  renderTaskTimeTable,
  handleExport,
};
