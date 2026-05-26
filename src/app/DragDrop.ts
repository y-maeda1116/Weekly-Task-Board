import type { Task } from '../types';

export function handleDragStart(e: DragEvent): void {
  const target = e.target as HTMLElement;
  e.dataTransfer!.setData('text/plain', target.dataset.taskId || '');
  setTimeout(() => {
    target.classList.add('dragging');
  }, 0);
}

export function handleDragEnd(e: DragEvent): void {
  (e.target as HTMLElement).classList.remove('dragging');
}

export function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  const targetColumn = (e.target as HTMLElement).closest('.day-column');
  if (targetColumn && !targetColumn.classList.contains('hidden') && !targetColumn.classList.contains('hiding')) {
    targetColumn.classList.add('drag-over');
  }
}

export function handleDragLeave(e: DragEvent): void {
  const targetColumn = (e.target as HTMLElement).closest('.day-column');
  if (targetColumn) {
    targetColumn.classList.remove('drag-over');
  }
}

export function createDropHandler(
  tasks: Task[],
  saveTasks: () => void,
  renderWeek: () => void,
): (e: DragEvent) => void {
  return (e: DragEvent) => {
    e.preventDefault();
    const targetColumn = (e.target as HTMLElement).closest('.day-column') as HTMLElement | null;
    if (!targetColumn) return;

    if (targetColumn.classList.contains('hidden') || targetColumn.classList.contains('hiding')) {
      return;
    }

    targetColumn.classList.remove('drag-over');

    const taskId = e.dataTransfer!.getData('text/plain');
    const newDate = targetColumn.dataset.date === 'null' ? null : targetColumn.dataset.date || null;

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.assigned_date = newDate;
      saveTasks();
      renderWeek();
    }
  };
}
