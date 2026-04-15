/**
 * Event Parser Implementation
 * Parses raw Outlook API responses into structured Event objects
 */

import { EventParser } from "./interfaces";
import { Event, RawEventData } from "../types/index";
import { logger } from "../utils/logger";

export class EventParserImpl implements EventParser {
  parseEvent(rawData: RawEventData): Event {
    try {
      this.validateEventData(rawData);

      const startTime = this.parseDateTime(rawData.start);
      const endTime = this.parseDateTime(rawData.end);

      if (!startTime || !endTime) {
        throw new Error("Missing required start or end time");
      }

      const event: Event = {
        id: rawData.id || "",
        title: rawData.subject || "Untitled Event",
        description: rawData.bodyPreview || "",
        startTime,
        endTime,
        location: rawData.location?.displayName,
        organizer: rawData.organizer?.emailAddress?.address,
        attendees: rawData.attendees?.map(a => a.emailAddress?.address).filter(Boolean) as string[],
        isAllDay: rawData.isAllDay || false,
        categories: rawData.categories || [],
        lastModified: rawData.lastModifiedDateTime ? new Date(rawData.lastModifiedDateTime) : new Date(),
        rawData
      };

      logger.info("EventParser", "Event parsed successfully", { eventId: event.id, title: event.title });
      return event;
    } catch (error) {
      logger.error("EventParser", "Failed to parse event", { error, rawData });
      throw new Error(`Failed to parse event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  parseEvents(rawDataArray: RawEventData[]): Event[] {
    try {
      logger.info("EventParser", "Parsing events", { count: rawDataArray.length });
      return rawDataArray.map(rawData => this.parseEvent(rawData));
    } catch (error) {
      logger.error("EventParser", "Failed to parse events", { error });
      throw new Error(`Failed to parse events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  validateEventData(data: unknown): boolean {
    if (!data || typeof data !== "object") {
      throw new Error("Event data must be an object");
    }

    const rawData = data as RawEventData;

    // Check required fields
    if (!rawData.id) {
      throw new Error("Event must have an id");
    }

    if (!rawData.subject) {
      throw new Error("Event must have a subject (title)");
    }

    if (!rawData.start || !rawData.start.dateTime) {
      throw new Error("Event must have a start time");
    }

    if (!rawData.end || !rawData.end.dateTime) {
      throw new Error("Event must have an end time");
    }

    return true;
  }

  private parseDateTime(dateTimeObj: any): Date | null {
    if (!dateTimeObj || !dateTimeObj.dateTime) {
      return null;
    }

    try {
      // Parse ISO 8601 datetime string
      const date = new Date(dateTimeObj.dateTime);
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }

      return date;
    } catch (error) {
      logger.error("EventParser", "Failed to parse datetime", { error, dateTimeObj });
      return null;
    }
  }
}
