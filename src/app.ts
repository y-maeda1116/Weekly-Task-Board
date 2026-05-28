/**
 * Vite Entry Point - Weekly Task Board
 * 全TSモジュールをインポートし、アプリケーションを初期化する
 */
import { appContext } from './app/AppContext';
import { exposeToWindow } from './app/shared';
import { initializeApp, setRenderWeek } from './app/init';
import { createRenderWeek } from './app/RenderWeek';
import { loadTasksWithMigration, saveTasksValidated } from './app/taskStorage';
import { loadSettings, saveSettings as saveSettingsToStorage } from './app/storage';

// --- Features (all modules) ---
import * as SignifierManager from './features/SignifierManager';
import * as PWASetup from './features/PWASetup';
import * as JournalManager from './features/JournalManager';
import * as MorningPages from './features/MorningPages';
import * as WeeklyReview from './features/WeeklyReview';
import * as TaskMigration from './features/TaskMigration';
import * as ThemeManager from './features/ThemeManager';
import * as ExportImport from './features/ExportImport';
import * as WeekNavigation from './features/WeekNavigation';
import * as TaskFiltering from './features/TaskFiltering';
import * as TaskOperations from './features/TaskOperations';
import * as TaskRendering from './features/TaskRendering';
import * as TaskModal from './features/TaskModal';
import * as JournalUI from './features/JournalUI';
import * as MorningPagesUI from './features/MorningPagesUI';
import * as WeeklyReviewUI from './features/WeeklyReviewUI';
import * as StatisticsEngine from './features/StatisticsEngine';
import * as DashboardManager from './features/DashboardManager';
import * as ArchiveManager from './features/ArchiveManager';
import * as TemplateManager from './features/TemplateManager';
import * as ContextManager from './features/ContextManager';
import * as DOMInitialization from './features/DOMInitialization';
import * as CalendarManager from './features/CalendarManager';
import { TASK_CATEGORIES } from './constants/taskCategories';

const w = window as any;

// --- Expose all modules to window.* ---
w.SignifierManager = SignifierManager;
w.PWASetup = PWASetup;
w.HybridJournalManager = JournalManager;
w.HybridMorningPages = MorningPages;
w.HybridWeeklyReview = WeeklyReview;
w.HybridTaskMigration = TaskMigration;
w.ThemeManager = ThemeManager;
w.ExportImport = ExportImport;
w.HybridWeekNavigation = WeekNavigation;
w.HybridTaskFiltering = TaskFiltering;
w.HybridTaskOperations = TaskOperations;
w.HybridTaskRendering = TaskRendering;
w.HybridTaskModal = TaskModal;
w.HybridJournalUI = JournalUI;
w.HybridMorningPagesUI = MorningPagesUI;
w.HybridWeeklyReviewUI = WeeklyReviewUI;
w.StatisticsEngine = StatisticsEngine;
w.DashboardManager = DashboardManager;
w.ArchiveManager = ArchiveManager;
w.TemplateManager = TemplateManager;
w.ContextManager = ContextManager;
w.HybridDOMInitialization = DOMInitialization;
w.CalendarManager = CalendarManager;

// --- Initialize app ---
exposeToWindow();
initializeApp();

// --- Wire up renderWeek ---
let _isRendering = false;

const { renderWeek, addDateClickListeners } = createRenderWeek({
  get tasks() { return appContext.tasks; },
  set tasks(v: any[]) { appContext.tasks = v; },
  setTasks: (t) => { appContext.tasks = t; w.tasks = t; },
  saveTasks: () => { saveTasksValidated(appContext.tasks); w.tasks = appContext.tasks; },
  get settings() { return appContext.settings; },
  get currentDate() { return appContext.currentDate; },
  get categoryFilter() { return appContext.categoryFilter; },
  get isRendering() { return _isRendering; },
  setIsRendering: (v) => { _isRendering = v; },
  get migrationNotified() { return false; },
  setMigrationNotified: () => {},
  get recurrenceEngine() { return w.recurrenceEngine; },
  get weekdayManager() { return w.weekdayManager; },
  taskRendererCallbacks: {
    saveTasks: () => { saveTasksValidated(appContext.tasks); w.tasks = appContext.tasks; },
    renderWeek: () => renderWeek(),
    openEditModal: (task: any) => w.openEditModal?.(task),
    playTaskCompletionAnimation: (el: any, cb: any) => w.playTaskCompletionAnimation?.(el, cb),
    archiveCompletedTasks: () => w.archiveCompletedTasks?.(),
    updateDashboard: () => w.updateDashboard?.(),
  },
});

setRenderWeek(renderWeek);
w.renderWeek = renderWeek;
(document.body as any).renderWeek = renderWeek;

// Initial render
try { renderWeek(); } catch (e) { console.error('[Init] renderWeek failed:', e); }

// Day column click listeners
const dayColumns = Array.from(document.querySelectorAll('.day-column:not(#unassigned-tasks)')) as HTMLElement[];
addDateClickListeners(dayColumns, (date?: string) => w.openCreateModal?.(date));
