/**
 * ArchiveComponent - Type-safe class for archive UI
 * Handles displaying and managing completed/archived tasks
 */

import type { ArchivedTask } from '../types';
import { TaskStorage } from '../utils/storage';
import { domManager } from '../core/DOMManager';
import { logger } from '../utils/logger';

/**
 * ArchiveComponent class
 * Manages the archived tasks view
 */
export class ArchiveComponent {
  private view: HTMLElement | null = null;
  private list: HTMLElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private clearBtn: HTMLButtonElement | null = null;
  private archivedTasks: ArchivedTask[] = [];

  constructor() {
    this.initializeElements();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.view = domManager.byId<HTMLElement>('archive-view');
    this.list = domManager.byId<HTMLElement>('archive-list');
    this.closeBtn = domManager.byId<HTMLButtonElement>('close-archive');
    this.clearBtn = domManager.byId<HTMLButtonElement>('clear-archive');
  }

  /**
   * Load archived tasks from storage
   */
  loadArchivedTasks(): void {
    const archive = TaskStorage.loadArchivedTasks();
    this.archivedTasks = archive;
  }

  /**
   * Show the archive view
   */
  show(): void {
    if (this.view) {
      domManager.show(this.view);
      this.loadArchivedTasks();
      this.renderArchivedTasks();
    }
  }

  /**
   * Hide the archive view
   */
  hide(): void {
    if (this.view) {
      domManager.hide(this.view);
    }
  }

  /**
   * Toggle archive view visibility
   */
  toggle(): void {
    if (this.view) {
      if (domManager.isVisible(this.view)) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  /**
   * Render archived tasks to the UI
   */
  private renderArchivedTasks(): void {
    if (!this.list) return;

    domManager.clear(this.list);

    if (this.archivedTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'archive-empty';
      empty.textContent = 'アーカイブされたタスクがありません';
      if (this.list) {
        domManager.addElement(empty, this.list);
      }
    } else {
      // Sort by archived date (newest first)
      const sortedTasks = [...this.archivedTasks].sort((a, b) =>
        b.archivedAt.localeCompare(a.archivedAt)
      );

      sortedTasks.forEach(task => {
        const element = this.createArchivedTaskElement(task);
        if (this.list) {
          domManager.addElement(element, this.list);
        }
      });
    }
  }

  /**
   * Create an archived task element
   */
  private createArchivedTaskElement(task: ArchivedTask): HTMLElement {
    const element = document.createElement('div');
    element.className = 'archived-task';
    element.dataset.id = task.id;

    const completedDate = new Date(task.completedAt);
    const completedDateFormatted = `${completedDate.getFullYear()}/${completedDate.getMonth() + 1}/${completedDate.getDate()}`;

    element.innerHTML = `
      <div class="archived-task-header">
        <span class="archived-task-name">${this.escapeHtml(task.name)}</span>
        <span class="archived-task-date">${completedDateFormatted}に完了</span>
      </div>
      <div class="archived-task-details">
        <span class="archived-task-time">見積: ${task.estimated_time}h / 実績: ${task.actual_time}h</span>
        <span class="archived-task-category">${task.category}</span>
        <button class="archived-task-restore" data-id="${task.id}" title="復元">復元</button>
      </div>
    `;

    // Add restore handler
    const restoreBtn = element.querySelector('.archived-task-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.restoreTask(task.id);
      });
    }

    return element;
  }

  /**
   * Archive a completed task
   * @param task - The task to archive
   */
  archiveTask(task: ArchivedTask): void {
    this.archivedTasks.unshift(task);

    // Save to storage
    TaskStorage.saveArchivedTasks(this.archivedTasks);

    // Update UI
    this.renderArchivedTasks();

    logger.info(`Archived task: ${task.name}`);
  }

  /**
   * Restore a task from archive
   * @param taskId - The task ID to restore
   */
  restoreTask(taskId: string): void {
    const index = this.archivedTasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    const task = this.archivedTasks[index];

    // Remove from archive
    this.archivedTasks.splice(index, 1);
    TaskStorage.saveArchivedTasks(this.archivedTasks);

    // Convert back to regular task and add to tasks
    // Note: This would need to be integrated with state manager
    const regularTask = this.archivedTaskToTask(task);

    logger.info(`Restored task: ${task.name}`);

    // Update UI
    this.renderArchivedTasks();
  }

  /**
   * Convert archived task to regular task
   */
  private archivedTaskToTask(archivedTask: ArchivedTask): Omit<ArchivedTask, 'archivedAt' | 'completedAt'> {
    const { archivedAt, completedAt, ...task } = archivedTask;
    return task;
  }

  /**
   * Clear all archived tasks
   */
  clearArchive(): void {
    if (this.archivedTasks.length === 0) {
      logger.info('Archive is already empty');
      return;
    }

    if (!confirm(`${this.archivedTasks.length}個のアーカイブを削除してもよろしいですか？`)) {
      return;
    }

    this.archivedTasks = [];
    TaskStorage.saveArchivedTasks(this.archivedTasks);
    this.renderArchivedTasks();

    logger.info('Cleared archive');
  }

  /**
   * Delete a specific archived task
   */
  deleteArchivedTask(taskId: string): void {
    const index = this.archivedTasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    this.archivedTasks.splice(index, 1);
    TaskStorage.saveArchivedTasks(this.archivedTasks);
    this.renderArchivedTasks();

    logger.info(`Deleted archived task: ${taskId}`);
  }

  /**
   * Get archived task count
   */
  getArchivedTaskCount(): number {
    return this.archivedTasks.length;
  }

  /**
   * Get all archived tasks
   */
  getArchivedTasks(): ReadonlyArray<ArchivedTask> {
    return [...this.archivedTasks];
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Create an ArchiveComponent instance
 * @returns New ArchiveComponent instance
 */
export function createArchiveComponent(): ArchiveComponent {
  return new ArchiveComponent();
}

/**
 * Global archive component instance
 */
export const archiveComponent = createArchiveComponent();
