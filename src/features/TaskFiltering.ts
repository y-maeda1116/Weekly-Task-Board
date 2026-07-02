import type { Task } from '../types';
import { TaskCategory, TaskPriority } from '../types/task';

export interface FilterOptions {
  category?: TaskCategory;
  completed?: boolean;
  date?: string;
  assigned_date?: string | null;
  priority?: TaskPriority;
  isRecurring?: boolean;
  searchQuery?: string;
}

type SortField = 'date' | 'name' | 'priority' | 'estimatedTime' | 'actualTime' | 'category' | 'completion';
type SortDirection = 'asc' | 'desc';

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.URGENT]: 4,
};

function compareCompletion(a: Task, b: Task): number {
  if (a.completed && !b.completed) return 1;
  if (!a.completed && b.completed) return -1;
  return 0;
}

export function filterTasks(tasks: readonly Task[], options: FilterOptions): Task[] {
  return tasks.filter(task => {
    if (options.category !== undefined && task.category !== options.category) return false;
    if (options.completed !== undefined && task.completed !== options.completed) return false;
    if (options.date !== undefined && task.date !== options.date) return false;

    if (options.assigned_date === null) {
      if (task.assigned_date !== null) return false;
    } else if (options.assigned_date !== undefined && task.assigned_date !== options.assigned_date) {
      return false;
    }

    if (options.priority !== undefined && task.priority !== options.priority) return false;
    if (options.isRecurring !== undefined && task.is_recurring !== options.isRecurring) return false;

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      const matchesName = task.name.toLowerCase().includes(query);
      const matchesDetails = task.details.toLowerCase().includes(query);
      if (!matchesName && !matchesDetails) return false;
    }

    return true;
  });
}

export function sortTasks(tasks: readonly Task[], sortBy: SortField, direction: SortDirection = 'asc'): Task[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.date.localeCompare(b.date);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'priority':
        comparison = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
        break;
      case 'estimatedTime':
        comparison = a.estimated_time - b.estimated_time;
        break;
      case 'actualTime':
        comparison = a.actual_time - b.actual_time;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'completion':
        comparison = compareCompletion(a, b);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function getTasksForDate(tasks: readonly Task[], date: string | null): Task[] {
  return filterTasks(tasks, { assigned_date: date });
}

export function getUnassignedTasks(tasks: readonly Task[]): Task[] {
  return filterTasks(tasks, { assigned_date: null });
}

export function getCompletedTasks(tasks: readonly Task[]): Task[] {
  return filterTasks(tasks, { completed: true });
}

export function getIncompleteTasks(tasks: readonly Task[]): Task[] {
  return filterTasks(tasks, { completed: false });
}

export function getTasksByCategory(tasks: readonly Task[], category: TaskCategory): Task[] {
  return filterTasks(tasks, { category });
}

export function getTasksByPriority(tasks: readonly Task[], priority: TaskPriority): Task[] {
  return filterTasks(tasks, { priority });
}

export function getRecurringTasks(tasks: readonly Task[]): Task[] {
  return filterTasks(tasks, { isRecurring: true });
}

export function getOneTimeTasks(tasks: readonly Task[]): Task[] {
  return filterTasks(tasks, { isRecurring: false });
}

export function searchTasks(tasks: readonly Task[], query: string): Task[] {
  if (!query || query.trim().length === 0) return [...tasks];
  return filterTasks(tasks, { searchQuery: query });
}

export function groupTasksByCategory(tasks: readonly Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.category || TaskCategory.TASK;
    return { ...acc, [key]: [...(acc[key] ?? []), task] };
  }, {});
}

export function groupTasksByDate(tasks: readonly Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.assigned_date ?? task.date ?? 'unassigned';
    return { ...acc, [key]: [...(acc[key] ?? []), task] };
  }, {});
}

export function groupTasksByPriority(tasks: readonly Task[]): Record<TaskPriority, Task[]> {
  const initial: Record<TaskPriority, Task[]> = {
    [TaskPriority.HIGH]: [],
    [TaskPriority.MEDIUM]: [],
    [TaskPriority.LOW]: [],
    [TaskPriority.URGENT]: [],
  };

  return tasks.reduce<Record<TaskPriority, Task[]>>((acc, task) => {
    const priority = task.priority || TaskPriority.MEDIUM;
    return { ...acc, [priority]: [...(acc[priority] ?? []), task] };
  }, initial);
}

export function getTaskCountByCategory(tasks: readonly Task[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    const key = task.category || TaskCategory.TASK;
    return { ...acc, [key]: (acc[key] ?? 0) + 1 };
  }, {});
}

export function getTaskCountByPriority(tasks: readonly Task[]): Record<TaskPriority, number> {
  const initial: Record<TaskPriority, number> = {
    [TaskPriority.HIGH]: 0,
    [TaskPriority.MEDIUM]: 0,
    [TaskPriority.LOW]: 0,
    [TaskPriority.URGENT]: 0,
  };

  return tasks.reduce<Record<TaskPriority, number>>((acc, task) => {
    const priority = task.priority || TaskPriority.MEDIUM;
    return { ...acc, [priority]: (acc[priority] ?? 0) + 1 };
  }, initial);
}

export function getTotalEstimatedTime(tasks: readonly Task[]): number {
  return tasks.reduce((sum, task) => sum + task.estimated_time, 0);
}

export function getTotalActualTime(tasks: readonly Task[]): number {
  return tasks.reduce((sum, task) => sum + task.actual_time, 0);
}

export function getTasksWithTimeOverrun(tasks: readonly Task[]): Task[] {
  return tasks.filter(task => task.actual_time > task.estimated_time);
}

export function getTasksDueSoon(tasks: readonly Task[], today?: string): Task[] {
  const todayDate = today ?? new Date().toISOString().slice(0, 10);
  return tasks.filter(task => task.due_date !== null && task.due_date <= todayDate && !task.completed);
}

export function sortTasksForDisplay(tasks: readonly Task[]): Task[] {
  return sortTasks(sortTasks(tasks, 'priority', 'desc'), 'completion', 'asc');
}

export function getFilterSummary(tasks: readonly Task[], options: FilterOptions): string {
  const filtered = filterTasks(tasks, options);
  let summary = `${filtered.length}/${tasks.length} tasks`;

  if (options.category) summary += ` in ${options.category}`;
  if (options.completed !== undefined) summary += options.completed ? ' (completed)' : ' (incomplete)';
  if (options.searchQuery) summary += ` matching "${options.searchQuery}"`;

  return summary;
}
