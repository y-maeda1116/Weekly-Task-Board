/**
 * Calendar Sync UI Implementation
 * Provides user interface for calendar synchronization
 */

import { CalendarSyncUI } from "./interfaces";
import { Event, SyncStatus } from "../types/index";
import { logger } from "../utils/logger";
import { VirtualScroller } from "../utils/virtualScroller";

export class CalendarSyncUIImpl implements CalendarSyncUI {
  private selectedEventId?: string;

  renderAuthButton(): HTMLElement {
    try {
      const button = document.createElement("button");
      button.id = "outlook-auth-button";
      button.className = "auth-button";
      button.textContent = "Connect to Outlook";
      button.setAttribute("aria-label", "Connect to Outlook account");
      return button;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render auth button", { error });
      throw new Error(`Failed to render auth button: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderDisconnectButton(): HTMLElement {
    try {
      const button = document.createElement("button");
      button.id = "outlook-disconnect-button";
      button.className = "disconnect-button";
      button.textContent = "Disconnect";
      button.setAttribute("aria-label", "Disconnect from Outlook account");
      return button;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render disconnect button", { error });
      throw new Error(`Failed to render disconnect button: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderDateRangePicker(): HTMLElement {
    try {
      const container = document.createElement("div");
      container.className = "date-range-picker";
      container.setAttribute("role", "group");
      container.setAttribute("aria-label", "Date range selection");

      // Start date input
      const startLabel = document.createElement("label");
      startLabel.htmlFor = "start-date";
      startLabel.textContent = "Start Date:";
      
      const startInput = document.createElement("input");
      startInput.id = "start-date";
      startInput.type = "date";
      startInput.setAttribute("aria-label", "Start date");

      // End date input
      const endLabel = document.createElement("label");
      endLabel.htmlFor = "end-date";
      endLabel.textContent = "End Date:";
      
      const endInput = document.createElement("input");
      endInput.id = "end-date";
      endInput.type = "date";
      endInput.setAttribute("aria-label", "End date");

      container.appendChild(startLabel);
      container.appendChild(startInput);
      container.appendChild(endLabel);
      container.appendChild(endInput);

      return container;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render date range picker", { error });
      throw new Error(`Failed to render date range picker: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderEventList(events: Event[]): HTMLElement {
    try {
      const container = document.createElement("div");
      container.className = "event-list";
      container.setAttribute("role", "list");
      container.setAttribute("aria-label", "Calendar events");

      if (events.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No events found";
        emptyMessage.className = "empty-message";
        container.appendChild(emptyMessage);
        return container;
      }

      // Use virtual scrolling for large lists (> 50 items)
      if (events.length > 50) {
        const scroller = new VirtualScroller({
          itemHeight: 50,
          containerHeight: 400,
          bufferSize: 5
        });

        scroller.setItems(events);

        const renderItem = (event: Event, index: number): HTMLElement => {
          const item = document.createElement("div");
          item.className = "event-list-item";
          item.setAttribute("role", "listitem");
          item.setAttribute("data-event-id", event.id);

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = `event-checkbox-${event.id}`;
          checkbox.className = "event-checkbox";
          checkbox.setAttribute("aria-label", `Select ${event.title}`);

          const label = document.createElement("label");
          label.htmlFor = `event-checkbox-${event.id}`;
          label.className = "event-label";
          
          const startTime = event.startTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          });
          const endTime = event.endTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          });
          
          label.textContent = `${event.title} (${startTime} - ${endTime})`;

          item.appendChild(checkbox);
          item.appendChild(label);
          return item;
        };

        return scroller.createScrollContainer(renderItem);
      }

      // Standard rendering for smaller lists
      events.forEach((event) => {
        const item = document.createElement("div");
        item.className = "event-list-item";
        item.setAttribute("role", "listitem");
        item.setAttribute("data-event-id", event.id);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `event-checkbox-${event.id}`;
        checkbox.className = "event-checkbox";
        checkbox.setAttribute("aria-label", `Select ${event.title}`);

        const label = document.createElement("label");
        label.htmlFor = `event-checkbox-${event.id}`;
        label.className = "event-label";
        
        const startTime = event.startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const endTime = event.endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit"
        });
        
        label.textContent = `${event.title} (${startTime} - ${endTime})`;

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
      });

      return container;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render event list", { error });
      throw new Error(`Failed to render event list: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderEventDetails(event: Event): HTMLElement {
    try {
      const container = document.createElement("div");
      container.className = "event-details-panel";
      container.setAttribute("role", "region");
      container.setAttribute("aria-label", "Event details");

      // Title
      const titleElement = document.createElement("h3");
      titleElement.textContent = event.title;
      titleElement.className = "event-title";

      // Start time
      const startElement = document.createElement("p");
      startElement.className = "event-start-time";
      startElement.innerHTML = `<strong>Start:</strong> ${event.startTime.toLocaleString()}`;

      // End time
      const endElement = document.createElement("p");
      endElement.className = "event-end-time";
      endElement.innerHTML = `<strong>End:</strong> ${event.endTime.toLocaleString()}`;

      // Description
      const descElement = document.createElement("p");
      descElement.className = "event-description";
      descElement.innerHTML = `<strong>Description:</strong> ${event.description || "No description"}`;

      // Location (if available)
      const locationElement = document.createElement("p");
      locationElement.className = "event-location";
      if (event.location) {
        locationElement.innerHTML = `<strong>Location:</strong> ${event.location}`;
      }

      container.appendChild(titleElement);
      container.appendChild(startElement);
      container.appendChild(endElement);
      if (event.location) {
        container.appendChild(locationElement);
      }
      container.appendChild(descElement);

      return container;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render event details", { error });
      throw new Error(`Failed to render event details: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderCheckbox(eventId: string): HTMLElement {
    try {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `event-checkbox-${eventId}`;
      checkbox.className = "event-checkbox";
      checkbox.setAttribute("aria-label", `Select event ${eventId}`);
      return checkbox;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render checkbox", { error });
      throw new Error(`Failed to render checkbox: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderSelectAllButton(): HTMLElement {
    try {
      const button = document.createElement("button");
      button.id = "select-all-button";
      button.className = "select-all-button";
      button.textContent = "Select All";
      button.setAttribute("aria-label", "Select all events");
      return button;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render select all button", { error });
      throw new Error(`Failed to render select all button: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderImportButton(): HTMLElement {
    try {
      const button = document.createElement("button");
      button.id = "import-button";
      button.className = "import-button";
      button.textContent = "Import Selected Events";
      button.setAttribute("aria-label", "Import selected events to task board");
      return button;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render import button", { error });
      throw new Error(`Failed to render import button: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderCancelButton(): HTMLElement {
    try {
      const button = document.createElement("button");
      button.id = "cancel-button";
      button.className = "cancel-button";
      button.textContent = "Cancel";
      button.setAttribute("aria-label", "Cancel import operation");
      return button;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render cancel button", { error });
      throw new Error(`Failed to render cancel button: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderSyncStatus(status: SyncStatus): HTMLElement {
    try {
      const container = document.createElement("div");
      container.className = `sync-status sync-status-${status}`;
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");

      const statusText = this.getStatusText(status);
      container.textContent = statusText;

      return container;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render sync status", { error });
      throw new Error(`Failed to render sync status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  renderErrorMessage(error: Error): HTMLElement {
    try {
      const container = document.createElement("div");
      container.className = "error-message";
      container.setAttribute("role", "alert");
      container.setAttribute("aria-live", "assertive");

      const icon = document.createElement("span");
      icon.className = "error-icon";
      icon.textContent = "⚠️ ";

      const message = document.createElement("span");
      message.className = "error-text";
      message.textContent = error.message;

      container.appendChild(icon);
      container.appendChild(message);

      return container;
    } catch (error) {
      logger.error("CalendarSyncUI", "Failed to render error message", { error });
      throw new Error(`Failed to render error message: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private getStatusText(status: SyncStatus): string {
    switch (status) {
      case "synced":
        return "✓ Sync completed successfully";
      case "pending":
        return "⏳ Sync in progress...";
      case "failed":
        return "✗ Sync failed";
      case "duplicate":
        return "⚠️ Duplicate event detected";
      default:
        return "Unknown status";
    }
  }
}
