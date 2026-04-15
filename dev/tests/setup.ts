/**
 * Test Setup
 * Common setup for all tests
 */

// Global test utilities
export const createMockDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};

export const createMockDateWithTime = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number = 0,
  seconds: number = 0
): Date => {
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString();
};
