/**
 * Date utility functions
 */

/**
 * Get the Monday of the week for a given date
 * @param d - The date to get Monday from
 * @returns The Monday of that week, set to 00:00:00 local time
 */
export function getMonday(d: Date): Date {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date();
  }
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
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date = now;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
