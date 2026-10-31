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
