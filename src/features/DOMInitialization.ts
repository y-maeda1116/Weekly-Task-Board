import type { DOMElements } from '../types';
import { logger } from '../utils/logger';
import { getDOMElements } from '../utils/dom';

const COMPONENT = 'DOMInitialization';

interface DOMRefs {
  addTaskBtn: HTMLButtonElement | null;
  closeModalBtn: Element | null;
  taskForm: HTMLFormElement | null;
  taskNameInput: HTMLInputElement | null;
  estimatedTimeInput: HTMLInputElement | null;
  actualTimeInput: HTMLInputElement | null;
  taskPriorityInput: HTMLSelectElement | null;
  taskCategoryInput: HTMLSelectElement | null;
  taskDateInput: HTMLInputElement | null;
  dueDateInput: HTMLInputElement | null;
  dueTimePeriodInput: HTMLSelectElement | null;
  dueHourInput: HTMLSelectElement | null;
  taskDetailsInput: HTMLTextAreaElement | null;
  isRecurringCheckbox: HTMLInputElement | null;
  recurrenceOptions: HTMLElement | null;
  recurrencePatternSelect: HTMLSelectElement | null;
  recurrenceEndDateInput: HTMLInputElement | null;
  duplicateTaskBtn: HTMLButtonElement | null;
  saveAsTemplateBtn: HTMLButtonElement | null;
  prevWeekBtn: HTMLButtonElement | null;
  todayBtn: HTMLButtonElement | null;
  nextWeekBtn: HTMLButtonElement | null;
  datePicker: HTMLInputElement | null;
  weekTitle: HTMLElement | null;
  dayColumns: HTMLElement[];
  categoryFilterSelect: HTMLSelectElement | null;
  idealDailyMinutesInput: HTMLInputElement | null;
  weekdayFilterBtn: HTMLButtonElement | null;
  weekdaySettings: HTMLElement | null;
  themeToggleBtn: HTMLButtonElement | null;
  moreMenuBtn: HTMLButtonElement | null;
  moreMenuDropdown: HTMLElement | null;
  exportDataBtn: HTMLButtonElement | null;
  importDataBtn: HTMLButtonElement | null;
  importFileInput: HTMLInputElement | null;
  archiveToggleBtn: HTMLButtonElement | null;
  archiveView: HTMLElement | null;
  closeArchiveBtn: HTMLButtonElement | null;
  clearArchiveBtn: HTMLButtonElement | null;
  archiveList: HTMLElement | null;
  statisticsToggleBtn: HTMLButtonElement | null;
  dashboardPanel: HTMLElement | null;
  closeDashboardBtn: HTMLButtonElement | null;
  templateToggleBtn: HTMLButtonElement | null;
  templatePanel: HTMLElement | null;
  closeTemplatePanelBtn: HTMLButtonElement | null;
  templateSearchInput: HTMLInputElement | null;
  templateSortSelect: HTMLSelectElement | null;
  templateList: HTMLElement | null;
  unassignedColumn: HTMLElement | null;
  unassignedList: HTMLElement | null;
  dayContextMenu: HTMLElement | null;
  modal: HTMLElement | null;
}

const refs: DOMRefs = {
  addTaskBtn: null,
  closeModalBtn: null,
  taskForm: null,
  taskNameInput: null,
  estimatedTimeInput: null,
  actualTimeInput: null,
  taskPriorityInput: null,
  taskCategoryInput: null,
  taskDateInput: null,
  dueDateInput: null,
  dueTimePeriodInput: null,
  dueHourInput: null,
  taskDetailsInput: null,
  isRecurringCheckbox: null,
  recurrenceOptions: null,
  recurrencePatternSelect: null,
  recurrenceEndDateInput: null,
  duplicateTaskBtn: null,
  saveAsTemplateBtn: null,
  prevWeekBtn: null,
  todayBtn: null,
  nextWeekBtn: null,
  datePicker: null,
  weekTitle: null,
  dayColumns: [],
  categoryFilterSelect: null,
  idealDailyMinutesInput: null,
  weekdayFilterBtn: null,
  weekdaySettings: null,
  themeToggleBtn: null,
  moreMenuBtn: null,
  moreMenuDropdown: null,
  exportDataBtn: null,
  importDataBtn: null,
  importFileInput: null,
  archiveToggleBtn: null,
  archiveView: null,
  closeArchiveBtn: null,
  clearArchiveBtn: null,
  archiveList: null,
  statisticsToggleBtn: null,
  dashboardPanel: null,
  closeDashboardBtn: null,
  templateToggleBtn: null,
  templatePanel: null,
  closeTemplatePanelBtn: null,
  templateSearchInput: null,
  templateSortSelect: null,
  templateList: null,
  unassignedColumn: null,
  unassignedList: null,
  dayContextMenu: null,
  modal: null,
};

let currentTaskId: string | null = null;
let isRendering = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function initializeElementReferences(): boolean {
  refs.addTaskBtn = byId<HTMLButtonElement>('add-task-btn');
  refs.closeModalBtn = document.querySelector('.close-btn');
  refs.taskForm = byId<HTMLFormElement>('task-form');
  refs.taskNameInput = byId<HTMLInputElement>('task-name');
  refs.estimatedTimeInput = byId<HTMLInputElement>('estimated-time');
  refs.actualTimeInput = byId<HTMLInputElement>('actual-time');
  refs.taskPriorityInput = byId<HTMLSelectElement>('task-priority');
  refs.taskCategoryInput = byId<HTMLSelectElement>('task-category');
  refs.taskDateInput = byId<HTMLInputElement>('task-date');
  refs.dueDateInput = byId<HTMLInputElement>('due-date');
  refs.dueTimePeriodInput = byId<HTMLSelectElement>('due-time-period');
  refs.dueHourInput = byId<HTMLSelectElement>('due-hour');
  refs.taskDetailsInput = byId<HTMLTextAreaElement>('task-details');
  refs.isRecurringCheckbox = byId<HTMLInputElement>('is-recurring');
  refs.recurrenceOptions = document.getElementById('recurrence-options');
  refs.recurrencePatternSelect = byId<HTMLSelectElement>('recurrence-pattern');
  refs.recurrenceEndDateInput = byId<HTMLInputElement>('recurrence-end-date');
  refs.duplicateTaskBtn = byId<HTMLButtonElement>('duplicate-task-btn');
  refs.saveAsTemplateBtn = byId<HTMLButtonElement>('save-as-template-btn');
  refs.prevWeekBtn = byId<HTMLButtonElement>('prev-week');
  refs.todayBtn = byId<HTMLButtonElement>('today');
  refs.nextWeekBtn = byId<HTMLButtonElement>('next-week');
  refs.datePicker = byId<HTMLInputElement>('date-picker');
  refs.weekTitle = document.getElementById('week-title');
  refs.dayColumns = Array.from(
    document.querySelectorAll<HTMLElement>('#task-board .day-column')
  );
  refs.unassignedColumn = byId<HTMLElement>('unassigned-tasks');
  refs.unassignedList = byId<HTMLElement>('unassigned-list');
  refs.categoryFilterSelect = byId<HTMLSelectElement>('filter-category');
  refs.idealDailyMinutesInput = byId<HTMLInputElement>('ideal-daily-minutes');
  refs.weekdayFilterBtn = byId<HTMLButtonElement>('weekday-filter-btn');
  refs.weekdaySettings = document.getElementById('weekday-settings');
  refs.themeToggleBtn = byId<HTMLButtonElement>('theme-toggle');
  refs.moreMenuBtn = byId<HTMLButtonElement>('more-menu-btn');
  refs.moreMenuDropdown = document.getElementById('more-menu-dropdown');
  refs.exportDataBtn = byId<HTMLButtonElement>('export-data-btn');
  refs.importDataBtn = byId<HTMLButtonElement>('import-data-btn');
  refs.importFileInput = byId<HTMLInputElement>('import-file-input');
  refs.archiveToggleBtn = byId<HTMLButtonElement>('archive-toggle');
  refs.archiveView = byId<HTMLElement>('archive-view');
  refs.closeArchiveBtn = byId<HTMLButtonElement>('close-archive');
  refs.clearArchiveBtn = byId<HTMLButtonElement>('clear-archive');
  refs.archiveList = byId<HTMLElement>('archive-list');
  refs.statisticsToggleBtn = byId<HTMLButtonElement>('statistics-toggle');
  refs.dashboardPanel = byId<HTMLElement>('dashboard-panel');
  refs.closeDashboardBtn = byId<HTMLButtonElement>('close-dashboard');
  refs.templateToggleBtn = byId<HTMLButtonElement>('template-toggle');
  refs.templatePanel = byId<HTMLElement>('template-panel');
  refs.closeTemplatePanelBtn = byId<HTMLButtonElement>('close-template-panel');
  refs.templateSearchInput = byId<HTMLInputElement>('template-search');
  refs.templateSortSelect = byId<HTMLSelectElement>('template-sort');
  refs.templateList = byId<HTMLElement>('template-list');
  refs.dayContextMenu = document.getElementById('day-context-menu');
  refs.modal = document.getElementById('task-modal');

  return validateCriticalElements();
}

function validateCriticalElements(): boolean {
  const critical: (HTMLElement | null)[] = [
    refs.addTaskBtn,
    refs.taskForm,
    refs.taskNameInput,
    refs.estimatedTimeInput,
    refs.actualTimeInput,
    refs.taskPriorityInput,
    refs.taskCategoryInput,
    refs.taskDateInput,
    refs.duplicateTaskBtn,
    refs.saveAsTemplateBtn,
  ];
  const missing = critical.filter(el => el === null);
  if (missing.length > 0) {
    logger.warn(COMPONENT, `Missing critical DOM elements: ${missing.length}`);
  }
  return missing.length === 0;
}

function initializeModalEventListeners(): boolean {
  if (!refs.closeModalBtn) {
    logger.warn(COMPONENT, 'Close modal button not found');
    return false;
  }
  refs.closeModalBtn.addEventListener('click', () => {
    closeModal();
  });
  return true;
}

function initializeTaskFormEventListeners(): boolean {
  if (!refs.taskForm) {
    logger.warn(COMPONENT, 'Task form not found');
    return false;
  }
  refs.taskForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    logger.info(COMPONENT, 'Task form submitted (delegated to existing script.js)');
  });
  return true;
}

function initializeWeekNavigationListeners(): boolean {
  if (!refs.prevWeekBtn || !refs.todayBtn || !refs.nextWeekBtn) {
    logger.warn(COMPONENT, 'Week navigation buttons not found');
    return false;
  }
  refs.prevWeekBtn.addEventListener('click', () => {
    updateWeekOffset(-1);
  });
  refs.todayBtn.addEventListener('click', () => {
    updateWeekOffset(0);
  });
  refs.nextWeekBtn.addEventListener('click', () => {
    updateWeekOffset(1);
  });
  refs.datePicker?.addEventListener('change', () => {
    if (refs.datePicker) {
      updateCurrentDate(new Date(refs.datePicker.value));
    }
  });
  return true;
}

function initializeWeekdayListeners(): boolean {
  if (!refs.weekdayFilterBtn || !refs.weekdaySettings) {
    logger.warn(COMPONENT, 'Weekday UI elements not found');
    return false;
  }
  refs.weekdayFilterBtn.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    const isVisible = refs.weekdaySettings?.style?.display === 'none';
    if (refs.weekdaySettings) {
      refs.weekdaySettings.style.display = isVisible ? 'block' : 'none';
    }
  });
  return true;
}

function initializeSettingsListeners(): boolean {
  if (!refs.categoryFilterSelect || !refs.idealDailyMinutesInput) {
    logger.warn(COMPONENT, 'Settings UI elements not found');
    return false;
  }
  refs.categoryFilterSelect.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLSelectElement;
    logger.info(COMPONENT, `Category filter changed to: ${target.value}`);
  });
  refs.idealDailyMinutesInput.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseInt(target.value) || 480;
    logger.info(COMPONENT, `Ideal daily minutes changed to: ${newValue}`);
  });
  return true;
}

function initializeThemeListener(): boolean {
  if (!refs.themeToggleBtn) {
    logger.warn(COMPONENT, 'Theme toggle button not found');
    return false;
  }
  refs.themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
  });
  return true;
}

function initializeMoreMenuListeners(): boolean {
  if (!refs.moreMenuBtn || !refs.moreMenuDropdown) {
    logger.warn(COMPONENT, 'More menu elements not found');
    return false;
  }
  refs.moreMenuBtn.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    toggleMoreMenu();
  });
  return true;
}

function initializeExportImportListeners(): boolean {
  if (!refs.exportDataBtn || !refs.importDataBtn) {
    logger.warn(COMPONENT, 'Export/Import buttons not found');
    return false;
  }
  refs.exportDataBtn.addEventListener('click', () => {
    exportData();
  });
  refs.importDataBtn.addEventListener('click', () => {
    refs.importFileInput?.click();
  });
  return true;
}

function initializeArchiveListeners(): boolean {
  if (!refs.archiveToggleBtn || !refs.closeArchiveBtn || !refs.clearArchiveBtn) {
    logger.warn(COMPONENT, 'Archive elements not found');
    return false;
  }
  refs.archiveToggleBtn.addEventListener('click', () => {
    toggleArchiveView();
  });
  refs.closeArchiveBtn.addEventListener('click', () => {
    closeArchiveView();
  });
  refs.clearArchiveBtn.addEventListener('click', () => {
    clearArchive();
  });
  return true;
}

function initializeStatisticsListeners(): boolean {
  if (!refs.statisticsToggleBtn || !refs.dashboardPanel || !refs.closeDashboardBtn) {
    logger.warn(COMPONENT, 'Statistics/Dashboard elements not found');
    return false;
  }
  refs.statisticsToggleBtn.addEventListener('click', () => {
    toggleStatistics();
  });
  refs.closeDashboardBtn.addEventListener('click', () => {
    if (refs.dashboardPanel) {
      refs.dashboardPanel.style.display = 'none';
    }
  });
  return true;
}

function initializeTemplatePanelListeners(): boolean {
  if (!refs.templateToggleBtn || !refs.closeTemplatePanelBtn) {
    logger.warn(COMPONENT, 'Template panel elements not found');
    return false;
  }
  refs.templateToggleBtn.addEventListener('click', () => {
    toggleTemplatePanel();
  });
  refs.closeTemplatePanelBtn.addEventListener('click', () => {
    closeTemplatePanel();
  });
  refs.templateSearchInput?.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    searchTemplates(target.value);
  });
  refs.templateSortSelect?.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLSelectElement;
    sortTemplates(target.value);
  });
  refs.saveAsTemplateBtn?.addEventListener('click', () => {
    saveTaskAsTemplate();
  });
  return true;
}

function initializeDayColumnListeners(): boolean {
  refs.dayColumns.forEach(column => {
    column.addEventListener('click', (e: MouseEvent) => {
      if (e.target === column || column.contains(e.target as Node)) {
        openTaskModal(column.id);
      }
    });
  });
  return true;
}

function initializeUnassignedListeners(): boolean {
  if (!refs.unassignedColumn || !refs.unassignedList) {
    logger.warn(COMPONENT, 'Unassigned elements not found');
    return false;
  }
  refs.unassignedColumn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    openTaskModal();
  });
  return true;
}

function initializeGlobalClickDismissal(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Node;
    if (
      refs.weekdaySettings &&
      refs.weekdayFilterBtn &&
      !refs.weekdaySettings.contains(target) &&
      !refs.weekdayFilterBtn.contains(target)
    ) {
      refs.weekdaySettings.style.display = 'none';
    }
    if (
      refs.moreMenuDropdown &&
      refs.moreMenuBtn &&
      !refs.moreMenuDropdown.contains(target) &&
      !refs.moreMenuBtn.contains(target)
    ) {
      refs.moreMenuDropdown.style.display = 'none';
    }
  });
}

function initializeEventListeners(): boolean {
  const results = [
    initializeModalEventListeners(),
    initializeTaskFormEventListeners(),
    initializeWeekNavigationListeners(),
    initializeWeekdayListeners(),
    initializeSettingsListeners(),
    initializeThemeListener(),
    initializeMoreMenuListeners(),
    initializeExportImportListeners(),
    initializeArchiveListeners(),
    initializeStatisticsListeners(),
    initializeTemplatePanelListeners(),
    initializeDayColumnListeners(),
    initializeUnassignedListeners(),
  ];
  initializeGlobalClickDismissal();

  const allSuccess = results.every(Boolean);
  if (allSuccess) {
    logger.info(COMPONENT, 'Event listeners initialized successfully');
  } else {
    logger.warn(COMPONENT, 'Some event listeners may have failed to initialize');
  }
  return allSuccess;
}

export function initializeDOMElements(): boolean {
  const success = initializeElementReferences() && initializeEventListeners();
  if (success) {
    logger.info(COMPONENT, 'DOM elements initialized successfully');
  } else {
    logger.error(COMPONENT, 'Failed to initialize some DOM elements');
  }
  return success;
}

export function getDOMRefs(): Readonly<DOMRefs> {
  return { ...refs };
}

export function closeModal(): void {
  if (refs.modal) {
    refs.modal.style.display = 'none';
    isRendering = false;
    currentTaskId = null;
  }
  logger.info(COMPONENT, 'Modal closed');
}

export function openTaskModal(dayId?: string): void {
  isRendering = true;
  currentTaskId = dayId ?? null;
  if (!refs.modal) return;

  refs.modal.style.display = 'block';
  refs.taskForm?.reset();

  const defaultDate = formatDate(new Date());
  if (refs.taskDateInput) {
    refs.taskDateInput.value = defaultDate;
  }
  if (refs.duplicateTaskBtn) {
    refs.duplicateTaskBtn.style.display = 'none';
  }
  if (refs.saveAsTemplateBtn) {
    refs.saveAsTemplateBtn.style.display = 'none';
  }
  refs.taskNameInput?.focus();
  logger.info(COMPONENT, `Task modal opened for ${dayId ?? 'new task'}`);
}

let weekOffset = 0;

export function updateWeekOffset(offset: number): void {
  weekOffset += offset;
  logger.info(COMPONENT, `Week offset updated to ${weekOffset}`);
}

export function getWeekOffset(): number {
  return weekOffset;
}

export function updateCurrentDate(date: Date): void {
  logger.info(COMPONENT, `Current date updated to ${formatDate(date)}`);
}

export function updateCategoryFilter(filter: string): void {
  if (refs.categoryFilterSelect) {
    refs.categoryFilterSelect.value = filter;
  }
}

export function updateIdealDailyMinutes(minutes: number): void {
  if (refs.idealDailyMinutesInput) {
    refs.idealDailyMinutesInput.value = String(minutes);
  }
}

export function toggleTheme(): void {
  logger.info(COMPONENT, 'Theme toggle triggered');
}

export function getCurrentTheme(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

export function toggleMoreMenu(): void {
  if (!refs.moreMenuDropdown) return;
  const isVisible = refs.moreMenuDropdown.style.display === 'block';
  refs.moreMenuDropdown.style.display = isVisible ? 'none' : 'block';
}

export function exportData(): void {
  logger.info(COMPONENT, 'Export data triggered');
}

export function importData(file: File): void {
  logger.info(COMPONENT, `Import file: ${file.name}`);
}

export function toggleArchiveView(): void {
  if (!refs.archiveView) return;
  const isVisible = refs.archiveView.style.display === 'block';
  refs.archiveView.style.display = isVisible ? 'none' : 'block';
  logger.info(COMPONENT, 'Archive toggle triggered');
}

export function closeArchiveView(): void {
  if (refs.archiveView) {
    refs.archiveView.style.display = 'none';
  }
  logger.info(COMPONENT, 'Close archive view triggered');
}

export function clearArchive(): void {
  logger.info(COMPONENT, 'Clear archive triggered');
}

export function toggleStatistics(): void {
  if (!refs.dashboardPanel) return;
  const isVisible = refs.dashboardPanel.style.display === 'block';
  refs.dashboardPanel.style.display = isVisible ? 'none' : 'block';
  logger.info(COMPONENT, 'Statistics toggle triggered');
}

export function toggleTemplatePanel(): void {
  if (!refs.templatePanel) return;
  const isVisible = refs.templatePanel.style.display === 'block';
  refs.templatePanel.style.display = isVisible ? 'none' : 'block';
  logger.info(COMPONENT, 'Template panel toggle triggered');
}

export function closeTemplatePanel(): void {
  if (refs.templatePanel) {
    refs.templatePanel.style.display = 'none';
  }
}

export function searchTemplates(searchTerm: string): void {
  if (refs.templateSearchInput) {
    refs.templateSearchInput.value = searchTerm;
  }
  logger.info(COMPONENT, `Template search: ${searchTerm}`);
}

export function sortTemplates(sortBy: string): void {
  if (refs.templateSortSelect) {
    refs.templateSortSelect.value = sortBy;
  }
  logger.info(COMPONENT, `Template sort changed to: ${sortBy}`);
}

export function saveTaskAsTemplate(): void {
  logger.info(COMPONENT, 'Save as template triggered');
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getRef<K extends keyof DOMRefs>(key: K): DOMRefs[K] {
  return refs[key];
}
