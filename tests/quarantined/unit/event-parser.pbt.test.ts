/**
 * Event Parser - Property-Based Tests
 * Tests for event parsing, validation, and round-trip conversion
 * 
 * **Validates: Requirements 2, 8**
 */

import { EventParserImpl } from "../../src/components/EventParser";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { RawEventData, Event } from "../../src/types/index";

describe("EventParser - Property-Based Tests", () => {
  let parser: EventParserImpl;

  beforeEach(() => {
    parser = new EventParserImpl();
  });

  describe("Property 5: Event Data Completeness", () => {
    it("should parse all required fields from Outlook API response", () => {
      const rawEvent: RawEventData = {
        id: "event-123",
        subject: "Team Meeting",
        bodyPreview: "Discuss Q4 plans",
        start: {
          dateTime: "2024-01-15T10:00:00Z",
          timeZone: "UTC"
        },
        end: {
          dateTime: "2024-01-15T11:00:00Z",
          timeZone: "UTC"
        },
        isAllDay: false,
        lastModifiedDateTime: "2024-01-10T15:30:00Z"
      };

      const event = parser.parseEvent(rawEvent);

      // Verify all required fields are present
      expect(event.id).toBe("event-123");
      expect(event.title).toBe("Team Meeting");
      expect(event.description).toBe("Discuss Q4 plans");
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
      expect(event.isAllDay).toBe(false);
      expect(event.lastModified).toBeInstanceOf(Date);
    });

    it("should include optional fields when present", () => {
      const rawEvent: RawEventData = {
        id: "event-456",
        subject: "Conference",
        bodyPreview: "Annual conference",
        start: {
          dateTime: "2024-02-20T09:00:00Z",
          timeZone: "UTC"
        },
        end: {
          dateTime: "2024-02-20T17:00:00Z",
          timeZone: "UTC"
        },
        location: {
          displayName: "Convention Center"
        },
        organizer: {
          emailAddress: {
            address: "organizer@example.com"
          }
        },
        attendees: [
          {
            emailAddress: {
              address: "attendee1@example.com"
            }
          },
          {
            emailAddress: {
              address: "attendee2@example.com"
            }
          }
        ],
        categories: ["work", "important"],
        isAllDay: false
      };

      const event = parser.parseEvent(rawEvent);

      expect(event.location).toBe("Convention Center");
      expect(event.organizer).toBe("organizer@example.com");
      expect(event.attendees).toEqual(["attendee1@example.com", "attendee2@example.com"]);
      expect(event.categories).toEqual(["work", "important"]);
    });

    it("should provide default values for missing optional fields", () => {
      const rawEvent: RawEventData = {
        id: "event-789",
        subject: "Simple Event",
        bodyPreview: "",
        start: {
          dateTime: "2024-03-01T14:00:00Z",
          timeZone: "UTC"
        },
        end: {
          dateTime: "2024-03-01T15:00:00Z",
          timeZone: "UTC"
        },
        isAllDay: false
      };

      const event = parser.parseEvent(rawEvent);

      expect(event.location).toBeUndefined();
      expect(event.organizer).toBeUndefined();
      expect(event.attendees).toEqual([]);
      expect(event.categories).toEqual([]);
    });
  });

  describe("Property 6: Empty Event List Handling", () => {
    it("should return empty array for empty event list without error", () => {
      const emptyList: RawEventData[] = [];

      const events = parser.parseEvents(emptyList);

      expect(events).toEqual([]);
      expect(Array.isArray(events)).toBe(true);
    });

    it("should handle multiple events in a batch", () => {
      const rawEvents: RawEventData[] = [
        {
          id: "event-1",
          subject: "Event 1",
          bodyPreview: "Description 1",
          start: { dateTime: "2024-01-01T10:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-01T11:00:00Z", timeZone: "UTC" },
          isAllDay: false
        },
        {
          id: "event-2",
          subject: "Event 2",
          bodyPreview: "Description 2",
          start: { dateTime: "2024-01-02T10:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-02T11:00:00Z", timeZone: "UTC" },
          isAllDay: false
        }
      ];

      const events = parser.parseEvents(rawEvents);

      expect(events).toHaveLength(2);
      expect(events[0].id).toBe("event-1");
      expect(events[1].id).toBe("event-2");
    });
  });

  describe("Property 19: Event Parse Round-Trip", () => {
    it("should preserve all data through parse -> serialize -> parse cycle", () => {
      const serializer = new EventSerializerImpl();
      
      const originalRawEvent: RawEventData = {
        id: "event-roundtrip",
        subject: "Round Trip Test",
        bodyPreview: "Testing round trip conversion",
        start: {
          dateTime: "2024-04-15T09:00:00Z",
          timeZone: "UTC"
        },
        end: {
          dateTime: "2024-04-15T10:30:00Z",
          timeZone: "UTC"
        },
        location: {
          displayName: "Meeting Room A"
        },
        organizer: {
          emailAddress: {
            address: "organizer@company.com"
          }
        },
        attendees: [
          {
            emailAddress: {
              address: "attendee@company.com"
            }
          }
        ],
        categories: ["meeting", "important"],
        isAllDay: false,
        lastModifiedDateTime: "2024-04-10T14:00:00Z"
      };

      // Parse: JSON -> Event
      const parsedEvent = parser.parseEvent(originalRawEvent);

      // Serialize: Event -> Task
      const task = serializer.eventToTask(parsedEvent);

      // Parse back: Task -> Event
      const reparsedEvent = serializer.taskToEvent(task);

      // Verify key data is preserved
      expect(reparsedEvent.id).toBe(parsedEvent.id);
      expect(reparsedEvent.title).toBe(parsedEvent.title);
      expect(reparsedEvent.description).toBe(parsedEvent.description);
      expect(reparsedEvent.location).toBe(parsedEvent.location);
      expect(reparsedEvent.organizer).toBe(parsedEvent.organizer);
      expect(reparsedEvent.isAllDay).toBe(parsedEvent.isAllDay);
      
      // Verify times are preserved (allowing for minor precision differences)
      expect(Math.abs(reparsedEvent.startTime.getTime() - parsedEvent.startTime.getTime())).toBeLessThan(1000);
      expect(Math.abs(reparsedEvent.endTime.getTime() - parsedEvent.endTime.getTime())).toBeLessThan(1000);
    });

    it("should handle all-day events in round-trip conversion", () => {
      const serializer = new EventSerializerImpl();
      
      const allDayEvent: RawEventData = {
        id: "all-day-event",
        subject: "All Day Event",
        bodyPreview: "This is an all-day event",
        start: {
          dateTime: "2024-05-20T00:00:00Z",
          timeZone: "UTC"
        },
        end: {
          dateTime: "2024-05-21T00:00:00Z",
          timeZone: "UTC"
        },
        isAllDay: true
      };

      const parsedEvent = parser.parseEvent(allDayEvent);
      const task = serializer.eventToTask(parsedEvent);
      const reparsedEvent = serializer.taskToEvent(task);

      expect(reparsedEvent.isAllDay).toBe(true);
      expect(reparsedEvent.title).toBe("All Day Event");
    });
  });

  describe("Event Validation", () => {
    it("should throw error for missing id", () => {
      const invalidEvent: RawEventData = {
        subject: "No ID Event",
        bodyPreview: "Missing ID",
        start: { dateTime: "2024-01-01T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-01T11:00:00Z", timeZone: "UTC" },
        isAllDay: false
      };

      expect(() => parser.parseEvent(invalidEvent)).toThrow();
    });

    it("should throw error for missing subject", () => {
      const invalidEvent: RawEventData = {
        id: "event-no-subject",
        bodyPreview: "No subject",
        start: { dateTime: "2024-01-01T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-01T11:00:00Z", timeZone: "UTC" },
        isAllDay: false
      };

      expect(() => parser.parseEvent(invalidEvent)).toThrow();
    });

    it("should throw error for missing start time", () => {
      const invalidEvent: RawEventData = {
        id: "event-no-start",
        subject: "No Start Time",
        bodyPreview: "Missing start",
        end: { dateTime: "2024-01-01T11:00:00Z", timeZone: "UTC" },
        isAllDay: false
      };

      expect(() => parser.parseEvent(invalidEvent)).toThrow();
    });

    it("should throw error for missing end time", () => {
      const invalidEvent: RawEventData = {
        id: "event-no-end",
        subject: "No End Time",
        bodyPreview: "Missing end",
        start: { dateTime: "2024-01-01T10:00:00Z", timeZone: "UTC" },
        isAllDay: false
      };

      expect(() => parser.parseEvent(invalidEvent)).toThrow();
    });

    it("should throw error for invalid date format", () => {
      const invalidEvent: RawEventData = {
        id: "event-bad-date",
        subject: "Bad Date",
        bodyPreview: "Invalid date",
        start: { dateTime: "not-a-date", timeZone: "UTC" },
        end: { dateTime: "2024-01-01T11:00:00Z", timeZone: "UTC" },
        isAllDay: false
      };

      expect(() => parser.parseEvent(invalidEvent)).toThrow();
    });
  });
});
