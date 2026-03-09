/**
 * Event Serializer Implementation
 * Converts Event objects to Task objects for the task board
 */

import { EventSerializer } from "./interfaces";
import { Event, Task, TaskStatus, Priority } from "../types/index";
import { logger } from "../utils/logger";

export class EventSerializerImpl implements EventSerializer {
  eventToTask(event: Event): Task {
    try {
      logger.info("EventSerializer", "Converting event to task", { eventId: event.id });

      // Generate unique task ID
      const taskId = `task_${event.id}_${Date.now()}`;

      // Determine task status based on event timing
      const now = new Date();
      let status: TaskStatus = TaskStatus.PENDING;
      
      if (event.endTime < now) {
        status = TaskStatus.COMPLETED;
      } else if (event.startTime <= now && event.endTime > now) {
        status = TaskStatus.IN_PROGRESS;
      }

      const task: Task = {
        id: taskId,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status,
        priority: Priority.MEDIUM,
        tags: event.categories || [],
        metadata: {
          outlookEventId: event.id,
          syncedAt: new Date(),
          syncStatus: "synced"
        }
      };

      logger.info("EventSerializer", "Event converted to task successfully", { taskId });
      return task;
    } catch (error) {
      logger.error("EventSerializer", "Failed to convert event to task", { error });
      throw new Error(`Failed to convert event to task: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  eventsToTasks(events: Event[]): Task[] {
    try {
      logger.info("EventSerializer", "Converting events to tasks", { count: events.length });
      return events.map(event => this.eventToTask(event));
    } catch (error) {
      logger.error("EventSerializer", "Failed to convert events to tasks", { error });
      throw new Error(`Failed to convert events to tasks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  taskToEvent(task: Task): Event {
    try {
      logger.info("EventSerializer", "Converting task to event", { taskId: task.id });

      const event: Event = {
        id: task.metadata?.outlookEventId || task.id,
        title: task.title,
        description: task.description,
        startTime: task.startDate || task.dueDate,
        endTime: task.endDate || task.dueDate,
        isAllDay: false,
        categories: task.tags || [],
        lastModified: new Date(),
        rawData: {
          id: task.metadata?.outlookEventId || task.id,
          subject: task.title,
          bodyPreview: task.description,
          start: {
            dateTime: (task.startDate || task.dueDate).toISOString(),
            timeZone: "UTC"
          },
          end: {
            dateTime: (task.endDate || task.dueDate).toISOString(),
            timeZone: "UTC"
          },
          isAllDay: false,
          categories: task.tags || []
        }
      };

      logger.info("EventSerializer", "Task converted to event successfully", { eventId: event.id });
      return event;
    } catch (error) {
      logger.error("EventSerializer", "Failed to convert task to event", { error });
      throw new Error(`Failed to convert task to event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
