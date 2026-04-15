/**
 * TemplatePanel - Type-safe class for template management UI
 * Handles task template creation, storage, and display
 */

import type { Task, TaskTemplate, TemplateSortOption } from '../types';
import { TemplateStorage } from '../utils/storage';
import { TaskStorage } from '../utils/storage';
import { taskManager } from '../core/TaskManager';
import { domManager } from '../core/DOMManager';
import { logger } from '../utils/logger';

/**
 * TemplatePanel class
 * Manages the template panel UI and template operations
 */
export class TemplatePanel {
  private panel: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private sortSelect: HTMLSelectElement | null = null;
  private list: HTMLElement | null = null;
  private empty: HTMLElement | null = null;
  private templates: TaskTemplate[] = [];
  private filteredTemplates: TaskTemplate[] = [];
  private currentSort: TemplateSortOption = 'recent';
  private currentSearch: string = '';

  constructor() {
    this.initializeElements();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.panel = domManager.byId<HTMLElement>('template-panel');
    this.searchInput = domManager.byId<HTMLInputElement>('template-search');
    this.sortSelect = domManager.byId<HTMLSelectElement>('template-sort');
    this.list = domManager.byId<HTMLElement>('template-list');
    this.empty = domManager.byId<HTMLElement>('template-empty');
  }

  /**
   * Show the template panel
   */
  show(): void {
    if (this.panel) {
      domManager.show(this.panel);
      this.loadTemplates();
      this.renderTemplates();
    }
  }

  /**
   * Hide the template panel
   */
  hide(): void {
    if (this.panel) {
      domManager.hide(this.panel);
    }
  }

  /**
   * Toggle panel visibility
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
   * Load templates from storage
   */
  loadTemplates(): void {
    this.templates = TemplateStorage.loadTemplates();
    this.filterTemplates();
  }

  /**
   * Save templates to storage
   */
  private saveTemplates(): void {
    TemplateStorage.saveTemplates(this.templates);
  }

  /**
   * Filter templates based on search and sort
   */
  private filterTemplates(): void {
    // Filter by search term
    this.filteredTemplates = this.templates.filter(template => {
      if (!this.currentSearch) return true;
      const search = this.currentSearch.toLowerCase();
      return (
        template.name.toLowerCase().includes(search) ||
        template.details?.toLowerCase().includes(search)
      );
    });

    // Sort templates
    this.sortTemplates(this.currentSort);
  }

  /**
   * Sort templates
   */
  private sortTemplates(sortBy: TemplateSortOption): void {
    switch (sortBy) {
      case 'recent':
        this.filteredTemplates.sort((a, b) => {
          const aDate = a.last_used_at || a.created_at;
          const bDate = b.last_used_at || b.created_at;
          return bDate.localeCompare(aDate);
        });
        break;
      case 'name':
        this.filteredTemplates.sort((a, b) =>
          a.name.localeCompare(b.name, 'ja')
        );
        break;
      case 'usage':
        this.filteredTemplates.sort((a, b) => b.usage_count - a.usage_count);
        break;
    }
  }

  /**
   * Render templates to the UI
   */
  private renderTemplates(): void {
    if (!this.list || !this.empty) return;

    domManager.clear(this.list);

    if (this.filteredTemplates.length === 0) {
      domManager.show(this.empty);
    } else {
      domManager.hide(this.empty);
      this.filteredTemplates.forEach(template => {
        const element = this.createTemplateElement(template);
        if (this.list) {
          domManager.addElement(element, this.list);
        }
      });
    }
  }

  /**
   * Create a template element
   */
  private createTemplateElement(template: TaskTemplate): HTMLElement {
    const element = document.createElement('div');
    element.className = 'template-item';
    element.dataset.id = template.id;

    element.innerHTML = `
      <div class="template-item-header">
        <span class="template-item-name">${this.escapeHtml(template.name)}</span>
        <span class="template-item-usage">使用回数: ${template.usage_count}</span>
      </div>
      <div class="template-item-details">
        <span class="template-item-time">見積: ${template.estimated_time}h</span>
        <span class="template-item-priority">${template.priority}</span>
        <button class="template-item-delete" data-id="${template.id}" title="削除">×</button>
      </div>
    `;

    // Add click handler
    element.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('template-item-delete')) {
        this.useTemplate(template);
      }
    });

    // Add delete handler
    const deleteBtn = element.querySelector('.template-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTemplate(template.id);
      });
    }

    return element;
  }

  /**
   * Use a template to create a new task
   */
  private useTemplate(template: TaskTemplate): void {
    const today = new Date().toISOString().split('T')[0];
    const task = taskManager.createTaskFromTaskTemplate(template, today);

    // Add to tasks
    // Note: This would need to be integrated with the state manager
    logger.info('TemplatePanel', `Using template: ${template.name}`);

    // Increment usage count
    template.usage_count++;
    template.last_used_at = new Date().toISOString();
    this.saveTemplates();
    this.renderTemplates();
  }

  /**
   * Delete a template
   */
  private deleteTemplate(templateId: string): void {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.templates.splice(index, 1);
      this.saveTemplates();
      this.filterTemplates();
      this.renderTemplates();
      logger.info('TemplatePanel', `Deleted template: ${templateId}`);
    }
  }

  /**
   * Create a new template from a task
   */
  createTemplateFromTask(task: Task): void {
    const template: TaskTemplate = {
      id: `template-${Date.now()}`,
      name: task.name,
      estimated_time: task.estimated_time,
      priority: task.priority,
      category: task.category,
      details: task.details,
      created_at: new Date().toISOString(),
      usage_count: 0,
      last_used_at: null
    };

    this.templates.push(template);
    this.saveTemplates();
    this.filterTemplates();
    this.renderTemplates();

    logger.info('TemplatePanel', `Created template from task: ${task.name}`);
  }

  /**
   * Set search term
   */
  setSearchTerm(search: string): void {
    this.currentSearch = search;
    this.filterTemplates();
    this.renderTemplates();
  }

  /**
   * Set sort option
   */
  setSortOption(sort: TemplateSortOption): void {
    this.currentSort = sort;
    this.filterTemplates();
    this.renderTemplates();
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
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.length;
  }

  /**
   * Get all templates
   */
  getTemplates(): ReadonlyArray<TaskTemplate> {
    return [...this.templates];
  }
}

/**
 * Create a TemplatePanel instance
 * @returns New TemplatePanel instance
 */
export function createTemplatePanel(): TemplatePanel {
  return new TemplatePanel();
}

/**
 * Global template panel instance
 */
export const templatePanel = createTemplatePanel();
