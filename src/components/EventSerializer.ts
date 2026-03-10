/**
 * Event Serializer Implementation
 * Converts Event objects to Task objects for the task board
 * Supports both Outlook and Google Calendar events
 */

import { EventSerializer } from "./interfaces";
import { Event, Task, TaskStatus, Priority } from "../types/index";
import { logger } from "../utils/logger";

type CalendarProvider = 'outlook' | 'google';

export class EventSerializerImpl implements EventSerializer {
  private provider: CalendarProvider = 'outlook';
  private providerPrefixes: Record<CalendarProvider, string> = {
    outlook: 'outlook',
    google: 'google'
  };

  constructor(provider?: CalendarProvider) {
    if (provider) {
      this.provider = provider;
    }
  }

  private detectProviderFromEvent(event: Event): CalendarProvider {
    // Check if rawData contains Google-specific fields
    if (event.rawData) {
      if ('start' in event.rawData && 'date' in (event.rawData.start as any)) {
        // Google uses 'date' for all-day events
        return 'google';
      }
      if ('recurrence' in event.rawData && Array.isArray(event.rawData.recurrence)) {
        // Google recurrence is an array of strings
        return 'google';
      }
      if ('colorId' in event.rawData) {
        // Google has colorId
        return 'google';
      }
    }
    // Default to outlook
    return 'outlook';
  }

  eventToTask(event: Event, provider?: CalendarProvider): Task {
    try {
      const detectedProvider = provider || this.detectProviderFromEvent(event);
      logger.info("EventSerializer", "Converting event to task", { eventId: event.id, provider: detectedProvider });

      // Generate unique task ID
      const taskId = `task_${this.providerPrefixes[detectedProvider]}_${event.id}_${Date.now()}`;

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
          calendarProvider: detectedProvider,
          syncedAt: new Date(),
          syncStatus: "synced"
        }
      };

      // Add provider-specific event ID
      if (detectedProvider === 'google') {
        task.metadata.googleEventId = event.id;
      } else {
        task.metadata.outlookEventId = event.id;
      }

      logger.info("EventSerializer", "Event converted to task successfully", { taskId, provider: detectedProvider });
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
      const provider = task.metadata?.calendarProvider || this.provider;
      logger.info("EventSerializer", "Converting task to event", { taskId: task.id, provider });

      const eventId = provider === 'google'
        ? (task.metadata?.googleEventId || task.id)
        : (task.metadata?.outlookEventId || task.id);

      const startTime = task.startDate || task.dueDate;
      const endTime = task.endDate || task.dueDate;

      const event: Event = {
        id: eventId,
        title: task.title,
        description: task.description,
        startTime,
        endTime,
        isAllDay: false,
        categories: task.tags || [],
        lastModified: new Date(),
        rawData: {
          id: eventId,
          summary: task.title,
          description: task.description,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC"
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC"
          },
          isAllDay: false,
          categories: task.tags || []
        }
      };

      logger.info("EventSerializer", "Task converted to event successfully", { eventId, provider });
      return event;
    } catch (error) {
      logger.error("EventSerializer", "Failed to convert task to event", { error });
      throw new Error(`Failed to convert task to event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
