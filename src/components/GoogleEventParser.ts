/**
 * Google Event Parser Implementation
 * Parses raw Google Calendar API responses into structured Event objects
 */

import type { Event } from "../types/index";
import type { GoogleRawEventData, GoogleEventTime, GoogleRecurrenceRule } from "../types/google";
import { logger } from "../utils/logger";

export class GoogleEventParserImpl {
  parseEvent(rawData: GoogleRawEventData): Event {
    try {
      this.validateEventData(rawData);

      const startTime = this.parseEventTime(rawData.start);
      const endTime = this.parseEventTime(rawData.end);

      if (!startTime || !endTime) {
        throw new Error("Missing required start or end time");
      }

      // Check if this is an all-day event
      const isAllDay = this.isAllDayEvent(rawData.start, rawData.end);

      // Parse recurrence if present
      const recurrence = this.parseRecurrence(rawData.recurrence);

      const event: Event = {
        id: rawData.id || "",
        title: rawData.summary || "Untitled Event",
        description: rawData.description || "",
        startTime,
        endTime,
        location: rawData.location,
        organizer: rawData.organizer?.email,
        attendees: rawData.attendees?.map(a => a.email).filter(Boolean) as string[],
        isAllDay,
        recurrence,
        categories: rawData.colorId ? [`color-${rawData.colorId}`] : [],
        lastModified: rawData.updated ? new Date(rawData.updated) : new Date(),
        rawData: rawData as Record<string, any>
      };

      logger.info("GoogleEventParser", "Event parsed successfully", { eventId: event.id, title: event.title });
      return event;
    } catch (error) {
      logger.error("GoogleEventParser", "Failed to parse event", { error, rawData });
      throw new Error(`Failed to parse event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  parseEvents(rawDataArray: GoogleRawEventData[]): Event[] {
    try {
      logger.info("GoogleEventParser", "Parsing events", { count: rawDataArray.length });
      return rawDataArray.map(rawData => this.parseEvent(rawData));
    } catch (error) {
      logger.error("GoogleEventParser", "Failed to parse events", { error });
      throw new Error(`Failed to parse events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  validateEventData(data: unknown): boolean {
    if (!data || typeof data !== "object") {
      throw new Error("Event data must be an object");
    }

    const rawData = data as GoogleRawEventData;

    // Check required fields
    if (!rawData.id) {
      throw new Error("Event must have an id");
    }

    if (!rawData.summary) {
      throw new Error("Event must have a summary (title)");
    }

    if (!rawData.start || (!rawData.start.dateTime && !rawData.start.date)) {
      throw new Error("Event must have a start time");
    }

    if (!rawData.end || (!rawData.end.dateTime && !rawData.end.date)) {
      throw new Error("Event must have an end time");
    }

    // Check for cancelled events
    if (rawData.status === "cancelled") {
      throw new Error("Event is cancelled and should not be imported");
    }

    return true;
  }

  private parseEventTime(eventTime: GoogleEventTime): Date | null {
    if (!eventTime) {
      return null;
    }

    try {
      // For all-day events, use the date field
      if (eventTime.date) {
        // Google returns date in YYYY-MM-DD format, parse as local time
        const [year, month, day] = eventTime.date.split("-").map(Number);
        return new Date(year, month - 1, day);
      }

      // For timed events, use the dateTime field (ISO 8601)
      if (eventTime.dateTime) {
        const date = new Date(eventTime.dateTime);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date;
      }

      return null;
    } catch (error) {
      logger.error("GoogleEventParser", "Failed to parse event time", { error, eventTime });
      return null;
    }
  }

  private isAllDayEvent(start: GoogleEventTime, end: GoogleEventTime): boolean {
    // All-day events have 'date' field instead of 'dateTime'
    return !!(start.date && end.date);
  }

  private parseRecurrence(recurrence: string[] | undefined): { frequency: string; interval?: number; endDate?: Date } | undefined {
    if (!recurrence || recurrence.length === 0) {
      return undefined;
    }

    // Parse RRULE format: RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR
    const rrule = recurrence.find(rule => rule.startsWith("RRULE:"));
    if (!rrule) {
      return undefined;
    }

    try {
      const ruleString = rrule.substring(6); // Remove "RRULE:" prefix
      const parts = ruleString.split(";");

      const result: { frequency: string; interval?: number; endDate?: Date } = {
        frequency: ""
      };

      for (const part of parts) {
        const [key, value] = part.split("=");

        switch (key) {
          case "FREQ":
            result.frequency = value.toLowerCase();
            break;
          case "INTERVAL":
            result.interval = parseInt(value, 10);
            break;
          case "UNTIL":
            // UNTIL is in YYYYMMDD format for dates or YYYYMMDDTHHmmssZ for datetime
            if (value.length === 8) {
              // Date only: YYYYMMDD
              const year = parseInt(value.substring(0, 4), 10);
              const month = parseInt(value.substring(4, 6), 10) - 1;
              const day = parseInt(value.substring(6, 8), 10);
              result.endDate = new Date(year, month, day);
            } else {
              // Full datetime
              result.endDate = new Date(value);
            }
            break;
        }
      }

      if (!result.frequency) {
        return undefined;
      }

      return result;
    } catch (error) {
      logger.warn("GoogleEventParser", "Failed to parse recurrence rule", { error, recurrence });
      return undefined;
    }
  }
}
