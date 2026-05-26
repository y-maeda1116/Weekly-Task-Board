import type { Task, CategoryInfo, DueTimePeriod } from '../types';
import { TaskCategory } from '../types';
import { TASK_CATEGORIES, PRIORITY_NAMES, PRIORITY_COLORS } from '../constants/taskCategories';

interface PriorityDisplay {
  name: string;
  icon: string;
  color: string;
}

const PRIORITY_DISPLAY: Record<string, PriorityDisplay> = {
  low: { name: '低', icon: '↓', color: '#27ae60' },
  medium: { name: '中', icon: '→', color: '#f39c12' },
  high: { name: '高', icon: '↑', color: '#e74c3c' },
  urgent: { name: '緊急', icon: '⬆', color: '#c0392b' },
};

export interface TaskRenderingCallbacks {
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  openEditModal: (taskId: string) => void;
  moveTask: (taskId: string, date: string) => void;
  moveTaskToUnassigned: (taskId: string) => void;
  renderWeek: () => void;
  getTasksForDate: (tasks: Task[], date: string) => Task[];
  getUnassignedTasks: (tasks: Task[]) => Task[];
}

let callbacks: TaskRenderingCallbacks | null = null;

export function initTaskRendering(cb: TaskRenderingCallbacks): void {
  callbacks = cb;
}

function getCallbacks(): TaskRenderingCallbacks {
  if (!callbacks) {
    throw new Error('TaskRendering not initialized. Call initTaskRendering first.');
  }
  return callbacks;
}

function resolveCategoryInfo(category: string): CategoryInfo {
  const key = category as TaskCategory;
  return TASK_CATEGORIES[key] ?? TASK_CATEGORIES[TaskCategory.TASK];
}

function resolvePriorityInfo(priority: string): PriorityDisplay {
  return PRIORITY_DISPLAY[priority] ?? PRIORITY_DISPLAY.medium;
}

export function formatTime(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours % 1 === 0) return `${hours}h`;

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
}

export function createTaskElement(task: Task): HTMLElement {
  const category = resolveCategoryInfo(task.category);
  const priority = resolvePriorityInfo(task.priority);

  const element = document.createElement('div');
  element.className = `task${task.completed ? ' completed' : ''}`;
  element.dataset.taskId = task.id;
  element.draggable = true;

  appendPriorityBadge(element, priority, task.priority);
  appendTaskName(element, task.name);
  appendTimeInfo(element, task.actual_time, task.estimated_time);
  appendCategoryBadge(element, category);

  if (task.due_date) {
    appendDueDate(element, task.due_date, task.due_time_period ?? null, task.due_hour ?? null, task.completed);
  }

  if (task.is_recurring) {
    appendRecurringIndicator(element);
  }

  appendCheckbox(element, task.id, task.completed);
  appendEditButton(element, task.id);
  appendDeleteButton(element, task.id);

  return element;
}

function appendPriorityBadge(parent: HTMLElement, priority: PriorityDisplay, taskPriority: string): void {
  const badge = document.createElement('span');
  badge.className = 'task-priority';
  badge.textContent = priority.icon;
  badge.title = `優先度: ${priority.name}`;
  badge.style.color = priority.color;
  parent.appendChild(badge);
}

function appendTaskName(parent: HTMLElement, name: string): void {
  const nameEl = document.createElement('span');
  nameEl.className = 'task-name';
  nameEl.textContent = name;
  nameEl.title = name;
  parent.appendChild(nameEl);
}

function appendTimeInfo(parent: HTMLElement, actualTime: number, estimatedTime: number): void {
  const timeEl = document.createElement('span');
  timeEl.className = 'task-time';
  timeEl.textContent = actualTime > 0
    ? `${formatTime(actualTime)}/${formatTime(estimatedTime)}`
    : formatTime(estimatedTime);
  parent.appendChild(timeEl);
}

function appendCategoryBadge(parent: HTMLElement, category: CategoryInfo): void {
  const badge = document.createElement('span');
  badge.className = 'task-category';
  badge.textContent = category.name;
  badge.style.backgroundColor = category.bgColor;
  badge.style.color = category.color;
  parent.appendChild(badge);
}

function appendDueDate(
  parent: HTMLElement,
  dueDate: string,
  timePeriod: DueTimePeriod,
  hour: number | null,
  completed: boolean,
): void {
  const dueEl = document.createElement('span');
  dueEl.className = 'task-due';
  dueEl.textContent = formatDueDate(dueDate, timePeriod, hour);
  dueEl.title = `期限: ${dueDate}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 && !completed) {
    dueEl.style.color = '#e74c3c';
    dueEl.style.fontWeight = 'bold';
  } else if (daysDiff <= 1 && !completed) {
    dueEl.style.color = '#f39c12';
  }

  parent.appendChild(dueEl);
}

function appendRecurringIndicator(parent: HTMLElement): void {
  const el = document.createElement('span');
  el.className = 'task-recurring';
  el.textContent = '🔄';
  el.title = '繰り返しタスク';
  parent.appendChild(el);
}

function appendCheckbox(parent: HTMLElement, taskId: string, completed: boolean): void {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-complete';
  checkbox.checked = completed;
  checkbox.addEventListener('change', () => handleTaskToggle(taskId));
  parent.appendChild(checkbox);
}

function appendEditButton(parent: HTMLElement, taskId: string): void {
  const btn = document.createElement('button');
  btn.className = 'task-edit';
  btn.textContent = '✏️';
  btn.title = '編集';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    getCallbacks().openEditModal(taskId);
  });
  parent.appendChild(btn);
}

function appendDeleteButton(parent: HTMLElement, taskId: string): void {
  const btn = document.createElement('button');
  btn.className = 'task-delete';
  btn.textContent = '🗑️';
  btn.title = '削除';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTaskDelete(taskId);
  });
  parent.appendChild(btn);
}

export function formatDueDate(date: string, timePeriod?: DueTimePeriod, hour?: number | null): string {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = d.toDateString() === today.toDateString() ? '今日'
    : d.toDateString() === tomorrow.toDateString() ? '明日'
    : `${d.getMonth() + 1}/${d.getDate()}`;

  let timeStr = '';
  if (timePeriod === 'morning') {
    timeStr = '午前';
  } else if (timePeriod === 'afternoon') {
    timeStr = '午後';
  } else if (hour) {
    timeStr = `${hour}時`;
  }

  return `📅${dateStr}${timeStr ? ` ${timeStr}` : ''}`;
}

function handleTaskToggle(taskId: string): void {
  const cb = getCallbacks();
  cb.toggleTaskCompletion(taskId);
  cb.renderWeek();
}

function handleTaskDelete(taskId: string): void {
  if (!confirm('このタスクを削除しますか？')) return;
  const cb = getCallbacks();
  cb.deleteTask(taskId);
  cb.renderWeek();
}

export function renderTasksToContainer(tasks: Task[], container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (tasks.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'task-empty';
    emptyMsg.textContent = 'タスクがありません';
    container.appendChild(emptyMsg);
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    fragment.appendChild(createTaskElement(task));
  });
  container.appendChild(fragment);
}

export function renderTasksForDate(tasks: Task[], date: string): void {
  const column = document.getElementById(getDayColumnId(date));
  if (!column) return;

  let list = column.querySelector('.task-list') as HTMLElement | null;
  if (!list) {
    list = document.createElement('div');
    list.className = 'task-list';
    column.appendChild(list);
  }

  renderTasksToContainer(tasks, list);
  updateDailyTimeDisplay(column, tasks);
}

export function renderUnassignedTasks(tasks: Task[]): void {
  const list = document.getElementById('unassigned-list');
  if (!list) return;
  renderTasksToContainer(tasks, list);
}

export function getDayColumnId(date: string): string {
  const d = new Date(date);
  const weekdayMap: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday',
  };
  return weekdayMap[d.getDay()] ?? 'sunday';
}

export function updateDailyTimeDisplay(column: HTMLElement, tasks: Task[]): void {
  const timeSpan = column.querySelector('.daily-total-time') as HTMLElement | null;
  if (!timeSpan) return;

  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
  const totalActual = tasks.reduce((sum, t) => sum + t.actual_time, 0);

  timeSpan.textContent = `(${formatTime(totalActual)} / ${formatTime(totalEstimated)})`;

  if (totalActual > totalEstimated) {
    timeSpan.style.color = '#e74c3c';
  } else if (totalActual === totalEstimated && totalEstimated > 0) {
    timeSpan.style.color = '#27ae60';
  } else {
    timeSpan.style.color = '#7f8c8d';
  }
}

export function renderWeek(tasks: Task[]): void {
  const cb = getCallbacks();
  const dayColumns = document.querySelectorAll<HTMLElement>('#task-board .day-column');

  dayColumns.forEach((column) => {
    const list = column.querySelector('.task-list') as HTMLElement | null;
    if (!list) return;

    const date = column.dataset.date;
    if (!date) return;

    const tasksForDate = cb.getTasksForDate(tasks, date);
    renderTasksToContainer(tasksForDate, list);
    updateDailyTimeDisplay(column, tasksForDate);
  });

  const unassignedList = document.getElementById('unassigned-list');
  if (unassignedList) {
    const unassignedTasks = cb.getUnassignedTasks(tasks);
    renderTasksToContainer(unassignedTasks, unassignedList);
  }
}

export function initializeDragAndDrop(): void {
  const dayColumns = document.querySelectorAll<HTMLElement>('.day-column');
  dayColumns.forEach((column) => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  (event.currentTarget as HTMLElement).classList.add('drag-over');
}

function handleDragLeave(event: DragEvent): void {
  (event.currentTarget as HTMLElement).classList.remove('drag-over');
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');

  const taskId = event.dataTransfer?.getData('text/plain');
  if (!taskId) return;

  const cb = getCallbacks();
  const date = target.dataset.date;

  if (date) {
    cb.moveTask(taskId, date);
    cb.renderWeek();
  } else if (target.id === 'unassigned-tasks') {
    cb.moveTaskToUnassigned(taskId);
    cb.renderWeek();
  }
}
