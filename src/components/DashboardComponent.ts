/**
 * DashboardComponent - Type-safe class for statistics dashboard UI
 * Handles rendering of weekly statistics and category analysis
 */

import type { Task, CompletionRate, CategoryAnalysis, DailyWorkTime } from '../types';
import {
  calculateCompletionRateForDate,
  calculateCategoryTimeAnalysisForDate,
  calculateDailyWorkTimeForDate
} from '../utils/statistics';
import { getMonday, formatDate, formatTime } from '../utils/date';
import { getCategoryInfo } from '../utils/validation';
import { domManager } from '../core/DOMManager';
import { logger } from '../utils/logger';

/**
 * DashboardComponent class
 * Manages the statistics dashboard UI
 */
export class DashboardComponent {
  private panel: HTMLElement | null = null;
  private datePicker: HTMLInputElement | null = null;
  private prevWeekBtn: HTMLButtonElement | null = null;
  private nextWeekBtn: HTMLButtonElement | null = null;
  private completionRateValue: HTMLElement | null = null;
  private completedTasksValue: HTMLElement | null = null;
  private estimatedTimeValue: HTMLElement | null = null;
  private actualTimeValue: HTMLElement | null = null;
  private categoryBreakdown: HTMLElement | null = null;
  private dailyBreakdown: HTMLElement | null = null;

  private weekOffset: number = 0;
  private currentTasks: Task[] = [];

  constructor() {
    this.initializeElements();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.panel = domManager.byId<HTMLElement>('dashboard-panel');
    this.datePicker = domManager.byId<HTMLInputElement>('dashboard-date-picker');
    this.prevWeekBtn = domManager.byId<HTMLButtonElement>('dashboard-prev-week');
    this.nextWeekBtn = domManager.byId<HTMLButtonElement>('dashboard-next-week');
    this.completionRateValue = domManager.byId<HTMLElement>('completion-rate-value');
    this.completedTasksValue = domManager.byId<HTMLElement>('completed-tasks-value');
    this.estimatedTimeValue = domManager.byId<HTMLElement>('estimated-time-value');
    this.actualTimeValue = domManager.byId<HTMLElement>('actual-time-value');
    this.categoryBreakdown = domManager.byId<HTMLElement>('category-breakdown');
    this.dailyBreakdown = domManager.byId<HTMLElement>('daily-breakdown');
  }

  /**
   * Set tasks for calculations
   */
  setTasks(tasks: Task[]): void {
    this.currentTasks = tasks;
  }

  /**
   * Show the dashboard
   */
  show(): void {
    if (this.panel) {
      domManager.show(this.panel);
      this.weekOffset = 0;
      this.updateDatePicker();
      this.updateDashboard();
    }
  }

  /**
   * Hide the dashboard
   */
  hide(): void {
    if (this.panel) {
      domManager.hide(this.panel);
    }
  }

  /**
   * Toggle dashboard visibility
   */
  toggle(): void {
    if (this.panel) {
      if (domManager.isVisible(this.panel)) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  /**
   * Navigate to previous week
   */
  previousWeek(): void {
    this.weekOffset--;
    this.updateDatePicker();
    this.updateDashboard();
  }

  /**
   * Navigate to next week
   */
  nextWeek(): void {
    this.weekOffset++;
    this.updateDatePicker();
    this.updateDashboard();
  }

  /**
   * Go to current week
   */
  goToCurrentWeek(): void {
    this.weekOffset = 0;
    this.updateDatePicker();
    this.updateDashboard();
  }

  /**
   * Update the date picker display
   */
  private updateDatePicker(): void {
    if (!this.datePicker) return;

    const monday = getMonday(new Date());
    const weekMonday = new Date(monday);
    weekMonday.setDate(monday.getDate() + (this.weekOffset * 7));
    this.datePicker.value = formatDate(weekMonday);
  }

  /**
   * Get current dashboard date (Monday)
   */
  private getDashboardDate(): Date {
    const monday = getMonday(new Date());
    const weekMonday = new Date(monday);
    weekMonday.setDate(monday.getDate() + (this.weekOffset * 7));
    return weekMonday;
  }

  /**
   * Update the dashboard with current statistics
   */
  updateDashboard(): void {
    try {
      const targetDate = this.getDashboardDate();

      // Calculate statistics
      const completionRate = calculateCompletionRateForDate(targetDate, this.currentTasks);
      const categoryAnalysis = calculateCategoryTimeAnalysisForDate(targetDate, this.currentTasks);
      const dailyWorkTime = calculateDailyWorkTimeForDate(targetDate, this.currentTasks);

      // Update completion rate
      this.updateCompletionRate(completionRate);

      // Update completion tasks
      this.updateCompletedTasks(completionRate);

      // Update estimated time
      this.updateEstimatedTime(categoryAnalysis);

      // Update actual time
      this.updateActualTime(categoryAnalysis);

      // Update category breakdown
      this.updateCategoryBreakdown(categoryAnalysis);

      // Update daily breakdown
      this.updateDailyBreakdown(dailyWorkTime);

    } catch (error) {
      logger.error('Dashboard update error:', error);
    }
  }

  /**
   * Update completion rate display
   */
  private updateCompletionRate(completionRate: CompletionRate): void {
    if (!this.completionRateValue) return;
    this.completionRateValue.textContent = `${completionRate.completion_rate}%`;
  }

  /**
   * Update completed tasks display
   */
  private updateCompletedTasks(completionRate: CompletionRate): void {
    if (!this.completedTasksValue) return;
    this.completedTasksValue.textContent = `${completionRate.completed_tasks}/${completionRate.total_tasks}`;
  }

  /**
   * Update estimated time display
   */
  private updateEstimatedTime(categoryAnalysis: CategoryAnalysis): void {
    if (!this.estimatedTimeValue) return;
    const time = formatTime(categoryAnalysis.total_estimated_time);
    this.estimatedTimeValue.textContent = time;
  }

  /**
   * Update actual time display
   */
  private updateActualTime(categoryAnalysis: CategoryAnalysis): void {
    if (!this.actualTimeValue) return;
    const time = formatTime(categoryAnalysis.total_actual_time);
    this.actualTimeValue.textContent = time;
  }

  /**
   * Update category breakdown display
   */
  private updateCategoryBreakdown(categoryAnalysis: CategoryAnalysis): void {
    if (!this.categoryBreakdown) return;

    domManager.clear(this.categoryBreakdown);

    Object.entries(categoryAnalysis.categories).forEach(([categoryKey, category]) => {
      if (category.task_count === 0) return;

      const categoryInfo = getCategoryInfo(categoryKey);
      const completionRate = category.task_count > 0
        ? Math.round((category.completed_count / category.task_count) * 100)
        : 0;

      const item = document.createElement('div');
      item.className = 'category-item';
      item.style.borderLeftColor = categoryInfo.color;

      item.innerHTML = `
        <div class="category-item-name" style="color: ${categoryInfo.color};">
          ${this.escapeHtml(categoryInfo.name)}
        </div>
        <div class="category-item-stats">
          <div class="category-item-stat">
            <div class="category-item-stat-label">見積</div>
            <div class="category-item-stat-value">${category.estimated_time.toFixed(1)}h</div>
          </div>
          <div class="category-item-stat">
            <div class="category-item-stat-label">実績</div>
            <div class="category-item-stat-value">${category.actual_time.toFixed(1)}h</div>
          </div>
          <div class="category-item-stat">
            <div class="category-item-stat-label">完了率</div>
            <div class="category-item-stat-value">${completionRate}%</div>
          </div>
          <div class="category-item-stat">
            <div class="category-item-stat-label">タスク数</div>
            <div class="category-item-stat-value">${category.completed_count}/${category.task_count}</div>
          </div>
        </div>
      `;

      if (this.categoryBreakdown) {
        domManager.addElement(item, this.categoryBreakdown);
      }
    });
  }

  /**
   * Update daily breakdown display
   */
  private updateDailyBreakdown(dailyWorkTime: DailyWorkTime): void {
    if (!this.dailyBreakdown) return;

    domManager.clear(this.dailyBreakdown);

    const dailyData = dailyWorkTime.daily_breakdown;

    Object.entries(dailyData).forEach(([dateStr, day]) => {
      const item = document.createElement('div');
      item.className = 'daily-item';

      const date = new Date(dateStr);
      const dateFormatted = `${date.getMonth() + 1}/${date.getDate()}`;

      const estimatedTime = day.estimated_time || 0;
      const actualTime = day.actual_time || 0;
      const variance = actualTime - estimatedTime;
      const varianceClass = variance > 0 ? 'overrun' : variance < 0 ? 'underrun' : 'match';
      const varianceText = variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`;

      item.innerHTML = `
        <div class="daily-item-day">${day.day_name || ''}曜日</div>
        <div class="daily-item-date">${dateFormatted}</div>
        <div class="daily-item-stats">
          <div class="daily-item-stat">
            <span class="daily-item-stat-label">見積</span>
            <span class="daily-item-stat-value">${estimatedTime.toFixed(1)}h</span>
          </div>
          <div class="daily-item-stat">
            <span class="daily-item-stat-label">実績</span>
            <span class="daily-item-stat-value">${actualTime.toFixed(1)}h</span>
          </div>
          <div class="daily-item-stat">
            <span class="daily-item-stat-label">差分</span>
            <span class="daily-item-stat-value time-${varianceClass}">${varianceText}</span>
          </div>
        </div>
        <div class="daily-item-tasks">
          完了: ${day.completed_count || 0}/${day.task_count || 0}
        </div>
      `;

      if (this.dailyBreakdown) {
        domManager.addElement(item, this.dailyBreakdown);
      }
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current week offset
   */
  getWeekOffset(): number {
    return this.weekOffset;
  }
}

/**
 * Create a DashboardComponent instance
 * @returns New DashboardComponent instance
 */
export function createDashboardComponent(): DashboardComponent {
  return new DashboardComponent();
}

/**
 * Global dashboard component instance
 */
export const dashboardComponent = createDashboardComponent();
