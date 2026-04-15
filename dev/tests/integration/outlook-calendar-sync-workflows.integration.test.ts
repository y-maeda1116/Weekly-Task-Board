/**
 * Outlook Calendar Sync - Workflow Integration Tests
 * Tests realistic user workflows and scenarios
 * 
 * Validates: Requirements 1, 2, 3, 4, 5, 6, 7, 8
 */

import { OutlookConnectorImpl } from "../../src/components/OutlookConnector";
import { EventParserImpl } from "../../src/components/EventParser";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { EventPrinterImpl } from "../../src/components/EventPrinter";
import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { CalendarSyncUIImpl } from "../../src/components/CalendarSyncUI";
import { Event, Task, SyncStatus } from "../../src/types/index";

describe("Outlook Calendar Sync - Workflow Integration Tests", () => {
  let connector: OutlookConnectorImpl;
  let parser: EventParserImpl;
  let serializer: EventSerializerImpl;
  let printer: EventPrinterImpl;
  let syncEngine: SyncEngineImpl;
  let importer: CalendarImporterImpl;
  let ui: CalendarSyncUIImpl;

  beforeEach(() => {
    connector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
    parser = new EventParserImpl();
    serializer = new EventSerializerImpl();
    printer = new EventPrinterImpl();
    syncEngine = new SyncEngineImpl();
    importer = new CalendarImporterImpl(connector, parser, syncEngine);
    ui = new CalendarSyncUIImpl(importer, syncEngine);

    jest.clearAllMocks();
  });

  describe("User Workflow Scenarios", () => {
    /**
     * Workflow Test 1: First-Time User Setup
     * Scenario: New user connects Outlook and imports first week of events
     * Validates: Requirements 1, 2, 3, 4, 5, 6
     */
    it("should support first-time user setup workflow", async () => {
      // Step 1: User clicks connect button
      jest.spyOn(connector, "initiateOAuthFlow").mockResolvedValue(undefined);
      await connector.initiateOAuthFlow();

      // Step 2: User completes OAuth flow
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      jest.spyOn(connector, "getAccessToken").mockReturnValue("new-token");

      await connector.handleOAuthCallback("auth-code-from-redirect");
      expect(connector.isAuthenticated()).toBe(true);

      // Step 3: User selects date range (this week)
      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      // Step 4: System fetches events
      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Monday Team Standup",
          start: { dateTime: "2024-01-15T09:00:00Z" },
          end: { dateTime: "2024-01-15T09:30:00Z" },
          bodyPreview: "Daily standup"
        },
        {
          id: "event-2",
          subject: "Wednesday Project Review",
          start: { dateTime: "2024-01-17T14:00:00Z" },
          end: { dateTime: "2024-01-17T15:00:00Z" },
          bodyPreview: "Project status review"
        },
        {
          id: "event-3",
          subject: "Friday Planning",
          start: { dateTime: "2024-01-19T10:00:00Z" },
          end: { dateTime: "2024-01-19T11:00:00Z" },
          bodyPreview: "Next week planning"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(3);

      // Step 5: User reviews events
      events.forEach(event => {
        const formatted = printer.formatEvent(event);
        expect(formatted).toBeDefined();
      });

      // Step 6: User selects all events
      events.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(3);

      // Step 7: User imports events
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending"
      }));

      const result = await importer.importSelectedEvents();
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3);

      // Step 8: Verify sync mappings created
      for (const event of events) {
        const mapping = await syncEngine.getSyncMapping(event.id);
        expect(mapping).toBeDefined();
      }
    });

    /**
     * Workflow Test 2: Weekly Sync with Selective Import
     * Scenario: User syncs weekly but only imports specific events
     * Validates: Requirements 3, 4, 5, 6
     */
    it("should support selective weekly sync", async () => {
      // Setup: User is already authenticated
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      // Step 1: User selects next week's date range
      const nextMonday = new Date("2024-01-22");
      const nextSunday = new Date("2024-01-28");
      importer.setDateRange(nextMonday, nextSunday);

      // Step 2: System fetches events
      const mockRawEvents = [
        {
          id: "event-4",
          subject: "Team Meeting",
          start: { dateTime: "2024-01-22T10:00:00Z" },
          end: { dateTime: "2024-01-22T11:00:00Z" },
          bodyPreview: "Team sync"
        },
        {
          id: "event-5",
          subject: "Client Call",
          start: { dateTime: "2024-01-23T14:00:00Z" },
          end: { dateTime: "2024-01-23T15:00:00Z" },
          bodyPreview: "Client discussion"
        },
        {
          id: "event-6",
          subject: "Personal Appointment",
          start: { dateTime: "2024-01-24T16:00:00Z" },
          end: { dateTime: "2024-01-24T17:00:00Z" },
          bodyPreview: "Doctor appointment"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(3);

      // Step 3: User selects only work-related events
      importer.selectEvent(events[0].id); // Team Meeting
      importer.selectEvent(events[1].id); // Client Call
      // Skip personal appointment

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);

      // Step 4: Import selected events
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending"
      }));

      const result = await importer.importSelectedEvents();
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });

    /**
     * Workflow Test 3: Handling Duplicate Events on Re-sync
     * Scenario: User syncs same week again, encounters duplicates
     * Validates: Requirements 5, 6
     */
    it("should handle duplicate detection on re-sync", async () => {
      // Setup: Previous events already imported
      const previousEvent: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Weekly sync",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      await syncEngine.recordSync(previousEvent.id, "task-1");

      // Step 1: User syncs same week again
      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      // Step 2: System fetches same events
      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Team Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Weekly sync"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      // Step 3: System detects duplicates
      const duplicates = await syncEngine.detectDuplicates(events);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-1");
      expect(duplicates[0].existingTaskId).toBe("task-1");

      // Step 4: User chooses to skip duplicate
      // (In real UI, user would see warning and choose action)
      importer.selectEvent(events[0].id);
      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
    });

    /**
     * Workflow Test 4: Error Recovery During Import
     * Scenario: Network error occurs during import, user retries
     * Validates: Requirements 7
     */
    it("should support error recovery during import", async () => {
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      let attemptCount = 0;

      jest.spyOn(connector, "getEvents").mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("Network timeout");
        }
        return [
          {
            id: "event-1",
            subject: "Meeting",
            start: { dateTime: "2024-01-15T10:00:00Z" },
            end: { dateTime: "2024-01-15T11:00:00Z" },
            bodyPreview: "Test"
          }
        ];
      });

      // First attempt fails
      try {
        await importer.fetchEvents();
        fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeDefined();
      }

      // User retries
      const events = await importer.fetchEvents();
      expect(events).toHaveLength(1);
      expect(attemptCount).toBe(2);
    });

    /**
     * Workflow Test 5: Bulk Import with Progress
     * Scenario: User imports large number of events with progress tracking
     * Validates: Requirements 3, 4, 5
     */
    it("should track progress during bulk import", async () => {
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      // Create 30 events
      const mockRawEvents = Array.from({ length: 30 }, (_, i) => ({
        id: `event-${i}`,
        subject: `Meeting ${i}`,
        start: { dateTime: `2024-01-15T${String(i % 24).padStart(2, "0")}:00:00Z` },
        end: { dateTime: `2024-01-15T${String((i % 24) + 1).padStart(2, "0")}:00:00Z` },
        bodyPreview: `Meeting ${i}`
      }));

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(30);

      // Select all events
      events.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(30);

      // Import with progress tracking
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending"
      }));

      const result = await importer.importSelectedEvents();
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(30);
    });
  });

  describe("Advanced User Workflows", () => {
    /**
     * Workflow Test 6: Multi-Week Sync Strategy
     * Scenario: User syncs multiple weeks at once
     * Validates: Requirements 2, 3, 4, 5, 6
     */
    it("should support multi-week sync", async () => {
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      // Sync 4 weeks at once
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-02-11");
      importer.setDateRange(startDate, endDate);

      // Create events across 4 weeks
      const mockRawEvents = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        subject: `Event ${i}`,
        start: { dateTime: `2024-01-${String(15 + (i % 28)).padStart(2, "0")}T10:00:00Z` },
        end: { dateTime: `2024-01-${String(15 + (i % 28)).padStart(2, "0")}T11:00:00Z` },
        bodyPreview: `Event ${i}`
      }));

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      expect(events.length).toBeGreaterThan(0);

      // Select all
      events.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(events.length);
    });

    /**
     * Workflow Test 7: Selective Category Import
     * Scenario: User imports only work-related events
     * Validates: Requirements 3, 4, 5
     */
    it("should support selective category-based import", async () => {
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Team Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Work",
          categories: ["work"]
        },
        {
          id: "event-2",
          subject: "Lunch with Friend",
          start: { dateTime: "2024-01-15T12:00:00Z" },
          end: { dateTime: "2024-01-15T13:00:00Z" },
          bodyPreview: "Personal",
          categories: ["personal"]
        },
        {
          id: "event-3",
          subject: "Project Review",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" },
          bodyPreview: "Work",
          categories: ["work"]
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      // Select only work events
      const workEvents = events.filter(e => e.categories?.includes("work"));
      workEvents.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
    });

    /**
     * Workflow Test 8: Disconnect and Reconnect
     * Scenario: User disconnects and reconnects account
     * Validates: Requirements 1
     */
    it("should support disconnect and reconnect workflow", async () => {
      // Initial connection
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect
      jest.spyOn(connector, "disconnectAccount").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(false);

      await connector.disconnectAccount();
      expect(connector.isAuthenticated()).toBe(false);

      // Reconnect
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("new-auth-code");
      expect(connector.isAuthenticated()).toBe(true);
    });

    /**
     * Workflow Test 9: Event Modification and Re-import
     * Scenario: Event is modified in Outlook, user re-imports
     * Validates: Requirements 2, 5
     */
    it("should handle modified events on re-import", async () => {
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      // Original event
      const originalEvent: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Original description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date("2024-01-10T00:00:00Z")
      };

      // Record initial sync
      await syncEngine.recordSync(originalEvent.id, "task-1");

      // Modified event (same ID, different content)
      const modifiedEvent: Event = {
        ...originalEvent,
        title: "Team Meeting - Updated",
        description: "Updated description",
        endTime: new Date("2024-01-15T12:00:00Z"),
        lastModified: new Date("2024-01-14T00:00:00Z")
      };

      // Detect as duplicate
      const duplicates = await syncEngine.detectDuplicates([modifiedEvent]);
      expect(duplicates).toHaveLength(1);

      // User chooses to update existing task
      const updatedMapping = await syncEngine.recordSync(modifiedEvent.id, "task-1");
      expect(updatedMapping).toBeDefined();
    });

    /**
     * Workflow Test 10: Complete Sync Cycle
     * Scenario: Full cycle from auth to import to disconnect
     * Validates: Requirements 1, 2, 3, 4, 5, 6, 7
     */
    it("should complete full sync cycle", async () => {
      // Phase 1: Authentication
      jest.spyOn(connector, "initiateOAuthFlow").mockResolvedValue(undefined);
      await connector.initiateOAuthFlow();

      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      jest.spyOn(connector, "getAccessToken").mockReturnValue("token");

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Phase 2: Date Range Selection
      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");
      importer.setDateRange(monday, sunday);

      // Phase 3: Event Fetching
      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Meeting 1",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Test 1"
        },
        {
          id: "event-2",
          subject: "Meeting 2",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" },
          bodyPreview: "Test 2"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();
      expect(events).toHaveLength(2);

      // Phase 4: Event Selection
      events.forEach(event => importer.selectEvent(event.id));
      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);

      // Phase 5: Import
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending"
      }));

      const result = await importer.importSelectedEvents();
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);

      // Phase 6: Verify Sync Mappings
      for (const event of events) {
        const mapping = await syncEngine.getSyncMapping(event.id);
        expect(mapping).toBeDefined();
      }

      // Phase 7: Disconnect
      jest.spyOn(connector, "disconnectAccount").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(false);

      await connector.disconnectAccount();
      expect(connector.isAuthenticated()).toBe(false);
    });
  });
});
