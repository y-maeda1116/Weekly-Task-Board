/**
 * Event Printer - Comprehensive Unit Tests
 * Tests for formatting, timezone handling, and various output formats
 */

import { EventPrinterImpl } from "../../src/components/EventPrinter";
import { Event } from "../../src/types/index";

describe("EventPrinter - Unit Tests", () => {
  let printer: EventPrinterImpl;

  beforeEach(() => {
    printer = new EventPrinterImpl();
  });

  describe("Single Event Formatting", () => {
    it("should format event as one-line summary", () => {
      const event: Event = {
        id: "event1",
        title: "Team Meeting",
        description: "Discuss project",
        startTime: new Date("2024-01-15T10:30:00Z"),
        endTime: new Date("2024-01-15T11:30:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("Team Meeting");
      expect(formatted).toContain("10:30");
      expect(formatted).toContain("11:30");
      expect(formatted).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
    });

    it("should format event with leading zeros for time", () => {
      const event: Event = {
        id: "event1",
        title: "Early Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T09:05:00Z"),
        endTime: new Date("2024-01-15T09:45:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("09:05");
      expect(formatted).toContain("09:45");
    });

    it("should handle midnight times", () => {
      const event: Event = {
        id: "event1",
        title: "Midnight Event",
        description: "Description",
        startTime: new Date("2024-01-15T00:00:00Z"),
        endTime: new Date("2024-01-15T01:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("00:00");
      expect(formatted).toContain("01:00");
    });

    it("should handle end-of-day times", () => {
      const event: Event = {
        id: "event1",
        title: "End of Day",
        description: "Description",
        startTime: new Date("2024-01-15T23:00:00Z"),
        endTime: new Date("2024-01-15T23:59:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("23:00");
      expect(formatted).toContain("23:59");
    });

    it("should handle event with special characters in title", () => {
      const event: Event = {
        id: "event1",
        title: "Q&A: Special <Meeting> \"Important\"",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("Q&A");
      expect(formatted).toContain("Special");
    });

    it("should handle event with unicode characters", () => {
      const event: Event = {
        id: "event1",
        title: "会議 🎉 Réunion",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("会議");
      expect(formatted).toContain("🎉");
    });

    it("should handle very long event title", () => {
      const longTitle = "A".repeat(500);
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

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain(longTitle);
    });
  });

  describe("Event List Formatting", () => {
    it("should format multiple events as numbered list", () => {
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

      const formatted = printer.formatEventList(events);

      expect(formatted).toContain("1. Meeting 1");
      expect(formatted).toContain("2. Meeting 2");
      expect(formatted).toContain("10:00");
      expect(formatted).toContain("14:00");
    });

    it("should return message for empty event list", () => {
      const formatted = printer.formatEventList([]);
      expect(formatted).toBe("No events found");
    });

    it("should format large number of events", () => {
      const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date(`2024-01-15T${10 + (i % 8)}:00:00Z`),
        endTime: new Date(`2024-01-15T${11 + (i % 8)}:00:00Z`),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      const formatted = printer.formatEventList(events);

      expect(formatted).toContain("1. Meeting 0");
      expect(formatted).toContain("100. Meeting 99");
      expect(formatted.split("\n")).toHaveLength(100);
    });

    it("should preserve order of events in list", () => {
      const events: Event[] = [
        {
          id: "event3",
          title: "Third",
          description: "Description",
          startTime: new Date("2024-01-15T15:00:00Z"),
          endTime: new Date("2024-01-15T16:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event1",
          title: "First",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event2",
          title: "Second",
          description: "Description",
          startTime: new Date("2024-01-15T12:00:00Z"),
          endTime: new Date("2024-01-15T13:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const formatted = printer.formatEventList(events);
      const lines = formatted.split("\n");

      expect(lines[0]).toContain("Third");
      expect(lines[1]).toContain("First");
      expect(lines[2]).toContain("Second");
    });
  });

  describe("Event Details Formatting", () => {
    it("should format event details with all fields", () => {
      const event: Event = {
        id: "event1",
        title: "Team Meeting",
        description: "Discuss project status",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Conference Room A",
        organizer: "organizer@example.com",
        attendees: ["attendee1@example.com", "attendee2@example.com"],
        isAllDay: false,
        categories: ["work"],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Title: Team Meeting");
      expect(formatted).toContain("Start:");
      expect(formatted).toContain("End:");
      expect(formatted).toContain("Location: Conference Room A");
      expect(formatted).toContain("Description: Discuss project status");
      expect(formatted).toContain("Organizer: organizer@example.com");
      expect(formatted).toContain("Attendees:");
      expect(formatted).toContain("attendee1@example.com");
      expect(formatted).toContain("attendee2@example.com");
    });

    it("should format event details without optional fields", () => {
      const event: Event = {
        id: "event1",
        title: "Simple Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Title: Simple Meeting");
      expect(formatted).toContain("Start:");
      expect(formatted).toContain("End:");
      expect(formatted).not.toContain("Location:");
      expect(formatted).not.toContain("Organizer:");
      expect(formatted).not.toContain("Attendees:");
    });

    it("should include all-day flag when true", () => {
      const event: Event = {
        id: "event1",
        title: "All Day Event",
        description: "Description",
        startTime: new Date("2024-01-15T00:00:00Z"),
        endTime: new Date("2024-01-16T00:00:00Z"),
        isAllDay: true,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("All-day event: Yes");
    });

    it("should not include all-day flag when false", () => {
      const event: Event = {
        id: "event1",
        title: "Regular Event",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).not.toContain("All-day event");
    });

    it("should format date and time in readable format", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:30:00Z"),
        endTime: new Date("2024-01-15T11:30:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toMatch(/Jan 15, 2024 10:30/);
      expect(formatted).toMatch(/Jan 15, 2024 11:30/);
    });

    it("should handle event with many attendees", () => {
      const attendees = Array.from({ length: 20 }, (_, i) => `attendee${i}@example.com`);
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

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Attendees:");
      for (let i = 0; i < 20; i++) {
        expect(formatted).toContain(`attendee${i}@example.com`);
      }
    });

    it("should handle event with very long description", () => {
      const longDescription = "B".repeat(1000);
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: longDescription,
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain(longDescription);
    });

    it("should handle event with special characters in description", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description with <tags> & \"quotes\" and 'apostrophes'",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("<tags>");
      expect(formatted).toContain("&");
      expect(formatted).toContain("quotes");
    });
  });

  describe("Timezone Handling", () => {
    it("should format times in UTC", () => {
      const event: Event = {
        id: "event1",
        title: "UTC Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("10:00");
      expect(formatted).toContain("11:00");
    });

    it("should handle different date formats", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-12-31T23:00:00Z"),
        endTime: new Date("2025-01-01T00:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Dec 31, 2024");
      expect(formatted).toContain("Jan 1, 2025");
    });

    it("should handle leap year dates", () => {
      const event: Event = {
        id: "event1",
        title: "Leap Day Event",
        description: "Description",
        startTime: new Date("2024-02-29T10:00:00Z"),
        endTime: new Date("2024-02-29T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Feb 29, 2024");
    });
  });

  describe("Edge Cases", () => {
    it("should handle event with empty title", () => {
      const event: Event = {
        id: "event1",
        title: "",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("10:00");
      expect(formatted).toContain("11:00");
    });

    it("should handle event with empty description", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Title: Meeting");
      expect(formatted).not.toContain("Description:");
    });

    it("should handle event with same start and end time", () => {
      const sameTime = new Date("2024-01-15T10:00:00Z");
      const event: Event = {
        id: "event1",
        title: "Instant Event",
        description: "Description",
        startTime: sameTime,
        endTime: sameTime,
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("10:00 - 10:00");
    });

    it("should handle event with end time before start time", () => {
      const event: Event = {
        id: "event1",
        title: "Invalid Event",
        description: "Description",
        startTime: new Date("2024-01-15T11:00:00Z"),
        endTime: new Date("2024-01-15T10:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const formatted = printer.formatEvent(event);

      expect(formatted).toContain("11:00 - 10:00");
    });

    it("should handle event with null optional fields", () => {
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

      const formatted = printer.formatEventDetails(event);

      expect(formatted).toContain("Title: Meeting");
      expect(formatted).not.toContain("Location:");
      expect(formatted).not.toContain("Organizer:");
      expect(formatted).not.toContain("Attendees:");
    });
  });

  describe("Error Handling", () => {
    it("should handle null event", () => {
      expect(() => printer.formatEvent(null as any)).toThrow();
    });

    it("should handle undefined event", () => {
      expect(() => printer.formatEvent(undefined as any)).toThrow();
    });

    it("should handle event with invalid date", () => {
      const event: any = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: "invalid-date",
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      expect(() => printer.formatEvent(event)).toThrow();
    });

    it("should handle null event list", () => {
      expect(() => printer.formatEventList(null as any)).toThrow();
    });

    it("should handle undefined event list", () => {
      expect(() => printer.formatEventList(undefined as any)).toThrow();
    });
  });
});
