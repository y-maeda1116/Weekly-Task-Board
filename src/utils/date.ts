/**
 * Date utility functions
 */

/**
 * Get the Monday of the week for a given date
 * @param d - The date to get Monday from
 * @returns The Monday of that week, set to 00:00:00 local time
 */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format a Date object into a YYYY-MM-DD string
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object
 * @param dateStr - The date string to parse
 * @returns The parsed Date object, or null if invalid
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get a future date string in YYYY-MM-DD format
 * @param daysToAdd - Number of days to add to today
 * @returns The future date string
 */
export function getNextDate(daysToAdd: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysToAdd);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the date string for a specific weekday relative to a given date
 * @param date - The base date
 * @param weekday - The target weekday (0 = Sunday, 1 = Monday, etc.)
 * @returns The date string for the target weekday
 */
export function getDateForWeekday(date: Date, weekday: number): string {
  const d = new Date(date);
  const currentDay = d.getDay();
  const diff = weekday - currentDay;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/**
 * Add days to a date
 * @param date - The base date
 * @param days - Number of days to add (can be negative)
 * @returns The new date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 * @param date - The base date
 * @param weeks - Number of weeks to add (can be negative)
 * @returns The new date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Get the difference in days between two dates
 * @param date1 - The first date
 * @param date2 - The second date
 * @returns The difference in days (positive if date2 is after date1)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);

  // Reset time components for accurate day calculation
  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);

  return Math.round((secondDate.getTime() - firstDate.getTime()) / oneDay);
}

/**
 * Check if a date is within a week range
 * @param date - The date to check
 * @param weekStart - The start of the week (Monday)
 * @returns True if the date is within the week
 */
export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = addDays(weekStart, 6);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(0, 0, 0, 0);

  return checkDate >= weekStart && checkDate <= weekEnd;
}

/**
 * Format a date as a Japanese date string
 * @param date - The date to format
 * @returns The formatted Japanese date string (e.g., "2025年3月10日")
 */
export function formatDateJapanese(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

/**
 * Format a time in hours and minutes
 * @param hours - The number of hours
 * @returns The formatted time string (e.g., "2h 30m")
 */
export function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);

  if (m === 0) {
    return `${h}h`;
  } else if (h === 0) {
    return `${m}m`;
  } else {
    return `${h}h ${m}m`;
  }
}

/**
 * Format a time as a decimal string
 * @param hours - The number of hours
 * @param decimals - Number of decimal places (default: 1)
 * @returns The formatted time string (e.g., "2.5h")
 */
export function formatTimeDecimal(hours: number, decimals: number = 1): string {
  return `${hours.toFixed(decimals)}h`;
}

/**
 * Parse time string to hours
 * @param timeStr - The time string to parse (e.g., "2.5h", "2h 30m", "2:30")
 * @returns The time in hours, or NaN if invalid
 */
export function parseTime(timeStr: string): number {
  if (!timeStr) return NaN;

  // Handle decimal format (e.g., "2.5h")
  const decimalMatch = timeStr.match(/^(\d+(?:\.\d+)?)h?$/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  // Handle "Xh Ym" format (e.g., "2h 30m")
  const hoursMinutesMatch = timeStr.match(/^(\d+)h\s*(\d+)?m?$/);
  if (hoursMinutesMatch) {
    const hours = parseInt(hoursMinutesMatch[1], 10);
    const minutes = hoursMinutesMatch[2] ? parseInt(hoursMinutesMatch[2], 10) : 0;
    return hours + minutes / 60;
  }

  // Handle "HH:MM" format (e.g., "2:30")
  const colonMatch = timeStr.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const minutes = parseInt(colonMatch[2], 10);
    return hours + minutes / 60;
  }

  return NaN;
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

/**
 * Check if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Check if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export function isFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}

/**
 * Get the week range for a given date
 * @param date - The date to get the week range for
 * @returns An object with start (Monday) and end (Sunday) dates
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = getMonday(date);
  const end = addDays(start, 6);
  return { start, end };
}

/**
 * Get a date string for a specific offset from the week's Monday
 * @param weekMonday - The Monday of the week
 * @param offset - The day offset (0 = Monday, 1 = Tuesday, etc.)
 * @returns The date string for the target day
 */
export function getDateFromWeekOffset(weekMonday: Date, offset: number): string {
  const targetDate = addDays(weekMonday, offset);
  return formatDate(targetDate);
}

/**
 * Format a date range as a string
 * @param start - The start date
 * @param end - The end date
 * @returns The formatted date range string
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
  const endStr = `${end.getMonth() + 1}/${end.getDate()}`;

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
}
