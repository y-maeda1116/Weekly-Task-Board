import type { Task } from '../types';
import { Weekday } from '../types';
import type { WeekdayManager } from '../models/WeekdayManager';
import type { TaskBulkMover } from '../models/TaskBulkMover';

export interface ContextManagerDeps {
  weekdayManager: WeekdayManager;
  taskBulkMover: TaskBulkMover;
  getTasks: () => Task[];
  saveTasks: () => void;
  renderWeek: () => void;
}

type NotificationType = 'info' | 'success' | 'default';

const WEEKDAY_COUNT = 7;
const ANIMATION_DURATION_MS = 450;
const NOTIFICATION_DURATION_MS = 4000;
const FADE_DURATION_MS = 300;

function initializeWeekdaySettings(deps: ContextManagerDeps): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '#weekday-checkboxes input[type="checkbox"]'
  );

  checkboxes.forEach((checkbox, index) => {
    const dayName = deps.weekdayManager.getDayNames()[index];
    if (!dayName) return;
    checkbox.checked = deps.weekdayManager.isWeekdayVisible(dayName);

    checkbox.addEventListener('change', (e) => {
      handleWeekdayChange(dayName, (e.target as HTMLInputElement).checked, deps);
    });
  });
}

function handleWeekdayChange(
  dayName: Weekday,
  visible: boolean,
  deps: ContextManagerDeps
): void {
  const tasks = deps.getTasks();
  const movedCount = deps.weekdayManager.toggleWeekday(dayName, visible, tasks);
  deps.saveTasks();

  updateWeekdayVisibility(deps);

  setTimeout(() => {
    deps.renderWeek();
  }, ANIMATION_DURATION_MS);

  if (!visible && movedCount > 0) {
    const label = deps.weekdayManager.getWeekdayLabel(dayName);
    showWeekdayNotification(
      `${label}曜日の${movedCount}個のタスクを未割り当てに移動しました`
    );
  }
}

function updateWeekdayVisibility(deps: ContextManagerDeps): void {
  const dayColumns = document.querySelectorAll<HTMLElement>('.day-column');
  const dayNames = deps.weekdayManager.getDayNames();

  dayColumns.forEach((column, index) => {
    if (index >= dayNames.length) return;

    const dayName = dayNames[index]!;
    const isVisible = deps.weekdayManager.isWeekdayVisible(dayName);

    if (isVisible) {
      column.style.display = '';
      column.classList.remove('hidden-day');
    } else {
      column.classList.add('hidden-day');
      setTimeout(() => {
        if (!deps.weekdayManager.isWeekdayVisible(dayName)) {
          column.style.display = 'none';
        }
      }, ANIMATION_DURATION_MS);
    }
  });

  updateGridColumns(deps);
}

function updateGridColumns(deps: ContextManagerDeps): void {
  const taskBoard = document.getElementById('task-board');
  if (!taskBoard) return;

  const visibleCount = deps.weekdayManager.getVisibleWeekdays().length;

  for (let i = 1; i <= WEEKDAY_COUNT; i++) {
    taskBoard.classList.remove(`weekdays-${i}`);
  }

  if (visibleCount > 0 && visibleCount < WEEKDAY_COUNT) {
    taskBoard.classList.add(`weekdays-${visibleCount}`);
  }
}

function showWeekdayNotification(message: string): void {
  showBulkMoveNotification(message, 'info');
}

function showBulkMoveNotification(message: string, type: NotificationType = 'info'): void {
  const existing = document.querySelector('.bulk-move-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `bulk-move-notification ${type}`;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    zIndex: '10000',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backgroundColor: type === 'info' ? '#4a90e2' : type === 'success' ? '#27ae60' : '#6c757d',
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s ease';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, FADE_DURATION_MS);
  }, NOTIFICATION_DURATION_MS);
}

function initializeContextMenu(deps: ContextManagerDeps): void {
  const contextMenu = document.getElementById('day-context-menu');
  if (!contextMenu) return;

  let currentTargetDate: string | null = null;
  let currentTargetColumn: HTMLElement | null = null;

  const dayColumns = document.querySelectorAll<HTMLElement>('.day-column');

  dayColumns.forEach((column) => {
    column.addEventListener('contextmenu', (e) => {
      if ((e.target as HTMLElement).closest('.task')) return;
      e.preventDefault();

      const dateStr = column.dataset.date;
      if (!dateStr || dateStr === 'null') return;

      currentTargetDate = dateStr;
      currentTargetColumn = column;

      showContextMenu(e.pageX, e.pageY, dateStr, contextMenu, deps);
    });
  });

  contextMenu.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).dataset.action;
    if (!action || !currentTargetDate) return;

    handleContextMenuAction(action, currentTargetDate, currentTargetColumn, deps);
    hideContextMenu(contextMenu);
  });

  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target as Node)) {
      hideContextMenu(contextMenu);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideContextMenu(contextMenu);
    }
  });
}

function showContextMenu(
  x: number,
  y: number,
  dateStr: string,
  contextMenu: HTMLElement,
  deps: ContextManagerDeps
): void {
  const tasksCount = deps.taskBulkMover.getTasksForDate(dateStr, deps.getTasks()).length;

  updateMoveMenuItem(contextMenu, tasksCount);
  updateHideMenuItem(contextMenu, dateStr, deps);

  contextMenu.style.display = 'block';

  const menuRect = contextMenu.getBoundingClientRect();
  const adjustedX = x + menuRect.width > window.innerWidth
    ? window.innerWidth - menuRect.width - 10
    : x;
  const adjustedY = y + menuRect.height > window.innerHeight
    ? window.innerHeight - menuRect.height - 10
    : y;

  contextMenu.style.left = `${adjustedX}px`;
  contextMenu.style.top = `${adjustedY}px`;
}

function updateMoveMenuItem(contextMenu: HTMLElement, tasksCount: number): void {
  const moveItem = contextMenu.querySelector<HTMLElement>('[data-action="move-all-tasks"]');
  if (!moveItem) return;

  if (tasksCount === 0) {
    moveItem.textContent = '📤 移動するタスクがありません';
    moveItem.style.opacity = '0.5';
    moveItem.style.cursor = 'not-allowed';
  } else {
    moveItem.textContent = `📤 ${tasksCount}個のタスクを未割り当てに移動`;
    moveItem.style.opacity = '1';
    moveItem.style.cursor = 'pointer';
  }
}

function updateHideMenuItem(
  contextMenu: HTMLElement,
  dateStr: string,
  deps: ContextManagerDeps
): void {
  const hideItem = contextMenu.querySelector<HTMLElement>('[data-action="hide-day"]');
  if (!hideItem) return;

  const dayName = deps.taskBulkMover.getDayNameFromDate(dateStr);
  const dayLabels = deps.taskBulkMover.getDayLabels();
  const dayNames = deps.taskBulkMover.getDayNames();
  const label = dayName ? dayLabels[dayNames.indexOf(dayName)] : '';

  hideItem.textContent = `👁️ ${label}曜日を非表示`;
}

function hideContextMenu(contextMenu: HTMLElement): void {
  contextMenu.style.display = 'none';
}

function handleContextMenuAction(
  action: string,
  dateStr: string,
  column: HTMLElement | null,
  deps: ContextManagerDeps
): void {
  switch (action) {
    case 'move-all-tasks':
      handleBulkMoveAction(dateStr, deps);
      break;
    case 'hide-day':
      handleHideDayAction(dateStr, deps);
      break;
  }
}

function handleBulkMoveAction(dateStr: string, deps: ContextManagerDeps): void {
  const tasks = deps.getTasks();
  const tasksToMove = deps.taskBulkMover.getTasksForDate(dateStr, tasks);

  if (tasksToMove.length === 0) {
    showBulkMoveNotification('移動するタスクがありません', 'info');
    return;
  }

  const date = new Date(dateStr);
  const dayLabels = deps.taskBulkMover.getDayLabels();
  const dayLabel = dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}(${dayLabel})`;

  if (confirm(`${dateLabel}の${tasksToMove.length}個のタスクを未割り当てに移動しますか？`)) {
    const movedCount = deps.taskBulkMover.moveTasksToUnassigned(dateStr, tasks);
    deps.taskBulkMover.notifyMoveResult(movedCount, dateStr);
    deps.saveTasks();
    deps.renderWeek();
  }
}

function handleHideDayAction(dateStr: string, deps: ContextManagerDeps): void {
  const dayName = deps.taskBulkMover.getDayNameFromDate(dateStr);
  if (!dayName) return;

  const dayLabels = deps.taskBulkMover.getDayLabels();
  const dayNames = deps.taskBulkMover.getDayNames();
  const label = dayLabels[dayNames.indexOf(dayName)];

  if (confirm(`${label}曜日を非表示にしますか？\nその曜日のタスクは未割り当てに移動されます。`)) {
    const checkbox = document.getElementById(`show-${dayName}`) as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = false;
      handleWeekdayChange(dayName as Weekday, false, deps);
    }
  }
}

export {
  initializeWeekdaySettings,
  handleWeekdayChange,
  updateWeekdayVisibility,
  updateGridColumns,
  showWeekdayNotification,
  showBulkMoveNotification,
  initializeContextMenu,
};
