/**
 * Google Event Parser - Comprehensive Unit Tests
 * Tests for parsing Google Calendar API responses into Event objects
 */

import { GoogleEventParserImpl } from "../../src/components/GoogleEventParser";
import type { GoogleRawEventData } from "../../src/types/google";

describe("GoogleEventParser - Unit Tests", () => {
  let parser: GoogleEventParserImpl;

  beforeEach(() => {
    parser = new GoogleEventParserImpl();
    jest.clearAllMocks();
  });

  describe("Event Parsing", () => {
    it("should construct parser instance", () => {
      expect(parser).toBeDefined();
    });

    it("should parse basic event with required fields", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Team Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.id).toBe("event-1");
      expect(event.title).toBe("Team Meeting");
      expect(event.description).toBe("");
      expect(event.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(event.endTime).toEqual(new Date("2024-01-15T11:00:00Z"));
      expect(event.isAllDay).toBe(false);
    });

    it("should parse event with all optional fields", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Important Meeting",
        description: "Quarterly review meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        location: "Conference Room A",
        organizer: {
          email: "organizer@example.com",
          displayName: "John Doe"
        },
        attendees: [
          { email: "attendee1@example.com" },
          { email: "attendee2@example.com" }
        ],
        colorId: "1",
        updated: "2024-01-14T08:00:00Z"
      };

      const event = parser.parseEvent(rawData);

      expect(event.description).toBe("Quarterly review meeting");
      expect(event.location).toBe("Conference Room A");
      expect(event.organizer).toBe("organizer@example.com");
      expect(event.attendees).toHaveLength(2);
      expect(event.categories).toContain("color-1");
    });

    it("should parse all-day event correctly", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "All Day Event",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.isAllDay).toBe(true);
      // All-day events should have time set to 00:00:00 local time
      expect(event.startTime.getHours()).toBe(0);
      expect(event.startTime.getMinutes()).toBe(0);
    });

    it("should parse event with recurrence rule", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence).toBeDefined();
      expect(event.recurrence?.frequency).toBe("weekly");
      expect(event.recurrence?.interval).toBe(1);
    });

    it("should parse event with recurrence until date", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=DAILY;UNTIL=20240301T000000Z"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence).toBeDefined();
      expect(event.recurrence?.endDate).toEqual(new Date("2024-03-01T00:00:00Z"));
    });

    it("should parse multiple events", () => {
      const rawDataArray: GoogleRawEventData[] = [
        {
          id: "event-1",
          summary: "Meeting 1",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        },
        {
          id: "event-2",
          summary: "Meeting 2",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" }
        }
      ];

      const events = parser.parseEvents(rawDataArray);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe("Meeting 1");
      expect(events[1].title).toBe("Meeting 2");
    });

    it("should handle event without title by using default", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.title).toBe("Untitled Event");
    });

    it("should handle event with missing optional fields", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Simple Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.description).toBe("");
      expect(event.location).toBeUndefined();
      expect(event.organizer).toBeUndefined();
      expect(event.attendees).toBeUndefined();
    });
  });

  describe("Validation", () => {
    it("should validate event with all required fields", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Valid Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(rawData)).not.toThrow();
    });

    it("should throw error for event without id", () => {
      const rawData = {
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have an id");
    });

    it("should throw error for event without summary", () => {
      const rawData = {
        id: "event-1",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have a summary");
    });

    it("should throw error for event without start time", () => {
      const rawData = {
        id: "event-1",
        summary: "Event",
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have a start time");
    });

    it("should throw error for event without end time", () => {
      const rawData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(rawData)).toThrow("Event must have an end time");
    });

    it("should throw error for cancelled event", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Cancelled Event",
        status: "cancelled",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(rawData)).toThrow("Event is cancelled");
    });

    it("should allow confirmed and tentative events", () => {
      const confirmedData: GoogleRawEventData = {
        id: "event-1",
        summary: "Confirmed Event",
        status: "confirmed",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(confirmedData)).not.toThrow();

      const tentativeData: GoogleRawEventData = {
        id: "event-2",
        summary: "Tentative Event",
        status: "tentative",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(tentativeData)).not.toThrow();
    });
  });

  describe("Date Time Parsing", () => {
    it("should parse ISO 8601 datetime strings", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:30:45Z" },
        end: { dateTime: "2024-01-15T11:30:45Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.startTime.getHours()).toBe(10);
      expect(event.startTime.getMinutes()).toBe(30);
      expect(event.startTime.getSeconds()).toBe(45);
    });

    it("should parse date-only strings for all-day events", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "All Day Event",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.startTime.getFullYear()).toBe(2024);
      expect(event.startTime.getMonth()).toBe(0); // January
      expect(event.startTime.getDate()).toBe(15);
    });

    it("should handle datetime with timezone offset", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00+09:00" },
        end: { dateTime: "2024-01-15T11:00:00+09:00" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.startTime).toBeDefined();
      expect(event.endTime).toBeDefined();
    });

    it("should parse updated timestamp correctly", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        updated: "2024-01-14T08:30:00Z"
      };

      const event = parser.parseEvent(rawData);

      expect(event.lastModified).toEqual(new Date("2024-01-14T08:30:00Z"));
    });
  });

  describe("Recurrence Parsing", () => {
    it("should parse daily recurrence", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Daily Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=DAILY"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence?.frequency).toBe("daily");
    });

    it("should parse weekly recurrence with interval", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Bi-weekly Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=WEEKLY;INTERVAL=2"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence?.frequency).toBe("weekly");
      expect(event.recurrence?.interval).toBe(2);
    });

    it("should parse monthly recurrence", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Monthly Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=MONTHLY"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence?.frequency).toBe("monthly");
    });

    it("should parse yearly recurrence", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Yearly Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=YEARLY"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence?.frequency).toBe("yearly");
    });

    it("should ignore non-RRULE recurrence strings", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["EXDATE:20240115T100000Z"]
      };

      const event = parser.parseEvent(rawData);

      expect(event.recurrence).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid datetime format", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "invalid-date" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.parseEvent(rawData)).toThrow();
    });

    it("should throw error for non-object event data", () => {
      expect(() => parser.validateEventData(null)).toThrow("Event data must be an object");
      expect(() => parser.validateEventData(undefined)).toThrow("Event data must be an object");
      expect(() => parser.validateEventData("string")).toThrow("Event data must be an object");
    });

    it("should handle parsing errors gracefully", () => {
      const invalidArray = [{ invalid: "data" }] as unknown as GoogleRawEventData[];

      expect(() => parser.parseEvents(invalidArray)).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle event with very long title", () => {
      const longTitle = "A".repeat(1000);
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: longTitle,
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.title).toBe(longTitle);
    });

    it("should handle event with special characters in title", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Meeting with <special> & \"characters\"",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(rawData);

      expect(event.title).toContain("special");
    });

    it("should handle event with many attendees", () => {
      const attendees = Array.from({ length: 100 }, (_, i) => ({
        email: `attendee${i}@example.com`
      }));

      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Large Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        attendees
      };

      const event = parser.parseEvent(rawData);

      expect(event.attendees).toHaveLength(100);
    });

    it("should parse empty events array", () => {
      const events = parser.parseEvents([]);
      expect(events).toEqual([]);
    });
  });
});
