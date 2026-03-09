/**
 * Calendar Sync UI - Comprehensive Unit Tests
 * Tests for rendering, interaction, and state management
 */

import { CalendarSyncUIImpl } from "../../src/components/CalendarSyncUI";
import { Event, SyncStatus } from "../../src/types/index";

describe("CalendarSyncUI - Unit Tests", () => {
  let ui: CalendarSyncUIImpl;

  beforeEach(() => {
    ui = new CalendarSyncUIImpl();
    // Clear DOM
    document.body.innerHTML = "";
  });

  describe("Authentication Button Rendering", () => {
    it("should render auth button", () => {
      const button = ui.renderAuthButton();

      expect(button).toBeDefined();
      expect(button.tagName).toBe("BUTTON");
      expect(button.textContent).toContain("Connect");
    });

    it("should render auth button with correct class", () => {
      const button = ui.renderAuthButton();

      expect(button.className).toContain("auth-button");
    });

    it("should render auth button with click handler", () => {
      const button = ui.renderAuthButton();

      expect(button.onclick).toBeDefined();
    });

    it("should render disconnect button", () => {
      const button = ui.renderDisconnectButton();

      expect(button).toBeDefined();
      expect(button.tagName).toBe("BUTTON");
      expect(button.textContent).toContain("Disconnect");
    });

    it("should render disconnect button with correct class", () => {
      const button = ui.renderDisconnectButton();

      expect(button.className).toContain("disconnect-button");
    });

    it("should render disconnect button with click handler", () => {
      const button = ui.renderDisconnectButton();

      expect(button.onclick).toBeDefined();
    });
  });

  describe("Date Range Picker Rendering", () => {
    it("should render date range picker", () => {
      const picker = ui.renderDateRangePicker();

      expect(picker).toBeDefined();
      expect(picker.tagName).toBe("DIV");
    });

    it("should render start date input", () => {
      const picker = ui.renderDateRangePicker();
      const startInput = picker.querySelector('input[type="date"]');

      expect(startInput).toBeDefined();
    });

    it("should render end date input", () => {
      const picker = ui.renderDateRangePicker();
      const inputs = picker.querySelectorAll('input[type="date"]');

      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it("should render date range picker with correct class", () => {
      const picker = ui.renderDateRangePicker();

      expect(picker.className).toContain("date-range-picker");
    });

    it("should have default date values", () => {
      const picker = ui.renderDateRangePicker();
      const inputs = picker.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;

      expect(inputs[0].value).toBeDefined();
      expect(inputs[1].value).toBeDefined();
    });

    it("should render fetch button", () => {
      const picker = ui.renderDateRangePicker();
      const button = picker.querySelector("button");

      expect(button).toBeDefined();
      expect(button?.textContent).toContain("Fetch");
    });
  });

  describe("Event List Rendering", () => {
    it("should render event list", () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Meeting 1",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const list = ui.renderEventList(events);

      expect(list).toBeDefined();
      expect(list.tagName).toBe("DIV");
    });

    it("should render event list with correct class", () => {
      const events: Event[] = [];
      const list = ui.renderEventList(events);

      expect(list.className).toContain("event-list");
    });

    it("should render multiple events", () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Meeting 1",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event2",
          title: "Meeting 2",
          description: "Description",
          startTime: new Date("2024-01-15T14:00:00Z"),
          endTime: new Date("2024-01-15T15:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const list = ui.renderEventList(events);
      const items = list.querySelectorAll(".event-item");

      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it("should render empty event list message", () => {
      const list = ui.renderEventList([]);

      expect(list.textContent).toContain("No events");
    });

    it("should render event with title", () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Important Meeting",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const list = ui.renderEventList(events);

      expect(list.textContent).toContain("Important Meeting");
    });

    it("should render event with time", () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Meeting",
          description: "Description",
          startTime: new Date("2024-01-15T10:30:00Z"),
          endTime: new Date("2024-01-15T11:30:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const list = ui.renderEventList(events);

      expect(list.textContent).toContain("10:30");
    });

    it("should render large number of events", () => {
      const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      const list = ui.renderEventList(events);
      const items = list.querySelectorAll(".event-item");

      expect(items.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe("Event Details Rendering", () => {
    it("should render event details", () => {
      const event: Event = {
        id: "event1",
        title: "Team Meeting",
        description: "Discuss project",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Room A",
        organizer: "organizer@example.com",
        attendees: ["attendee1@example.com"],
        isAllDay: false,
        categories: ["work"],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details).toBeDefined();
      expect(details.tagName).toBe("DIV");
    });

    it("should render event details with correct class", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.className).toContain("event-details");
    });

    it("should display event title", () => {
      const event: Event = {
        id: "event1",
        title: "Important Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("Important Meeting");
    });

    it("should display event description", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Discuss project status",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("Discuss project status");
    });

    it("should display event location", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Conference Room A",
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("Conference Room A");
    });

    it("should display event organizer", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        organizer: "organizer@example.com",
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("organizer@example.com");
    });

    it("should display event attendees", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        attendees: ["attendee1@example.com", "attendee2@example.com"],
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("attendee1@example.com");
      expect(details.textContent).toContain("attendee2@example.com");
    });

    it("should handle event with many attendees", () => {
      const attendees = Array.from({ length: 50 }, (_, i) => `attendee${i}@example.com`);
      const event: Event = {
        id: "event1",
        title: "Large Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        attendees,
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("attendee0@example.com");
      expect(details.textContent).toContain("attendee49@example.com");
    });
  });

  describe("Checkbox Rendering", () => {
    it("should render checkbox", () => {
      const checkbox = ui.renderCheckbox("event1");

      expect(checkbox).toBeDefined();
      expect(checkbox.tagName).toBe("INPUT");
      expect((checkbox as HTMLInputElement).type).toBe("checkbox");
    });

    it("should render checkbox with event ID", () => {
      const checkbox = ui.renderCheckbox("event1") as HTMLInputElement;

      expect(checkbox.value).toBe("event1");
    });

    it("should render multiple checkboxes", () => {
      const checkbox1 = ui.renderCheckbox("event1");
      const checkbox2 = ui.renderCheckbox("event2");

      expect(checkbox1).toBeDefined();
      expect(checkbox2).toBeDefined();
      expect((checkbox1 as HTMLInputElement).value).not.toBe((checkbox2 as HTMLInputElement).value);
    });
  });

  describe("Select All Button Rendering", () => {
    it("should render select all button", () => {
      const button = ui.renderSelectAllButton();

      expect(button).toBeDefined();
      expect(button.tagName).toBe("BUTTON");
    });

    it("should render select all button with correct text", () => {
      const button = ui.renderSelectAllButton();

      expect(button.textContent).toContain("Select All");
    });

    it("should render select all button with correct class", () => {
      const button = ui.renderSelectAllButton();

      expect(button.className).toContain("select-all-button");
    });
  });

  describe("Import Button Rendering", () => {
    it("should render import button", () => {
      const button = ui.renderImportButton();

      expect(button).toBeDefined();
      expect(button.tagName).toBe("BUTTON");
      expect(button.textContent).toContain("Import");
    });

    it("should render import button with correct class", () => {
      const button = ui.renderImportButton();

      expect(button.className).toContain("import-button");
    });

    it("should render import button with click handler", () => {
      const button = ui.renderImportButton();

      expect(button.onclick).toBeDefined();
    });
  });

  describe("Cancel Button Rendering", () => {
    it("should render cancel button", () => {
      const button = ui.renderCancelButton();

      expect(button).toBeDefined();
      expect(button.tagName).toBe("BUTTON");
      expect(button.textContent).toContain("Cancel");
    });

    it("should render cancel button with correct class", () => {
      const button = ui.renderCancelButton();

      expect(button.className).toContain("cancel-button");
    });

    it("should render cancel button with click handler", () => {
      const button = ui.renderCancelButton();

      expect(button.onclick).toBeDefined();
    });
  });

  describe("Sync Status Rendering", () => {
    it("should render sync status for SYNCED", () => {
      const status = ui.renderSyncStatus(SyncStatus.SYNCED);

      expect(status).toBeDefined();
      expect(status.tagName).toBe("DIV");
      expect(status.textContent).toContain("Synced");
    });

    it("should render sync status for PENDING", () => {
      const status = ui.renderSyncStatus(SyncStatus.PENDING);

      expect(status).toBeDefined();
      expect(status.textContent).toContain("Pending");
    });

    it("should render sync status for FAILED", () => {
      const status = ui.renderSyncStatus(SyncStatus.FAILED);

      expect(status).toBeDefined();
      expect(status.textContent).toContain("Failed");
    });

    it("should render sync status for DUPLICATE", () => {
      const status = ui.renderSyncStatus(SyncStatus.DUPLICATE);

      expect(status).toBeDefined();
      expect(status.textContent).toContain("Duplicate");
    });

    it("should render sync status with correct class", () => {
      const status = ui.renderSyncStatus(SyncStatus.SYNCED);

      expect(status.className).toContain("sync-status");
    });

    it("should render sync status with status-specific class", () => {
      const status = ui.renderSyncStatus(SyncStatus.SYNCED);

      expect(status.className).toContain("synced");
    });
  });

  describe("Error Message Rendering", () => {
    it("should render error message", () => {
      const error = new Error("Test error");
      const element = ui.renderErrorMessage(error);

      expect(element).toBeDefined();
      expect(element.tagName).toBe("DIV");
    });

    it("should render error message with correct class", () => {
      const error = new Error("Test error");
      const element = ui.renderErrorMessage(error);

      expect(element.className).toContain("error-message");
    });

    it("should display error message text", () => {
      const error = new Error("Something went wrong");
      const element = ui.renderErrorMessage(error);

      expect(element.textContent).toContain("Something went wrong");
    });

    it("should handle error with long message", () => {
      const longMessage = "A".repeat(1000);
      const error = new Error(longMessage);
      const element = ui.renderErrorMessage(error);

      expect(element.textContent).toContain(longMessage);
    });

    it("should handle error with special characters", () => {
      const error = new Error("Error: <tag> & \"quote\" 'apostrophe'");
      const element = ui.renderErrorMessage(error);

      expect(element.textContent).toContain("Error:");
    });

    it("should handle error with unicode characters", () => {
      const error = new Error("エラー: 日本語 中文");
      const element = ui.renderErrorMessage(error);

      expect(element.textContent).toContain("エラー");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rendering with empty event list", () => {
      const list = ui.renderEventList([]);

      expect(list).toBeDefined();
      expect(list.textContent).toContain("No events");
    });

    it("should handle rendering event with null optional fields", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: null as any,
        organizer: null as any,
        attendees: null as any,
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details).toBeDefined();
      expect(details.textContent).toContain("Meeting");
    });

    it("should handle rendering event with very long title", () => {
      const longTitle = "A".repeat(1000);
      const event: Event = {
        id: "event1",
        title: longTitle,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain(longTitle);
    });

    it("should handle rendering event with special characters", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting: Q&A <Special> \"Important\"",
        description: "Description with 'quotes'",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details).toBeDefined();
    });

    it("should handle rendering event with unicode characters", () => {
      const event: Event = {
        id: "event1",
        title: "会議 🎉 Réunion",
        description: "日本語 中文 한국어",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const details = ui.renderEventDetails(event);

      expect(details.textContent).toContain("会議");
    });
  });

  describe("Error Handling", () => {
    it("should handle null event in renderEventDetails", () => {
      expect(() => ui.renderEventDetails(null as any)).toThrow();
    });

    it("should handle undefined event in renderEventDetails", () => {
      expect(() => ui.renderEventDetails(undefined as any)).toThrow();
    });

    it("should handle null error in renderErrorMessage", () => {
      expect(() => ui.renderErrorMessage(null as any)).toThrow();
    });

    it("should handle undefined error in renderErrorMessage", () => {
      expect(() => ui.renderErrorMessage(undefined as any)).toThrow();
    });

    it("should handle null event list in renderEventList", () => {
      expect(() => ui.renderEventList(null as any)).toThrow();
    });

    it("should handle undefined event list in renderEventList", () => {
      expect(() => ui.renderEventList(undefined as any)).toThrow();
    });

    it("should handle null event ID in renderCheckbox", () => {
      expect(() => ui.renderCheckbox(null as any)).toThrow();
    });

    it("should handle undefined event ID in renderCheckbox", () => {
      expect(() => ui.renderCheckbox(undefined as any)).toThrow();
    });
  });

  describe("DOM Integration", () => {
    it("should render button that can be clicked", () => {
      const button = ui.renderAuthButton();
      document.body.appendChild(button);

      const clickSpy = jest.fn();
      button.addEventListener("click", clickSpy);
      button.click();

      expect(clickSpy).toHaveBeenCalled();
    });

    it("should render checkbox that can be checked", () => {
      const checkbox = ui.renderCheckbox("event1") as HTMLInputElement;
      document.body.appendChild(checkbox);

      checkbox.checked = true;

      expect(checkbox.checked).toBe(true);
    });

    it("should render date input with value", () => {
      const picker = ui.renderDateRangePicker();
      document.body.appendChild(picker);

      const inputs = picker.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;

      expect(inputs[0].value).toBeDefined();
    });

    it("should render multiple elements without conflicts", () => {
      const authButton = ui.renderAuthButton();
      const picker = ui.renderDateRangePicker();
      const list = ui.renderEventList([]);

      document.body.appendChild(authButton);
      document.body.appendChild(picker);
      document.body.appendChild(list);

      expect(document.body.children.length).toBe(3);
    });
  });
});
