/**
 * Task Categories Constants
 * Defines all task categories with their display properties
 */

import type { TaskCategories } from '../types';
import { TaskCategory } from '../types';

/**
 * Task Categories Definition
 * Maps category keys to their display properties (name, color, background color)
 */
export const TASK_CATEGORIES: TaskCategories = {
  [TaskCategory.TASK]: { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
  [TaskCategory.MEETING]: { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
  [TaskCategory.REVIEW]: { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
  [TaskCategory.BUGFIX]: { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
  [TaskCategory.DOCUMENT]: { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
  [TaskCategory.RESEARCH]: { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
};

/**
 * Get all category keys
 */
export function getCategoryKeys(): TaskCategory[] {
  return Object.keys(TASK_CATEGORIES) as TaskCategory[];
}

/**
 * Get category display name
 */
export function getCategoryName(category: TaskCategory): string {
  return TASK_CATEGORIES[category]?.name || 'Unknown';
}

/**
 * Get category color
 */
export function getCategoryColor(category: TaskCategory): string {
  return TASK_CATEGORIES[category]?.color || '#3498db';
}

/**
 * Get category background color
 */
export function getCategoryBgColor(category: TaskCategory): string {
  return TASK_CATEGORIES[category]?.bgColor || '#e3f2fd';
}

/**
 * Priority display names (Japanese)
 */
export const PRIORITY_NAMES: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急'
};

/**
 * Priority colors
 */
export const PRIORITY_COLORS: Record<string, string> = {
  low: '#95a5a6',
  medium: '#3498db',
  high: '#e67e22',
  urgent: '#e74c3c'
};
