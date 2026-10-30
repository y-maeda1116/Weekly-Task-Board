/**
 * Validation utility functions
 */

import { TaskCategory } from '../types';
import { TASK_CATEGORIES } from '../constants/taskCategories';

/**
 * Validate and normalize category value
 * @param category - The category to validate
 * @returns Valid category key
 */
export function validateCategory(category: string | TaskCategory | undefined): TaskCategory {
  if (category && TASK_CATEGORIES[category as TaskCategory]) {
    return category as TaskCategory;
  }
  return TaskCategory.TASK;
}

/**
 * Get category information by category key
 * @param categoryKey - The category key
 * @returns Category information with name, color, and bgColor
 */
export function getCategoryInfo(categoryKey: TaskCategory | string) {
  return TASK_CATEGORIES[categoryKey as TaskCategory] || TASK_CATEGORIES[TaskCategory.TASK];
}
