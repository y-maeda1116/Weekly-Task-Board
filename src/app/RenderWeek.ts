import type { Task, Settings } from '../types';
import { getMonday, formatDate } from '../utils/date';
import { createTaskElement } from './TaskRenderer';
import { getCategoryInfo, shouldDisplayTask } from './taskStorage';
import { handleDragOver, handleDragLeave, createDropHandler } from './DragDrop';

interface RenderWeekDeps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  saveTasks: () => void;
  settings: Settings;
  currentDate: Date;
  categoryFilter: string;
  isRendering: boolean;
  setIsRendering: (v: boolean) => void;
  migrationNotified: boolean;
  setMigrationNotified: (v: boolean) => void;
  recurrenceEngine: any;
  weekdayManager: any;
  taskRendererCallbacks: any;
}

function appendDailyTimeSpans(parent: Element, totalMinutes: number, completedMinutes: number): void {
  parent.textContent = '';
  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const totalSpan = document.createElement('span');
    totalSpan.className = 'total-time';
    totalSpan.textContent = `(${hours}h ${minutes}m)`;
    parent.appendChild(totalSpan);

    if (completedMinutes > 0) {
      const cH = Math.floor(completedMinutes / 60);
      const cM = completedMinutes % 60;
      const completedSpan = document.createElement('span');
      completedSpan.className = 'completed-time';
      completedSpan.textContent = `完了: ${cH}h ${cM}m`;
      parent.appendChild(completedSpan);
    }
  } else {
    const totalSpan = document.createElement('span');
    totalSpan.className = 'total-time';
    totalSpan.textContent = '(0h 0m)';
    parent.appendChild(totalSpan);
  }
}

export function createRenderWeek(deps: RenderWeekDeps) {
  let dndInitialized = false;
  let dateClickInitialized = false;

  function addDragAndDropListeners() {
    if (dndInitialized) return;
    dndInitialized = true;
    document.querySelectorAll('.day-column').forEach(col => {
      col.addEventListener('dragover', handleDragOver as EventListener);
      col.addEventListener('dragleave', handleDragLeave as EventListener);
      col.addEventListener('drop', createDropHandler(deps.tasks, deps.saveTasks, renderWeek) as EventListener);
    });
  }

  function addDateClickListeners(dayColumns: HTMLElement[], openTaskModal: (date?: string) => void) {
    if (dateClickInitialized) return;
    dateClickInitialized = true;
    dayColumns.forEach(col => {
      col.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.task')) return;
        const dateStr = col.dataset.date;
        if (dateStr && dateStr !== 'null') {
          openTaskModal(dateStr);
        }
      });
    });
  }

  function renderWeek() {
    if (deps.isRendering) return;
    deps.setIsRendering(true);

    try {
    const monday = getMonday(deps.currentDate);

    // Recurring tasks
    const recurringStart = new Date(monday);
    const recurringEnd = new Date(monday);
    recurringEnd.setDate(monday.getDate() + 6);

    const recurringTasks = deps.tasks.filter(t => t.is_recurring && t.recurrence_pattern);
    if (recurringTasks.length > 0 && deps.recurrenceEngine) {
      const generated = deps.recurrenceEngine.generateAllRecurringTasks(recurringTasks, recurringStart, recurringEnd);
      let added = 0;
      generated.forEach((gt: Task) => {
        const isDup = deps.tasks.some(et => et.name === gt.name && et.assigned_date === gt.assigned_date);
        if (!isDup && gt.assigned_date && gt.assigned_date !== 'null') {
          deps.tasks.push(gt);
          added++;
        }
      });
      if (added > 0) deps.saveTasks();
    }

    // DOM refs
    const dayColumns = Array.from(document.querySelectorAll('.day-column')) as HTMLElement[];
    const unassignedColumn = document.getElementById('unassigned-tasks');
    const unassignedList = unassignedColumn?.querySelector('#unassigned-list');
    const weekTitle = document.getElementById('week-title');
    const datePicker = document.getElementById('date-picker') as HTMLInputElement | null;

    dayColumns.forEach(col => {
      col.querySelectorAll('.task').forEach(t => t.remove());
      const totalTimeEl = col.querySelector('.daily-total-time');
      if (totalTimeEl) { totalTimeEl.textContent = ''; totalTimeEl.classList.remove('overload'); }
    });

    if (unassignedList) {
      while (unassignedList.firstChild) unassignedList.removeChild(unassignedList.firstChild);
    }

    const weekDates: Date[] = [];
    const dailyTotals: Record<string, number> = {};
    const dailyCompletedTotals: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dateStr = formatDate(date);
      weekDates.push(date);
      dailyTotals[dateStr] = 0;
      dailyCompletedTotals[dateStr] = 0;
    }

    const startOfWeek = weekDates[0];
    const endOfWeek = weekDates[6];
    let weekTitleText = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

    if (deps.categoryFilter) {
      const catInfo = getCategoryInfo(deps.categoryFilter);
      const filteredCount = deps.tasks.filter(t => shouldDisplayTask(t, '', deps.categoryFilter)).length;
      weekTitleText += ` | フィルター: ${catInfo.name} (${filteredCount}件)`;
    }

    if (deps.weekdayManager) {
      const hiddenDays = deps.weekdayManager.getHiddenWeekdays();
      if (hiddenDays.length > 0) {
        const hiddenLabels = hiddenDays.map((day: string) =>
          deps.weekdayManager.dayLabels[deps.weekdayManager.dayNames.indexOf(day)]
        );
        weekTitleText += ` | 非表示: ${hiddenLabels.join('・')}曜日`;
      }
    }

    if (weekTitle) weekTitle.textContent = weekTitleText;

    const startOfWeekStr = formatDate(startOfWeek);
    const endOfWeekStr = formatDate(endOfWeek);
    const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];

    dayColumns.forEach((column, index) => {
      const date = weekDates[index];
      const dateStr = formatDate(date);
      column.dataset.date = dateStr;

      const h3 = column.querySelector('h3');
      if (h3) {
        h3.textContent = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()})`;
        const totalTimeSpan = document.createElement('span');
        totalTimeSpan.className = 'daily-total-time';
        h3.appendChild(totalTimeSpan);
      }

      if (deps.weekdayManager) {
        const dayName = deps.weekdayManager.dayNames[index];
        const isVisible = deps.weekdayManager.isWeekdayVisible(dayName);
        if (isVisible) {
          column.classList.remove('hidden', 'hiding');
          column.classList.add('showing');
        } else {
          column.classList.add('hidden');
          column.classList.remove('showing', 'hiding');
        }
      }
    });

    // Archived tasks time
    const w = window as any;
    const archivedTasks = w.ArchiveManager?.loadArchivedTasks?.() || [];
    archivedTasks.forEach((task: Task) => {
      if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr && shouldDisplayTask(task, '', deps.categoryFilter)) {
        dailyCompletedTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
        dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
      }
    });

    // Place tasks
    deps.tasks.forEach(task => {
      if (!shouldDisplayTask(task, '', deps.categoryFilter)) return;

      const taskElement = createTaskElement(task, deps.taskRendererCallbacks);
      if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr) {
        const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
        if (column) {
          column.appendChild(taskElement);
          dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
        }
      } else if (task.assigned_date === null && unassignedList) {
        unassignedList.appendChild(taskElement);
      }
    });

    // Display daily totals
    dayColumns.forEach((column, index) => {
      const dateStr = formatDate(weekDates[index]);
      const totalMinutes = dailyTotals[dateStr];
      const completedMinutes = dailyCompletedTotals[dateStr];
      const totalTimeEl = column.querySelector('.daily-total-time');

      if (totalTimeEl) {
        appendDailyTimeSpans(totalTimeEl, totalMinutes, completedMinutes);
        if (totalMinutes > deps.settings.ideal_daily_minutes) {
          totalTimeEl.classList.add('overload');
        } else {
          totalTimeEl.classList.remove('overload');
        }
      }
    });

    if (unassignedColumn) unassignedColumn.dataset.date = 'null';
    addDragAndDropListeners();

    if (datePicker) datePicker.value = formatDate(deps.currentDate);

    const w2 = window as any;
    w2.updateGridColumns?.();
    w2.updateDashboard?.();
    w2.HybridJournalUI?.injectStartButtons?.();

    // Check incomplete from previous week
    if (!deps.migrationNotified && w2.HybridTaskMigration) {
      const prevMonday = new Date(monday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const prevEnd = new Date(prevMonday);
      prevEnd.setDate(prevEnd.getDate() + 6);
      const incomplete = w2.HybridTaskMigration.getIncompleteTasksForWeek(formatDate(prevMonday), formatDate(prevEnd));
      if (incomplete.length > 0) {
        deps.setMigrationNotified(true);
        const btn = document.getElementById('migration-toggle');
        if (btn) {
          btn.classList.add('migration-alert');
          btn.title = `⚠ 前週に${incomplete.length}件の未完了タスクがあります`;
        }
      }
    }

    } finally {
      deps.setIsRendering(false);
    }
  }

  return { renderWeek, addDateClickListeners };
}
