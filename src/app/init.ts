import type { Task } from '../types';
import { appContext } from './AppContext';
import { loadTasksWithMigration, saveTasksValidated } from './taskStorage';
import { getCategoryInfo } from '../utils/validation';
import { loadSettings, saveSettings as saveSettingsToStorage } from './storage';
import { getMonday, formatDate } from '../utils/date';
import { showNotification } from './notifications';
import { archiveCallbacks, renderWeek, setTasks, updateDashboard } from './actions';
import { WeekdayManager } from '../models/WeekdayManager';
import { TaskBulkMover } from '../models/TaskBulkMover';
import { RecurrenceEngine } from '../models/RecurrenceEngine';
import { initializeCommandPalette } from '../features/CommandPalette';
import { initializeKeyboardShortcuts } from '../features/KeyboardShortcuts';
import * as ThemeManager from '../features/ThemeManager';
import * as ContextManager from '../features/ContextManager';
import * as ExportImport from '../features/ExportImport';
import * as ArchiveManager from '../features/ArchiveManager';
import * as CalendarManager from '../features/CalendarManager';
import * as PWASetup from '../features/PWASetup';
import * as WeeklyReviewUI from '../features/WeeklyReviewUI';
import * as MorningPagesUI from '../features/MorningPagesUI';
import * as DashboardManager from '../features/DashboardManager';
import * as TemplateManager from '../features/TemplateManager';
import * as JournalUI from '../features/JournalUI';
import * as TaskModal from '../features/TaskModal';
import * as TaskMigration from '../features/TaskMigration';

export interface AppServices {
  weekdayManager: WeekdayManager;
  taskBulkMover: TaskBulkMover;
  recurrenceEngine: RecurrenceEngine;
}

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

export function initializeApp(): AppServices {
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

  // 5. Settings UI
  const idealInput = document.getElementById('ideal-daily-minutes') as HTMLInputElement | null;
  if (idealInput) idealInput.value = String(appContext.settings.ideal_daily_minutes);

  // 6. Theme
  try { ThemeManager.initializeTheme(); } catch (e) { console.error('[Init] Theme failed:', e); }

  // 7. Category filter
  initializeCategoryFilter();

  // 8. Weekday settings
  const contextDeps = {
    weekdayManager,
    taskBulkMover,
    getTasks: () => appContext.tasks,
    saveTasks: () => saveTasksValidated(appContext.tasks),
    renderWeek,
  };
  try { ContextManager.initializeWeekdaySettings(contextDeps); } catch (e) { console.error('[Init] WeekdaySettings failed:', e); }

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
  try { ContextManager.initializeContextMenu(contextDeps); } catch (e) { console.error('[Init] ContextMenu failed:', e); }
  try { ContextManager.updateGridColumns(contextDeps); } catch (e) { console.error('[Init] GridColumns failed:', e); }

  // 10. Multi-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'weekly-task-board.tasks' && e.newValue) {
      try {
        appContext.tasks = JSON.parse(e.newValue);
        renderWeek();
        updateDashboard();
      } catch (err) { console.error('[Storage] Sync failed:', err); }
    }
    if (e.key === 'weekly-task-board.settings' && e.newValue) {
      try {
        appContext.settings = JSON.parse(e.newValue);
        if (idealInput) idealInput.value = String(appContext.settings.ideal_daily_minutes);
      } catch (err) { console.error('[Storage] Settings sync failed:', err); }
    }
  });

  // 11. Export/Import buttons
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const importFileInput = document.getElementById('import-file-input') as HTMLInputElement | null;
  if (exportBtn) exportBtn.addEventListener('click', () => ExportImport.exportData(appContext.tasks, appContext.settings));
  if (importBtn) importBtn.addEventListener('click', () => importFileInput?.click());
  if (importFileInput) importFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      ExportImport.importData(
        file,
        (t: Task[]) => { appContext.tasks = t; },
        (s) => { appContext.settings = s; },
        renderWeek,
      );
    }
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
    renderWeek();
  });

  nextWeekBtn?.addEventListener('click', () => {
    const newMonday = getMonday(appContext.currentDate);
    newMonday.setDate(newMonday.getDate() + 7);
    appContext.currentDate = newMonday;
    renderWeek();
  });

  todayBtn?.addEventListener('click', () => {
    appContext.currentDate = new Date();
    renderWeek();
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
            renderWeek();
      }
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });
    datePicker.addEventListener('blur', () => {
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });
  }

  idealInput?.addEventListener('change', (e) => {
    appContext.settings.ideal_daily_minutes = parseInt((e.target as HTMLInputElement).value, 10) || 480;
    saveSettingsToStorage(appContext.settings);
    renderWeek();
  });

  categoryFilterSelect?.addEventListener('change', (e) => {
    const filter = (e.target as HTMLSelectElement).value;
    appContext.categoryFilter = filter;
    const container = document.getElementById('category-filter');
    if (container) container.classList.toggle('filter-active', !!filter);
    renderWeek();
  });

  // 13. Migration modal
  setupMigrationModal();

  // 14. Initialize features
  try { ThemeManager.initThemeEventListeners(); } catch (e) { console.error('[Init] ThemeListeners failed:', e); }
  try { ArchiveManager.initArchiveEventListeners(archiveCallbacks); } catch (e) { console.error('[Init] ArchiveListeners failed:', e); }
  try { CalendarManager.initCalendarSettings(); } catch (e) { console.error('[Init] Calendar failed:', e); }
  try { PWASetup.initPWA(); } catch (e) { console.error('[Init] PWA failed:', e); }
  try { WeeklyReviewUI.initialize(); } catch (e) { console.error('[Init] WeeklyReviewUI failed:', e); }
  try { MorningPagesUI.initializeMorningPagesUI(); } catch (e) { console.error('[Init] MorningPagesUI failed:', e); }

  // 15. Panel toggles
  try { DashboardManager.initializeDashboardToggle(); } catch (e) { console.error('[Init] DashboardToggle failed:', e); }
  try { TemplateManager.initializeTemplatePanel(); } catch (e) { console.error('[Init] TemplatePanel failed:', e); }
  try { JournalUI.initTimelineControls(); } catch (e) { console.error('[Init] JournalControls failed:', e); }

  // Journal toggle button
  const journalToggleBtn = document.getElementById('journal-toggle');
  if (journalToggleBtn) {
    journalToggleBtn.addEventListener('click', () => {
      try { JournalUI.openTimeline(); } catch (e) { console.error('[Init] Journal open failed:', e); }
    });
  }

  // 16. Task modal
  try { TaskModal.initializeModal(); } catch (e) { console.error('[Init] TaskModal failed:', e); }
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      try { TaskModal.openCreateModal(); } catch (e) { console.error('[Init] AddTask failed:', e); }
    });
  }

  // Command palette
  const paletteHandle = initializeCommandPalette({
    getTasks: () => appContext.tasks,
    goToWeek: (date: Date) => {
      appContext.currentDate = date;
        renderWeek();
    },
  });
  // ヘッダーの検索ボタンからパレットを開く（Ctrl/Cmd+K と対称の入口）
  document.getElementById("palette-toggle")?.addEventListener("click", () => paletteHandle.open());

  // 17. Keyboard shortcuts
  try {
    initializeKeyboardShortcuts({
      openCreateModal: () => TaskModal.openCreateModal(),
      openEditModal: (taskId: string) => TaskModal.openEditModal(taskId),
      toggleTaskCompletion: (taskId: string) => {
        const checkbox = document.querySelector<HTMLInputElement>(`[data-task-id="${taskId}"] .task-checkbox`);
        checkbox?.click(); // 既存のチェックボックスハンドラ（アニメーション・保存）を再利用
      },
      deleteTask: (taskId: string) => {
        setTasks(appContext.tasks.filter(t => t.id !== taskId));
        renderWeek();
        updateDashboard();
      },
      navigateWeek: (direction: -1 | 1) => {
        const newMonday = getMonday(appContext.currentDate);
        newMonday.setDate(newMonday.getDate() + direction * 7);
        appContext.currentDate = newMonday;
            renderWeek();
      },
      goToToday: () => {
        appContext.currentDate = new Date();
            renderWeek();
      },
      openPalette: () => paletteHandle.open(),
    });
  } catch (e) { console.error('[Init] KeyboardShortcuts failed:', e); }

  // Version info
  const APP_VERSION = '1.9.13';
  const BUILD_DATE = '2026-05-28';
  window.APP_VERSION = APP_VERSION;
  window.BUILD_DATE = BUILD_DATE;
  console.log(`%c🚀 ウィークリータスクボード v${APP_VERSION} (Vite + TypeScript)`, 'font-size: 14px; color: #4a90e2; font-weight: bold;');

  return { weekdayManager, taskBulkMover, recurrenceEngine };
}

function setupMigrationModal(): void {
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
    const incomplete = appContext.tasks.filter(t => !t.completed && !t.assigned_date);
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
      renderWeek();
      updateDashboard();
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
    executeMigrationAndRefresh(TaskMigration.migrateTasksToNextWeek);
  });
  migrateNextDayBtn?.addEventListener('click', () => {
    executeMigrationAndRefresh(TaskMigration.migrateTasksToNextDay);
  });
  migrateUnassignedBtn?.addEventListener('click', () => {
    executeMigrationAndRefresh(TaskMigration.migrateTasksToUnassigned);
  });
}
