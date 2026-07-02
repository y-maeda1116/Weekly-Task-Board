/**
 * Event Printer Property-Based Tests
 * Tests the correctness properties of event formatting
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { EventPrinterImpl } from "../../src/components/EventPrinter";
import { Event } from "../../src/types/index";

describe("EventPrinter - Property-Based Tests", () => {
  const printer = new EventPrinterImpl();

  /**
   * Property 20: Event Format
   * **Validates: Requirements 3**
   * 
   * For all Event objects, the event printer formats them into a human-readable string
   * containing event title, start time, end time, and location (if available)
   */
  it("Property 20: Should format event with title, start time, end time, and location", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 500 }),
          location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          organizer: fc.option(fc.string({ maxLength: 100 })),
          attendees: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 10 })),
          isAllDay: fc.boolean(),
          categories: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
          lastModified: fc.date(),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          // Ensure startTime is before endTime
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          // Format event
          const formatted = printer.formatEvent(event);

          // Verify formatted string contains title
          expect(formatted).toContain(event.title);

          // Verify formatted string contains time information
          expect(formatted).toMatch(/\d{2}:\d{2}/); // Should contain time in HH:MM format

          // Verify it's a non-empty string
          expect(formatted.length).toBeGreaterThan(0);
        }
      )
    );
  });

  /**
   * Additional property: Event details formatting
   * Verifies that event details are formatted with all available information
   */
  it("Should format event details with all available information", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string({ minLength: 1 }),
          location: fc.string({ minLength: 1 }),
          organizer: fc.string({ minLength: 1 }),
          attendees: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          isAllDay: fc.boolean(),
          categories: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          lastModified: fc.date(),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          const details = printer.formatEventDetails(event);

          // Verify all key information is present
          expect(details).toContain(event.title);
          expect(details).toContain(event.description);
          expect(details).toContain(event.location);
          expect(details).toContain(event.organizer);

          // Verify it's multi-line format
          expect(details.split("\n").length).toBeGreaterThan(1);
        }
      )
    );
  });

  /**
   * Additional property: Event list formatting
   * Verifies that multiple events are formatted as a list
   */
  it("Should format event list with all events", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            isAllDay: fc.boolean(),
            lastModified: fc.date(),
            location: fc.option(fc.string()),
            organizer: fc.option(fc.string()),
            attendees: fc.option(fc.array(fc.string())),
            categories: fc.option(fc.array(fc.string())),
            startTime: fc.date(),
            endTime: fc.date()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (eventDataArray) => {
          const events: Event[] = eventDataArray.map((data) => ({
            ...data,
            startTime: new Date(Math.min(data.startTime.getTime(), data.endTime.getTime())),
            endTime: new Date(Math.max(data.startTime.getTime(), data.endTime.getTime()))
          }));

          const formatted = printer.formatEventList(events);

          // Verify all event titles are in the list
          events.forEach((event) => {
            expect(formatted).toContain(event.title);
          });

          // Verify it's a multi-line format
          const lines = formatted.split("\n");
          expect(lines.length).toBeGreaterThanOrEqual(events.length);
        }
      )
    );
  });

  /**
   * Additional property: Empty event list handling
   * Verifies that empty event lists are handled gracefully
   */
  it("Should handle empty event list gracefully", () => {
    const emptyList: Event[] = [];
    const formatted = printer.formatEventList(emptyList);

    // Should return a meaningful message
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted.toLowerCase()).toContain("no events");
  });

  /**
   * Additional property: Time format consistency
   * Verifies that times are formatted consistently in HH:MM format
   */
  it("Should format times consistently in HH:MM format", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string(),
          isAllDay: fc.boolean(),
          lastModified: fc.date(),
          location: fc.option(fc.string()),
          organizer: fc.option(fc.string()),
          attendees: fc.option(fc.array(fc.string())),
          categories: fc.option(fc.array(fc.string())),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          const formatted = printer.formatEvent(event);

          // Extract time patterns from formatted string
          const timePattern = /\d{2}:\d{2}/g;
          const times = formatted.match(timePattern);

          // Should have at least 2 times (start and end)
          expect(times).toBeDefined();
          expect(times!.length).toBeGreaterThanOrEqual(2);

          // Each time should be in valid HH:MM format
          times!.forEach((time) => {
            const [hours, minutes] = time.split(":").map(Number);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(hours).toBeLessThan(24);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
          });
        }
      )
    );
  });

  /**
   * Additional property: Location inclusion
   * Verifies that location is included when available
   */
  it("Should include location in details when available", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string(),
          location: fc.string({ minLength: 1 }),
          organizer: fc.option(fc.string()),
          attendees: fc.option(fc.array(fc.string())),
          isAllDay: fc.boolean(),
          categories: fc.option(fc.array(fc.string())),
          lastModified: fc.date(),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          const details = printer.formatEventDetails(event);

          // Location should be included
          expect(details).toContain(event.location);
          expect(details).toContain("Location");
        }
      )
    );
  });

  /**
   * Additional property: Non-empty formatted output
   * Verifies that all formatting methods produce non-empty output
   */
  it("Should always produce non-empty formatted output", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string(),
          isAllDay: fc.boolean(),
          lastModified: fc.date(),
          location: fc.option(fc.string()),
          organizer: fc.option(fc.string()),
          attendees: fc.option(fc.array(fc.string())),
          categories: fc.option(fc.array(fc.string())),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          const formatted = printer.formatEvent(event);
          const details = printer.formatEventDetails(event);

          expect(formatted.length).toBeGreaterThan(0);
          expect(details.length).toBeGreaterThan(0);
        }
      )
    );
  });
});
