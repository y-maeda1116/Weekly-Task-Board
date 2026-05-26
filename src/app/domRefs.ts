export interface DOMRefs {
  weekTitle: HTMLElement | null;
  datePicker: HTMLInputElement | null;
  prevWeekBtn: HTMLElement | null;
  nextWeekBtn: HTMLElement | null;
  todayBtn: HTMLElement | null;
  addTaskBtn: HTMLElement | null;
  taskModal: HTMLElement | null;
  taskForm: HTMLFormElement | null;
  categoryFilterSelect: HTMLSelectElement | null;
  idealDailyMinutesInput: HTMLInputElement | null;
  moreMenuBtn: HTMLElement | null;
  moreMenuDropdown: HTMLElement | null;
  templateToggleBtn: HTMLElement | null;
  templatePanel: HTMLElement | null;
  migrationModal: HTMLElement | null;
  journalToggleBtn: HTMLElement | null;
  dashboardPanel: HTMLElement | null;
}

let refs: DOMRefs | null = null;

export function getDOMRefs(): DOMRefs {
  if (refs) return refs;
  refs = {
    weekTitle: document.getElementById('week-title'),
    datePicker: document.getElementById('date-picker') as HTMLInputElement | null,
    prevWeekBtn: document.getElementById('prev-week'),
    nextWeekBtn: document.getElementById('next-week'),
    todayBtn: document.getElementById('today-btn'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form') as HTMLFormElement | null,
    categoryFilterSelect: document.getElementById('category-filter') as HTMLSelectElement | null,
    idealDailyMinutesInput: document.getElementById('ideal-daily-minutes') as HTMLInputElement | null,
    moreMenuBtn: document.getElementById('more-menu-btn'),
    moreMenuDropdown: document.getElementById('more-menu-dropdown'),
    templateToggleBtn: document.getElementById('template-toggle-btn'),
    templatePanel: document.getElementById('template-panel'),
    migrationModal: document.getElementById('migration-modal'),
    journalToggleBtn: document.getElementById('journal-toggle-btn'),
    dashboardPanel: document.getElementById('dashboard-panel'),
  };
  return refs;
}

export function getDayColumns(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.day-column'));
}

export function getUnassignedColumn(): HTMLElement | null {
  return document.getElementById('unassigned-tasks');
}
