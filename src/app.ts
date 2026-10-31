/**
 * Vite Entry Point - Weekly Task Board
 * アプリケーションを初期化し、週表示のレンダリングを開始する
 */
import type { Task } from './types';
import { appContext } from './app/AppContext';
import { initializeApp } from './app/init';
import { createRenderWeek } from './app/RenderWeek';
import {
  archiveCallbacks,
  saveTasks,
  setRenderWeek,
  setTasks,
  updateDashboard,
} from './app/actions';
import { archiveCompletedTasks } from './features/ArchiveManager';
import { playTaskCompletionAnimation } from './features/ThemeManager';
import { openCreateModal, openEditModal } from './features/TaskModal';

// --- Initialize app ---
const { weekdayManager, taskBulkMover, recurrenceEngine } = initializeApp();

// --- Wire up renderWeek ---
let _isRendering = false;

const { renderWeek, addDateClickListeners } = createRenderWeek({
  get tasks() { return appContext.tasks; },
  set tasks(v: Task[]) { appContext.tasks = v; },
  setTasks,
  saveTasks,
  get settings() { return appContext.settings; },
  get currentDate() { return appContext.currentDate; },
  get categoryFilter() { return appContext.categoryFilter; },
  get isRendering() { return _isRendering; },
  setIsRendering: (v) => { _isRendering = v; },
  get migrationNotified() { return false; },
  setMigrationNotified: () => {},
  recurrenceEngine,
  weekdayManager,
  taskBulkMover,
  taskRendererCallbacks: {
    saveTasks,
    renderWeek: () => renderWeek(),
    openEditModal: (task: Task) => openEditModal(task.id),
    playTaskCompletionAnimation: (el, checkbox) => playTaskCompletionAnimation(el, checkbox, saveTasks),
    archiveCompletedTasks: () => archiveCompletedTasks(archiveCallbacks),
    updateDashboard,
  },
});

setRenderWeek(renderWeek);

// Initial render
try { renderWeek(); } catch (e) { console.error('[Init] renderWeek failed:', e); }

// Day column click listeners
const dayColumns = Array.from(document.querySelectorAll('.day-column:not(#unassigned-tasks)')) as HTMLElement[];
addDateClickListeners(dayColumns, (date?: string) => openCreateModal(date));
