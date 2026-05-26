/**
 * Shared utilities exposed to window.* for backward compatibility
 * with existing IIFE modules during migration.
 */
import { getMonday, formatDate, getNextDate } from '../utils/date';
import { TASK_CATEGORIES, getCategoryName, getCategoryColor, getCategoryBgColor } from '../constants/taskCategories';
import { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS } from '../constants/signifiers';

export {
  getMonday,
  formatDate,
  getNextDate,
  TASK_CATEGORIES,
  getCategoryName,
  getCategoryColor,
  getCategoryBgColor,
  SIGNIFIER_ORDER,
  SIGNIFIER_MAP,
  SIGNIFIER_LABELS,
};

export function exposeToWindow(): void {
  const w = window as any;
  w.getMonday = getMonday;
  w.formatDate = formatDate;
  w.getNextDate = getNextDate;
  w.TASK_CATEGORIES = TASK_CATEGORIES;
}
