/**
 * RecurrenceEngine Unit Tests
 * Focus: monthly recurrence must advance by calendar month (anchor day),
 * consistent with generateMonthlyTasks — not by a fixed 30-day interval.
 */

import { describe, it, expect } from "vitest";
import { RecurrenceEngine } from "../../src/models/RecurrenceEngine";
import type { Task } from "../../src/types";
import { TaskPriority, TaskCategory } from "../../src/types";

const makeTask = (id: string, name: string, overrides: Partial<Task> = {}): Task => ({
  id,
  name,
  estimated_time: 30,
  actual_time: 0,
  completed: false,
  priority: TaskPriority.MEDIUM,
  category: TaskCategory.TASK,
  date: "2027-01-31",
  assigned_date: "2027-01-31",
  due_date: null,
  details: "",
  is_recurring: true,
  recurrence_pattern: "monthly",
  recurrence_end_date: null,
  ...overrides,
});

const atMidnight = (y: number, m: number, d: number): Date => new Date(y, m - 1, d);

describe("RecurrenceEngine", () => {
  describe("getNextOccurrence", () => {
    it("advances monthly recurrence to the same day in the next calendar month", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "monthly task");
      const next = engine.getNextOccurrence(task, atMidnight(2027, 1, 31));
      expect(next).not.toBeNull();
      expect(next!.getTime()).toBe(atMidnight(2027, 2, 28).getTime());
    });

    it("keeps the anchor day after a clamped short month (Jan 31 -> Feb 28 -> Mar 31)", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "monthly task");
      const next = engine.getNextOccurrence(task, atMidnight(2027, 2, 28));
      expect(next!.getTime()).toBe(atMidnight(2027, 3, 31).getTime());
    });

    it("advances daily recurrence by one day (unchanged behavior)", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "daily task", { recurrence_pattern: "daily" });
      const next = engine.getNextOccurrence(task, atMidnight(2027, 1, 31));
      expect(next!.getTime()).toBe(atMidnight(2027, 2, 1).getTime());
    });

    it("advances weekly recurrence by seven days (unchanged behavior)", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "weekly task", { recurrence_pattern: "weekly" });
      const next = engine.getNextOccurrence(task, atMidnight(2027, 1, 31));
      expect(next!.getTime()).toBe(atMidnight(2027, 2, 7).getTime());
    });

    it("parses the anchor day from the date string without timezone shifts", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "monthly task");
      const next = engine.getNextOccurrence(task, atMidnight(2027, 2, 28));
      // Anchor "2027-01-31" must yield day 31 even if this string is parsed
      // as UTC midnight (i.e. when the test runs in a UTC− timezone)
      expect(next!.getTime()).toBe(atMidnight(2027, 3, 31).getTime());
    });

    it("returns null for non-recurring tasks", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "one-off", { is_recurring: false, recurrence_pattern: null });
      expect(engine.getNextOccurrence(task, atMidnight(2027, 1, 31))).toBeNull();
    });
  });

  describe("getOccurrencesInRange", () => {
    it("returns calendar-monthly occurrences for a day-31 anchor", () => {
      const engine = new RecurrenceEngine();
      const task = makeTask("t1", "monthly task");
      const occurrences = engine.getOccurrencesInRange(
        task,
        atMidnight(2027, 1, 31),
        atMidnight(2027, 4, 30)
      );
      const expected = [
        atMidnight(2027, 1, 31),
        atMidnight(2027, 2, 28),
        atMidnight(2027, 3, 31),
        atMidnight(2027, 4, 30),
      ].map((d) => d.getTime());
      expect(occurrences.map((d) => d.getTime())).toEqual(expected);
    });
  });
});
