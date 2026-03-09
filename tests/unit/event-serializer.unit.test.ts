/**
 * Event Serializer - Comprehensive Unit Tests
 * Tests for event-to-task conversion, metadata preservation, and ID generation
 */

import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { Event, Task, TaskStatus, Priority } from "../../src/types/index";

describe("EventSerializer - Unit Tests", () => {
  let serializer: EventSerializerImpl;

  beforeEach(() => {
    serializer = new EventSerializerImpl();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Event to Task Conversion", () => {
    it("should convert event to task with all fields", () => {
      const event: Event = {
        id: "event1",
        title: "Team Meeting",
        description: "Discuss project status",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Conference Room A",
        organizer: "organizer@example.com",
        attendees: ["attendee1@example.com", "attendee2@example.com"],
        isAllDay: false,
        categories: ["work", "important"],
        lastModified: new Date("2024-01-15T09:00:00Z")
      };

      const task = serializer.eventToTask(event);

      expect(task.title).toBe("Team Meeting");
      expect(task.description).toBe("Discuss project status");
      expect(task.dueDate).toEqual(event.endTime);
      expect(task.startDate).toEqual(event.startTime);
      expect(task.tags).toContain("work");
      expect(task.tags).toContain("important");
    });

    it("should generate unique task ID", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task1 = serializer.eventToTask(event);
      const task2 = serializer.eventToTask(event);

      expect(task1.id).not.toBe(task2.id);
      expect(task1.id).toContain("task_event1_");
      expect(task2.id).toContain("task_event1_");
    });

    it("should preserve metadata in task", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);

      expect(task.metadata?.outlookEventId).toBe("event1");
      expect(task.metadata?.syncStatus).toBe("synced");
      expect(task.metadata?.syncedAt).toBeDefined();
    });

    it("should set task status to PENDING for future events", () => {
      const event: Event = {
        id: "event1",
        title: "Future Meeting",
        description: "Description",
        startTime: new Date("2024-01-20T10:00:00Z"),
        endTime: new Date("2024-01-20T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it("should set task status to IN_PROGRESS for ongoing events", () => {
      const event: Event = {
        id: "event1",
        title: "Current Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T11:00:00Z"),
        endTime: new Date("2024-01-15T13:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should set task status to COMPLETED for past events", () => {
      const event: Event = {
        id: "event1",
        title: "Past Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T09:00:00Z"),
        endTime: new Date("2024-01-15T10:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it("should set default priority to MEDIUM", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.priority).toBe(Priority.MEDIUM);
    });

    it("should handle event with no categories", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.tags).toEqual([]);
    });

    it("should handle event with multiple categories", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: ["work", "important", "urgent", "meeting"],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.tags).toHaveLength(4);
      expect(task.tags).toEqual(["work", "important", "urgent", "meeting"]);
    });
  });

  describe("Multiple Events to Tasks Conversion", () => {
    it("should convert multiple events to tasks", () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Meeting 1",
          description: "Description 1",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event2",
          title: "Meeting 2",
          description: "Description 2",
          startTime: new Date("2024-01-15T14:00:00Z"),
          endTime: new Date("2024-01-15T15:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      const tasks = serializer.eventsToTasks(events);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Meeting 1");
      expect(tasks[1].title).toBe("Meeting 2");
    });

    it("should handle empty event array", () => {
      const tasks = serializer.eventsToTasks([]);
      expect(tasks).toEqual([]);
    });

    it("should preserve order of events", () => {
      const events: Event[] = Array.from({ length: 10 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: `Description ${i}`,
        startTime: new Date(`2024-01-15T${10 + i}:00:00Z`),
        endTime: new Date(`2024-01-15T${11 + i}:00:00Z`),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      const tasks = serializer.eventsToTasks(events);

      expect(tasks).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(tasks[i].title).toBe(`Meeting ${i}`);
      }
    });
  });

  describe("Task to Event Conversion", () => {
    it("should convert task to event", () => {
      const task: Task = {
        id: "task1",
        title: "Project Review",
        description: "Review project progress",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        startDate: new Date("2024-01-15T14:00:00Z"),
        endDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.HIGH,
        tags: ["work", "review"],
        metadata: {
          outlookEventId: "event1",
          syncedAt: new Date(),
          syncStatus: "synced"
        }
      };

      const event = serializer.taskToEvent(task);

      expect(event.title).toBe("Project Review");
      expect(event.description).toBe("Review project progress");
      expect(event.id).toBe("event1");
      expect(event.categories).toEqual(["work", "review"]);
    });

    it("should use task ID if no outlook event ID", () => {
      const task: Task = {
        id: "task1",
        title: "Meeting",
        description: "Description",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        tags: [],
        metadata: {}
      };

      const event = serializer.taskToEvent(task);
      expect(event.id).toBe("task1");
    });

    it("should use dueDate as endDate if endDate not provided", () => {
      const task: Task = {
        id: "task1",
        title: "Meeting",
        description: "Description",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        tags: [],
        metadata: {}
      };

      const event = serializer.taskToEvent(task);
      expect(event.endTime).toEqual(task.dueDate);
    });

    it("should use dueDate as startDate if startDate not provided", () => {
      const task: Task = {
        id: "task1",
        title: "Meeting",
        description: "Description",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        tags: [],
        metadata: {}
      };

      const event = serializer.taskToEvent(task);
      expect(event.startTime).toEqual(task.dueDate);
    });

    it("should preserve tags as categories", () => {
      const task: Task = {
        id: "task1",
        title: "Meeting",
        description: "Description",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        tags: ["urgent", "important", "work"],
        metadata: {}
      };

      const event = serializer.taskToEvent(task);
      expect(event.categories).toEqual(["urgent", "important", "work"]);
    });

    it("should handle task with no tags", () => {
      const task: Task = {
        id: "task1",
        title: "Meeting",
        description: "Description",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        tags: [],
        metadata: {}
      };

      const event = serializer.taskToEvent(task);
      expect(event.categories).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle event with very long title", () => {
      const longTitle = "A".repeat(1000);
      const event: Event = {
        id: "event1",
        title: longTitle,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.title).toBe(longTitle);
    });

    it("should handle event with very long description", () => {
      const longDescription = "B".repeat(5000);
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: longDescription,
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.description).toBe(longDescription);
    });

    it("should handle event with special characters", () => {
      const event: Event = {
        id: "event1",
        title: "Meeting: Q&A <Special> \"Chars\"",
        description: "Description with 'quotes' and <tags>",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.title).toContain("Q&A");
      expect(task.description).toContain("'quotes'");
    });

    it("should handle event with unicode characters", () => {
      const event: Event = {
        id: "event1",
        title: "会議 🎉 Réunion",
        description: "日本語 中文 한국어",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.title).toContain("会議");
      expect(task.description).toContain("日本語");
    });

    it("should handle all-day event", () => {
      const event: Event = {
        id: "event1",
        title: "All Day Event",
        description: "Description",
        startTime: new Date("2024-01-15T00:00:00Z"),
        endTime: new Date("2024-01-16T00:00:00Z"),
        isAllDay: true,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.dueDate).toEqual(event.endTime);
    });

    it("should handle event with same start and end time", () => {
      const sameTime = new Date("2024-01-15T10:00:00Z");
      const event: Event = {
        id: "event1",
        title: "Instant Event",
        description: "Description",
        startTime: sameTime,
        endTime: sameTime,
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.startDate).toEqual(task.endDate);
    });

    it("should handle event with end time before start time", () => {
      const event: Event = {
        id: "event1",
        title: "Invalid Event",
        description: "Description",
        startTime: new Date("2024-01-15T11:00:00Z"),
        endTime: new Date("2024-01-15T10:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.startDate?.getTime()).toBeGreaterThan(task.endDate?.getTime() || 0);
    });

    it("should handle event with many categories", () => {
      const categories = Array.from({ length: 50 }, (_, i) => `category${i}`);
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories,
        lastModified: new Date()
      };

      const task = serializer.eventToTask(event);
      expect(task.tags).toHaveLength(50);
    });
  });

  describe("Roundtrip Conversion", () => {
    it("should preserve data through event-task-event roundtrip", () => {
      const originalEvent: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Room A",
        isAllDay: false,
        categories: ["work"],
        lastModified: new Date()
      };

      const task = serializer.eventToTask(originalEvent);
      const convertedEvent = serializer.taskToEvent(task);

      expect(convertedEvent.title).toBe(originalEvent.title);
      expect(convertedEvent.description).toBe(originalEvent.description);
      expect(convertedEvent.categories).toEqual(originalEvent.categories);
    });

    it("should preserve data through task-event-task roundtrip", () => {
      const originalTask: Task = {
        id: "task1",
        title: "Project Review",
        description: "Review progress",
        dueDate: new Date("2024-01-15T15:00:00Z"),
        startDate: new Date("2024-01-15T14:00:00Z"),
        endDate: new Date("2024-01-15T15:00:00Z"),
        status: TaskStatus.PENDING,
        priority: Priority.HIGH,
        tags: ["work", "review"],
        metadata: {
          outlookEventId: "event1",
          syncedAt: new Date(),
          syncStatus: "synced"
        }
      };

      const event = serializer.taskToEvent(originalTask);
      const convertedTask = serializer.eventToTask(event);

      expect(convertedTask.title).toBe(originalTask.title);
      expect(convertedTask.description).toBe(originalTask.description);
      expect(convertedTask.tags).toEqual(originalTask.tags);
    });
  });

  describe("Error Handling", () => {
    it("should handle event with missing required fields", () => {
      const event: any = {
        id: "event1",
        title: "Meeting"
        // Missing other required fields
      };

      expect(() => serializer.eventToTask(event)).toThrow();
    });

    it("should handle null event", () => {
      expect(() => serializer.eventToTask(null as any)).toThrow();
    });

    it("should handle undefined event", () => {
      expect(() => serializer.eventToTask(undefined as any)).toThrow();
    });

    it("should handle null task", () => {
      expect(() => serializer.taskToEvent(null as any)).toThrow();
    });

    it("should handle undefined task", () => {
      expect(() => serializer.taskToEvent(undefined as any)).toThrow();
    });
  });
});
