import type { Task } from '../types';
import { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS } from '../constants/signifiers';
import { getCategoryInfo, validateCategory } from './taskStorage';
import { handleDragStart, handleDragEnd } from './DragDrop';

function getTimeOverrunSeverity(estimated: number, actual: number): 'none' | 'minor' | 'moderate' | 'severe' {
  if (actual <= estimated) return 'none';
  const diff = actual - estimated;
  if (diff <= 0.5) return 'minor';
  if (diff <= 1.5) return 'moderate';
  return 'severe';
}

interface TaskRendererCallbacks {
  saveTasks: () => void;
  renderWeek: () => void;
  openEditModal: (task: Task) => void;
  playTaskCompletionAnimation: (taskEl: HTMLElement, checkbox: HTMLInputElement) => void;
  archiveCompletedTasks: () => void;
  updateDashboard: () => void;
}

export function createTaskElement(
  task: Task,
  callbacks: TaskRendererCallbacks,
): HTMLElement {
  const taskElement = document.createElement('div');
  taskElement.className = 'task';
  if (task.completed) taskElement.classList.add('completed');

  taskElement.classList.add(`priority-${task.priority || 'medium'}`);
  const categoryKey = validateCategory(task.category);
  taskElement.classList.add(`category-${categoryKey}`);

  if (task.actual_time && task.actual_time > 0) {
    const timeDiff = task.actual_time - task.estimated_time;
    if (timeDiff > 0) {
      taskElement.classList.add('time-overrun-indicator');
      const severity = getTimeOverrunSeverity(task.estimated_time, task.actual_time);
      taskElement.classList.add(`time-overrun-${severity}`);
    } else if (timeDiff < 0) {
      taskElement.classList.add('time-underrun-indicator');
    } else {
      taskElement.classList.add('time-match-indicator');
    }
  }

  taskElement.dataset.taskId = task.id;
  taskElement.dataset.category = categoryKey;
  taskElement.draggable = true;

  const categoryInfo = getCategoryInfo(categoryKey);
  const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' };
  const priorityLabel = priorityLabels[task.priority] || '中';

  const categoryBar = document.createElement('div');
  categoryBar.className = 'category-bar';
  categoryBar.style.backgroundColor = categoryInfo.color;

  const taskHeader = document.createElement('div');
  taskHeader.className = 'task-header';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;

  const taskNameDiv = document.createElement('div');
  taskNameDiv.className = 'task-name';

  const sigSpan = document.createElement('span');
  sigSpan.className = 'task-signifier';
  sigSpan.dataset.signifier = task.signifier || '';

  if (task.signifier) {
    sigSpan.textContent = SIGNIFIER_MAP[task.signifier] + ' ';
    sigSpan.title = SIGNIFIER_LABELS[task.signifier] + ' (クリックで変更)';
  } else {
    sigSpan.textContent = '⬜ ';
    sigSpan.title = 'クリックで記号を設定';
    sigSpan.classList.add('task-signifier-empty');
  }

  sigSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const cur = SIGNIFIER_ORDER.indexOf(task.signifier || null);
    task.signifier = SIGNIFIER_ORDER[(cur + 1) % SIGNIFIER_ORDER.length] as any;
    callbacks.saveTasks();
    callbacks.renderWeek();
  });
  taskNameDiv.appendChild(sigSpan);
  taskNameDiv.appendChild(document.createTextNode(task.name));

  const prioritySpan = document.createElement('span');
  prioritySpan.className = `task-priority ${task.priority || 'medium'}`;
  prioritySpan.textContent = priorityLabel;

  const timeDiv = document.createElement('div');
  timeDiv.className = 'task-time';
  timeDiv.textContent = `${task.estimated_time}h`;

  if (task.actual_time && task.actual_time > 0) {
    const timeDiff = task.actual_time - task.estimated_time;
    const timeDiffPercent = ((timeDiff / task.estimated_time) * 100).toFixed(0);
    const timeSpan = document.createElement('span');
    if (timeDiff > 0) {
      const severity = getTimeOverrunSeverity(task.estimated_time, task.actual_time);
      timeSpan.className = `time-overrun time-overrun-${severity}`;
      timeSpan.textContent = `(+${timeDiff}h, +${timeDiffPercent}%)`;
    } else if (timeDiff < 0) {
      timeSpan.className = 'time-underrun';
      timeSpan.textContent = `(${timeDiff}h, ${timeDiffPercent}%)`;
    } else {
      timeSpan.className = 'time-match';
      timeSpan.textContent = '(一致)';
    }
    timeDiv.appendChild(document.createTextNode(' '));
    timeDiv.appendChild(timeSpan);
  }

  taskHeader.appendChild(checkbox);
  taskHeader.appendChild(taskNameDiv);
  taskHeader.appendChild(prioritySpan);
  taskHeader.appendChild(timeDiv);

  taskElement.appendChild(categoryBar);
  taskElement.appendChild(taskHeader);

  if (task.due_date) {
    const dueDateDiv = document.createElement('div');
    dueDateDiv.className = 'task-due-date';
    const dueDate = new Date(task.due_date);
    const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
    dueDateDiv.textContent = `期限: ${formattedDate}`;
    taskElement.appendChild(dueDateDiv);
  }

  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    const newCompleted = (e.target as HTMLInputElement).checked;
    if (newCompleted) {
      const w = window as any;
      if (w.HybridJournalManager && w.HybridJournalUI) {
        const activeEntry = w.HybridJournalManager.getEntryByTaskId(task.id);
        if (activeEntry) {
          e.preventDefault();
          checkbox.checked = false;
          w.HybridJournalUI.showNextStepModal(activeEntry, () => {
            task.completed = true;
            checkbox.checked = true;
            callbacks.playTaskCompletionAnimation(taskElement, checkbox);
            setTimeout(() => {
              callbacks.archiveCompletedTasks();
              callbacks.renderWeek();
              callbacks.updateDashboard();
            }, 1800);
          });
          return;
        }
      }
      task.completed = true;
      callbacks.playTaskCompletionAnimation(taskElement, checkbox);
      setTimeout(() => {
        callbacks.archiveCompletedTasks();
        callbacks.renderWeek();
        callbacks.updateDashboard();
      }, 1800);
    } else {
      task.completed = false;
      callbacks.saveTasks();
      callbacks.renderWeek();
      callbacks.updateDashboard();
    }
  });

  taskElement.addEventListener('click', () => callbacks.openEditModal(task));
  taskElement.addEventListener('dragstart', handleDragStart);
  taskElement.addEventListener('dragend', handleDragEnd);

  return taskElement;
}
