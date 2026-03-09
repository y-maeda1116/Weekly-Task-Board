/**
 * Event Printer Implementation
 * Formats Event objects into human-readable strings
 */

import { EventPrinter } from "./interfaces";
import { Event } from "../types/index";
import { logger } from "../utils/logger";

export class EventPrinterImpl implements EventPrinter {
  /**
   * Format a single event as a one-line summary
   * Format: "Title (HH:MM - HH:MM)"
   */
  formatEvent(event: Event): string {
    try {
      const startTime = this.formatTime(event.startTime);
      const endTime = this.formatTime(event.endTime);
      return `${event.title} (${startTime} - ${endTime})`;
    } catch (error) {
      logger.error("EventPrinter", "Failed to format event", { error, eventId: event.id });
      throw new Error(`Failed to format event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Format multiple events as a list
   */
  formatEventList(events: Event[]): string {
    try {
      if (events.length === 0) {
        return "No events found";
      }
      
      return events
        .map((event, index) => `${index + 1}. ${this.formatEvent(event)}`)
        .join("\n");
    } catch (error) {
      logger.error("EventPrinter", "Failed to format event list", { error, count: events.length });
      throw new Error(`Failed to format event list: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Format event details in multi-line format
   * Includes title, start time, end time, location, and description
   */
  formatEventDetails(event: Event): string {
    try {
      const lines: string[] = [];
      
      // Title
      lines.push(`Title: ${event.title}`);
      
      // Start time
      lines.push(`Start: ${this.formatDateTime(event.startTime)}`);
      
      // End time
      lines.push(`End: ${this.formatDateTime(event.endTime)}`);
      
      // Location (if available)
      if (event.location) {
        lines.push(`Location: ${event.location}`);
      }
      
      // Description (if available)
      if (event.description) {
        lines.push(`Description: ${event.description}`);
      }
      
      // Organizer (if available)
      if (event.organizer) {
        lines.push(`Organizer: ${event.organizer}`);
      }
      
      // Attendees (if available)
      if (event.attendees && event.attendees.length > 0) {
        lines.push(`Attendees: ${event.attendees.join(", ")}`);
      }
      
      // All-day flag
      if (event.isAllDay) {
        lines.push("All-day event: Yes");
      }
      
      return lines.join("\n");
    } catch (error) {
      logger.error("EventPrinter", "Failed to format event details", { error, eventId: event.id });
      throw new Error(`Failed to format event details: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Format time in HH:MM format
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Format date and time in a readable format
   */
  private formatDateTime(date: Date): string {
    const dateStr = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    const timeStr = this.formatTime(date);
    return `${dateStr} ${timeStr}`;
  }
}
