/**
 * Google Event Parser - Property-Based Tests
 * Tests for parsing validation, date handling, and recurrence parsing
 *
 * **Validates: Requirements 2, 8**
 */

import { GoogleEventParserImpl } from "../../src/components/GoogleEventParser";
import type { GoogleRawEventData } from "../../src/types/google";

describe("GoogleEventParser - Property-Based Tests", () => {
  let parser: GoogleEventParserImpl;

  beforeEach(() => {
    parser = new GoogleEventParserImpl();
  });

  describe("Property 1: Required Field Validation", () => {
    it("should always require event id for valid event", () => {
      const eventWithoutId: GoogleRawEventData = {
        summary: "Test Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(eventWithoutId)).toThrow("Event must have an id");
    });

    it("should always require summary for valid event", () => {
      const eventWithoutSummary: GoogleRawEventData = {
        id: "event-1",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(eventWithoutSummary)).toThrow("Event must have a summary");
    });

    it("should always require start time for valid event", () => {
      const eventWithoutStart: GoogleRawEventData = {
        id: "event-1",
        summary: "Test Event",
        end: { dateTime: "2024-01-15T11:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(eventWithoutStart)).toThrow("Event must have a start time");
    });

    it("should always require end time for valid event", () => {
      const eventWithoutEnd: GoogleRawEventData = {
        id: "event-1",
        summary: "Test Event",
        start: { dateTime: "2024-01-15T10:00:00Z" }
      } as GoogleRawEventData;

      expect(() => parser.validateEventData(eventWithoutEnd)).toThrow("Event must have an end time");
    });
  });

  describe("Property 2: All-Day Event Detection", () => {
    it("should detect all-day events by presence of date field", () => {
      const allDayEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "All Day Event",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" }
      };

      const event = parser.parseEvent(allDayEvent);
      expect(event.isAllDay).toBe(true);
    });

    it("should detect timed events by presence of dateTime field", () => {
      const timedEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Timed Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(timedEvent);
      expect(event.isAllDay).toBe(false);
    });

    it("should set midnight time for all-day events", () => {
      const allDayEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "All Day Event",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" }
      };

      const event = parser.parseEvent(allDayEvent);

      expect(event.startTime.getHours()).toBe(0);
      expect(event.startTime.getMinutes()).toBe(0);
      expect(event.startTime.getSeconds()).toBe(0);
    });
  });

  describe("Property 3: Recurrence Rule Parsing", () => {
    it("should parse FREQ parameter from RRULE", () => {
      const rruleEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=WEEKLY"]
      };

      const event = parser.parseEvent(rruleEvent);
      expect(event.recurrence?.frequency).toBe("weekly");
    });

    it("should parse INTERVAL parameter from RRULE", () => {
      const rruleEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=WEEKLY;INTERVAL=3"]
      };

      const event = parser.parseEvent(rruleEvent);
      expect(event.recurrence?.interval).toBe(3);
    });

    it("should parse UNTIL parameter from RRULE as Date", () => {
      const rruleEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=DAILY;UNTIL=20240301"]
      };

      const event = parser.parseEvent(rruleEvent);
      expect(event.recurrence?.endDate).toEqual(new Date("2024-03-01"));
    });

    it("should parse UNTIL parameter with full datetime", () => {
      const rruleEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=DAILY;UNTIL=20240301T000000Z"]
      };

      const event = parser.parseEvent(rruleEvent);
      expect(event.recurrence?.endDate).toBeDefined();
    });

    it("should handle RRULE with multiple parameters", () => {
      const rruleEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Recurring Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"]
      };

      const event = parser.parseEvent(rruleEvent);

      expect(event.recurrence?.frequency).toBe("weekly");
      expect(event.recurrence?.interval).toBe(2);
    });

    it("should return undefined recurrence when RRULE is absent", () => {
      const nonRecurringEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "One-time Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(nonRecurringEvent);
      expect(event.recurrence).toBeUndefined();
    });

    it("should ignore EXDATE recurrence entries", () => {
      const eventWithExdate: GoogleRawEventData = {
        id: "event-1",
        summary: "Event with Exception",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: ["EXDATE:20240115T100000Z"]
      };

      const event = parser.parseEvent(eventWithExdate);
      expect(event.recurrence).toBeUndefined();
    });
  });

  describe("Property 4: Event Status Handling", () => {
    it("should reject cancelled events", () => {
      const cancelledEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Cancelled Event",
        status: "cancelled",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(cancelledEvent)).toThrow("Event is cancelled");
    });

    it("should accept confirmed events", () => {
      const confirmedEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Confirmed Event",
        status: "confirmed",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(confirmedEvent)).not.toThrow();
    });

    it("should accept tentative events", () => {
      const tentativeEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Tentative Event",
        status: "tentative",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(tentativeEvent)).not.toThrow();
    });

    it("should accept events without status", () => {
      const eventWithoutStatus: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      expect(() => parser.validateEventData(eventWithoutStatus)).not.toThrow();
    });
  });

  describe("Property 5: Date Format Handling", () => {
    it("should parse ISO 8601 datetime format correctly", () => {
      const isoDateTimeEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "ISO DateTime Event",
        start: { dateTime: "2024-01-15T10:30:45.123Z" },
        end: { dateTime: "2024-01-15T11:30:45.123Z" }
      };

      const event = parser.parseEvent(isoDateTimeEvent);

      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
      expect(event.startTime.getTime()).toBeGreaterThan(0);
    });

    it("should parse date-only format (YYYY-MM-DD) for all-day events", () => {
      const dateOnlyEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "Date Only Event",
        start: { date: "2024-12-31" },
        end: { date: "2025-01-01" }
      };

      const event = parser.parseEvent(dateOnlyEvent);

      expect(event.startTime.getFullYear()).toBe(2024);
      expect(event.startTime.getMonth()).toBe(11); // December is 11
      expect(event.startTime.getDate()).toBe(31);
    });

    it("should parse datetime with timezone offset", () => {
      const tzOffsetEvent: GoogleRawEventData = {
        id: "event-1",
        summary: "TZ Offset Event",
        start: { dateTime: "2024-01-15T10:00:00+09:00" },
        end: { dateTime: "2024-01-15T11:00:00+09:00" }
      };

      const event = parser.parseEvent(tzOffsetEvent);

      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
    });
  });

  describe("Property 6: Optional Field Handling", () => {
    it("should handle missing description", () => {
      const eventWithoutDescription: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutDescription);
      expect(event.description).toBe("");
    });

    it("should handle missing location", () => {
      const eventWithoutLocation: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutLocation);
      expect(event.location).toBeUndefined();
    });

    it("should handle missing organizer", () => {
      const eventWithoutOrganizer: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutOrganizer);
      expect(event.organizer).toBeUndefined();
    });

    it("should handle missing attendees", () => {
      const eventWithoutAttendees: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutAttendees);
      expect(event.attendees).toBeUndefined();
    });

    it("should handle missing colorId", () => {
      const eventWithoutColor: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutColor);
      expect(event.categories).toEqual([]);
    });

    it("should include colorId in categories when present", () => {
      const eventWithColor: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        colorId: "5"
      };

      const event = parser.parseEvent(eventWithColor);
      expect(event.categories).toContain("color-5");
    });
  });

  describe("Property 7: Attendee List Processing", () => {
    it("should extract attendee email addresses", () => {
      const eventWithAttendees: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        attendees: [
          { email: "attendee1@example.com" },
          { email: "attendee2@example.com" }
        ]
      };

      const event = parser.parseEvent(eventWithAttendees);
      expect(event.attendees).toEqual(["attendee1@example.com", "attendee2@example.com"]);
    });

    it("should filter out attendees with empty email", () => {
      const eventWithInvalidAttendees: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        attendees: [
          { email: "valid@example.com" },
          { email: "" },
          { displayName: "No Email" }
        ]
      };

      const event = parser.parseEvent(eventWithInvalidAttendees);
      expect(event.attendees).toEqual(["valid@example.com"]);
    });
  });

  describe("Property 8: Raw Data Preservation", () => {
    it("should preserve original raw data in parsed event", () => {
      const rawData: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        customField: "custom value"
      };

      const event = parser.parseEvent(rawData);
      expect(event.rawData).toBeDefined();
      expect(event.rawData?.customField).toBe("custom value");
    });
  });

  describe("Property 9: Updated Timestamp", () => {
    it("should use current date when updated timestamp is missing", () => {
      const eventWithoutUpdated: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const event = parser.parseEvent(eventWithoutUpdated);
      expect(event.lastModified).toBeInstanceOf(Date);
    });

    it("should parse updated timestamp when present", () => {
      const updatedTimestamp = "2024-01-14T08:30:00Z";
      const eventWithUpdated: GoogleRawEventData = {
        id: "event-1",
        summary: "Event",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        updated: updatedTimestamp
      };

      const event = parser.parseEvent(eventWithUpdated);
      expect(event.lastModified).toEqual(new Date(updatedTimestamp));
    });
  });

  describe("Property 10: Batch Event Parsing", () => {
    it("should parse multiple events consistently", () => {
      const eventsData: GoogleRawEventData[] = [
        {
          id: "event-1",
          summary: "Event 1",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        },
        {
          id: "event-2",
          summary: "Event 2",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" }
        },
        {
          id: "event-3",
          summary: "Event 3",
          start: { dateTime: "2024-01-17T09:00:00Z" },
          end: { dateTime: "2024-01-17T10:00:00Z" }
        }
      ];

      const events = parser.parseEvents(eventsData);

      expect(events).toHaveLength(3);
      expect(events[0].id).toBe("event-1");
      expect(events[1].id).toBe("event-2");
      expect(events[2].id).toBe("event-3");
    });

    it("should return empty array for empty input", () => {
      const events = parser.parseEvents([]);
      expect(events).toEqual([]);
    });
  });
});
