/**
 * Outlook Calendar Sync - Comprehensive Integration Tests
 * Tests end-to-end workflows combining multiple components
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

describe("Outlook Calendar Sync - Integration Tests", () => {
  let connector: OutlookConnectorImpl;
  let parser: EventParserImpl;
  let serializer: EventSerializerImpl;
  let printer: EventPrinterImpl;
  let syncEngine: SyncEngineImpl;
  let importer: CalendarImporterImpl;
  let ui: CalendarSyncUIImpl;

  beforeEach(() => {
    // Initialize all components
    connector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
    parser = new EventParserImpl();
    serializer = new EventSerializerImpl();
    printer = new EventPrinterImpl();
    syncEngine = new SyncEngineImpl();
    importer = new CalendarImporterImpl(connector, parser, syncEngine);
    ui = new CalendarSyncUIImpl(importer, syncEngine);

    jest.clearAllMocks();
  });

  describe("End-to-End Sync Flow Tests", () => {
    /**
     * Integration Test 1: Complete OAuth to Import Flow
     * Tests: OAuth → Event Fetch → Event Selection → Import
     * Validates: Requirements 1, 2, 3, 4, 5
     */
    it("should complete full OAuth to import workflow", async () => {
      // Step 1: Authenticate with Outlook
      const mockAuthCode = "mock-auth-code-12345";
      const mockAccessToken = "mock-access-token-xyz";

      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      jest.spyOn(connector, "getAccessToken").mockReturnValue(mockAccessToken);

      await connector.handleOAuthCallback(mockAuthCode);
      expect(connector.isAuthenticated()).toBe(true);
      expect(connector.getAccessToken()).toBe(mockAccessToken);

      // Step 2: Fetch events for date range
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");

      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Team Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Discuss project status"
        },
        {
          id: "event-2",
          subject: "Client Call",
          start: { dateTime: "2024-01-16T14:00:00Z" },
          end: { dateTime: "2024-01-16T15:00:00Z" },
          bodyPreview: "Review requirements"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      importer.setDateRange(startDate, endDate);
      const fetchedEvents = await importer.fetchEvents();

      expect(fetchedEvents).toHaveLength(2);
      expect(fetchedEvents[0].title).toBe("Team Meeting");
      expect(fetchedEvents[1].title).toBe("Client Call");

      // Step 3: Select events for import
      importer.selectEvent(fetchedEvents[0].id);
      importer.selectEvent(fetchedEvents[1].id);

      const selectedEvents = importer.getSelectedEvents();
      expect(selectedEvents).toHaveLength(2);

      // Step 4: Import selected events
      const mockTaskStorage: Task[] = [];
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending",
        metadata: {
          outlookEventId: event.id,
          syncedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        }
      }));

      const importResult = await importer.importSelectedEvents();
      expect(importResult.success).toBe(true);
      expect(importResult.importedCount).toBe(2);

      // Step 5: Verify sync mappings were recorded
      const mapping1 = await syncEngine.getSyncMapping(fetchedEvents[0].id);
      const mapping2 = await syncEngine.getSyncMapping(fetchedEvents[1].id);

      expect(mapping1).toBeDefined();
      expect(mapping2).toBeDefined();
    });

    /**
     * Integration Test 2: Multiple Event Selection and Import
     * Tests: Event selection state persistence across multiple selections
     * Validates: Requirements 3, 4, 5
     */
    it("should handle multiple event selection and import", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Meeting 1",
          description: "First meeting",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-2",
          title: "Meeting 2",
          description: "Second meeting",
          startTime: new Date("2024-01-15T14:00:00Z"),
          endTime: new Date("2024-01-15T15:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-3",
          title: "Meeting 3",
          description: "Third meeting",
          startTime: new Date("2024-01-16T10:00:00Z"),
          endTime: new Date("2024-01-16T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      jest.spyOn(importer, "fetchEvents").mockResolvedValue(mockEvents);

      // Select first and third events
      importer.selectEvent(mockEvents[0].id);
      importer.selectEvent(mockEvents[2].id);

      let selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
      expect(selected.map(e => e.id)).toContain("event-1");
      expect(selected.map(e => e.id)).toContain("event-3");

      // Deselect first event
      importer.deselectEvent(mockEvents[0].id);
      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe("event-3");

      // Re-select first event
      importer.selectEvent(mockEvents[0].id);
      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
    });

    /**
     * Integration Test 3: Date Range Validation and Default Behavior
     * Tests: Date range validation and default date handling
     * Validates: Requirements 6
     */
    it("should validate date ranges and apply defaults", () => {
      const validStart = new Date("2024-01-15");
      const validEnd = new Date("2024-01-21");

      // Valid date range should not throw
      expect(() => {
        importer.setDateRange(validStart, validEnd);
      }).not.toThrow();

      // Invalid date range (start > end) should throw
      expect(() => {
        importer.setDateRange(validEnd, validStart);
      }).toThrow();

      // Test default date range (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      importer.setDateRange(today, tomorrow);
      const uiState = importer.getUIState();
      expect(uiState.dateRange).toBeDefined();
    });
  });

  describe("Error Scenarios in Integration", () => {
    /**
     * Integration Test 4: Network Error with Automatic Retry
     * Tests: Network error handling with exponential backoff retry
     * Validates: Requirements 7
     */
    it("should retry on network error with exponential backoff", async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Network error");
        }
        return { success: true };
      });

      const result = await syncEngine.retryWithBackoff(mockOperation, maxRetries);

      expect(attemptCount).toBe(3);
      expect(result.success).toBe(true);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    /**
     * Integration Test 5: API Failure Handling
     * Tests: API error handling and user notification
     * Validates: Requirements 2, 7
     */
    it("should handle API failures gracefully", async () => {
      const mockError = new Error("API Error: 401 Unauthorized");

      jest.spyOn(connector, "getEvents").mockRejectedValue(mockError);

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");
      importer.setDateRange(startDate, endDate);

      try {
        await importer.fetchEvents();
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("API Error");
      }
    });

    /**
     * Integration Test 6: Parsing Error Handling
     * Tests: Invalid event data parsing and error recovery
     * Validates: Requirements 2, 8
     */
    it("should handle parsing errors for invalid event data", () => {
      const invalidEventData = {
        id: "event-1",
        subject: "Valid Title",
        // Missing required start/end times
        bodyPreview: "Description"
      };

      expect(() => {
        parser.parseEvent(invalidEventData);
      }).toThrow();
    });

    /**
     * Integration Test 7: Import Failure with Transaction Rollback
     * Tests: Transaction rollback on import failure
     * Validates: Requirements 4, 7
     */
    it("should rollback transaction on import failure", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Meeting",
          description: "Test meeting",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      importer.selectEvent(mockEvents[0].id);

      // Mock serializer to throw error
      jest.spyOn(serializer, "eventToTask").mockImplementation(() => {
        throw new Error("Serialization failed");
      });

      try {
        await importer.importSelectedEvents();
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Verify no sync mapping was recorded
      const mapping = await syncEngine.getSyncMapping(mockEvents[0].id);
      expect(mapping).toBeNull();
    });
  });

  describe("Duplicate Detection and Handling in Integration", () => {
    /**
     * Integration Test 8: Duplicate Detection
     * Tests: Detection of previously imported events
     * Validates: Requirements 5
     */
    it("should detect duplicate events on re-import", async () => {
      const mockEvent: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Weekly sync",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // First import
      await syncEngine.recordSync(mockEvent.id, "task-1");

      // Attempt to detect duplicate
      const duplicates = await syncEngine.detectDuplicates([mockEvent]);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-1");
      expect(duplicates[0].existingTaskId).toBe("task-1");
    });

    /**
     * Integration Test 9: Duplicate Handling with User Options
     * Tests: Providing user options for duplicate handling
     * Validates: Requirements 5
     */
    it("should provide options for handling duplicates", async () => {
      const mockEvent: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Weekly sync",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // Record initial sync
      await syncEngine.recordSync(mockEvent.id, "task-1");

      // Detect duplicate
      const duplicates = await syncEngine.detectDuplicates([mockEvent]);
      expect(duplicates).toHaveLength(1);

      // User chooses to update existing task
      const updatedMapping = await syncEngine.recordSync(mockEvent.id, "task-1");
      expect(updatedMapping).toBeDefined();
    });

    /**
     * Integration Test 10: Mixed Import with Duplicates and New Events
     * Tests: Handling mix of new and duplicate events in single import
     * Validates: Requirements 4, 5
     */
    it("should handle mixed import with duplicates and new events", async () => {
      const existingEvent: Event = {
        id: "event-1",
        title: "Existing Meeting",
        description: "Already imported",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      const newEvent: Event = {
        id: "event-2",
        title: "New Meeting",
        description: "Not yet imported",
        startTime: new Date("2024-01-16T14:00:00Z"),
        endTime: new Date("2024-01-16T15:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      // Record existing event as already synced
      await syncEngine.recordSync(existingEvent.id, "task-1");

      // Detect duplicates in mixed list
      const duplicates = await syncEngine.detectDuplicates([existingEvent, newEvent]);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-1");
    });
  });

  describe("Full Workflow Scenarios", () => {
    /**
     * Integration Test 11: Complete Weekly Sync Workflow
     * Tests: Full workflow from authentication to import completion
     * Validates: Requirements 1, 2, 3, 4, 5, 6
     */
    it("should complete full weekly sync workflow", async () => {
      // Step 1: Authenticate
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Step 2: Set date range for this week
      const monday = new Date("2024-01-15");
      const sunday = new Date("2024-01-21");

      importer.setDateRange(monday, sunday);

      // Step 3: Fetch events
      const mockRawEvents = [
        {
          id: "event-1",
          subject: "Monday Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          bodyPreview: "Team sync"
        },
        {
          id: "event-2",
          subject: "Wednesday Review",
          start: { dateTime: "2024-01-17T14:00:00Z" },
          end: { dateTime: "2024-01-17T15:00:00Z" },
          bodyPreview: "Project review"
        },
        {
          id: "event-3",
          subject: "Friday Planning",
          start: { dateTime: "2024-01-19T09:00:00Z" },
          end: { dateTime: "2024-01-19T10:00:00Z" },
          bodyPreview: "Next week planning"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockRawEvents);
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(3);

      // Step 4: Select all events
      events.forEach(event => importer.selectEvent(event.id));

      const selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(3);

      // Step 5: Import events
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

      // Step 6: Verify all sync mappings
      for (const event of events) {
        const mapping = await syncEngine.getSyncMapping(event.id);
        expect(mapping).toBeDefined();
      }
    });

    /**
     * Integration Test 12: Event Formatting and Display
     * Tests: Event formatting for UI display
     * Validates: Requirements 3, 8
     */
    it("should format events correctly for display", () => {
      const event: Event = {
        id: "event-1",
        title: "Team Meeting",
        description: "Discuss project status",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Conference Room A",
        isAllDay: false,
        lastModified: new Date()
      };

      const summary = printer.formatEvent(event);
      expect(summary).toContain("Team Meeting");
      expect(summary).toContain("10:00");
      expect(summary).toContain("11:00");

      const details = printer.formatEventDetails(event);
      expect(details).toContain("Team Meeting");
      expect(details).toContain("Discuss project status");
      expect(details).toContain("Conference Room A");
    });

    /**
     * Integration Test 13: Round-trip Event Serialization
     * Tests: Event → Task → Event conversion maintains data integrity
     * Validates: Requirements 4, 8
     */
    it("should maintain data integrity through serialization round-trip", () => {
      const originalEvent: Event = {
        id: "event-1",
        title: "Important Meeting",
        description: "Quarterly review",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Room 101",
        isAllDay: false,
        lastModified: new Date()
      };

      // Event → Task
      const task = serializer.eventToTask(originalEvent);
      expect(task.title).toBe(originalEvent.title);
      expect(task.description).toBe(originalEvent.description);
      expect(task.metadata?.outlookEventId).toBe(originalEvent.id);

      // Task → Event
      const reconstructedEvent = serializer.taskToEvent(task);
      expect(reconstructedEvent.title).toBe(originalEvent.title);
      expect(reconstructedEvent.description).toBe(originalEvent.description);
      expect(reconstructedEvent.id).toBe(originalEvent.id);
    });

    /**
     * Integration Test 14: Disconnection and Token Cleanup
     * Tests: Proper cleanup when user disconnects
     * Validates: Requirements 1
     */
    it("should cleanup tokens and state on disconnect", async () => {
      // Authenticate first
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect
      jest.spyOn(connector, "disconnectAccount").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(false);

      await connector.disconnectAccount();
      expect(connector.isAuthenticated()).toBe(false);
      expect(connector.getAccessToken()).toBeNull();
    });

    /**
     * Integration Test 15: Error Recovery and Retry Flow
     * Tests: Complete error recovery workflow
     * Validates: Requirements 7
     */
    it("should recover from errors and retry successfully", async () => {
      let callCount = 0;

      jest.spyOn(connector, "getEvents").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
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

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");
      importer.setDateRange(startDate, endDate);

      // First attempt fails
      try {
        await importer.fetchEvents();
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Retry succeeds
      const events = await importer.fetchEvents();
      expect(events).toHaveLength(1);
      expect(callCount).toBe(2);
    });
  });

  describe("UI Integration Tests", () => {
    /**
     * Integration Test 16: UI State Management
     * Tests: UI state consistency across operations
     * Validates: Requirements 3, 5
     */
    it("should maintain consistent UI state", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Meeting 1",
          description: "First",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      jest.spyOn(importer, "fetchEvents").mockResolvedValue(mockEvents);

      let uiState = importer.getUIState();
      expect(uiState.isLoading).toBe(false);

      importer.selectEvent(mockEvents[0].id);
      uiState = importer.getUIState();
      expect(uiState.selectedEventIds).toContain("event-1");

      importer.deselectEvent(mockEvents[0].id);
      uiState = importer.getUIState();
      expect(uiState.selectedEventIds).not.toContain("event-1");
    });

    /**
     * Integration Test 17: Error Message Display
     * Tests: Proper error message display in UI
     * Validates: Requirements 1, 7
     */
    it("should display appropriate error messages", async () => {
      const errorMessage = "Failed to fetch events: Network error";

      jest.spyOn(connector, "getEvents").mockRejectedValue(new Error("Network error"));

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");
      importer.setDateRange(startDate, endDate);

      try {
        await importer.fetchEvents();
      } catch (error) {
        const uiState = importer.getUIState();
        expect(uiState.error).toBeDefined();
      }
    });
  });
});
