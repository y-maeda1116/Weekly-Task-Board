import type { Task } from '../types';
import { appContext } from './AppContext';
import { loadTasksWithMigration, saveTasksValidated, getCategoryInfo } from './taskStorage';
import { loadSettings, saveSettings as saveSettingsToStorage } from './storage';
import { getMonday, formatDate } from '../utils/date';
import { showNotification } from './notifications';
import { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS } from '../constants/signifiers';
import { WeekdayManager } from '../models/WeekdayManager';
import { TaskBulkMover } from '../models/TaskBulkMover';
import { RecurrenceEngine } from '../models/RecurrenceEngine';

let isRendering = false;
let migrationNotified = false;
let editingTaskId: string | null = null;
let renderWeekFn: (() => void) | null = null;

export function getIsRendering() { return isRendering; }
export function setIsRendering(v: boolean) { isRendering = v; }
export function getEditingTaskId() { return editingTaskId; }
export function setEditingTaskId(id: string | null) { editingTaskId = id; }

function carryOverOldTasks(tasks: Task[]): Task[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentMonday = getMonday(now);
  const currentMondayStr = formatDate(currentMonday);
  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevMondayStr = formatDate(prevMonday);
  const prevEndStr = formatDate(new Date(prevMonday.getFullYear(), prevMonday.getMonth(), prevMonday.getDate() + 6));

  return tasks.map(task => {
    if (task.completed) return task;
    if (!task.assigned_date) return task;
    if (task.assigned_date === 'null') return task;
    if (task.assigned_date >= currentMondayStr) return task;
    if (task.assigned_date < prevMondayStr || task.assigned_date > prevEndStr) return task;
    return { ...task, assigned_date: null };
  });
}

function initializeCategoryFilter() {
  const select = document.getElementById('category-filter') as HTMLSelectElement | null;
  if (select) {
    select.value = '';
    appContext.categoryFilter = '';
    const filterContainer = document.getElementById('category-filter');
    if (filterContainer) filterContainer.classList.remove('filter-active');
  }
}

export function initializeApp(): void {
  const w = window as any;

  // 1. Load data
  let tasks = loadTasksWithMigration();
  tasks = carryOverOldTasks(tasks);
  appContext.tasks = tasks;

  const settings = loadSettings();
  appContext.settings = settings;
  appContext.currentDate = new Date();

  // 2. Create instances from TypeScript modules
  const weekdayManager = new WeekdayManager();
  const taskBulkMover = new TaskBulkMover();
  const recurrenceEngine = new RecurrenceEngine();

  w.weekdayManager = weekdayManager;
  w.taskBulkMover = taskBulkMover;
  w.recurrenceEngine = recurrenceEngine;

  // 3. Sync to window globals
  appContext.syncToWindow();

  // 4. Expose storage functions
  w.tasks = appContext.tasks;
  w.settings = appContext.settings;
  w.currentDate = appContext.currentDate;
  w.currentCategoryFilter = '';
  w.editingTaskId = null;

  w.loadTasks = () => {
    appContext.tasks = loadTasksWithMigration();
    w.tasks = appContext.tasks;
    return appContext.tasks;
  };
  w.saveTasks = () => {
    saveTasksValidated(appContext.tasks);
    w.tasks = appContext.tasks;
  };
  w.loadSettings = () => appContext.settings;
  w.saveSettings = () => saveSettingsToStorage(appContext.settings);
  w.loadArchivedTasks = w.ArchiveManager?.loadArchivedTasks?.bind(w.ArchiveManager);
  w.saveArchivedTasks = w.ArchiveManager?.saveArchivedTasks?.bind(w.ArchiveManager);
  w.archiveCompletedTasks = w.ArchiveManager?.archiveCompletedTasks?.bind(w.ArchiveManager);
  w.showNotification = showNotification;
  w.getCategoryInfo = getCategoryInfo;
  w.SIGNIFIER_ORDER = SIGNIFIER_ORDER;
  w.SIGNIFIER_MAP = SIGNIFIER_MAP;
  w.SIGNIFIER_LABELS = SIGNIFIER_LABELS;

  // Re-export module functions
  w.calculateCompletionRate = w.StatisticsEngine?.calculateCompletionRate;
  w.getCompletionRateForWeek = w.StatisticsEngine?.getCompletionRateForWeek;
  w.calculateCategoryTimeAnalysis = w.StatisticsEngine?.calculateCategoryTimeAnalysis;
  w.calculateDailyWorkTime = w.StatisticsEngine?.calculateDailyWorkTime;
  w.calculateEstimatedVsActualAnalysis = w.StatisticsEngine?.calculateEstimatedVsActualAnalysis;
  w.updateDashboard = w.DashboardManager?.updateDashboard;
  w.initializeDashboardToggle = w.DashboardManager?.initializeDashboardToggle;
  w.initializeWeekdaySettings = w.ContextManager?.initializeWeekdaySettings;
  w.initializeContextMenu = w.ContextManager?.initializeContextMenu;
  w.updateGridColumns = w.ContextManager?.updateGridColumns;
  w.initializeTheme = w.ThemeManager?.initializeTheme;
  w.toggleTheme = w.ThemeManager?.toggleTheme;
  w.updateThemeButton = w.ThemeManager?.updateThemeButton;
  w.playTaskCompletionAnimation = w.ThemeManager?.playTaskCompletionAnimation;
  w.exportData = () => w.ExportImport?.exportData(appContext.tasks, appContext.settings);
  w.importData = (file: File) => w.ExportImport?.importData(
    file,
    (t: Task[]) => { appContext.tasks = t; w.tasks = t; },
    (s: any) => { appContext.settings = s; w.settings = s; },
    () => renderWeekFn?.(),
  );
  w.connectGoogleCalendar = w.CalendarManager?.connectGoogleCalendar;
  w.connectOutlookCalendar = w.CalendarManager?.connectOutlookCalendar;
  w.disconnectGoogleCalendar = w.CalendarManager?.disconnectGoogleCalendar;
  w.disconnectOutlookCalendar = w.CalendarManager?.disconnectOutlookCalendar;
  w.checkOAuthCallback = w.CalendarManager?.checkOAuthCallback;
  w.showSettingsHelp = w.CalendarManager?.showSettingsHelp;
  w.initCalendarSettings = w.CalendarManager?.initCalendarSettings;
  w.registerServiceWorker = w.PWASetup?.registerServiceWorker;
  w.initPWA = w.PWASetup?.initPWA;

  // 5. Settings UI
  const idealInput = document.getElementById('ideal-daily-minutes') as HTMLInputElement | null;
  if (idealInput) idealInput.value = String(appContext.settings.ideal_daily_minutes);

  // 6. Theme
  try { w.ThemeManager?.initializeTheme(); } catch (e) { console.error('[Init] Theme failed:', e); }

  // 7. Category filter
  initializeCategoryFilter();

  // 8. Weekday settings
  const contextDeps = {
    weekdayManager,
    taskBulkMover,
    getTasks: () => appContext.tasks,
    saveTasks: () => { saveTasksValidated(appContext.tasks); w.tasks = appContext.tasks; },
    renderWeek: () => renderWeekFn?.(),
  };
  try { w.ContextManager?.initializeWeekdaySettings(contextDeps); } catch (e) { console.error('[Init] WeekdaySettings failed:', e); }

  // Weekday filter dropdown
  const weekdayFilterBtn = document.getElementById('weekday-filter-btn');
  const weekdaySettings = document.getElementById('weekday-settings');
  if (weekdayFilterBtn && weekdaySettings) {
    weekdayFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      weekdaySettings.style.display = weekdaySettings.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('#weekday-filter-btn') && !(e.target as HTMLElement).closest('#weekday-settings')) {
        weekdaySettings.style.display = 'none';
      }
    });
  }

  // More menu dropdown
  const moreMenuBtn = document.getElementById('more-menu-btn');
  const moreMenuDropdown = document.getElementById('more-menu-dropdown');
  if (moreMenuBtn && moreMenuDropdown) {
    moreMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreMenuDropdown.style.display = moreMenuDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('#more-menu-btn') && !(e.target as HTMLElement).closest('#more-menu-dropdown')) {
        moreMenuDropdown.style.display = 'none';
      }
    });
  }

  // 9. Context menu
  try { w.ContextManager?.initializeContextMenu(contextDeps); } catch (e) { console.error('[Init] ContextMenu failed:', e); }
  try { w.ContextManager?.updateGridColumns(contextDeps); } catch (e) { console.error('[Init] GridColumns failed:', e); }

  // 10. Multi-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'weekly-task-board.tasks' && e.newValue) {
      try {
        appContext.tasks = JSON.parse(e.newValue);
        w.tasks = appContext.tasks;
        renderWeekFn?.();
        w.updateDashboard?.();
      } catch (err) { console.error('[Storage] Sync failed:', err); }
    }
    if (e.key === 'weekly-task-board.settings' && e.newValue) {
      try {
        appContext.settings = JSON.parse(e.newValue);
        w.settings = appContext.settings;
        if (idealInput) idealInput.value = String(appContext.settings.ideal_daily_minutes);
      } catch (err) { console.error('[Storage] Settings sync failed:', err); }
    }
  });

  // 11. Export/Import buttons
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const importFileInput = document.getElementById('import-file-input') as HTMLInputElement | null;
  if (exportBtn) exportBtn.addEventListener('click', () => w.exportData?.());
  if (importBtn) importBtn.addEventListener('click', () => importFileInput?.click());
  if (importFileInput) importFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) w.importData?.(file);
    (e.target as HTMLInputElement).value = '';
  });

  // 12. Navigation
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  const todayBtn = document.getElementById('today');
  const datePicker = document.getElementById('date-picker') as HTMLInputElement | null;
  const categoryFilterSelect = document.getElementById('category-filter') as HTMLSelectElement | null;

  prevWeekBtn?.addEventListener('click', () => {
    const newMonday = getMonday(appContext.currentDate);
    newMonday.setDate(newMonday.getDate() - 7);
    appContext.currentDate = newMonday;
    w.currentDate = appContext.currentDate;
    renderWeekFn?.();
  });

  nextWeekBtn?.addEventListener('click', () => {
    const newMonday = getMonday(appContext.currentDate);
    newMonday.setDate(newMonday.getDate() + 7);
    appContext.currentDate = newMonday;
    w.currentDate = appContext.currentDate;
    renderWeekFn?.();
  });

  todayBtn?.addEventListener('click', () => {
    appContext.currentDate = new Date();
    w.currentDate = appContext.currentDate;
    renderWeekFn?.();
  });

  if (datePicker) {
    datePicker.addEventListener('click', () => {
      datePicker.removeAttribute('readonly');
      if (typeof datePicker.showPicker === 'function') {
        try { datePicker.showPicker(); } catch { datePicker.focus(); }
      } else { datePicker.focus(); }
    });
    datePicker.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (val) {
        appContext.currentDate = new Date(val);
        w.currentDate = appContext.currentDate;
        renderWeekFn?.();
      }
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });
    datePicker.addEventListener('blur', () => {
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });
  }

  idealInput?.addEventListener('change', (e) => {
    appContext.settings.ideal_daily_minutes = parseInt((e.target as HTMLInputElement).value, 10) || 480;
    w.settings = appContext.settings;
    saveSettingsToStorage(appContext.settings);
    renderWeekFn?.();
  });

  categoryFilterSelect?.addEventListener('change', (e) => {
    const filter = (e.target as HTMLSelectElement).value;
    appContext.categoryFilter = filter;
    w.currentCategoryFilter = filter;
    const container = document.getElementById('category-filter');
    if (container) container.classList.toggle('filter-active', !!filter);
    renderWeekFn?.();
  });

  // 13. Migration modal
  setupMigrationModal(tasks);

  // 14. Initialize features
  try { w.ThemeManager?.initThemeEventListeners?.(); } catch (e) { console.error('[Init] ThemeListeners failed:', e); }
  try { w.ArchiveManager?.initArchiveEventListeners?.(); } catch (e) { console.error('[Init] ArchiveListeners failed:', e); }
  try { w.CalendarManager?.initCalendarSettings?.(); } catch (e) { console.error('[Init] Calendar failed:', e); }
  try { w.CalendarManager?.checkOAuthCallback?.(); } catch (e) { console.error('[Init] OAuth failed:', e); }
  try { w.PWASetup?.initPWA?.(); } catch (e) { console.error('[Init] PWA failed:', e); }
  try { w.HybridWeeklyReviewUI?.initialize?.(); } catch (e) { console.error('[Init] WeeklyReviewUI failed:', e); }
  try { w.HybridMorningPagesUI?.initializeMorningPagesUI?.(); } catch (e) { console.error('[Init] MorningPagesUI failed:', e); }

  // 15. Panel toggles
  try { w.DashboardManager?.initializeDashboardToggle?.(); } catch (e) { console.error('[Init] DashboardToggle failed:', e); }
  try { w.TemplateManager?.initializeTemplatePanel?.(); } catch (e) { console.error('[Init] TemplatePanel failed:', e); }
  try { w.HybridJournalUI?.initTimelineControls?.(); } catch (e) { console.error('[Init] JournalControls failed:', e); }

  // Journal toggle button
  const journalToggleBtn = document.getElementById('journal-toggle');
  if (journalToggleBtn) {
    journalToggleBtn.addEventListener('click', () => {
      try { w.HybridJournalUI?.openTimeline?.(); } catch (e) { console.error('[Init] Journal open failed:', e); }
    });
  }

  // 16. Task modal
  try { w.HybridTaskModal?.initializeModal?.(); } catch (e) { console.error('[Init] TaskModal failed:', e); }
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      try { w.HybridTaskModal?.openCreateModal?.(); } catch (e) { console.error('[Init] AddTask failed:', e); }
    });
  }
  w.openEditModal = (task: any) => w.HybridTaskModal?.openEditModal?.(task);
  w.openCreateModal = () => w.HybridTaskModal?.openCreateModal?.();
  w.closeTaskModal = () => w.HybridTaskModal?.closeModal?.();

  // Version info
  const APP_VERSION = '1.9.2';
  const BUILD_DATE = '2026-05-28';
  w.APP_VERSION = APP_VERSION;
  w.BUILD_DATE = BUILD_DATE;
  console.log(`%c🚀 ウィークリータスクボード v${APP_VERSION} (Vite + TypeScript)`, 'font-size: 14px; color: #4a90e2; font-weight: bold;');
}

function setupMigrationModal(tasks: Task[]): void {
  const w = window as any;
  const migrationToggleBtn = document.getElementById('migration-toggle');
  const migrationModal = document.getElementById('migration-modal');
  const closeBtn = document.getElementById('close-migration-modal');
  const taskListEl = document.getElementById('migration-task-list');
  const migrateNextWeekBtn = document.getElementById('migrate-next-week-btn');
  const migrateNextDayBtn = document.getElementById('migrate-next-day-btn');
  const migrateUnassignedBtn = document.getElementById('migrate-unassigned-btn');

  function getSelectedIds(): string[] {
    if (!taskListEl) return [];
    return Array.from(taskListEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  function renderMigrationList(): void {
    if (!taskListEl) return;
    while (taskListEl.firstChild) taskListEl.removeChild(taskListEl.firstChild);
    const incomplete = tasks.filter(t => !t.completed && !t.assigned_date);
    if (incomplete.length === 0) {
      const msg = document.createElement('p');
      msg.textContent = '移行対象の未完了タスクはありません。';
      msg.style.color = '#888';
      taskListEl.appendChild(msg);
      return;
    }
    const selectAllLabel = document.createElement('label');
    selectAllLabel.style.cssText = 'display:block;margin-bottom:8px;font-weight:bold;cursor:pointer;';
    const selectAllCb = document.createElement('input');
    selectAllCb.type = 'checkbox';
    selectAllCb.checked = true;
    selectAllCb.addEventListener('change', () => {
      taskListEl.querySelectorAll('.migration-task-cb').forEach(cb => { (cb as HTMLInputElement).checked = selectAllCb.checked; });
    });
    selectAllLabel.appendChild(selectAllCb);
    selectAllLabel.appendChild(document.createTextNode(' 全て選択'));
    taskListEl.appendChild(selectAllLabel);

    incomplete.forEach(task => {
      const label = document.createElement('label');
      label.style.cssText = 'display:block;padding:4px 0;cursor:pointer;';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'migration-task-cb';
      cb.value = task.id;
      cb.checked = true;
      const catInfo = getCategoryInfo(task.category);
      const catBadge = document.createElement('span');
      catBadge.textContent = ` [${catInfo.name}]`;
      catBadge.style.color = catInfo.color;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(` ${task.name}`));
      label.appendChild(catBadge);
      label.appendChild(document.createTextNode(` (${task.estimated_time}h)`));
      taskListEl.appendChild(label);
    });
  }

  function closeMigrationModal(): void {
    if (migrationModal) {
      migrationModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      setTimeout(() => { migrationModal.style.display = 'none'; }, 300);
    }
  }

  function executeMigrationAndRefresh(migrationFn: (ids: string[], monday: string) => number): void {
    const ids = getSelectedIds();
    if (ids.length === 0) { alert('移行するタスクを選択してください。'); return; }
    const mondayStr = formatDate(getMonday(appContext.currentDate));
    const count = migrationFn(ids, mondayStr);
    if (count > 0) {
      appContext.tasks = loadTasksWithMigration();
      (window as any).tasks = appContext.tasks;
      renderWeekFn?.();
      (window as any).updateDashboard?.();
      closeMigrationModal();
      showNotification(`${count}件のタスクを移行しました`, 'success');
    }
  }

  migrationToggleBtn?.addEventListener('click', () => {
    renderMigrationList();
    if (migrationModal) {
      document.body.classList.add('modal-open');
      migrationModal.style.display = 'block';
      setTimeout(() => migrationModal.classList.add('show'), 10);
    }
  });

  closeBtn?.addEventListener('click', closeMigrationModal);
  migrationModal?.addEventListener('click', (e) => {
    if (e.target === migrationModal) closeMigrationModal();
  });

  migrateNextWeekBtn?.addEventListener('click', () => {
    if (w.HybridTaskMigration) executeMigrationAndRefresh(w.HybridTaskMigration.migrateTasksToNextWeek);
  });
  migrateNextDayBtn?.addEventListener('click', () => {
    if (w.HybridTaskMigration) executeMigrationAndRefresh(w.HybridTaskMigration.migrateTasksToNextDay);
  });
  migrateUnassignedBtn?.addEventListener('click', () => {
    if (w.HybridTaskMigration) executeMigrationAndRefresh(w.HybridTaskMigration.migrateTasksToUnassigned);
  });
}

export function setRenderWeek(fn: () => void): void {
  renderWeekFn = fn;
}
