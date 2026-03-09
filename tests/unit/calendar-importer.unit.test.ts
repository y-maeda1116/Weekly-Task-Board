/**
 * Calendar Importer - Comprehensive Unit Tests
 * Tests for date validation, selection management, and import orchestration
 */

import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { OutlookConnector, EventParser, EventSerializer, SyncEngine } from "../../src/components/interfaces";
import { Event, RawEventData } from "../../src/types/index";

describe("CalendarImporter - Unit Tests", () => {
  let importer: CalendarImporterImpl;
  let mockOutlookConnector: jest.Mocked<OutlookConnector>;
  let mockEventParser: jest.Mocked<EventParser>;
  let mockEventSerializer: jest.Mocked<EventSerializer>;
  let mockSyncEngine: jest.Mocked<SyncEngine>;

  beforeEach(() => {
    mockOutlookConnector = {
      initiateOAuthFlow: jest.fn(),
      handleOAuthCallback: jest.fn(),
      disconnectAccount: jest.fn(),
      isAuthenticated: jest.fn().mockReturnValue(true),
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeAccessToken: jest.fn(),
      getEvents: jest.fn(),
      getEventDetails: jest.fn()
    } as any;

    mockEventParser = {
      parseEvent: jest.fn(),
      parseEvents: jest.fn(),
      validateEventData: jest.fn()
    } as any;

    mockEventSerializer = {
      eventToTask: jest.fn(),
      eventsToTasks: jest.fn(),
      taskToEvent: jest.fn()
    } as any;

    mockSyncEngine = {
      recordSync: jest.fn(),
      getSyncMapping: jest.fn(),
      detectDuplicates: jest.fn().mockResolvedValue([]),
      retryWithBackoff: jest.fn()
    } as any;

    importer = new CalendarImporterImpl(
      mockOutlookConnector,
      mockEventParser,
      mockEventSerializer,
      mockSyncEngine
    );
  });

  describe("Date Range Management", () => {
    it("should set date range", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-20");

      importer.setDateRange(startDate, endDate);

      const state = importer.getUIState();
      expect(state.dateRange.startDate).toEqual(startDate);
      expect(state.dateRange.endDate).toEqual(endDate);
    });

    it("should initialize with today's date range", () => {
      const state = importer.getUIState();

      expect(state.dateRange.startDate).toBeDefined();
      expect(state.dateRange.endDate).toBeDefined();
      expect(state.dateRange.startDate.getDate()).toBeLessThanOrEqual(state.dateRange.endDate.getDate());
    });

    it("should validate valid date range", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-20");

      const isValid = importer.validateDateRange(startDate, endDate);

      expect(isValid).toBe(true);
    });

    it("should reject invalid date range (start after end)", () => {
      const startDate = new Date("2024-01-20");
      const endDate = new Date("2024-01-15");

      const isValid = importer.validateDateRange(startDate, endDate);

      expect(isValid).toBe(false);
    });

    it("should accept same start and end date", () => {
      const date = new Date("2024-01-15");

      const isValid = importer.validateDateRange(date, date);

      expect(isValid).toBe(true);
    });

    it("should handle very large date ranges", () => {
      const startDate = new Date("2000-01-01");
      const endDate = new Date("2099-12-31");

      const isValid = importer.validateDateRange(startDate, endDate);

      expect(isValid).toBe(true);
    });

    it("should handle date range with time components", () => {
      const startDate = new Date("2024-01-15T10:30:00Z");
      const endDate = new Date("2024-01-20T14:45:00Z");

      const isValid = importer.validateDateRange(startDate, endDate);

      expect(isValid).toBe(true);
    });
  });

  describe("Event Fetching", () => {
    it("should fetch events for valid date range", async () => {
      const mockRawEvents: RawEventData[] = [
        {
          id: "event1",
          subject: "Meeting",
          bodyPreview: "Description",
          start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
          end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
        }
      ];

      const mockEvents: Event[] = [
        {
          id: "event1",
          title: "Meeting",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      mockOutlookConnector.getEvents.mockResolvedValue(mockRawEvents);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Meeting");
      expect(mockOutlookConnector.getEvents).toHaveBeenCalled();
    });

    it("should return empty array when no events found", async () => {
      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue([]);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      const events = await importer.fetchEvents();

      expect(events).toEqual([]);
    });

    it("should throw error for invalid date range", async () => {
      importer.setDateRange(new Date("2024-01-20"), new Date("2024-01-15"));

      await expect(importer.fetchEvents()).rejects.toThrow();
    });

    it("should handle API errors gracefully", async () => {
      mockOutlookConnector.getEvents.mockRejectedValue(new Error("API Error"));

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));

      await expect(importer.fetchEvents()).rejects.toThrow();
    });

    it("should handle parsing errors", async () => {
      mockOutlookConnector.getEvents.mockResolvedValue([{ id: "event1" } as any]);
      mockEventParser.parseEvents.mockImplementation(() => {
        throw new Error("Parse error");
      });

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));

      await expect(importer.fetchEvents()).rejects.toThrow();
    });

    it("should fetch large number of events", async () => {
      const mockRawEvents: RawEventData[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `event${i}`,
        subject: `Meeting ${i}`,
        bodyPreview: "Description",
        start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" }
      }));

      const mockEvents: Event[] = mockRawEvents.map(raw => ({
        id: raw.id,
        title: raw.subject,
        description: raw.bodyPreview,
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      mockOutlookConnector.getEvents.mockResolvedValue(mockRawEvents);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(1000);
    });
  });

  describe("Event Selection", () => {
    beforeEach(async () => {
      const mockEvents: Event[] = [
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

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();
    });

    it("should select event", () => {
      importer.selectEvent("event1");

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe("event1");
    });

    it("should deselect event", () => {
      importer.selectEvent("event1");
      importer.deselectEvent("event1");

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(0);
    });

    it("should select multiple events", () => {
      importer.selectEvent("event1");
      importer.selectEvent("event2");

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
    });

    it("should handle selecting same event twice", () => {
      importer.selectEvent("event1");
      importer.selectEvent("event1");

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
    });

    it("should handle deselecting non-selected event", () => {
      importer.deselectEvent("event1");

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(0);
    });

    it("should preserve selection state", () => {
      importer.selectEvent("event1");

      let selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);

      importer.selectEvent("event2");

      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
    });

    it("should return correct selected events", () => {
      importer.selectEvent("event1");

      const selected = importer.getSelectedEvents();
      expect(selected[0].title).toBe("Meeting 1");
    });
  });

  describe("Import Process", () => {
    beforeEach(async () => {
      const mockEvents: Event[] = [
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

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();
    });

    it("should import selected events", async () => {
      importer.selectEvent("event1");

      mockEventSerializer.eventToTask.mockReturnValue({
        id: "task1",
        title: "Meeting 1",
        description: "Description",
        dueDate: new Date("2024-01-15T11:00:00Z"),
        status: "pending" as any,
        priority: "medium" as any,
        tags: [],
        metadata: {}
      });

      mockSyncEngine.recordSync.mockResolvedValue(undefined);

      const result = await importer.importSelectedEvents();

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockEventSerializer.eventToTask).toHaveBeenCalled();
      expect(mockSyncEngine.recordSync).toHaveBeenCalled();
    });

    it("should handle import with no selected events", async () => {
      const result = await importer.importSelectedEvents();

      expect(result.importedCount).toBe(0);
    });

    it("should detect duplicates during import", async () => {
      importer.selectEvent("event1");

      mockSyncEngine.detectDuplicates.mockResolvedValue([
        {
          outlookEventId: "event1",
          taskId: "task1",
          event: {} as any,
          task: {} as any,
          syncMapping: {} as any
        }
      ]);

      const result = await importer.importSelectedEvents();

      expect(result.duplicateCount).toBe(1);
      expect(result.importedCount).toBe(0);
    });

    it("should handle import errors gracefully", async () => {
      importer.selectEvent("event1");

      mockEventSerializer.eventToTask.mockImplementation(() => {
        throw new Error("Serialization error");
      });

      const result = await importer.importSelectedEvents();

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it("should handle partial import failures", async () => {
      const mockEvents: Event[] = [
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

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();

      importer.selectEvent("event1");
      importer.selectEvent("event2");

      let callCount = 0;
      mockEventSerializer.eventToTask.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            id: "task1",
            title: "Meeting 1",
            description: "Description",
            dueDate: new Date("2024-01-15T11:00:00Z"),
            status: "pending" as any,
            priority: "medium" as any,
            tags: [],
            metadata: {}
          };
        }
        throw new Error("Serialization error");
      });

      const result = await importer.importSelectedEvents();

      expect(result.importedCount).toBeGreaterThan(0);
      expect(result.failedCount).toBeGreaterThan(0);
    });
  });

  describe("UI State Management", () => {
    it("should return current UI state", () => {
      const state = importer.getUIState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.selectedEvents).toBeDefined();
      expect(state.dateRange).toBeDefined();
      expect(state.events).toBeDefined();
    });

    it("should reflect authentication status", () => {
      mockOutlookConnector.isAuthenticated.mockReturnValue(false);

      const state = importer.getUIState();

      expect(state.isAuthenticated).toBe(false);
    });

    it("should reflect loading state during fetch", async () => {
      const mockEvents: Event[] = [];
      mockOutlookConnector.getEvents.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));

      const fetchPromise = importer.fetchEvents();
      let state = importer.getUIState();
      expect(state.isLoading).toBe(true);

      await fetchPromise;
      state = importer.getUIState();
      expect(state.isLoading).toBe(false);
    });

    it("should include error message in state", async () => {
      importer.setDateRange(new Date("2024-01-20"), new Date("2024-01-15"));

      try {
        await importer.fetchEvents();
      } catch (e) {
        // Expected
      }

      const state = importer.getUIState();
      expect(state.error).toBeDefined();
    });

    it("should include selected events in state", async () => {
      const mockEvents: Event[] = [
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

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();

      importer.selectEvent("event1");

      const state = importer.getUIState();
      expect(state.selectedEvents.has("event1")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large number of events", async () => {
      const mockEvents: Event[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(10000);
    });

    it("should handle rapid selection/deselection", async () => {
      const mockEvents: Event[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();

      for (let i = 0; i < 100; i++) {
        importer.selectEvent(`event${i}`);
        importer.deselectEvent(`event${i}`);
      }

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(0);
    });

    it("should handle concurrent operations", async () => {
      const mockEvents: Event[] = [
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

      mockOutlookConnector.getEvents.mockResolvedValue([]);
      mockEventParser.parseEvents.mockReturnValue(mockEvents);

      importer.setDateRange(new Date("2024-01-15"), new Date("2024-01-20"));
      await importer.fetchEvents();

      importer.selectEvent("event1");

      const state = importer.getUIState();
      expect(state.selectedEvents.has("event1")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle null date range", () => {
      expect(() => importer.setDateRange(null as any, null as any)).toThrow();
    });

    it("should handle undefined date range", () => {
      expect(() => importer.setDateRange(undefined as any, undefined as any)).toThrow();
    });

    it("should handle null event ID in selection", () => {
      expect(() => importer.selectEvent(null as any)).toThrow();
    });

    it("should handle undefined event ID in selection", () => {
      expect(() => importer.selectEvent(undefined as any)).toThrow();
    });
  });
});
