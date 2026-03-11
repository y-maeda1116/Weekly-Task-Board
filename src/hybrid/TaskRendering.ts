/**
 * Task Rendering Module
 * Type-safe task rendering and DOM operations
 * Standalone version with no external dependencies
 */

/**
 * Task interface
 */
export interface Task {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  date: string;
  assigned_date: string | null;
  due_date: string | null;
  due_time_period: 'morning' | 'afternoon' | null;
  due_hour: number | null;
  details: string;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date: string | null;
}

/**
 * Category info
 */
interface CategoryInfo {
  name: string;
  color: string;
  bgColor: string;
}

/**
 * Logger class
 */
class HybridLogger {
  info(message: string, ...args: any[]): void {
    console.log(`[TaskRender] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[TaskRender] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[TaskRender] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

/**
 * Category information mapping
 */
const CATEGORY_INFO: Record<string, CategoryInfo> = {
  task: { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
  meeting: { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
  review: { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
  bugfix: { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
  document: { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
  research: { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
};

/**
 * Priority information mapping
 */
const PRIORITY_INFO: Record<string, { name: string; icon: string }> = {
  low: { name: '低', icon: '↓' },
  medium: { name: '中', icon: '→' },
  high: { name: '高', icon: '↑' }
};

/**
 * Get category info
 */
function getCategoryInfo(category: string): CategoryInfo {
  return CATEGORY_INFO[category] || CATEGORY_INFO.task;
}

/**
 * Get priority info
 */
function getPriorityInfo(priority: string): { name: string; icon: string } {
  return PRIORITY_INFO[priority] || PRIORITY_INFO.medium;
}

/**
 * Format time in hours
 */
function formatTime(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours % 1 === 0) {
    return `${hours}h`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
}

/**
 * Create task element
 */
function createTaskElement(task: Task): HTMLElement {
  const category = getCategoryInfo(task.category);
  const priority = getPriorityInfo(task.priority);

  const element = document.createElement('div');
  element.className = `task ${task.completed ? 'completed' : ''}`;
  element.dataset.taskId = task.id;
  element.draggable = true;

  // Priority indicator
  const priorityBadge = document.createElement('span');
  priorityBadge.className = 'task-priority';
  priorityBadge.textContent = priority.icon;
  priorityBadge.title = `優先度: ${priority.name}`;
  priorityBadge.style.color = task.priority === 'high' ? '#e74c3c' :
                           task.priority === 'low' ? '#27ae60' : '#f39c12';
  element.appendChild(priorityBadge);

  // Task name
  const nameEl = document.createElement('span');
  nameEl.className = 'task-name';
  nameEl.textContent = task.name;
  nameEl.title = task.name;
  element.appendChild(nameEl);

  // Time info
  const timeEl = document.createElement('span');
  timeEl.className = 'task-time';
  const timeText = task.actual_time > 0
    ? `${formatTime(task.actual_time)}/${formatTime(task.estimated_time)}`
    : formatTime(task.estimated_time);
  timeEl.textContent = timeText;
  element.appendChild(timeEl);

  // Category badge
  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'task-category';
  categoryBadge.textContent = category.name;
  categoryBadge.style.backgroundColor = category.bgColor;
  categoryBadge.style.color = category.color;
  element.appendChild(categoryBadge);

  // Due date indicator (if applicable)
  if (task.due_date) {
    const dueEl = document.createElement('span');
    dueEl.className = 'task-due';
    const dueText = formatDueDate(task.due_date, task.due_time_period, task.due_hour);
    dueEl.textContent = dueText;
    dueEl.title = `期限: ${task.due_date}`;

    // Color code based on urgency
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0 && !task.completed) {
      dueEl.style.color = '#e74c3c';
      dueEl.style.fontWeight = 'bold';
    } else if (daysDiff <= 1 && !task.completed) {
      dueEl.style.color = '#f39c12';
    }

    element.appendChild(dueEl);
  }

  // Recurrence indicator
  if (task.is_recurring) {
    const recurringEl = document.createElement('span');
    recurringEl.className = 'task-recurring';
    recurringEl.textContent = '🔄';
    recurringEl.title = '繰り返しタスク';
    element.appendChild(recurringEl);
  }

  // Completion checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-complete';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => handleTaskToggle(task.id));
  element.appendChild(checkbox);

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'task-edit';
  editBtn.textContent = '✏️';
  editBtn.title = '編集';
  editBtn.addEventListener('click', () => handleTaskEdit(task.id));
  element.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete';
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = '削除';
  deleteBtn.addEventListener('click', () => handleTaskDelete(task.id));
  element.appendChild(deleteBtn);

  return element;
}

/**
 * Format due date for display
 */
function formatDueDate(date: string, timePeriod?: string | null, hour?: number | null): string {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if today, tomorrow, or other date
  const dateStr = d.toDateString() === today.toDateString() ? '今日' :
                  d.toDateString() === tomorrow.toDateString() ? '明日' :
                  `${d.getMonth() + 1}/${d.getDate()}`;

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

/**
 * Handle task completion toggle
 */
function handleTaskToggle(taskId: string): void {
  if ((window as any).HybridTaskOperations && (window as any).HybridTaskOperations.toggleTaskCompletion) {
    (window as any).HybridTaskOperations.toggleTaskCompletion(taskId);
    // Trigger re-render
    if ((window as any).renderWeek) {
      (window as any).renderWeek();
    }
    logger.info(`Task toggled: ${taskId}`);
  }
}

/**
 * Handle task edit
 */
function handleTaskEdit(taskId: string): void {
  if ((window as any).HybridTaskModal && (window as any).HybridTaskModal.openEditModal) {
    (window as any).HybridTaskModal.openEditModal(taskId);
    logger.info(`Task edit requested: ${taskId}`);
  }
}

/**
 * Handle task delete
 */
function handleTaskDelete(taskId: string): void {
  if (confirm('このタスクを削除しますか？')) {
    if ((window as any).HybridTaskOperations && (window as any).HybridTaskOperations.deleteTask) {
      (window as any).HybridTaskOperations.deleteTask(taskId);
      // Trigger re-render
      if ((window as any).renderWeek) {
        (window as any).renderWeek();
      }
      logger.info(`Task deleted: ${taskId}`);
    }
  }
}

/**
 * Render tasks to a container
 */
function renderTasksToContainer(tasks: Task[], container: HTMLElement): void {
  // Clear existing tasks
  container.innerHTML = '';

  if (tasks.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'task-empty';
    emptyMsg.textContent = 'タスクがありません';
    container.appendChild(emptyMsg);
    return;
  }

  // Render each task
  tasks.forEach(task => {
    const taskEl = createTaskElement(task);
    container.appendChild(taskEl);
  });
}

/**
 * Render tasks for a specific date column
 */
function renderTasksForDate(tasks: Task[], date: string): void {
  const column = document.getElementById(getDayColumnId(date));
  if (!column) {
    return;
  }

  const list = column.querySelector('.task-list') as HTMLElement | null;
  if (!list) {
    // Create task list if it doesn't exist
    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    column.appendChild(taskList);
    renderTasksToContainer(tasks, taskList);
  } else {
    renderTasksToContainer(tasks, list);
  }

  // Update daily time display
  updateDailyTimeDisplay(column, tasks);
}

/**
 * Render unassigned tasks
 */
function renderUnassignedTasks(tasks: Task[]): void {
  const list = document.getElementById('unassigned-list');
  if (!list) {
    return;
  }

  renderTasksToContainer(tasks, list);
}

/**
 * Get day column ID from date
 */
function getDayColumnId(date: string): string {
  const d = new Date(date);
  const day = d.getDay();
  const weekdayMap: Record<number, string> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday'
  };
  return weekdayMap[day] || 'sunday';
}

/**
 * Update daily time display
 */
function updateDailyTimeDisplay(column: HTMLElement, tasks: Task[]): void {
  const timeSpan = column.querySelector('.daily-total-time') as HTMLElement | null;
  if (!timeSpan) {
    return;
  }

  const totalEstimated = tasks.reduce((sum, task) => sum + task.estimated_time, 0);
  const totalActual = tasks.reduce((sum, task) => sum + task.actual_time, 0);

  timeSpan.textContent = `(${formatTime(totalActual)} / ${formatTime(totalEstimated)})`;

  // Color code based on progress
  if (totalActual > totalEstimated) {
    timeSpan.style.color = '#e74c3c'; // Overdue
  } else if (totalActual === totalEstimated && totalEstimated > 0) {
    timeSpan.style.color = '#27ae60'; // Complete
  } else {
    timeSpan.style.color = '#7f8c8d'; // Normal
  }
}

/**
 * Render all tasks for the week
 */
function renderWeek(tasks: Task[]): void {
  // Get all date columns
  const dayColumns = document.querySelectorAll('#task-board .day-column');

  dayColumns.forEach(column => {
    if (!(column instanceof HTMLElement)) return;

    const list = column.querySelector('.task-list') as HTMLElement | null;
    if (!list) return;

    // Get date for this column
    const date = column.dataset.date;

    if (date) {
      // Get tasks for this date
      const tasksForDate = (window as any).HybridTaskFiltering?.getTasksForDate
        ? (window as any).HybridTaskFiltering.getTasksForDate(tasks, date)
        : tasks.filter((t: Task) => t.assigned_date === date || (t.assigned_date === null && t.date === date));

      renderTasksToContainer(tasksForDate, list);
      updateDailyTimeDisplay(column, tasksForDate);
    }
  });

  // Render unassigned tasks
  const unassignedList = document.getElementById('unassigned-list');
  if (unassignedList) {
    const unassignedTasks = (window as any).HybridTaskFiltering?.getUnassignedTasks
      ? (window as any).HybridTaskFiltering.getUnassignedTasks(tasks)
      : tasks.filter((t: Task) => t.assigned_date === null);

    renderTasksToContainer(unassignedTasks, unassignedList);
  }

  logger.info('Week rendered');
}

/**
 * Initialize drag and drop
 */
function initializeDragAndDrop(): void {
  const dayColumns = document.querySelectorAll('.day-column');

  dayColumns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragleave', handleDragLeave);
  });

  logger.info('Drag and drop initialized');
}

/**
 * Handle drag over
 */
function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
  const target = event.currentTarget as HTMLElement;
  target.classList.add('drag-over');
}

/**
 * Handle drag leave
 */
function handleDragLeave(event: DragEvent): void {
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');
}

/**
 * Handle drop
 */
function handleDrop(event: DragEvent): void {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');

  const taskId = event.dataTransfer?.getData('text/plain');
  if (!taskId) return;

  const columnId = target.id;
  const date = target.dataset.date;

  if (date) {
    // Move task to new date
    if ((window as any).HybridTaskOperations?.moveTask) {
      (window as any).HybridTaskOperations.moveTask(taskId, date);
      // Trigger re-render
      if ((window as any).renderWeek) {
        (window as any).renderWeek();
      }
      logger.info(`Task ${taskId} moved to ${date}`);
    }
  } else if (columnId === 'unassigned-tasks') {
    // Move task to unassigned
    if ((window as any).HybridTaskOperations?.moveTaskToUnassigned) {
      (window as any).HybridTaskOperations.moveTaskToUnassigned(taskId);
      // Trigger re-render
      if ((window as any).renderWeek) {
        (window as any).renderWeek();
      }
      logger.info(`Task ${taskId} moved to unassigned`);
    }
  }
}

/**
 * Public API
 */
export const TaskRendering = {
  // Rendering
  createTaskElement,
  renderTasksToContainer,
  renderTasksForDate,
  renderUnassignedTasks,
  renderWeek,

  // Utilities
  getCategoryInfo,
  getPriorityInfo,
  formatTime,
  formatDueDate,
  getDayColumnId,

  // Drag and drop
  initializeDragAndDrop,

  // Handlers
  handleTaskToggle,
  handleTaskEdit,
  handleTaskDelete
};

// Expose to window for use by existing script.js
(window as any).HybridTaskRendering = TaskRendering;

console.log('Hybrid task rendering module loaded');
