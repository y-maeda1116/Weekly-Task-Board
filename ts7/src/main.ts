/**
 * TS7 Standalone Application
 * TypeScript 7.0 Beta — Full weekly task board without script.js
 */

// ── Hybrid modules ──
import '../../src/hybrid/TaskOperations';
import '../../src/hybrid/TaskFiltering';
import '../../src/hybrid/WeekNavigation';
import '../../src/hybrid/SignifierManager';
import '../../src/hybrid/TaskRendering';

// ── Types ──
type SignifierType = 'none' | 'task' | 'note' | 'important' | 'consider' | 'idea';

interface AppTask {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  date: string;
  assigned_date: string | null;
  details: string;
  signifier: SignifierType;
}

// ── Constants ──
const STORAGE_KEY = 'weekly-task-board.tasks';

const SIGNIFIER_SYMBOLS: Record<SignifierType, string> = {
  none: '\u2B1C',
  task: '\u2705',
  note: '\uD83D\uDCDD',
  important: '\u2757',
  consider: '\uD83E\uDD14',
  idea: '\uD83D\uDCA1'
};

const SIGNIFIER_LABELS: Record<SignifierType, string> = {
  none: '\u672A\u8A2D\u5B9A',
  task: '\u30BF\u30B9\u30AF',
  note: '\u30E1\u30E2',
  important: '\u91CD\u8981',
  consider: '\u691C\u8A0E',
  idea: '\u30A2\u30A4\u30C7\u30A2'
};

const SIGNIFIER_ORDER: SignifierType[] = [
  'none', 'task', 'note', 'important', 'consider', 'idea'
];

const CATEGORY_INFO: Record<string, { name: string; color: string }> = {
  task: { name: '\u30BF\u30B9\u30AF', color: '#3498db' },
  meeting: { name: '\u6253\u3061\u5408\u308F\u305B', color: '#27ae60' },
  review: { name: '\u30EC\u30D3\u30E5\u30FC', color: '#f39c12' },
  bugfix: { name: '\u30D0\u30B0\u4FEE\u6B63', color: '#e74c3c' },
  document: { name: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8', color: '#9b59b6' },
  research: { name: '\u5B66\u7FD2\u30FB\u8ABF\u67FB', color: '#f1c40f' }
};

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const WEEKDAY_LABELS = ['\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F', '\u65E5'] as const;

// ── State ──
let tasks: AppTask[] = [];
let currentWeekMonday: Date = getMonday(new Date());
let filterCategory = '';

// ── Storage ──
function loadTasks(): AppTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t: AppTask) => ({ ...t, signifier: t.signifier || 'none' }));
  } catch {
    return [];
  }
}

function saveTasks(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Date utils ──
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateForWeekday(monday: Date, weekdayIndex: number): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + weekdayIndex);
  return d;
}

// ── Task operations ──
function createTask(partial: Partial<AppTask> & { name: string; date: string }): AppTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: partial.name,
    estimated_time: partial.estimated_time ?? 30,
    actual_time: 0,
    completed: false,
    priority: partial.priority ?? 'medium',
    category: partial.category ?? 'task',
    date: partial.date,
    assigned_date: partial.date,
    details: partial.details ?? '',
    signifier: 'none'
  };
}

function cycleSignifier(task: AppTask): AppTask {
  const idx = SIGNIFIER_ORDER.indexOf(task.signifier);
  return { ...task, signifier: SIGNIFIER_ORDER[(idx + 1) % SIGNIFIER_ORDER.length] };
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

// ── Rendering ──
function renderWeekTitle(): void {
  const el = document.getElementById('week-title');
  if (!el) return;
  const end = new Date(currentWeekMonday);
  end.setDate(end.getDate() + 6);
  const startStr = `${currentWeekMonday.getMonth() + 1}/${currentWeekMonday.getDate()}`;
  const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
  el.textContent = `${startStr} (${WEEKDAY_LABELS[0]}) \u2014 ${endStr} (${WEEKDAY_LABELS[6]})`;
}

function renderDayColumn(columnId: string, dateStr: string): void {
  const column = document.getElementById(columnId);
  if (!column) return;

  const dayTasks = tasks.filter(t => t.date === dateStr && t.assigned_date);
  const filtered = filterCategory
    ? dayTasks.filter(t => t.category === filterCategory)
    : dayTasks;

  // Update daily total
  const totalTimeEl = column.querySelector('.daily-total-time') as HTMLElement | null;
  if (totalTimeEl) {
    const totalMin = dayTasks.reduce((sum, t) => sum + t.estimated_time, 0);
    const completedMin = dayTasks.filter(t => t.completed).reduce((sum, t) => sum + t.estimated_time, 0);
    totalTimeEl.textContent = totalMin > 0 ? ` ${completedMin}/${formatMinutes(totalMin)}` : '';
  }

  // Remove existing task items (keep h3 and hint)
  column.querySelectorAll('.task-item').forEach(el => el.remove());

  filtered.forEach(task => {
    const item = createTaskElement(task);
    column.appendChild(item);
  });
}

function renderUnassigned(): void {
  const list = document.getElementById('unassigned-list');
  if (!list) return;
  list.textContent = '';

  const unassigned = tasks.filter(t => !t.assigned_date);
  const filtered = filterCategory
    ? unassigned.filter(t => t.category === filterCategory)
    : unassigned;

  filtered.forEach(task => {
    list.appendChild(createTaskElement(task));
  });
}

function createTaskElement(task: AppTask): HTMLElement {
  const item = document.createElement('div');
  item.className = 'task-item';
  item.dataset.taskId = task.id;

  if (task.completed) {
    item.style.opacity = '0.5';
    item.style.textDecoration = 'line-through';
  }

  const catInfo = CATEGORY_INFO[task.category] ?? CATEGORY_INFO.task;

  // Signifier
  const sigEl = document.createElement('span');
  sigEl.className = 'task-signifier';
  sigEl.textContent = SIGNIFIER_SYMBOLS[task.signifier];
  sigEl.title = SIGNIFIER_LABELS[task.signifier];
  sigEl.style.cursor = 'pointer';
  sigEl.style.fontSize = '1.4em';
  sigEl.style.marginRight = '2px';
  sigEl.addEventListener('click', (e) => {
    e.stopPropagation();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = cycleSignifier(tasks[idx]);
      saveTasks();
      renderAll();
    }
  });

  // Category badge
  const badge = document.createElement('span');
  badge.className = 'task-category-badge';
  badge.textContent = catInfo.name;
  badge.style.cssText = `font-size:0.7em;background:${catInfo.color}20;color:${catInfo.color};padding:1px 6px;border-radius:8px;margin-right:4px;`;

  // Name
  const nameEl = document.createElement('span');
  nameEl.className = 'task-name';
  nameEl.textContent = task.name;
  nameEl.style.flex = '1';
  nameEl.style.cursor = 'pointer';

  // Time
  const timeEl = document.createElement('span');
  timeEl.className = 'task-time';
  timeEl.textContent = formatMinutes(task.estimated_time);
  timeEl.style.cssText = 'font-size:0.8em;color:#888;margin-left:4px;white-space:nowrap;';

  // Delete button
  const delBtn = document.createElement('button');
  delBtn.textContent = '\u00D7';
  delBtn.title = '\u524A\u9664';
  delBtn.style.cssText = 'background:none;border:none;color:#e74c3c;cursor:pointer;font-size:1.1em;padding:0 4px;opacity:0.5;';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks();
    renderAll();
  });

  // Toggle complete on name click
  nameEl.addEventListener('click', (e) => {
    e.stopPropagation();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], completed: !tasks[idx].completed };
      if (tasks[idx].completed) {
        tasks[idx].actual_time = tasks[idx].estimated_time;
      } else {
        tasks[idx].actual_time = 0;
      }
      saveTasks();
      renderAll();
    }
  });

  item.appendChild(sigEl);
  item.appendChild(badge);
  item.appendChild(nameEl);
  item.appendChild(timeEl);
  item.appendChild(delBtn);

  return item;
}

function renderAll(): void {
  renderWeekTitle();

  const datePicker = document.getElementById('date-picker') as HTMLInputElement | null;
  if (datePicker) {
    datePicker.value = formatDateStr(currentWeekMonday);
  }

  WEEKDAYS.forEach((day, i) => {
    const dateStr = formatDateStr(getDateForWeekday(currentWeekMonday, i));
    renderDayColumn(day, dateStr);
  });

  renderUnassigned();
}

// ── Navigation ──
function navigateWeek(direction: number): void {
  currentWeekMonday = new Date(currentWeekMonday);
  currentWeekMonday.setDate(currentWeekMonday.getDate() + direction * 7);
  renderAll();
}

function goCurrentWeek(): void {
  currentWeekMonday = getMonday(new Date());
  renderAll();
}

// ── Add Task ──
function openAddTaskModal(defaultDate?: string): void {
  const modal = document.getElementById('add-task-modal');
  const dateInput = document.getElementById('task-date') as HTMLInputElement | null;
  if (!modal) return;

  if (dateInput) {
    dateInput.value = defaultDate ?? formatDateStr(new Date());
  }
  modal.style.display = 'block';
  modal.classList.add('show');

  const nameInput = document.getElementById('task-name') as HTMLInputElement | null;
  nameInput?.focus();
}

function closeAddTaskModal(): void {
  const modal = document.getElementById('add-task-modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('show');

  const form = document.getElementById('add-task-form') as HTMLFormElement | null;
  form?.reset();
}

function handleAddTask(e: Event): void {
  e.preventDefault();

  const name = (document.getElementById('task-name') as HTMLInputElement).value.trim();
  const estimatedTime = parseInt((document.getElementById('task-estimated-time') as HTMLInputElement).value, 10) || 30;
  const priority = (document.getElementById('task-priority') as HTMLSelectElement).value as AppTask['priority'];
  const category = (document.getElementById('task-category') as HTMLSelectElement).value;
  const date = (document.getElementById('task-date') as HTMLInputElement).value;
  const details = (document.getElementById('task-details') as HTMLTextAreaElement).value.trim();

  if (!name) return;

  const task = createTask({ name, estimated_time: estimatedTime, priority, category, date, details });
  tasks.push(task);
  saveTasks();
  closeAddTaskModal();
  renderAll();
}

// ── Day column click to add task ──
function setupDayColumnClicks(): void {
  WEEKDAYS.forEach((day, i) => {
    const column = document.getElementById(day);
    if (!column) return;

    column.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.task-item') || target.closest('.task-signifier') || target.closest('button')) return;

      const dateStr = formatDateStr(getDateForWeekday(currentWeekMonday, i));
      openAddTaskModal(dateStr);
    });
  });
}

// ── Signifier Help ──
function setupSignifierHelp(): void {
  const btn = document.getElementById('signifier-help-btn');
  const modal = document.getElementById('signifier-help-modal');
  const closeBtn = document.getElementById('close-signifier-help');
  const legend = document.getElementById('signifier-legend');

  if (!btn || !modal || !legend) return;

  // Populate legend
  legend.textContent = '';
  SIGNIFIER_ORDER.forEach(key => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:1.1em;';
    row.appendChild(Object.assign(document.createElement('span'), { textContent: SIGNIFIER_SYMBOLS[key], style: 'font-size:1.4em;' }));
    const label = document.createElement('span');
    label.textContent = SIGNIFIER_LABELS[key];
    if (key === 'none') label.style.opacity = '0.5';
    row.appendChild(label);
    legend.appendChild(row);
  });

  btn.addEventListener('click', () => {
    modal.style.display = 'block';
    modal.classList.add('show');
  });

  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.classList.remove('show');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  });
}

// ── Category filter ──
function setupCategoryFilter(): void {
  const select = document.getElementById('filter-category') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    filterCategory = select.value;
    renderAll();
  });
}

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  tasks = loadTasks();

  // Navigation
  document.getElementById('prev-week')?.addEventListener('click', () => navigateWeek(-1));
  document.getElementById('next-week')?.addEventListener('click', () => navigateWeek(1));
  document.getElementById('today')?.addEventListener('click', goCurrentWeek);

  // Add task
  document.getElementById('add-task-btn')?.addEventListener('click', () => openAddTaskModal());
  document.getElementById('close-add-task')?.addEventListener('click', closeAddTaskModal);
  document.getElementById('add-task-form')?.addEventListener('submit', handleAddTask);

  const addModal = document.getElementById('add-task-modal');
  addModal?.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddTaskModal();
  });

  // Day column clicks
  setupDayColumnClicks();

  // Signifier help
  setupSignifierHelp();

  // Category filter
  setupCategoryFilter();

  // Hybrid module status
  const hybridModules = [
    'HybridTaskOperations',
    'HybridTaskFiltering',
    'HybridWeekNavigation',
    'HybridSignifierManager',
    'HybridTaskRendering',
  ] as const;

  const status = hybridModules.map((name) => {
    const ok = typeof (window as any)[name] !== 'undefined';
    return `${ok ? '\u2705' : '\u274C'} ${name}`;
  });
  console.log(`[TS7] Hybrid modules:\n${status.join('\n')}`);

  // Initial render
  renderAll();
  console.log('[TS7] App initialized');
});
