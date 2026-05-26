import { getMonday, formatDate, getWeekRange, addDays, isDateInWeek } from '../utils/date';
import { logger } from '../utils/logger';

type WeekdayId = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const WEEKDAY_IDS: WeekdayId[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const WEEKDAY_OFFSET: Record<WeekdayId, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6
};

const WEEKDAY_DISPLAY_NAMES: Record<WeekdayId, string> = {
  monday: '月曜日', tuesday: '火曜日', wednesday: '水曜日',
  thursday: '木曜日', friday: '金曜日', saturday: '土曜日', sunday: '日曜日'
};

const DAY_NUMBER_TO_WEEKDAY: Record<number, WeekdayId | null> = {
  1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday',
  5: 'friday', 6: 'saturday', 0: 'sunday'
};

interface WeekState {
  currentDate: Date;
  weekOffset: number;
  mondayDate: Date | null;
}

const weekState: WeekState = {
  currentDate: new Date(),
  weekOffset: 0,
  mondayDate: null
};

export function formatDateDisplay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}年${m}月${d}日`;
}

export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  if (startMonth === endMonth) {
    return `${startDate.getFullYear()}年${startMonth}月${startDay}日〜${endDay}日`;
  }
  return `${startDate.getFullYear()}年${startMonth}月${startDay}日〜${endMonth}月${endDay}日`;
}

export function getWeekdayDisplayName(weekday: WeekdayId): string {
  return WEEKDAY_DISPLAY_NAMES[weekday] || weekday;
}

export function getWeekdayId(date: Date): WeekdayId | null {
  return DAY_NUMBER_TO_WEEKDAY[date.getDay()] ?? null;
}

function getDateForWeekday(weekday: WeekdayId): Date | null {
  if (!weekState.mondayDate) return null;
  return addDays(weekState.mondayDate, WEEKDAY_OFFSET[weekday]);
}

export function getDateStringForWeekday(weekday: WeekdayId): string | null {
  const date = getDateForWeekday(weekday);
  return date ? formatDate(date) : null;
}

export function getWeekOffset(): number {
  return weekState.weekOffset;
}

export function getCurrentDate(): Date {
  return new Date(weekState.currentDate);
}

export function getMondayDate(): Date | null {
  return weekState.mondayDate ? new Date(weekState.mondayDate) : null;
}

export function isDateInCurrentWeek(date: Date): boolean {
  if (!weekState.mondayDate) return false;
  return isDateInWeek(date, weekState.mondayDate);
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function previousWeek(): void {
  weekState.weekOffset -= 1;
  weekState.currentDate = new Date(weekState.currentDate.getTime() - MS_PER_WEEK);
  updateWeekDisplay();
  logger.info('WeekNavigation', `Navigated to previous week (offset: ${weekState.weekOffset})`);
}

export function currentWeek(): void {
  weekState.weekOffset = 0;
  weekState.currentDate = new Date();
  updateWeekDisplay();
  logger.info('WeekNavigation', 'Navigated to current week');
}

export function nextWeek(): void {
  weekState.weekOffset += 1;
  weekState.currentDate = new Date(weekState.currentDate.getTime() + MS_PER_WEEK);
  updateWeekDisplay();
  logger.info('WeekNavigation', `Navigated to next week (offset: ${weekState.weekOffset})`);
}

export function goToWeek(date: Date): void {
  const monday = getMonday(date);
  weekState.currentDate = new Date(monday);
  weekState.mondayDate = monday;
  const todayMonday = getMonday(new Date());
  const diffTime = monday.getTime() - todayMonday.getTime();
  weekState.weekOffset = Math.round(diffTime / MS_PER_WEEK);
  updateWeekDisplay();
  logger.info('WeekNavigation', `Navigated to week of ${formatDate(date)}`);
}

export function updateDayColumnDates(): void {
  WEEKDAY_IDS.forEach(weekdayId => {
    const column = document.getElementById(weekdayId);
    const date = getDateForWeekday(weekdayId);
    if (!column || !date) return;
    column.dataset.date = formatDate(date);
    const header = column.querySelector('h3');
    if (header) {
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      header.textContent = `${getWeekdayDisplayName(weekdayId)} ${dateStr}`;
    }
  });
}

export function updateWeekDisplay(): void {
  const weekRange = getWeekRange(weekState.currentDate);
  const weekTitle = document.getElementById('week-title');
  const datePicker = document.getElementById('date-picker') as HTMLInputElement | null;
  if (weekTitle) {
    weekTitle.textContent = formatWeekRange(weekRange.start, weekRange.end);
  }
  if (datePicker) {
    datePicker.value = formatDate(weekRange.start);
  }
  updateDayColumnDates();
}

export function initializeWeekNavigation(): boolean {
  weekState.currentDate = new Date();
  weekState.mondayDate = getMonday(weekState.currentDate);
  weekState.weekOffset = 0;
  updateWeekDisplay();
  logger.info('WeekNavigation', 'Week navigation initialized');
  return true;
}
