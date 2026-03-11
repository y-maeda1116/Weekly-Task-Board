/**
 * DOM element type definitions for type-safe DOM manipulation
 */

/**
 * Main DOM elements interface
 * Type-safe references to all DOM elements used in the application
 */
export interface DOMElements {
  // Header elements
  headerControls: HTMLElement | null;
  addTaskBtn: HTMLButtonElement | null;
  filterCategory: HTMLSelectElement | null;
  idealDailyMinutes: HTMLInputElement | null;
  weekdayFilterBtn: HTMLButtonElement | null;
  weekdaySettings: HTMLElement | null;
  weekdayCheckboxes: HTMLElement | null;
  showMonday: HTMLInputElement | null;
  showTuesday: HTMLInputElement | null;
  showWednesday: HTMLInputElement | null;
  showThursday: HTMLInputElement | null;
  showFriday: HTMLInputElement | null;
  showSaturday: HTMLInputElement | null;
  showSunday: HTMLInputElement | null;
  prevWeekBtn: HTMLButtonElement | null;
  todayBtn: HTMLButtonElement | null;
  nextWeekBtn: HTMLButtonElement | null;
  datePicker: HTMLInputElement | null;
  statisticsToggle: HTMLButtonElement | null;
  templateToggle: HTMLButtonElement | null;
  themeToggle: HTMLButtonElement | null;
  moreMenuBtn: HTMLButtonElement | null;
  moreMenuDropdown: HTMLElement | null;
  exportDataBtn: HTMLButtonElement | null;
  importDataBtn: HTMLButtonElement | null;
  importFileInput: HTMLInputElement | null;
  archiveToggle: HTMLButtonElement | null;
  weekTitle: HTMLElement | null;

  // Task board elements
  monday: HTMLElement | null;
  tuesday: HTMLElement | null;
  wednesday: HTMLElement | null;
  thursday: HTMLElement | null;
  friday: HTMLElement | null;
  saturday: HTMLElement | null;
  sunday: HTMLElement | null;
  unassignedList: HTMLElement | null;
  sidebar: HTMLElement | null;

  // Dashboard elements
  dashboardPanel: HTMLElement | null;
  dashboardDatePicker: HTMLInputElement | null;
  dashboardPrevWeek: HTMLButtonElement | null;
  dashboardNextWeek: HTMLButtonElement | null;
  closeDashboard: HTMLButtonElement | null;
  completionRateValue: HTMLElement | null;
  completedTasksValue: HTMLElement | null;
  estimatedTimeValue: HTMLElement | null;
  actualTimeValue: HTMLElement | null;
  categoryBreakdown: HTMLElement | null;
  dailyBreakdown: HTMLElement | null;

  // Archive elements
  archiveView: HTMLElement | null;
  closeArchive: HTMLButtonElement | null;
  clearArchive: HTMLButtonElement | null;
  archiveList: HTMLElement | null;

  // Context menu
  dayContextMenu: HTMLElement | null;

  // Template panel
  templatePanel: HTMLElement | null;
  closeTemplatePanel: HTMLButtonElement | null;
  templateSearch: HTMLInputElement | null;
  templateSort: HTMLSelectElement | null;
  templateList: HTMLElement | null;
  templateEmpty: HTMLElement | null;

  // Task modal
  taskModal: HTMLElement | null;
  taskForm: HTMLFormElement | null;
  taskName: HTMLInputElement | null;
  estimatedTime: HTMLInputElement | null;
  actualTime: HTMLInputElement | null;
  taskPriority: HTMLSelectElement | null;
  taskCategory: HTMLSelectElement | null;
  taskDate: HTMLInputElement | null;
  dueDate: HTMLInputElement | null;
  dueTimePeriod: HTMLSelectElement | null;
  dueHour: HTMLSelectElement | null;
  taskDetails: HTMLTextAreaElement | null;
  isRecurring: HTMLInputElement | null;
  recurrenceOptions: HTMLElement | null;
  recurrencePattern: HTMLSelectElement | null;
  recurrenceEndDate: HTMLInputElement | null;
  duplicateTaskBtn: HTMLButtonElement | null;
  saveAsTemplateBtn: HTMLButtonElement | null;
}

/**
 * Day column elements interface
 * Represents a day column in the task board
 */
export interface DayColumn {
  element: HTMLElement;
  date: Date;
  dayName: string;
  visible: boolean;
}

/**
 * Weekday enum
 */
export enum Weekday {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

/**
 * Weekday display names (Japanese)
 */
export const WEEKDAY_NAMES: Record<Weekday, string> = {
  [Weekday.MONDAY]: '月',
  [Weekday.TUESDAY]: '火',
  [Weekday.WEDNESDAY]: '水',
  [Weekday.THURSDAY]: '木',
  [Weekday.FRIDAY]: '金',
  [Weekday.SATURDAY]: '土',
  [Weekday.SUNDAY]: '日'
};

/**
 * Full weekday display names (Japanese)
 */
export const FULL_WEEKDAY_NAMES: Record<Weekday, string> = {
  [Weekday.MONDAY]: '月曜日',
  [Weekday.TUESDAY]: '火曜日',
  [Weekday.WEDNESDAY]: '水曜日',
  [Weekday.THURSDAY]: '木曜日',
  [Weekday.FRIDAY]: '金曜日',
  [Weekday.SATURDAY]: '土曜日',
  [Weekday.SUNDAY]: '日曜日'
};
