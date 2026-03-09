/**
 * Event Parser - Comprehensive Unit Tests
 * Tests for JSON parsing, validation, timezone handling, and edge cases
 */

import { EventParserImpl } from "../../src/components/EventParser";
import { RawEventData } from "../../src/types/index";

describe("EventParser - Unit Tests", () => {
  let parser: EventParserImpl;

  beforeEach(() => {
    parser = new EventParserImpl();
  });

  describe("Event Parsing", () => {
    it("should parse valid event data", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Team Meeting",
        bodyPreview: "Discuss project status",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        isAllDay: false,
        categories: ["work"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.id).toBe("event1");
      expect(event.title).toBe("Team Meeting");
      expect(event.description).toBe("Discuss project status");
      expect(event.isAllDay).toBe(false);
      expect(event.categories).toContain("work");
    });

    it("should parse event with all optional fields", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        location: { displayName: "Conference Room A" },
        organizer: { emailAddress: { address: "organizer@example.com" } },
        attendees: [
          { emailAddress: { address: "attendee1@example.com" } },
          { emailAddress: { address: "attendee2@example.com" } }
        ],
        isAllDay: false,
        categories: ["work", "important"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.location).toBe("Conference Room A");
      expect(event.organizer).toBe("organizer@example.com");
      expect(event.attendees).toHaveLength(2);
      expect(event.attendees).toContain("attendee1@example.com");
    });

    it("should handle missing optional fields", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.location).toBeUndefined();
      expect(event.organizer).toBeUndefined();
      expect(event.attendees).toEqual([]);
    });

    it("should use default title for missing subject", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.title).toBe("Untitled Event");
    });

    it("should parse multiple events", () => {
      const rawDataArray: RawEventData[] = [
        {
          id: "event1",
          subject: "Meeting 1",
          bodyPreview: "Description 1",
          start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
        },
        {
          id: "event2",
          subject: "Meeting 2",
          bodyPreview: "Description 2",
          start: { dateTime: "2024-01-15T14:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-15T15:00:00Z", timeZone: "UTC" }
        }
      ];

      const events = parser.parseEvents(rawDataArray);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe("Meeting 1");
      expect(events[1].title).toBe("Meeting 2");
    });

    it("should handle empty event array", () => {
      const events = parser.parseEvents([]);
      expect(events).toEqual([]);
    });
  });

  describe("Validation", () => {
    it("should validate event with all required fields", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(parser.validateEventData(rawData)).toBe(true);
    });

    it("should throw error for missing id", () => {
      const rawData: any = {
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have an id");
    });

    it("should throw error for missing subject", () => {
      const rawData: any = {
        id: "event1",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have a subject");
    });

    it("should throw error for missing start time", () => {
      const rawData: any = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have a start time");
    });

    it("should throw error for missing end time", () => {
      const rawData: any = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have an end time");
    });

    it("should throw error for non-object data", () => {
      expect(() => parser.validateEventData("not an object")).toThrow("Event data must be an object");
      expect(() => parser.validateEventData(null)).toThrow("Event data must be an object");
      expect(() => parser.validateEventData(undefined)).toThrow("Event data must be an object");
    });

    it("should throw error for missing dateTime in start", () => {
      const rawData: any = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have a start time");
    });
  });

  describe("DateTime Parsing", () => {
    it("should parse ISO 8601 datetime correctly", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:30:45Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:30:45Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.startTime.getFullYear()).toBe(2024);
      expect(event.startTime.getMonth()).toBe(0); // January
      expect(event.startTime.getDate()).toBe(15);
      expect(event.startTime.getHours()).toBe(10);
      expect(event.startTime.getMinutes()).toBe(30);
    });

    it("should handle different timezone formats", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00+05:00", timeZone: "Asia/Kolkata" },
        end: { dateTime: "2024-01-15T11:00:00+05:00", timeZone: "Asia/Kolkata" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.startTime).toBeDefined();
      expect(event.endTime).toBeDefined();
    });

    it("should throw error for invalid datetime format", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "invalid-date", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      expect(() => parser.parseEvent(rawData)).toThrow();
    });

    it("should handle all-day events", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "All Day Event",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T00:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-16T00:00:00Z", timeZone: "UTC" },
        isAllDay: true
      };

      const event = parser.parseEvent(rawData);
      expect(event.isAllDay).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle event with very long title", () => {
      const longTitle = "A".repeat(1000);
      const rawData: RawEventData = {
        id: "event1",
        subject: longTitle,
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.title).toBe(longTitle);
    });

    it("should handle event with very long description", () => {
      const longDescription = "B".repeat(5000);
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: longDescription,
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.description).toBe(longDescription);
    });

    it("should handle event with many attendees", () => {
      const attendees = Array.from({ length: 100 }, (_, i) => ({
        emailAddress: { address: `attendee${i}@example.com` }
      }));

      const rawData: RawEventData = {
        id: "event1",
        subject: "Large Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        attendees: attendees as any
      };

      const event = parser.parseEvent(rawData);
      expect(event.attendees).toHaveLength(100);
    });

    it("should handle event with special characters in title", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting: Q&A <Special> \"Chars\" 'Test'",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.title).toContain("Q&A");
      expect(event.title).toContain("<Special>");
    });

    it("should handle event with unicode characters", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "会議 🎉 Réunion",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.title).toContain("会議");
      expect(event.title).toContain("🎉");
    });

    it("should handle event with null attendees", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        attendees: null as any
      };

      const event = parser.parseEvent(rawData);
      expect(event.attendees).toEqual([]);
    });

    it("should handle event with attendees missing email", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        attendees: [
          { emailAddress: { address: "valid@example.com" } },
          { emailAddress: null as any },
          { emailAddress: { address: "another@example.com" } }
        ] as any
      };

      const event = parser.parseEvent(rawData);
      expect(event.attendees).toHaveLength(2);
      expect(event.attendees).toContain("valid@example.com");
    });

    it("should handle event with same start and end time", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Instant Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.startTime.getTime()).toBe(event.endTime.getTime());
    });

    it("should handle event with end time before start time", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Invalid Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" }
      };

      const event = parser.parseEvent(rawData);
      expect(event.startTime.getTime()).toBeGreaterThan(event.endTime.getTime());
    });
  });

  describe("Error Handling", () => {
    it("should throw descriptive error for invalid event", () => {
      const rawData: any = {
        id: "event1"
      };

      expect(() => parser.parseEvent(rawData)).toThrow("Failed to parse event");
    });

    it("should handle parsing error in event array", () => {
      const rawDataArray: any[] = [
        {
          id: "event1",
          subject: "Valid Event",
          bodyPreview: "Description",
          start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
        },
        {
          id: "event2"
          // Missing required fields
        }
      ];

      expect(() => parser.parseEvents(rawDataArray)).toThrow();
    });

    it("should handle null raw data", () => {
      expect(() => parser.parseEvent(null as any)).toThrow();
    });

    it("should handle undefined raw data", () => {
      expect(() => parser.parseEvent(undefined as any)).toThrow();
    });
  });

  describe("Roundtrip Validation", () => {
    it("should preserve event data through parse cycle", () => {
      const rawData: RawEventData = {
        id: "event1",
        subject: "Meeting",
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
        location: { displayName: "Room A" },
        isAllDay: false,
        categories: ["work"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.id).toBe(rawData.id);
      expect(event.title).toBe(rawData.subject);
      expect(event.description).toBe(rawData.bodyPreview);
      expect(event.location).toBe(rawData.location?.displayName);
      expect(event.isAllDay).toBe(rawData.isAllDay);
      expect(event.categories).toEqual(rawData.categories);
    });
  });
});
