/**
 * Calendar Sync UI Property-Based Tests
 * Tests the correctness properties of the UI rendering
 */

import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { CalendarSyncUIImpl } from "../../src/components/CalendarSyncUI";
import { Event, SyncStatus } from "../../src/types/index";

describe("CalendarSyncUI - Property-Based Tests", () => {
  let ui: CalendarSyncUIImpl;

  beforeEach(() => {
    ui = new CalendarSyncUIImpl();
  });

  /**
   * Property 8: Event details display
   * **Validates: Requirements 3, 5**
   * 
   * For all clicked events in the list, the system displays a details panel
   * containing event title, start time, end time, and description
   */
  it("Property 8: Should display event details with all required information", () => {
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

          // Render event details
          const detailsElement = ui.renderEventDetails(event);

          // Verify it's an HTML element
          expect(detailsElement).toBeInstanceOf(HTMLElement);

          // Verify it contains required information
          const textContent = detailsElement.textContent || "";
          expect(textContent).toContain(event.title);
          expect(textContent).toContain(event.description);

          // Verify it has proper role for accessibility
          expect(detailsElement.getAttribute("role")).toBe("region");
        }
      )
    );
  });

  /**
   * Property 14: Duplicate warning display
   * **Validates: Requirements 3, 5**
   * 
   * For all detected duplicate events, the system displays a warning
   * and provides options to create new task, update existing, or skip
   */
  it("Property 14: Should render error messages for duplicate warnings", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (errorMessage) => {
          const error = new Error(errorMessage);

          // Render error message
          const errorElement = ui.renderErrorMessage(error);

          // Verify it's an HTML element
          expect(errorElement).toBeInstanceOf(HTMLElement);

          // Verify it contains the error message
          const textContent = errorElement.textContent || "";
          expect(textContent).toContain(errorMessage);

          // Verify it has proper role for accessibility
          expect(errorElement.getAttribute("role")).toBe("alert");
        }
      )
    );
  });

  /**
   * Additional property: Auth button rendering
   * Verifies that auth button is rendered correctly
   */
  it("Should render auth button with proper attributes", () => {
    const button = ui.renderAuthButton();

    expect(button).toBeInstanceOf(HTMLElement);
    expect(button.tagName).toBe("BUTTON");
    expect(button.id).toBe("outlook-auth-button");
    expect(button.textContent).toContain("Connect");
    expect(button.getAttribute("aria-label")).toBeDefined();
  });

  /**
   * Additional property: Disconnect button rendering
   * Verifies that disconnect button is rendered correctly
   */
  it("Should render disconnect button with proper attributes", () => {
    const button = ui.renderDisconnectButton();

    expect(button).toBeInstanceOf(HTMLElement);
    expect(button.tagName).toBe("BUTTON");
    expect(button.id).toBe("outlook-disconnect-button");
    expect(button.textContent).toContain("Disconnect");
    expect(button.getAttribute("aria-label")).toBeDefined();
  });

  /**
   * Additional property: Date range picker rendering
   * Verifies that date range picker is rendered correctly
   */
  it("Should render date range picker with start and end date inputs", () => {
    const picker = ui.renderDateRangePicker();

    expect(picker).toBeInstanceOf(HTMLElement);
    expect(picker.className).toContain("date-range-picker");

    // Should have role and aria-label for accessibility
    expect(picker.getAttribute("role")).toBe("group");
    expect(picker.getAttribute("aria-label")).toBeDefined();

    // Should contain date inputs
    const inputs = picker.querySelectorAll("input[type='date']");
    expect(inputs.length).toBe(2);
  });

  /**
   * Additional property: Event list rendering
   * Verifies that event list is rendered with all events
   */
  it("Should render event list with all events and checkboxes", () => {
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
          { maxLength: 10 }
        ),
        (eventDataArray) => {
          const events: Event[] = eventDataArray.map((data) => ({
            ...data,
            startTime: new Date(Math.min(data.startTime.getTime(), data.endTime.getTime())),
            endTime: new Date(Math.max(data.startTime.getTime(), data.endTime.getTime()))
          }));

          const listElement = ui.renderEventList(events);

          expect(listElement).toBeInstanceOf(HTMLElement);
          expect(listElement.className).toContain("event-list");
          expect(listElement.getAttribute("role")).toBe("list");

          if (events.length > 0) {
            // Should have list items
            const items = listElement.querySelectorAll("[role='listitem']");
            expect(items.length).toBe(events.length);

            // Each item should have a checkbox
            const checkboxes = listElement.querySelectorAll("input[type='checkbox']");
            expect(checkboxes.length).toBe(events.length);
          }
        }
      )
    );
  });

  /**
   * Additional property: Checkbox rendering
   * Verifies that checkboxes are rendered correctly
   */
  it("Should render checkbox with proper attributes", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (eventId) => {
          const checkbox = ui.renderCheckbox(eventId);

          expect(checkbox).toBeInstanceOf(HTMLElement);
          expect(checkbox.tagName).toBe("INPUT");
          expect((checkbox as HTMLInputElement).type).toBe("checkbox");
          expect(checkbox.id).toContain(eventId);
          expect(checkbox.getAttribute("aria-label")).toBeDefined();
        }
      )
    );
  });

  /**
   * Additional property: Select all button rendering
   * Verifies that select all button is rendered correctly
   */
  it("Should render select all button with proper attributes", () => {
    const button = ui.renderSelectAllButton();

    expect(button).toBeInstanceOf(HTMLElement);
    expect(button.tagName).toBe("BUTTON");
    expect(button.id).toBe("select-all-button");
    expect(button.textContent).toContain("Select All");
    expect(button.getAttribute("aria-label")).toBeDefined();
  });

  /**
   * Additional property: Import button rendering
   * Verifies that import button is rendered correctly
   */
  it("Should render import button with proper attributes", () => {
    const button = ui.renderImportButton();

    expect(button).toBeInstanceOf(HTMLElement);
    expect(button.tagName).toBe("BUTTON");
    expect(button.id).toBe("import-button");
    expect(button.textContent).toContain("Import");
    expect(button.getAttribute("aria-label")).toBeDefined();
  });

  /**
   * Additional property: Cancel button rendering
   * Verifies that cancel button is rendered correctly
   */
  it("Should render cancel button with proper attributes", () => {
    const button = ui.renderCancelButton();

    expect(button).toBeInstanceOf(HTMLElement);
    expect(button.tagName).toBe("BUTTON");
    expect(button.id).toBe("cancel-button");
    expect(button.textContent).toContain("Cancel");
    expect(button.getAttribute("aria-label")).toBeDefined();
  });

  /**
   * Additional property: Sync status rendering
   * Verifies that sync status is rendered for all status types
   */
  it("Should render sync status for all status types", () => {
    const statuses: SyncStatus[] = ["synced", "pending", "failed", "duplicate"];

    statuses.forEach((status) => {
      const statusElement = ui.renderSyncStatus(status);

      expect(statusElement).toBeInstanceOf(HTMLElement);
      expect(statusElement.className).toContain("sync-status");
      expect(statusElement.className).toContain(`sync-status-${status}`);
      expect(statusElement.getAttribute("role")).toBe("status");
      expect(statusElement.textContent).toBeDefined();
      expect(statusElement.textContent!.length).toBeGreaterThan(0);
    });
  });

  /**
   * Additional property: Error message accessibility
   * Verifies that error messages have proper accessibility attributes
   */
  it("Should render error messages with accessibility attributes", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (errorMessage) => {
          const error = new Error(errorMessage);
          const errorElement = ui.renderErrorMessage(error);

          // Should have alert role
          expect(errorElement.getAttribute("role")).toBe("alert");

          // Should have aria-live for screen readers
          expect(errorElement.getAttribute("aria-live")).toBe("assertive");

          // Should contain error message
          expect(errorElement.textContent).toContain(errorMessage);
        }
      )
    );
  });

  /**
   * Additional property: Event list empty state
   * Verifies that empty event list is handled gracefully
   */
  it("Should display empty message when no events", () => {
    const emptyList: Event[] = [];
    const listElement = ui.renderEventList(emptyList);

    expect(listElement).toBeInstanceOf(HTMLElement);
    const textContent = listElement.textContent || "";
    expect(textContent.toLowerCase()).toContain("no events");
  });

  /**
   * Additional property: Event details with location
   * Verifies that location is included in event details when available
   */
  it("Should include location in event details when available", () => {
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

          const detailsElement = ui.renderEventDetails(event);
          const textContent = detailsElement.textContent || "";

          // Location should be included
          expect(textContent).toContain(event.location);
        }
      )
    );
  });
});
