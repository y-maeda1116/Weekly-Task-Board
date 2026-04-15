/**
 * Hybrid Integration Layer - Simple Version
 * Exposes TypeScript type-safe functions to window
 * Works alongside existing script.js without module system
 */

/**
 * Task creation with basic typing
 */
export function createTask(options: {
  name: string;
  estimated_time: number;
  priority: string;
  category: string;
  date: string;
  details?: string;
}): {
  id: string;
  name: string;
  estimated_time: number;
  actual_time: number;
  completed: boolean;
  priority: string;
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
} {
  const now = Date.now();
  return {
    id: `task-${now}-${Math.random().toString(36).substring(2, 11)}`,
    name: options.name,
    estimated_time: options.estimated_time,
    actual_time: 0,
    completed: false,
    priority: options.priority,
    category: options.category,
    date: options.date,
    assigned_date: options.date,
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: options.details || '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };
}

/**
 * Category info mapping
 */
export function getCategoryInfo(category: string): {
  name: string;
  color: string;
  bgColor: string;
} {
  const categoryMap: Record<string, {
    name: string;
    color: string;
    bgColor: string;
  }> = {
    'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
    'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
    'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
    'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
    'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
    'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
  };

  return categoryMap[category] || categoryMap['task'];
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Expose functions to window for use by script.js
(window as any).HybridBridge = {
  createTask,
  getCategoryInfo,
  formatDate
};

console.log('Hybrid bridge initialized (simple version)');
