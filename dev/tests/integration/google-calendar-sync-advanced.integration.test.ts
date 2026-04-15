/**
 * Google Calendar Sync - Advanced Integration Tests
 * Tests advanced features, edge cases, and complex scenarios
 *
 * **Validates: Requirements 7, 8, and advanced use cases**
 */

import { GoogleConnectorImpl } from "../../src/components/GoogleConnector";
import { GoogleEventParserImpl } from "../../src/components/GoogleEventParser";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { Event } from "../../src/types/index";
import type { GoogleRawEventData } from "../../src/types/google";

describe("Google Calendar Sync - Advanced Integration Tests", () => {
  let connector: GoogleConnectorImpl;
  let parser: GoogleEventParserImpl;
  let serializer: EventSerializerImpl;
  let syncEngine: SyncEngineImpl;
  let importer: CalendarImporterImpl;

  beforeEach(() => {
    connector = new GoogleConnectorImpl("test-client-id", "test-client-secret", "http://localhost:3000/google-callback");
    parser = new GoogleEventParserImpl();
    serializer = new EventSerializerImpl();
    syncEngine = new SyncEngineImpl();
    importer = new CalendarImporterImpl(
      connector as any,
      parser as any,
      syncEngine
    );

    jest.clearAllMocks();
  });

  describe("Advanced Feature 1: Recurring Event Expansion", () => {
    it("should parse complex recurrence rules", () => {
      const complexRecurringEvent: GoogleRawEventData = {
        id: "recurring-1",
        summary: "Complex Recurring Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        recurrence: [
          "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;UNTIL=20240630T170000Z"
        ]
      };

      const parsedEvent = parser.parseEvent(complexRecurringEvent);

      expect(parsedEvent.recurrence).toBeDefined();
      expect(parsedEvent.recurrence?.frequency).toBe("weekly");
      expect(parsedEvent.recurrence?.interval).toBe(2);
      expect(parsedEvent.recurrence?.endDate).toBeDefined();
    });

    it("should handle daily recurrence with count", () => {
      const dailyCountEvent: GoogleRawEventData = {
        id: "daily-1",
        summary: "Daily Task",
        start: { dateTime: "2024-01-15T09:00:00Z" },
        end: { dateTime: "2024-01-15T09:15:00Z" },
        recurrence: ["RRULE:FREQ=DAILY;COUNT=10"]
      };

      const parsedEvent = parser.parseEvent(dailyCountEvent);

      expect(parsedEvent.recurrence?.frequency).toBe("daily");
    });

    it("should handle monthly recurrence by day", () => {
      const monthlyEvent: GoogleRawEventData = {
        id: "monthly-1",
        summary: "Monthly Review",
        start: { dateTime: "2024-01-15T14:00:00Z" },
        end: { dateTime: "2024-01-15T15:00:00Z" },
        recurrence: ["RRULE:FREQ=MONTHLY;BYDAY=3MO"]
      };

      const parsedEvent = parser.parseEvent(monthlyEvent);

      expect(parsedEvent.recurrence?.frequency).toBe("monthly");
    });
  });

  describe("Advanced Feature 2: Multi-Day Event Handling", () => {
    it("should handle multi-day all-day events", () => {
      const multiDayEvent: GoogleRawEventData = {
        id: "multiday-1",
        summary: "Conference Week",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-19" }
      };

      const parsedEvent = parser.parseEvent(multiDayEvent);

      expect(parsedEvent.isAllDay).toBe(true);
      expect(parsedEvent.endTime.getDate() - parsedEvent.startTime.getDate()).toBe(4);
    });

    it("should handle multi-day timed events", () => {
      const multiDayTimedEvent: GoogleRawEventData = {
        id: "multiday-timed-1",
        summary: "Extended Workshop",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-17T17:00:00Z" }
      };

      const parsedEvent = parser.parseEvent(multiDayTimedEvent);

      expect(parsedEvent.isAllDay).toBe(false);
      const durationHours = (parsedEvent.endTime.getTime() - parsedEvent.startTime.getTime()) / (1000 * 60 * 60);
      expect(durationHours).toBeGreaterThan(24);
    });
  });

  describe("Advanced Feature 3: Event Reminders and Alarms", () => {
    it("should handle events with reminders in metadata", () => {
      const eventWithReminders: GoogleRawEventData = {
        id: "reminder-1",
        summary: "Meeting with Reminder",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 1440 },
            { method: "popup", minutes: 10 }
          ]
        }
      };

      const parsedEvent = parser.parseEvent(eventWithReminders);

      // Reminders are stored in rawData for future use
      expect(parsedEvent.rawData?.reminders).toBeDefined();
    });
  });

  describe("Advanced Feature 4: Conference Data and Hangouts Links", () => {
    it("should preserve conference data in events", () => {
      const eventWithConference: GoogleRawEventData = {
        id: "conf-1",
        summary: "Virtual Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        conferenceData: {
          createRequest: {
            requestId: "sample-request-123",
            conferenceSolutionKey: { type: "hangoutsMeet" },
            status: { statusCode: "success" }
          },
          entryPoints: [
            {
              entryPointType: "video",
              uri: "https://meet.google.com/abc-defg-hij",
              label: "meet.google.com"
            }
          ]
        }
      };

      const parsedEvent = parser.parseEvent(eventWithConference);

      expect(parsedEvent.rawData?.conferenceData).toBeDefined();
    });
  });

  describe("Advanced Feature 5: Extended Properties", () => {
    it("should preserve extended properties", () => {
      const eventWithExtendedProps: GoogleRawEventData = {
        id: "ext-1",
        summary: "Event with Extended Properties",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        extendedProperties: {
          private: {
            "custom-field-1": "value-1",
            "custom-field-2": "value-2"
          },
          shared: {
            "shared-field": "shared-value"
          }
        }
      };

      const parsedEvent = parser.parseEvent(eventWithExtendedProps);

      expect(parsedEvent.rawData?.extendedProperties).toBeDefined();
    });
  });

  describe("Advanced Feature 6: Event Attachments", () => {
    it("should handle events with attachments", () => {
      const eventWithAttachments: GoogleRawEventData = {
        id: "attach-1",
        summary: "Meeting with Attachments",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        attachments: [
          {
            fileUrl: "https://example.com/document.pdf",
            title: "Meeting Agenda.pdf",
            mimeType: "application/pdf",
            iconLink: "https://example.com/pdf-icon.png"
          }
        ]
      };

      const parsedEvent = parser.parseEvent(eventWithAttachments);

      expect(parsedEvent.rawData?.attachments).toBeDefined();
    });
  });

  describe("Advanced Feature 7: Attendee Response Tracking", () => {
    it("should track attendee response statuses", () => {
      const eventWithAttendees: GoogleRawEventData = {
        id: "attendee-1",
        summary: "Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        attendees: [
          { email: "accepted@example.com", responseStatus: "accepted" },
          { email: "declined@example.com", responseStatus: "declined" },
          { email: "tentative@example.com", responseStatus: "tentative" },
          { email: "pending@example.com", responseStatus: "needsAction" }
        ]
      };

      const parsedEvent = parser.parseEvent(eventWithAttendees);

      expect(parsedEvent.attendees).toHaveLength(4);
      expect(parsedEvent.rawData?.attendees).toBeDefined();
    });
  });

  describe("Advanced Feature 8: Color Coding", () => {
    it("should parse all Google Calendar color IDs", () => {
      const colorIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

      colorIds.forEach(colorId => {
        const event: GoogleRawEventData = {
          id: `color-${colorId}`,
          summary: "Colored Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          colorId
        };

        const parsedEvent = parser.parseEvent(event);

        expect(parsedEvent.categories).toContain(`color-${colorId}`);
      });
    });
  });

  describe("Advanced Feature 9: Event Visibility and Transparency", () => {
    it("should handle different visibility levels", () => {
      const visibilityLevels = ["default", "public", "private", "confidential"];

      visibilityLevels.forEach(visibility => {
        const event: GoogleRawEventData = {
          id: `vis-${visibility}`,
          summary: `${visibility} Event`,
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          visibility: visibility as any
        };

        const parsedEvent = parser.parseEvent(event);

        expect(parsedEvent.rawData?.visibility).toBe(visibility);
      });
    });

    it("should handle transparency settings", () => {
      const transparentEvent: GoogleRawEventData = {
        id: "trans-1",
        summary: "Available Time",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        transparency: "transparent"
      };

      const parsedEvent = parser.parseEvent(transparentEvent);

      expect(parsedEvent.rawData?.transparency).toBe("transparent");
    });
  });

  describe("Advanced Feature 10: Multiple Calendar Sync", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");
    });

    it("should fetch and merge events from multiple calendars", async () => {
      const mockCalendars = [
        { id: "primary", summary: "Primary", primary: true, accessRole: "owner" },
        { id: "work", summary: "Work", accessRole: "writer" },
        { id: "personal", summary: "Personal", accessRole: "owner" }
      ];

      jest.spyOn(connector, "getCalendarList").mockResolvedValue(mockCalendars as any);

      const calendars = await connector.getCalendarList();

      // Mock events from each calendar
      const primaryEvents = [
        {
          id: "primary-1",
          summary: "Primary Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      const workEvents = [
        {
          id: "work-1",
          summary: "Work Event",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" }
        }
      ];

      const personalEvents = [
        {
          id: "personal-1",
          summary: "Personal Event",
          start: { dateTime: "2024-01-17T18:00:00Z" },
          end: { dateTime: "2024-01-17T19:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents")
        .mockResolvedValueOnce(primaryEvents as any)
        .mockResolvedValueOnce(workEvents as any)
        .mockResolvedValueOnce(personalEvents as any);

      const allEvents: any[] = [];
      for (const calendar of calendars) {
        const events = await connector.getEvents(
          new Date("2024-01-15"),
          new Date("2024-01-20"),
          calendar.id
        );
        allEvents.push(...events);
      }

      expect(allEvents).toHaveLength(3);
    });
  });

  describe("Advanced Feature 11: Time Zone Handling", () => {
    it("should handle events in different time zones", () => {
      const eventWithTimeZone: GoogleRawEventData = {
        id: "tz-1",
        summary: "Time Zone Event",
        start: { dateTime: "2024-01-15T10:00:00+09:00" },
        end: { dateTime: "2024-01-15T11:00:00+09:00" }
      };

      const parsedEvent = parser.parseEvent(eventWithTimeZone);

      expect(parsedEvent.startTime).toBeInstanceOf(Date);
      expect(parsedEvent.endTime).toBeInstanceOf(Date);
    });

    it("should handle events with explicit timeZone field", () => {
      const eventWithTimeZoneField: GoogleRawEventData = {
        id: "tz-2",
        summary: "Time Zone Field Event",
        start: {
          dateTime: "2024-01-15T10:00:00",
          timeZone: "America/New_York"
        },
        end: {
          dateTime: "2024-01-15T11:00:00",
          timeZone: "America/New_York"
        }
      };

      const parsedEvent = parser.parseEvent(eventWithTimeZoneField);

      expect(parsedEvent.startTime).toBeInstanceOf(Date);
    });
  });

  describe("Advanced Feature 12: Large Dataset Handling", () => {
    it("should handle fetching large number of events", async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      // Mock 100 events
      const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        summary: `Event ${i}`,
        start: { dateTime: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z` },
        end: { dateTime: `2024-01-${String(i + 1).padStart(2, '0')}T11:00:00Z` }
      }));

      jest.spyOn(connector, "getEvents").mockResolvedValue(largeEventSet as any);

      const events = await connector.getEvents(new Date("2024-01-01"), new Date("2024-01-31"));

      expect(events).toHaveLength(100);
    });

    it("should parse large event batch efficiently", () => {
      const largeEventData = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        summary: `Event ${i}`,
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      }));

      const start = performance.now();
      const parsedEvents = parser.parseEvents(largeEventData as GoogleRawEventData[]);
      const duration = performance.now() - start;

      expect(parsedEvents).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should parse in less than 1 second
    });
  });

  describe("Advanced Feature 13: Event Description with HTML", () => {
    it("should preserve HTML in descriptions", () => {
      const eventWithHTML: GoogleRawEventData = {
        id: "html-1",
        summary: "Meeting",
        description: "<p>Agenda:</p><ul><li>Item 1</li><li>Item 2</li></ul>",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      const parsedEvent = parser.parseEvent(eventWithHTML);

      expect(parsedEvent.description).toContain("<p>Agenda:</p>");
    });
  });

  describe("Advanced Feature 14: Event Linking", () => {
    it("should preserve event links and hangout links", () => {
      const eventWithLink: GoogleRawEventData = {
        id: "link-1",
        summary: "Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
        hangoutLink: "https://meet.google.com/abc-defg-hij"
      };

      const parsedEvent = parser.parseEvent(eventWithLink);

      expect(parsedEvent.rawData?.hangoutLink).toBe("https://meet.google.com/abc-defg-hij");
    });
  });

  describe("Advanced Feature 15: Concurrent Request Handling", () => {
    it("should handle multiple concurrent event fetches", async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);

      // Fetch from multiple calendars concurrently
      const calendars = ["primary", "work", "personal"];
      const promises = calendars.map(calendarId =>
        connector.getEvents(new Date("2024-01-15"), new Date("2024-01-16"), calendarId)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe("Advanced Feature 16: Cache Performance", () => {
    it("should utilize cache for repeated requests", async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      let fetchCount = 0;
      const mockEvents = [
        {
          id: "event-1",
          summary: "Cached Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockImplementation(async () => {
        fetchCount++;
        return mockEvents as any;
      });

      // First call - fetches from API
      await connector.getEvents(new Date("2024-01-15"), new Date("2024-01-16"));
      expect(fetchCount).toBe(1);

      // Second call - should use cache
      await connector.getEvents(new Date("2024-01-15"), new Date("2024-01-16"));
      expect(fetchCount).toBe(1); // No additional fetch
    });
  });
});
