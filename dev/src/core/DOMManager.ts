/**
 * DOMManager - Type-safe class for DOM element management
 * Manages references to all DOM elements with type safety
 */

import type { DOMElements, DayColumn } from '../types';
import { getDOMElements } from '../utils/dom';
import { Weekday } from '../types';
import { logger } from '../utils/logger';

/**
 * DOMManager class
 * Provides type-safe access to DOM elements throughout the application
 */
export class DOMManager {
  private elements: DOMElements;
  private cache: Map<string, Element> = new Map();

  constructor() {
    this.elements = getDOMElements();
    this.initializeCache();
  }

  /**
   * Initialize element cache with frequently used elements
   */
  private initializeCache(): void {
    const frequentIds = [
      'header-controls',
      'add-task-btn',
      'filter-category',
      'ideal-daily-minutes',
      'weekday-filter-btn',
      'prev-week',
      'today',
      'next-week',
      'date-picker',
      'statistics-toggle',
      'template-toggle',
      'theme-toggle',
      'more-menu-btn',
      'more-menu-dropdown',
      'export-data-btn',
      'import-data-btn',
      'import-file-input',
      'archive-toggle',
      'week-title',
      'dashboard-panel',
      'dashboard-date-picker',
      'dashboard-prev-week',
      'dashboard-next-week',
      'close-dashboard',
      'completion-rate-value',
      'completed-tasks-value',
      'estimated-time-value',
      'actual-time-value',
      'category-breakdown',
      'daily-breakdown',
      'archive-view',
      'close-archive',
      'clear-archive',
      'archive-list',
      'day-context-menu',
      'template-panel',
      'close-template-panel',
      'template-search',
      'template-sort',
      'template-list',
      'template-empty',
      'task-modal',
      'task-form',
      'task-name',
      'estimated-time',
      'actual-time',
      'task-priority',
      'task-category',
      'task-date',
      'due-date',
      'due-time-period',
      'due-hour',
      'task-details',
      'is-recurring',
      'recurrence-options',
      'recurrence-pattern',
      'recurrence-end-date',
      'duplicate-task-btn',
      'save-as-template-btn',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
      'unassigned-list',
      'sidebar'
    ];

    frequentIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.cache.set(id, element);
      }
    });
  }

  /**
   * Get all DOM elements
   * @returns All DOM elements reference
   */
  getElements(): DOMElements {
    return this.elements;
  }

  /**
   * Get a specific DOM element by property name
   * @param key - The element property name
   * @returns The element or null
   */
  getElement<K extends keyof DOMElements>(key: K): DOMElements[K] {
    return this.elements[key];
  }

  /**
   * Get an element by ID with type assertion
   * @param id - The element ID
   * @returns The element or null
   */
  byId<T extends Element = Element>(id: string): T | null {
    if (this.cache.has(id)) {
      return this.cache.get(id) as T | null;
    }

    const element = document.getElementById(id) as T | null;
    if (element) {
      this.cache.set(id, element);
    }

    return element;
  }

  /**
   * Query selector with type assertion
   * @param selector - The CSS selector
   * @param parent - The parent element (defaults to document)
   * @returns The element or null
   */
  querySelector<T extends Element = Element>(
    selector: string,
    parent: ParentNode = document
  ): T | null {
    return parent.querySelector<T>(selector);
  }

  /**
   * Query selector all with type assertion
   * @param selector - The CSS selector
   * @param parent - The parent element (defaults to document)
   * @returns NodeList of matching elements
   */
  querySelectorAll<T extends Element = Element>(
    selector: string,
    parent: ParentNode = document
  ): NodeListOf<T> {
    return parent.querySelectorAll<T>(selector);
  }

  /**
   * Get a day column element
   * @param weekday - The weekday name
   * @returns The day column element or null
   */
  getDayColumn(weekday: Weekday): HTMLElement | null {
    return this.byId<HTMLElement>(weekday);
  }

  /**
   * Get all day columns
   * @returns Array of day column info
   */
  getDayColumns(): DayColumn[] {
    const weekdays: Weekday[] = [
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
      Weekday.SUNDAY
    ];
    const dayColumns: DayColumn[] = [];

    weekdays.forEach((day, index) => {
      const element = this.byId<HTMLElement>(day);
      if (element) {
        dayColumns.push({
          element,
          date: new Date(),
          dayName: day,
          visible: true
        });
      }
    });

    return dayColumns;
  }

  /**
   * Get the task list for a day column
   * @param weekday - The weekday name
   * @returns The task list element or null
   */
  getDayTaskList(weekday: Weekday): HTMLElement | null {
    const column = this.getDayColumn(weekday);
    if (!column) return null;

    return column.querySelector('.task-list') as HTMLElement | null;
  }

  /**
   * Create a new task element
   * @param taskId - The task ID
   * @returns The created task element
   */
  createTaskElement(taskId: string): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'task';
    element.id = taskId;
    element.draggable = true;
    return element;
  }

  /**
   * Create a new button element
   * @param text - The button text
   * @param className - Optional CSS class name
   * @returns The created button element
   */
  createButton(text: string, className?: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    if (className) {
      button.className = className;
    }
    return button;
  }

  /**
   * Create a new input element
   * @param type - The input type
   * @param className - Optional CSS class name
   * @returns The created input element
   */
  createInput(type: string, className?: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    if (className) {
      input.className = className;
    }
    return input;
  }

  /**
   * Create a new select element
   * @param options - Array of option values
   * @param className - Optional CSS class name
   * @returns The created select element
   */
  createSelect(options: string[], className?: string): HTMLSelectElement {
    const select = document.createElement('select');
    if (className) {
      select.className = className;
    }
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });
    return select;
  }

  /**
   * Add an event listener with automatic cleanup support
   * @param target - The event target
   * @param type - The event type
   * @param listener - The event listener
   * @param options - Event listener options
   * @returns Cleanup function
   */
  on<K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (this: EventTarget, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    target.addEventListener(type, listener as EventListener, options);
    return () => target.removeEventListener(type, listener as EventListener, options);
  }

  /**
   * Add a custom event listener with automatic cleanup
   * @param target - The event target
   * @param type - The custom event type
   * @param listener - The event listener
   * @param options - Event listener options
   * @returns Cleanup function
   */
  onCustomEvent(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
  }

  /**
   * Dispatch a custom event
   * @param target - The event target
   * @param type - The event type
   * @param detail - Event detail data
   * @returns Whether the event was cancelled
   */
  dispatchEvent(target: EventTarget, type: string, detail?: any): boolean {
    const event = new CustomEvent(type, { detail });
    return target.dispatchEvent(event);
  }

  /**
   * Remove an element from the DOM
   * @param element - The element to remove
   * @returns True if element was removed
   */
  removeElement(element: Element | null): boolean {
    if (!element || !element.parentNode) {
      return false;
    }
    element.parentNode.removeChild(element);
    this.removeFromCache(element);
    return true;
  }

  /**
   * Add an element to the DOM
   * @param element - The element to add
   * @param parent - The parent element (defaults to body)
   */
  addElement(element: Element, parent: ParentNode = document.body): void {
    parent.appendChild(element);
  }

  /**
   * Insert an element before another element
   * @param element - The element to insert
   * @param reference - The reference element
   * @param parent - The parent element
   */
  insertBefore(
    element: Element,
    reference: Element | null,
    parent: ParentNode
  ): void {
    parent.insertBefore(element, reference);
  }

  /**
   * Replace an element with another
   * @param newElement - The new element
   * @param oldElement - The element to replace
   * @param parent - The parent element
   */
  replaceElement(newElement: Element, oldElement: Element, parent: ParentNode): void {
    parent.replaceChild(newElement, oldElement);
  }

  /**
   * Add a CSS class to an element
   * @param element - The target element
   * @param className - The class name to add
   */
  addClass(element: Element, className: string): void {
    element.classList.add(className);
  }

  /**
   * Remove a CSS class from an element
   * @param element - The target element
   * @param className - The class name to remove
   */
  removeClass(element: Element, className: string): void {
    element.classList.remove(className);
  }

  /**
   * Toggle a CSS class on an element
   * @param element - The target element
   * @param className - The class name to toggle
   * @param force - Optional force value
   * @returns Whether the class is now present
   */
  toggleClass(element: Element, className: string, force?: boolean): boolean {
    if (force !== undefined) {
      return element.classList.toggle(className, force);
    }
    return element.classList.toggle(className);
  }

  /**
   * Check if an element has a CSS class
   * @param element - The target element
   * @param className - The class name to check
   * @returns Whether the class is present
   */
  hasClass(element: Element, className: string): boolean {
    return element.classList.contains(className);
  }

  /**
   * Set element display style
   * @param element - The target element
   * @param display - The display value
   */
  setDisplay(element: HTMLElement, display: string): void {
    element.style.display = display;
  }

  /**
   * Show an element
   * @param element - The element to show
   */
  show(element: HTMLElement): void {
    element.style.display = '';
  }

  /**
   * Hide an element
   * @param element - The element to hide
   */
  hide(element: HTMLElement): void {
    element.style.display = 'none';
  }

  /**
   * Toggle element visibility
   * @param element - The element to toggle
   * @param show - Optional visibility state
   */
  toggleVisibility(element: HTMLElement, show?: boolean): void {
    if (show !== undefined) {
      element.style.display = show ? '' : 'none';
    } else {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    }
  }

  /**
   * Check if an element is visible
   * @param element - The element to check
   * @returns Whether the element is visible
   */
  isVisible(element: HTMLElement): boolean {
    return element.style.display !== 'none';
  }

  /**
   * Set element text content
   * @param element - The target element
   * @param text - The text content
   */
  setText(element: HTMLElement, text: string): void {
    element.textContent = text;
  }

  /**
   * Set element HTML content
   * @param element - The target element
   * @param html - The HTML content
   */
  setHTML(element: HTMLElement, html: string): void {
    element.innerHTML = html;
  }

  /**
   * Get element text content
   * @param element - The target element
   * @returns The text content
   */
  getText(element: HTMLElement): string {
    return element.textContent || '';
  }

  /**
   * Clear element content
   * @param element - The element to clear
   */
  clear(element: HTMLElement): void {
    element.innerHTML = '';
  }

  /**
   * Remove element from cache
   * @param element - The element to remove
   */
  private removeFromCache(element: Element): void {
    if (element.id) {
      this.cache.delete(element.id);
    }
  }

  /**
   * Clear the entire element cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns Number of cached elements
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Refresh all DOM elements
   * Call this after dynamic DOM changes
   */
  refresh(): void {
    this.clearCache();
    this.elements = getDOMElements();
    this.initializeCache();
  }
}

/**
 * Create a DOMManager instance
 * @returns New DOMManager instance
 */
export function createDOMManager(): DOMManager {
  return new DOMManager();
}

/**
 * Global DOM manager instance
 */
export const domManager = createDOMManager();
