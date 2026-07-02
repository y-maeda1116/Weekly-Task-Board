import type { Task } from '../types';
import type { MigrationHistory } from '../types/storage';
import { StorageKeys } from '../types/storage';
import { validateCategory, getCategoryInfo } from '../app/taskStorage';

export interface ArchivedTask extends Task {
  archived_date: string;
}

export interface ArchiveCallbacks {
  getTasks: () => Task[];
  saveTasks: (tasks: Task[]) => void;
  getMigrationHistory: () => MigrationHistory;
}

function migrateArchivedTasksAddActualTime(archivedTasks: ArchivedTask[]): ArchivedTask[] {
  return archivedTasks.map(task =>
    task.actual_time === undefined
      ? { ...task, actual_time: 0 }
      : task
  );
}

function migrateArchivedTasksAddRecurringFields(archivedTasks: ArchivedTask[]): ArchivedTask[] {
  return archivedTasks.map(task => ({
    ...task,
    is_recurring: task.is_recurring ?? false,
    recurrence_pattern: task.recurrence_pattern ?? null,
    recurrence_end_date: task.recurrence_end_date ?? null,
  }));
}

function applyMigrations(
  archivedTasks: ArchivedTask[],
  getMigrationHistory: () => MigrationHistory
): ArchivedTask[] {
  const history = getMigrationHistory();
  let migrated = archivedTasks;

  if (history.version >= '1.0') {
    migrated = migrateArchivedTasksAddActualTime(migrated);
  }
  if (history.version >= '1.1') {
    migrated = migrateArchivedTasksAddRecurringFields(migrated);
  }

  return migrated;
}

export function loadArchivedTasks(callbacks: ArchiveCallbacks): ArchivedTask[] {
  const archivedJson = localStorage.getItem(StorageKeys.ARCHIVE);
  if (!archivedJson) return [];

  try {
    const parsed: ArchivedTask[] = JSON.parse(archivedJson);
    return applyMigrations(parsed, callbacks.getMigrationHistory);
  } catch {
    return [];
  }
}

export function saveArchivedTasks(archivedTasks: ArchivedTask[]): void {
  let migrated = migrateArchivedTasksAddActualTime(archivedTasks);
  migrated = migrateArchivedTasksAddRecurringFields(migrated);
  localStorage.setItem(StorageKeys.ARCHIVE, JSON.stringify(migrated));
}

export function archiveCompletedTasks(callbacks: ArchiveCallbacks): void {
  const allTasks = callbacks.getTasks();
  const completedTasks = allTasks.filter(task => task.completed);
  if (completedTasks.length === 0) return;

  const archivedTasks = loadArchivedTasks(callbacks);
  const currentDate = new Date().toISOString();

  const newlyArchived: ArchivedTask[] = completedTasks.map(task => ({
    ...task,
    archived_date: currentDate,
  }));

  const remainingTasks = allTasks.filter(task => !task.completed);
  const allArchived = [...archivedTasks, ...newlyArchived];

  saveArchivedTasks(allArchived);
  callbacks.saveTasks(remainingTasks);
}

function formatDateParts(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

function buildDatesHtml(task: ArchivedTask): string {
  const parts: string[] = [];

  if (task.assigned_date) {
    const d = new Date(task.assigned_date);
    parts.push(`担当日: ${d.getMonth() + 1}/${d.getDate()}`);
  }

  if (task.due_date) {
    const d = new Date(task.due_date);
    parts.push(`期限: ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  }

  return parts.join(' | ');
}

function createArchivedTaskElement(
  task: ArchivedTask,
  callbacks: ArchiveCallbacks
): HTMLElement {
  const taskElement = document.createElement('div');
  taskElement.className = 'archived-task';

  const categoryKey = validateCategory(task.category);
  const categoryInfo = getCategoryInfo(categoryKey);
  taskElement.classList.add('category-' + categoryKey);

  const categoryBar = document.createElement('div');
  categoryBar.className = 'category-bar';
  categoryBar.style.backgroundColor = categoryInfo.color;

  const header = document.createElement('div');
  header.className = 'archived-task-header';

  const nameEl = document.createElement('div');
  nameEl.className = 'archived-task-name';
  nameEl.textContent = task.name;

  const timeEl = document.createElement('div');
  timeEl.className = 'archived-task-time';
  timeEl.textContent = `${task.estimated_time}h`;

  header.appendChild(nameEl);
  header.appendChild(timeEl);

  taskElement.appendChild(categoryBar);
  taskElement.appendChild(header);

  const datesHtml = buildDatesHtml(task);
  if (datesHtml) {
    const datesEl = document.createElement('div');
    datesEl.className = 'archived-task-dates';
    datesEl.textContent = datesHtml;
    taskElement.appendChild(datesEl);
  }

  if (task.details) {
    const detailsEl = document.createElement('div');
    detailsEl.className = 'archived-task-details';
    detailsEl.textContent = task.details;
    taskElement.appendChild(detailsEl);
  }

  const archivedDate = new Date(task.archived_date);
  const completedEl = document.createElement('div');
  completedEl.className = 'archived-task-completed-date';
  completedEl.textContent = `完了: ${formatDateParts(archivedDate)}`;
  taskElement.appendChild(completedEl);

  const actionsEl = document.createElement('div');
  actionsEl.className = 'archived-task-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'restore-task-btn';
  restoreBtn.dataset.taskId = task.id;
  restoreBtn.textContent = '↩️ 復元';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-task-btn';
  deleteBtn.dataset.taskId = task.id;
  deleteBtn.textContent = '🗑️ 削除';

  actionsEl.appendChild(restoreBtn);
  actionsEl.appendChild(deleteBtn);
  taskElement.appendChild(actionsEl);

  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    restoreTaskFromArchive(task.id, taskElement, callbacks);
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTaskFromArchive(task.id, taskElement, callbacks);
  });

  return taskElement;
}

export function showArchiveView(callbacks: ArchiveCallbacks): void {
  renderArchive(callbacks);
  const archiveView = document.getElementById('archive-view');
  if (archiveView) archiveView.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

export function hideArchiveView(): void {
  const archiveView = document.getElementById('archive-view');
  if (archiveView) archiveView.style.display = 'none';
  document.body.style.overflow = 'auto';
}

export function renderArchive(callbacks: ArchiveCallbacks): void {
  const archivedTasks = loadArchivedTasks(callbacks);
  const archiveList = document.getElementById('archive-list');
  if (!archiveList) return;

  archiveList.textContent = '';

  if (archivedTasks.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'archive-empty';
    emptyDiv.textContent = 'アーカイブされたタスクはありません';
    archiveList.appendChild(emptyDiv);
    return;
  }

  const sorted = [...archivedTasks].sort(
    (a, b) => new Date(b.archived_date).getTime() - new Date(a.archived_date).getTime()
  );

  sorted.forEach(task => {
    archiveList.appendChild(createArchivedTaskElement(task, callbacks));
  });
}

export function clearAllArchive(callbacks: ArchiveCallbacks): void {
  if (confirm('アーカイブされた全てのタスクを削除しますか？この操作は取り消せません。')) {
    saveArchivedTasks([]);
    renderArchive(callbacks);
  }
}

export function restoreTaskFromArchive(
  taskId: string,
  taskElement: HTMLElement,
  callbacks: ArchiveCallbacks
): void {
  const archivedTasks = loadArchivedTasks(callbacks);
  const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) return;

  // taskIndex は上記で -1 が除外済みのため存在が保証される
  const taskToRestore = archivedTasks[taskIndex]!;
  taskElement.classList.add('restoring');

  setTimeout(() => {
    const updatedArchived = archivedTasks.filter((_, i) => i !== taskIndex);
    saveArchivedTasks(updatedArchived);

    const { archived_date: _, ...restoredFields } = taskToRestore;
    const restoredTask: Task = { ...restoredFields, completed: false };

    const currentTasks = callbacks.getTasks();
    callbacks.saveTasks([...currentTasks, restoredTask]);

    renderArchive(callbacks);
    showRestoreMessage(taskToRestore.name);
  }, 800);
}

export function deleteTaskFromArchive(
  taskId: string,
  taskElement: HTMLElement,
  callbacks: ArchiveCallbacks
): void {
  const archivedTasks = loadArchivedTasks(callbacks);
  const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) return;

  const taskToDelete = archivedTasks[taskIndex]!;
  if (!confirm(`「${taskToDelete.name}」を完全に削除しますか？この操作は取り消せません。`)) return;

  taskElement.classList.add('restoring');

  setTimeout(() => {
    const updatedArchived = archivedTasks.filter((_, i) => i !== taskIndex);
    saveArchivedTasks(updatedArchived);
    renderArchive(callbacks);
  }, 800);
}

function showRestoreMessage(taskName: string): void {
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = `「${taskName}」を復元しました！`;
  messageElement.style.background = 'linear-gradient(135deg, #4a90e2, #5aa3f0)';

  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.classList.add('show');
  }, 100);

  setTimeout(() => {
    messageElement.classList.remove('show');
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 300);
  }, 2000);
}

export function initArchiveEventListeners(callbacks: ArchiveCallbacks): void {
  const archiveToggleBtn = document.getElementById('archive-toggle');
  const closeArchiveBtn = document.getElementById('close-archive');
  const clearArchiveBtn = document.getElementById('clear-archive');

  if (archiveToggleBtn) {
    archiveToggleBtn.addEventListener('click', () => showArchiveView(callbacks));
  }
  if (closeArchiveBtn) {
    closeArchiveBtn.addEventListener('click', hideArchiveView);
  }
  if (clearArchiveBtn) {
    clearArchiveBtn.addEventListener('click', () => clearAllArchive(callbacks));
  }
}
