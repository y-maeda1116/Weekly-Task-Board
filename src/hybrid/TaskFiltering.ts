/**
 * Task Filtering Module
 * Type-safe task filtering and sorting functions
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
 * Filter options
 */
export interface FilterOptions {
  category?: string;
  completed?: boolean;
  date?: string;
  assigned_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  searchQuery?: string;
  isRecurring?: boolean;
}

/**
 * Sort options
 */
export type SortOption = 'date' | 'name' | 'priority' | 'estimatedTime' | 'actualTime' | 'category' | 'completion';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Logger class
 */
class HybridLogger {
  info(message: string, ...args: any[]): void {
    console.log(`[TaskFilter] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[TaskFilter] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[TaskFilter] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

/**
 * Priority values for sorting
 */
const PRIORITY_VALUES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3
};

/**
 * Filter tasks based on criteria
 */
function filterTasks(tasks: Task[], options: FilterOptions): Task[] {
  return tasks.filter(task => {
    // Category filter
    if (options.category && task.category !== options.category) {
      return false;
    }

    // Completion filter
    if (options.completed !== undefined && task.completed !== options.completed) {
      return false;
    }

    // Date filter (original date)
    if (options.date && task.date !== options.date) {
      return false;
    }

    // Assigned date filter
    if (options.assigned_date === null) {
      // Filter for unassigned tasks
      if (task.assigned_date !== null) {
        return false;
      }
    } else if (options.assigned_date !== undefined && task.assigned_date !== options.assigned_date) {
      return false;
    }

    // Priority filter
    if (options.priority && task.priority !== options.priority) {
      return false;
    }

    // Recurring filter
    if (options.isRecurring !== undefined && task.is_recurring !== options.isRecurring) {
      return false;
    }

    // Search query filter (case-insensitive)
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      const matchesName = task.name.toLowerCase().includes(query);
      const matchesDetails = task.details.toLowerCase().includes(query);
      if (!matchesName && !matchesDetails) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort tasks based on criteria
 */
function sortTasks(tasks: Task[], sortBy: SortOption, direction: SortDirection = 'asc'): Task[] {
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
        comparison = PRIORITY_VALUES[a.priority] - PRIORITY_VALUES[b.priority];
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
        // Completed tasks last
        if (a.completed && !b.completed) {
          comparison = 1;
        } else if (!a.completed && b.completed) {
          comparison = -1;
        } else {
          comparison = 0;
        }
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get tasks for a specific date
 */
function getTasksForDate(tasks: Task[], date: string): Task[] {
  return filterTasks(tasks, { assigned_date: date });
}

/**
 * Get unassigned tasks
 */
function getUnassignedTasks(tasks: Task[]): Task[] {
  return filterTasks(tasks, { assigned_date: null });
}

/**
 * Get completed tasks
 */
function getCompletedTasks(tasks: Task[]): Task[] {
  return filterTasks(tasks, { completed: true });
}

/**
 * Get incomplete tasks
 */
function getIncompleteTasks(tasks: Task[]): Task[] {
  return filterTasks(tasks, { completed: false });
}

/**
 * Get tasks by category
 */
function getTasksByCategory(tasks: Task[], category: string): Task[] {
  return filterTasks(tasks, { category });
}

/**
 * Get tasks by priority
 */
function getTasksByPriority(tasks: Task[], priority: 'low' | 'medium' | 'high'): Task[] {
  return filterTasks(tasks, { priority });
}

/**
 * Get recurring tasks
 */
function getRecurringTasks(tasks: Task[]): Task[] {
  return filterTasks(tasks, { isRecurring: true });
}

/**
 * Get one-time tasks
 */
function getOneTimeTasks(tasks: Task[]): Task[] {
  return filterTasks(tasks, { isRecurring: false });
}

/**
 * Search tasks
 */
function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query || query.trim().length === 0) {
    return tasks;
  }
  return filterTasks(tasks, { searchQuery: query });
}

/**
 * Group tasks by category
 */
function groupTasksByCategory(tasks: Task[]): Record<string, Task[]> {
  const grouped: Record<string, Task[]> = {};

  tasks.forEach(task => {
    const category = task.category || 'task';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(task);
  });

  return grouped;
}

/**
 * Group tasks by date
 */
function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const grouped: Record<string, Task[]> = {};

  tasks.forEach(task => {
    const date = task.assigned_date || task.date || 'unassigned';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(task);
  });

  return grouped;
}

/**
 * Group tasks by priority
 */
function groupTasksByPriority(tasks: Task[]): Record<string, Task[]> {
  const grouped: Record<string, Task[]> = {
    high: [],
    medium: [],
    low: []
  };

  tasks.forEach(task => {
    const priority = task.priority || 'medium';
    if (!grouped[priority]) {
      grouped[priority] = [];
    }
    grouped[priority].push(task);
  });

  return grouped;
}

/**
 * Get task count by category
 */
function getTaskCountByCategory(tasks: Task[]): Record<string, number> {
  const counts: Record<string, number> = {};

  tasks.forEach(task => {
    const category = task.category || 'task';
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

/**
 * Get task count by priority
 */
function getTaskCountByPriority(tasks: Task[]): Record<string, number> {
  const counts: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };

  tasks.forEach(task => {
    const priority = task.priority || 'medium';
    counts[priority] = (counts[priority] || 0) + 1;
  });

  return counts;
}

/**
 * Get total estimated time
 */
function getTotalEstimatedTime(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + task.estimated_time, 0);
}

/**
 * Get total actual time
 */
function getTotalActualTime(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + task.actual_time, 0);
}

/**
 * Get tasks with time overrun
 */
function getTasksWithTimeOverrun(tasks: Task[]): Task[] {
  return tasks.filter(task => task.actual_time > task.estimated_time);
}

/**
 * Get tasks due today or earlier
 */
function getTasksDueSoon(tasks: Task[], today?: string): Task[] {
  const todayDate = today || new Date().toISOString().split('T')[0];

  return tasks.filter(task => {
    if (!task.due_date) {
      return false;
    }
    return task.due_date <= todayDate && !task.completed;
  });
}

/**
 * Sort tasks for display (completed tasks last, then by priority)
 */
function sortTasksForDisplay(tasks: Task[]): Task[] {
  return sortTasks(
    sortTasks(tasks, 'priority', 'desc'),
    'completion',
    'asc'
  );
}

/**
 * Get filter summary
 */
function getFilterSummary(tasks: Task[], options: FilterOptions): string {
  const filtered = filterTasks(tasks, options);
  const total = tasks.length;
  const filteredCount = filtered.length;

  let summary = `${filteredCount}/${total} tasks`;

  if (options.category) {
    summary += ` in ${options.category}`;
  }
  if (options.completed !== undefined) {
    summary += options.completed ? ' (completed)' : ' (incomplete)';
  }
  if (options.searchQuery) {
    summary += ` matching "${options.searchQuery}"`;
  }

  return summary;
}

/**
 * Public API
 */
export const TaskFiltering = {
  // Basic filtering
  filterTasks,
  sortTasks,

  // Convenience filters
  getTasksForDate,
  getUnassignedTasks,
  getCompletedTasks,
  getIncompleteTasks,
  getTasksByCategory,
  getTasksByPriority,
  getRecurringTasks,
  getOneTimeTasks,

  // Search
  searchTasks,

  // Grouping
  groupTasksByCategory,
  groupTasksByDate,
  groupTasksByPriority,

  // Counts
  getTaskCountByCategory,
  getTaskCountByPriority,

  // Time calculations
  getTotalEstimatedTime,
  getTotalActualTime,
  getTasksWithTimeOverrun,

  // Due tasks
  getTasksDueSoon,

  // Display sorting
  sortTasksForDisplay,

  // Summary
  getFilterSummary
};

// Expose to window for use by existing script.js
(window as any).HybridTaskFiltering = TaskFiltering;

console.log('Hybrid task filtering module loaded');
