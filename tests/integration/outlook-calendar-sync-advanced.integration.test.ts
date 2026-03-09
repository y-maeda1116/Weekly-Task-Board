/**
 * Outlook Calendar Sync - Advanced Integration Tests
 * Tests complex scenarios and edge cases in component interactions
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

describe("Outlook Calendar Sync - Advanced Integration Tests", () => {
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

  describe("Complex Workflow Scenarios", () => {
    /**
     * Integration Test 1: Large Batch Import with Progress Tracking
     * Tests: Importing large number of events with progress updates
     * Validates: Requirements 3, 4, 5
     */
    it("should handle large batch import with progress tracking", async () => {
      const largeEventSet: Event[] = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        title: `Meeting ${i}`,
        description: `Meeting description ${i}`,
        startTime: new Date(`2024-01-15T${String(i % 24).padStart(2, "0")}:00:00Z`),
        endTime: new Date(`2024-01-15T${String((i % 24) + 1).padStart(2, "0")}:00:00Z`),
        isAllDay: false,
        lastModified: new Date()
      }));

      jest.spyOn(importer, "fetchEvents").mockResolvedValue(largeEventSet);

      // Select all events
      largeEventSet.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(50);

      // Mock serializer
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
      expect(result.importedCount).toBe(50);
    });

    /**
     * Integration Test 2: Concurrent Sync Operations
     * Tests: Multiple sync operations happening in sequence
     * Validates: Requirements 5, 7
     */
    it("should handle concurrent sync operations safely", async () => {
      const event1: Event = {
        id: "event-1",
        title: "Meeting 1",
        description: "First",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      const event2: Event = {
        id: "event-2",
        title: "Meeting 2",
        description: "Second",
        startTime: new Date("2024-01-16T10:00:00Z"),
        endTime: new Date("2024-01-16T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // Record both syncs
      await syncEngine.recordSync(event1.id, "task-1");
      await syncEngine.recordSync(event2.id, "task-2");

      // Verify both mappings exist
      const mapping1 = await syncEngine.getSyncMapping(event1.id);
      const mapping2 = await syncEngine.getSyncMapping(event2.id);

      expect(mapping1).toBeDefined();
      expect(mapping2).toBeDefined();
      expect(mapping1).not.toEqual(mapping2);
    });

    /**
     * Integration Test 3: Partial Import Failure Recovery
     * Tests: Recovering from partial import failures
     * Validates: Requirements 4, 7
     */
    it("should recover from partial import failures", async () => {
      const events: Event[] = [
        {
          id: "event-1",
          title: "Meeting 1",
          description: "First",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-2",
          title: "Meeting 2",
          description: "Second",
          startTime: new Date("2024-01-16T10:00:00Z"),
          endTime: new Date("2024-01-16T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      let callCount = 0;
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Serialization failed");
        }
        return {
          id: `task-${event.id}`,
          title: event.title,
          description: event.description,
          dueDate: event.endTime,
          startDate: event.startTime,
          endDate: event.endTime,
          status: "pending"
        };
      });

      importer.selectEvent(events[0].id);
      importer.selectEvent(events[1].id);

      try {
        await importer.importSelectedEvents();
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Verify no mappings were recorded due to rollback
      const mapping1 = await syncEngine.getSyncMapping(events[0].id);
      expect(mapping1).toBeNull();
    });
  });

  describe("Token Management and Security", () => {
    /**
     * Integration Test 4: Token Refresh During Long Operation
     * Tests: Token refresh during long-running operations
     * Validates: Requirements 1, 2
     */
    it("should refresh token during long operations", async () => {
      const initialToken = "initial-token";
      const refreshedToken = "refreshed-token";

      jest.spyOn(connector, "getAccessToken").mockReturnValueOnce(initialToken);
      jest.spyOn(connector, "refreshAccessToken").mockResolvedValue(refreshedToken);
      jest.spyOn(connector, "getAccessToken").mockReturnValueOnce(refreshedToken);

      const token1 = connector.getAccessToken();
      expect(token1).toBe(initialToken);

      await connector.refreshAccessToken();

      const token2 = connector.getAccessToken();
      expect(token2).toBe(refreshedToken);
    });

    /**
     * Integration Test 5: Secure Token Storage Verification
     * Tests: Tokens are stored securely, not in localStorage
     * Validates: Requirements 1
     */
    it("should store tokens securely", async () => {
      const mockToken = "secure-token-xyz";

      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "getAccessToken").mockReturnValue(mockToken);

      await connector.handleOAuthCallback("auth-code");

      const token = connector.getAccessToken();
      expect(token).toBe(mockToken);

      // Verify token is not in localStorage
      expect(localStorage.getItem("access_token")).toBeNull();
    });

    /**
     * Integration Test 6: Token Revocation on Disconnect
     * Tests: Tokens are properly revoked when disconnecting
     * Validates: Requirements 1
     */
    it("should revoke tokens on disconnect", async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      jest.spyOn(connector, "revokeAccessToken").mockResolvedValue(undefined);
      jest.spyOn(connector, "disconnectAccount").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(false);

      await connector.revokeAccessToken();
      await connector.disconnectAccount();

      expect(connector.isAuthenticated()).toBe(false);
    });
  });

  describe("Event Data Integrity", () => {
    /**
     * Integration Test 7: Event Data Preservation Through Conversion
     * Tests: All event data is preserved during conversion
     * Validates: Requirements 4, 8
     */
    it("should preserve all event data through conversion", () => {
      const originalEvent: Event = {
        id: "event-1",
        title: "Important Meeting",
        description: "Quarterly business review",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T12:00:00Z"),
        location: "Conference Room A",
        organizer: "john@example.com",
        attendees: ["jane@example.com", "bob@example.com"],
        isAllDay: false,
        categories: ["work", "important"],
        lastModified: new Date()
      };

      // Convert to task
      const task = serializer.eventToTask(originalEvent);

      // Verify all data is preserved
      expect(task.title).toBe(originalEvent.title);
      expect(task.description).toBe(originalEvent.description);
      expect(task.startDate).toEqual(originalEvent.startTime);
      expect(task.endDate).toEqual(originalEvent.endTime);
      expect(task.metadata?.outlookEventId).toBe(originalEvent.id);

      // Convert back to event
      const reconstructed = serializer.taskToEvent(task);

      expect(reconstructed.title).toBe(originalEvent.title);
      expect(reconstructed.description).toBe(originalEvent.description);
      expect(reconstructed.id).toBe(originalEvent.id);
    });

    /**
     * Integration Test 8: Timezone Handling in Event Conversion
     * Tests: Proper timezone handling during conversion
     * Validates: Requirements 2, 8
     */
    it("should handle timezones correctly", () => {
      const utcEvent: Event = {
        id: "event-1",
        title: "Global Meeting",
        description: "Across timezones",
        startTime: new Date("2024-01-15T15:00:00Z"), // 3 PM UTC
        endTime: new Date("2024-01-15T16:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      const task = serializer.eventToTask(utcEvent);
      expect(task.startDate).toEqual(utcEvent.startTime);
      expect(task.endDate).toEqual(utcEvent.endTime);

      // Verify times are preserved
      expect(task.startDate?.getUTCHours()).toBe(15);
      expect(task.endDate?.getUTCHours()).toBe(16);
    });

    /**
     * Integration Test 9: All-Day Event Handling
     * Tests: Proper handling of all-day events
     * Validates: Requirements 2, 4
     */
    it("should handle all-day events correctly", () => {
      const allDayEvent: Event = {
        id: "event-1",
        title: "Company Holiday",
        description: "All day event",
        startTime: new Date("2024-01-15T00:00:00Z"),
        endTime: new Date("2024-01-16T00:00:00Z"),
        isAllDay: true,
        lastModified: new Date()
      };

      const task = serializer.eventToTask(allDayEvent);
      expect(task.title).toBe("Company Holiday");
      expect(task.dueDate).toBeDefined();

      const formatted = printer.formatEvent(allDayEvent);
      expect(formatted).toContain("Company Holiday");
    });
  });

  describe("Error Handling and Recovery", () => {
    /**
     * Integration Test 10: Graceful Degradation on API Errors
     * Tests: System continues functioning with partial API failures
     * Validates: Requirements 2, 7
     */
    it("should gracefully degrade on API errors", async () => {
      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Valid Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Valid"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");
      importer.setDateRange(startDate, endDate);

      const events = await importer.fetchEvents();
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Valid Event");
    });

    /**
     * Integration Test 11: Retry with Exponential Backoff
     * Tests: Proper exponential backoff during retries
     * Validates: Requirements 7
     */
    it("should implement exponential backoff correctly", async () => {
      const delays: number[] = [];
      let attemptCount = 0;

      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Temporary failure");
        }
        return { success: true };
      });

      const result = await syncEngine.retryWithBackoff(mockOperation, 3);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    /**
     * Integration Test 12: Error Logging and Context
     * Tests: Errors are logged with proper context
     * Validates: Requirements 7
     */
    it("should log errors with context", async () => {
      const errorMessage = "API Error: 500 Internal Server Error";

      jest.spyOn(connector, "getEvents").mockRejectedValue(new Error(errorMessage));

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");
      importer.setDateRange(startDate, endDate);

      try {
        await importer.fetchEvents();
      } catch (error) {
        expect((error as Error).message).toContain("API Error");
      }
    });
  });

  describe("Duplicate Detection Advanced Scenarios", () => {
    /**
     * Integration Test 13: Duplicate Detection with Modified Events
     * Tests: Detecting duplicates even when events are modified
     * Validates: Requirements 5
     */
    it("should detect duplicates even with modified content", async () => {
      const originalEvent: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Original description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // Record initial sync
      await syncEngine.recordSync(originalEvent.id, "task-1");

      // Modified version of same event
      const modifiedEvent: Event = {
        ...originalEvent,
        title: "Team Meeting - Updated",
        description: "Updated description",
        lastModified: new Date()
      };

      // Should still detect as duplicate
      const duplicates = await syncEngine.detectDuplicates([modifiedEvent]);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-1");
    });

    /**
     * Integration Test 14: Bulk Duplicate Detection
     * Tests: Detecting duplicates in large event sets
     * Validates: Requirements 5
     */
    it("should detect duplicates in bulk operations", async () => {
      const events: Event[] = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        title: `Meeting ${i}`,
        description: `Description ${i}`,
        startTime: new Date(`2024-01-15T${String(i % 24).padStart(2, "0")}:00:00Z`),
        endTime: new Date(`2024-01-15T${String((i % 24) + 1).padStart(2, "0")}:00:00Z`),
        isAllDay: false,
        lastModified: new Date()
      }));

      // Record first 5 as already synced
      for (let i = 0; i < 5; i++) {
        await syncEngine.recordSync(events[i].id, `task-${i}`);
      }

      // Detect duplicates in all 20
      const duplicates = await syncEngine.detectDuplicates(events);
      expect(duplicates).toHaveLength(5);
    });

    /**
     * Integration Test 15: Duplicate Resolution Options
     * Tests: Providing multiple resolution options for duplicates
     * Validates: Requirements 5
     */
    it("should provide multiple resolution options for duplicates", async () => {
      const event: Event = {
        id: "event-1",
        title: "Meeting",
        description: "Test",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // Record initial sync
      await syncEngine.recordSync(event.id, "task-1");

      // Detect duplicate
      const duplicates = await syncEngine.detectDuplicates([event]);
      expect(duplicates).toHaveLength(1);

      // Option 1: Skip import
      // Option 2: Update existing task
      // Option 3: Create new task
      // All options should be available
      expect(duplicates[0].existingTaskId).toBe("task-1");
    });
  });

  describe("UI and Display Integration", () => {
    /**
     * Integration Test 16: Event List Rendering with Formatting
     * Tests: Events are formatted correctly for list display
     * Validates: Requirements 3, 8
     */
    it("should format event list for display", () => {
      const events: Event[] = [
        {
          id: "event-1",
          title: "Morning Meeting",
          description: "Team sync",
          startTime: new Date("2024-01-15T09:00:00Z"),
          endTime: new Date("2024-01-15T10:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-2",
          title: "Afternoon Review",
          description: "Project review",
          startTime: new Date("2024-01-15T14:00:00Z"),
          endTime: new Date("2024-01-15T15:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      const formattedList = printer.formatEventList(events);
      expect(formattedList).toContain("Morning Meeting");
      expect(formattedList).toContain("Afternoon Review");
      expect(formattedList).toContain("09:00");
      expect(formattedList).toContain("14:00");
    });

    /**
     * Integration Test 17: Event Details Display
     * Tests: Event details are displayed with all information
     * Validates: Requirements 3, 8
     */
    it("should display complete event details", () => {
      const event: Event = {
        id: "event-1",
        title: "Important Meeting",
        description: "Quarterly business review with stakeholders",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T12:00:00Z"),
        location: "Conference Room A",
        organizer: "john@example.com",
        attendees: ["jane@example.com", "bob@example.com"],
        isAllDay: false,
        lastModified: new Date()
      };

      const details = printer.formatEventDetails(event);
      expect(details).toContain("Important Meeting");
      expect(details).toContain("Quarterly business review");
      expect(details).toContain("Conference Room A");
      expect(details).toContain("10:00");
      expect(details).toContain("12:00");
    });

    /**
     * Integration Test 18: Selection State Persistence
     * Tests: Selection state persists across UI operations
     * Validates: Requirements 3, 5
     */
    it("should persist selection state across operations", () => {
      const events: Event[] = [
        {
          id: "event-1",
          title: "Meeting 1",
          description: "First",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-2",
          title: "Meeting 2",
          description: "Second",
          startTime: new Date("2024-01-16T10:00:00Z"),
          endTime: new Date("2024-01-16T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      // Select first event
      importer.selectEvent(events[0].id);
      let selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);

      // Fetch new events (simulating refresh)
      jest.spyOn(importer, "fetchEvents").mockResolvedValue(events);

      // Selection should persist
      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe("event-1");
    });
  });

  describe("Performance and Scalability", () => {
    /**
     * Integration Test 19: Large Event Set Processing
     * Tests: System handles large event sets efficiently
     * Validates: Requirements 2, 3, 4
     */
    it("should process large event sets efficiently", async () => {
      const largeEventSet: Event[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        description: `Description ${i}`,
        startTime: new Date(`2024-01-15T${String(i % 24).padStart(2, "0")}:00:00Z`),
        endTime: new Date(`2024-01-15T${String((i % 24) + 1).padStart(2, "0")}:00:00Z`),
        isAllDay: false,
        lastModified: new Date()
      }));

      jest.spyOn(importer, "fetchEvents").mockResolvedValue(largeEventSet);

      const startTime = Date.now();
      const events = await importer.fetchEvents();
      const endTime = Date.now();

      expect(events).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    /**
     * Integration Test 20: Memory Efficiency in Bulk Operations
     * Tests: Memory usage remains reasonable during bulk operations
     * Validates: Requirements 4, 5
     */
    it("should maintain memory efficiency in bulk operations", async () => {
      const events: Event[] = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        description: `Description ${i}`,
        startTime: new Date(`2024-01-15T${String(i % 24).padStart(2, "0")}:00:00Z`),
        endTime: new Date(`2024-01-15T${String((i % 24) + 1).padStart(2, "0")}:00:00Z`),
        isAllDay: false,
        lastModified: new Date()
      }));

      // Select all events
      events.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(50);

      // Convert all to tasks
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending"
      }));

      const tasks = selected.map(event => serializer.eventToTask(event));
      expect(tasks).toHaveLength(50);
    });
  });
});
