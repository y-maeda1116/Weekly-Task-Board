/**
 * DOM utility functions for type-safe element access and manipulation
 */

import type { DOMElements, DayColumn, Weekday } from '../types';

/**
 * DOM element cache
 * Stores references to DOM elements for efficient access
 */
class DOMElementCache {
  private cache: Partial<DOMElements> = {};

  /**
   * Get an element from cache or DOM
   */
  getElement<K extends keyof DOMElements>(selector: string, key: K): DOMElements[K] | null {
    if (this.cache[key] !== undefined) {
      return this.cache[key] as DOMElements[K];
    }

    const element = document.querySelector(selector);
    this.cache[key] = element as DOMElements[K];
    return this.cache[key] as DOMElements[K];
  }

  /**
   * Get an element by ID
   */
  getElementById<K extends keyof DOMElements>(id: string, key: K): DOMElements[K] | null {
    if (this.cache[key] !== undefined) {
      return this.cache[key] as DOMElements[K];
    }

    const element = document.getElementById(id);
    this.cache[key] = element as DOMElements[K];
    return this.cache[key] as DOMElements[K];
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache = {};
  }
}

/**
 * Global DOM element cache instance
 */
const domCache = new DOMElementCache();

/**
 * Get all main DOM elements
 */
export function getDOMElements(): DOMElements {
  return {
    // Header elements
    headerControls: document.getElementById('header-controls'),
    addTaskBtn: document.getElementById('add-task-btn') as HTMLButtonElement,
    filterCategory: document.getElementById('filter-category') as HTMLSelectElement,
    idealDailyMinutes: document.getElementById('ideal-daily-minutes') as HTMLInputElement,
    weekdayFilterBtn: document.getElementById('weekday-filter-btn') as HTMLButtonElement,
    weekdaySettings: document.getElementById('weekday-settings'),
    weekdayCheckboxes: document.getElementById('weekday-checkboxes'),
    showMonday: document.getElementById('show-monday') as HTMLInputElement,
    showTuesday: document.getElementById('show-tuesday') as HTMLInputElement,
    showWednesday: document.getElementById('show-wednesday') as HTMLInputElement,
    showThursday: document.getElementById('show-thursday') as HTMLInputElement,
    showFriday: document.getElementById('show-friday') as HTMLInputElement,
    showSaturday: document.getElementById('show-saturday') as HTMLInputElement,
    showSunday: document.getElementById('show-sunday') as HTMLInputElement,
    prevWeekBtn: document.getElementById('prev-week') as HTMLButtonElement,
    todayBtn: document.getElementById('today') as HTMLButtonElement,
    nextWeekBtn: document.getElementById('next-week') as HTMLButtonElement,
    datePicker: document.getElementById('date-picker') as HTMLInputElement,
    statisticsToggle: document.getElementById('statistics-toggle') as HTMLButtonElement,
    templateToggle: document.getElementById('template-toggle') as HTMLButtonElement,
    themeToggle: document.getElementById('theme-toggle') as HTMLButtonElement,
    moreMenuBtn: document.getElementById('more-menu-btn') as HTMLButtonElement,
    moreMenuDropdown: document.getElementById('more-menu-dropdown'),
    exportDataBtn: document.getElementById('export-data-btn') as HTMLButtonElement,
    importDataBtn: document.getElementById('import-data-btn') as HTMLButtonElement,
    importFileInput: document.getElementById('import-file-input') as HTMLInputElement,
    archiveToggle: document.getElementById('archive-toggle') as HTMLButtonElement,
    weekTitle: document.getElementById('week-title'),

    // Task board elements
    monday: document.getElementById('monday'),
    tuesday: document.getElementById('tuesday'),
    wednesday: document.getElementById('wednesday'),
    thursday: document.getElementById('thursday'),
    friday: document.getElementById('friday'),
    saturday: document.getElementById('saturday'),
    sunday: document.getElementById('sunday'),
    unassignedList: document.getElementById('unassigned-list'),
    sidebar: document.getElementById('sidebar'),

    // Dashboard elements
    dashboardPanel: document.getElementById('dashboard-panel'),
    dashboardDatePicker: document.getElementById('dashboard-date-picker') as HTMLInputElement,
    dashboardPrevWeek: document.getElementById('dashboard-prev-week') as HTMLButtonElement,
    dashboardNextWeek: document.getElementById('dashboard-next-week') as HTMLButtonElement,
    closeDashboard: document.getElementById('close-dashboard') as HTMLButtonElement,
    completionRateValue: document.getElementById('completion-rate-value'),
    completedTasksValue: document.getElementById('completed-tasks-value'),
    estimatedTimeValue: document.getElementById('estimated-time-value'),
    actualTimeValue: document.getElementById('actual-time-value'),
    categoryBreakdown: document.getElementById('category-breakdown'),
    dailyBreakdown: document.getElementById('daily-breakdown'),

    // Archive elements
    archiveView: document.getElementById('archive-view'),
    closeArchive: document.getElementById('close-archive') as HTMLButtonElement,
    clearArchive: document.getElementById('clear-archive') as HTMLButtonElement,
    archiveList: document.getElementById('archive-list'),

    // Context menu
    dayContextMenu: document.getElementById('day-context-menu'),

    // Template panel
    templatePanel: document.getElementById('template-panel'),
    closeTemplatePanel: document.getElementById('close-template-panel') as HTMLButtonElement,
    templateSearch: document.getElementById('template-search') as HTMLInputElement,
    templateSort: document.getElementById('template-sort') as HTMLSelectElement,
    templateList: document.getElementById('template-list'),
    templateEmpty: document.getElementById('template-empty'),

    // Task modal
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form') as HTMLFormElement,
    taskName: document.getElementById('task-name') as HTMLInputElement,
    estimatedTime: document.getElementById('estimated-time') as HTMLInputElement,
    actualTime: document.getElementById('actual-time') as HTMLInputElement,
    taskPriority: document.getElementById('task-priority') as HTMLSelectElement,
    taskCategory: document.getElementById('task-category') as HTMLSelectElement,
    taskDate: document.getElementById('task-date') as HTMLInputElement,
    dueDate: document.getElementById('due-date') as HTMLInputElement,
    dueTimePeriod: document.getElementById('due-time-period') as HTMLSelectElement,
    dueHour: document.getElementById('due-hour') as HTMLSelectElement,
    taskDetails: document.getElementById('task-details') as HTMLTextAreaElement,
    isRecurring: document.getElementById('is-recurring') as HTMLInputElement,
    recurrenceOptions: document.getElementById('recurrence-options'),
    recurrencePattern: document.getElementById('recurrence-pattern') as HTMLSelectElement,
    recurrenceEndDate: document.getElementById('recurrence-end-date') as HTMLInputElement,
    duplicateTaskBtn: document.getElementById('duplicate-task-btn') as HTMLButtonElement,
    saveAsTemplateBtn: document.getElementById('save-as-template-btn') as HTMLButtonElement
  };
}

/**
 * Clear the DOM element cache
 */
export function clearDOMCache(): void {
  domCache.clear();
}

/**
 * Get day column elements
 */
export function getDayColumns(): DayColumn[] {
  const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayColumns: DayColumn[] = [];

  weekdays.forEach((day, index) => {
    const element = document.getElementById(day);
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
 * Get the day column by weekday name
 */
export function getDayColumn(weekday: Weekday): HTMLElement | null {
  return document.getElementById(weekday);
}

/**
 * Get the task list for a day column
 */
export function getDayTaskList(weekday: Weekday): HTMLElement | null {
  const column = getDayColumn(weekday);
  if (!column) return null;

  return column.querySelector('.task-list');
}

/**
 * Create a new task element
 */
export function createTaskElement(taskId: string): HTMLDivElement {
  const element = document.createElement('div');
  element.className = 'task';
  element.id = taskId;
  element.draggable = true;
  return element;
}

/**
 * Create a new button element
 */
export function createButton(text: string, className?: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  if (className) {
    button.className = className;
  }
  return button;
}

/**
 * Create a new input element
 */
export function createInput(type: string, className?: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  if (className) {
    input.className = className;
  }
  return input;
}

/**
 * Create a new select element
 */
export function createSelect(options: string[], className?: string): HTMLSelectElement {
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
 * Add event listener with automatic cleanup support
 */
export function on<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  listener: (this: EventTarget, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): () => void {
  target.addEventListener(type, listener as EventListener, options);
  return () => target.removeEventListener(type, listener as EventListener, options);
}

/**
 * Add event listener with support for custom events
 */
export function onCustomEvent(
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
 */
export function dispatchEvent(target: EventTarget, type: string, detail?: any): boolean {
  const event = new CustomEvent(type, { detail });
  return target.dispatchEvent(event);
}

/**
 * Query selector with type assertion
 */
export function querySelector<E extends Element = Element>(
  selector: string,
  parent: ParentNode = document
): E | null {
  return parent.querySelector<E>(selector);
}

/**
 * Query selector all with type assertion
 */
export function querySelectorAll<E extends Element = Element>(
  selector: string,
  parent: ParentNode = document
): NodeListOf<E> {
  return parent.querySelectorAll<E>(selector);
}

/**
 * Get element by ID with type assertion
 */
export function getElementById<E extends Element = Element>(
  id: string
): E | null {
  return document.getElementById<E>(id);
}
