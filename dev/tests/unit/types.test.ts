/**
 * Type Definitions Unit Tests
 * Verifies that all core types are properly defined
 */

import {
  Event,
  Task,
  SyncMapping,
  SyncStatus,
  TaskStatus,
  Priority,
  RawEventData,
  DuplicateInfo,
  ImportResult,
  UIState
} from "../../src/types/index";

describe("Type Definitions", () => {
  describe("Event Type", () => {
    it("should create a valid Event object", () => {
      const event: Event = {
        id: "event-1",
        title: "Test Event",
        description: "Test Description",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      expect(event.id).toBe("event-1");
      expect(event.title).toBe("Test Event");
      expect(event.isAllDay).toBe(false);
    });

    it("should support optional Event fields", () => {
      const event: Event = {
        id: "event-1",
        title: "Test Event",
        description: "Test Description",
        startTime: new Date(),
        endTime: new Date(),
        isAllDay: false,
        lastModified: new Date(),
        location: "Conference Room A",
        organizer: "organizer@example.com",
        attendees: ["attendee1@example.com", "attendee2@example.com"],
        categories: ["work", "meeting"]
      };

      expect(event.location).toBe("Conference Room A");
      expect(event.attendees).toHaveLength(2);
    });
  });

  describe("Task Type", () => {
    it("should create a valid Task object", () => {
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        description: "Test Description",
        dueDate: new Date("2024-01-01"),
        status: TaskStatus.PENDING
      };

      expect(task.id).toBe("task-1");
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it("should support Task metadata", () => {
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        description: "Test Description",
        dueDate: new Date(),
        status: TaskStatus.PENDING,
        metadata: {
          outlookEventId: "event-1",
          syncedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        }
      };

      expect(task.metadata?.outlookEventId).toBe("event-1");
      expect(task.metadata?.syncStatus).toBe(SyncStatus.SYNCED);
    });
  });

  describe("SyncMapping Type", () => {
    it("should create a valid SyncMapping object", () => {
      const mapping: SyncMapping = {
        id: "mapping-1",
        outlookEventId: "event-1",
        taskId: "task-1",
        syncedAt: new Date(),
        syncStatus: SyncStatus.SYNCED,
        lastModified: new Date()
      };

      expect(mapping.outlookEventId).toBe("event-1");
      expect(mapping.taskId).toBe("task-1");
      expect(mapping.syncStatus).toBe(SyncStatus.SYNCED);
    });
  });

  describe("Enums", () => {
    it("should have all SyncStatus values", () => {
      expect(SyncStatus.SYNCED).toBe("synced");
      expect(SyncStatus.PENDING).toBe("pending");
      expect(SyncStatus.FAILED).toBe("failed");
      expect(SyncStatus.DUPLICATE).toBe("duplicate");
    });

    it("should have all TaskStatus values", () => {
      expect(TaskStatus.PENDING).toBe("pending");
      expect(TaskStatus.IN_PROGRESS).toBe("in_progress");
      expect(TaskStatus.COMPLETED).toBe("completed");
      expect(TaskStatus.ARCHIVED).toBe("archived");
    });

    it("should have all Priority values", () => {
      expect(Priority.LOW).toBe("low");
      expect(Priority.MEDIUM).toBe("medium");
      expect(Priority.HIGH).toBe("high");
      expect(Priority.URGENT).toBe("urgent");
    });
  });

  describe("ImportResult Type", () => {
    it("should create a valid ImportResult object", () => {
      const result: ImportResult = {
        success: true,
        importedCount: 5,
        failedCount: 0,
        duplicateCount: 1,
        errors: [],
        syncMappings: []
      };

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(5);
    });
  });

  describe("UIState Type", () => {
    it("should create a valid UIState object", () => {
      const state: UIState = {
        isAuthenticated: true,
        isLoading: false,
        selectedEvents: new Set(["event-1", "event-2"]),
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31")
        },
        events: []
      };

      expect(state.isAuthenticated).toBe(true);
      expect(state.selectedEvents.size).toBe(2);
    });
  });
});
