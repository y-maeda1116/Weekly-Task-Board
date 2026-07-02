/**
 * Event Serializer Property-Based Tests
 * Tests the correctness properties of event-to-task conversion
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { Event, Task, TaskStatus } from "../../src/types/index";

describe("EventSerializer - Property-Based Tests", () => {
  const serializer = new EventSerializerImpl();

  /**
   * Property 10: Event to Task Conversion
   * **Validates: Requirements 4**
   * 
   * For all selected events, the system converts them to Task objects using:
   * - Event title as task title
   * - Event time as task date
   * - Event description as task description
   */
  it("Property 10: Should convert event to task with correct field mapping", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 500 }),
          location: fc.option(fc.string({ maxLength: 100 })),
          organizer: fc.option(fc.string({ maxLength: 100 })),
          attendees: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 10 })),
          isAllDay: fc.boolean(),
          categories: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
          lastModified: fc.date(),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          // Ensure startTime is before endTime
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          // Convert event to task
          const task = serializer.eventToTask(event);

          // Verify field mapping
          expect(task.title).toBe(event.title);
          expect(task.description).toBe(event.description);
          expect(task.dueDate).toEqual(event.endTime);
          expect(task.startDate).toEqual(event.startTime);
          expect(task.endDate).toEqual(event.endTime);

          // Verify metadata contains Outlook event ID
          expect(task.metadata?.outlookEventId).toBe(event.id);
          expect(task.metadata?.syncedAt).toBeDefined();
          expect(task.metadata?.syncStatus).toBe("synced");

          // Verify task has valid ID
          expect(task.id).toBeDefined();
          expect(task.id.length).toBeGreaterThan(0);

          // Verify task status is set based on timing
          expect([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]).toContain(task.status);
        }
      )
    );
  });

  /**
   * Additional property: Task status determination based on event timing
   * Verifies that task status is correctly set based on event timing
   */
  it("Should set task status based on event timing", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string(),
          isAllDay: fc.boolean(),
          lastModified: fc.date(),
          location: fc.option(fc.string()),
          organizer: fc.option(fc.string()),
          attendees: fc.option(fc.array(fc.string())),
          categories: fc.option(fc.array(fc.string()))
        }),
        (baseData) => {
          const now = new Date();
          
          // Test case 1: Past event should be COMPLETED
          const pastEvent: Event = {
            ...baseData,
            startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000)    // 1 hour ago
          };
          
          const pastTask = serializer.eventToTask(pastEvent);
          expect(pastTask.status).toBe(TaskStatus.COMPLETED);

          // Test case 2: Current event should be IN_PROGRESS
          const currentEvent: Event = {
            ...baseData,
            startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
            endTime: new Date(now.getTime() + 30 * 60 * 1000)    // 30 minutes from now
          };
          
          const currentTask = serializer.eventToTask(currentEvent);
          expect(currentTask.status).toBe(TaskStatus.IN_PROGRESS);

          // Test case 3: Future event should be PENDING
          const futureEvent: Event = {
            ...baseData,
            startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
            endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000)    // 2 hours from now
          };
          
          const futureTask = serializer.eventToTask(futureEvent);
          expect(futureTask.status).toBe(TaskStatus.PENDING);
        }
      )
    );
  });

  /**
   * Additional property: Batch conversion consistency
   * Verifies that converting multiple events produces consistent results
   */
  it("Should convert multiple events consistently", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            isAllDay: fc.boolean(),
            lastModified: fc.date(),
            location: fc.option(fc.string()),
            organizer: fc.option(fc.string()),
            attendees: fc.option(fc.array(fc.string())),
            categories: fc.option(fc.array(fc.string())),
            startTime: fc.date(),
            endTime: fc.date()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (eventDataArray) => {
          const events: Event[] = eventDataArray.map((data) => ({
            ...data,
            startTime: new Date(Math.min(data.startTime.getTime(), data.endTime.getTime())),
            endTime: new Date(Math.max(data.startTime.getTime(), data.endTime.getTime()))
          }));

          // Convert using batch method
          const tasks = serializer.eventsToTasks(events);

          // Verify count matches
          expect(tasks.length).toBe(events.length);

          // Verify each task corresponds to its event
          tasks.forEach((task, index) => {
            const event = events[index];
            expect(task.title).toBe(event.title);
            expect(task.description).toBe(event.description);
            expect(task.metadata?.outlookEventId).toBe(event.id);
          });
        }
      )
    );
  });

  /**
   * Additional property: Metadata preservation
   * Verifies that all event metadata is preserved in the task
   */
  it("Should preserve all event metadata in task", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          description: fc.string(),
          location: fc.string({ minLength: 1 }),
          organizer: fc.string({ minLength: 1 }),
          attendees: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          isAllDay: fc.boolean(),
          categories: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          lastModified: fc.date(),
          startTime: fc.date(),
          endTime: fc.date()
        }),
        (eventData) => {
          const startTime = new Date(Math.min(eventData.startTime.getTime(), eventData.endTime.getTime()));
          const endTime = new Date(Math.max(eventData.startTime.getTime(), eventData.endTime.getTime()));

          const event: Event = {
            ...eventData,
            startTime,
            endTime
          };

          const task = serializer.eventToTask(event);

          // Verify categories are preserved as tags
          expect(task.tags).toEqual(event.categories);

          // Verify metadata contains sync information
          expect(task.metadata).toBeDefined();
          expect(task.metadata?.outlookEventId).toBe(event.id);
          expect(task.metadata?.syncStatus).toBe("synced");
          expect(task.metadata?.syncedAt).toBeInstanceOf(Date);
        }
      )
    );
  });

  /**
   * Additional property: Task ID uniqueness
   * Verifies that each converted task gets a unique ID
   */
  it("Should generate unique task IDs for each event", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            isAllDay: fc.boolean(),
            lastModified: fc.date(),
            location: fc.option(fc.string()),
            organizer: fc.option(fc.string()),
            attendees: fc.option(fc.array(fc.string())),
            categories: fc.option(fc.array(fc.string())),
            startTime: fc.date(),
            endTime: fc.date()
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (eventDataArray) => {
          const events: Event[] = eventDataArray.map((data) => ({
            ...data,
            startTime: new Date(Math.min(data.startTime.getTime(), data.endTime.getTime())),
            endTime: new Date(Math.max(data.startTime.getTime(), data.endTime.getTime()))
          }));

          const tasks = serializer.eventsToTasks(events);
          const taskIds = tasks.map((t) => t.id);
          const uniqueIds = new Set(taskIds);

          // All task IDs should be unique
          expect(uniqueIds.size).toBe(taskIds.length);
        }
      )
    );
  });
});
