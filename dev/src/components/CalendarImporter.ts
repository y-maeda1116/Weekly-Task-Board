/**
 * Calendar Importer Implementation
 * Orchestrates the import process and manages UI interactions
 */

import { CalendarImporter } from "./interfaces";
import { Event, ImportResult, UIState, TaskStatus } from "../types/index";
import { OutlookConnector } from "./interfaces";
import { EventParser } from "./interfaces";
import { EventSerializer } from "./interfaces";
import { SyncEngine } from "./interfaces";
import { logger } from "../utils/logger";
import { ErrorHandler, ErrorCode, AppError } from "../utils/errorHandler";
import { transactionManager } from "../utils/transactionManager";
import { RequestDebouncer } from "../utils/requestThrottler";

export class CalendarImporterImpl implements CalendarImporter {
  private dateRange: { startDate: Date; endDate: Date } = {
    startDate: new Date(),
    endDate: new Date()
  };
  private selectedEventIds: Set<string> = new Set();
  private events: Event[] = [];
  private isLoading: boolean = false;
  private error?: string;
  private successMessage?: string;
  private debouncer: RequestDebouncer;

  constructor(
    private outlookConnector: OutlookConnector,
    private eventParser: EventParser,
    private eventSerializer: EventSerializer,
    private syncEngine: SyncEngine
  ) {
    // Initialize with today's date range
    const today = new Date();
    this.dateRange = {
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    };
    this.debouncer = new RequestDebouncer(500); // 500ms debounce
  }

  setDateRange(startDate: Date, endDate: Date): void {
    try {
      logger.info("CalendarImporter", "Setting date range", { startDate, endDate });
      this.dateRange = { startDate, endDate };
      this.error = undefined;
    } catch (error) {
      logger.error("CalendarImporter", "Failed to set date range", { error });
      throw new Error(`Failed to set date range: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  validateDateRange(startDate: Date, endDate: Date): boolean {
    try {
      logger.info("CalendarImporter", "Validating date range", { startDate, endDate });
      
      // Check if startDate is not after endDate
      if (startDate > endDate) {
        this.error = "Start date cannot be after end date";
        logger.warn("CalendarImporter", "Invalid date range: start date is after end date");
        return false;
      }
      
      this.error = undefined;
      return true;
    } catch (error) {
      logger.error("CalendarImporter", "Failed to validate date range", { error });
      throw new Error(`Failed to validate date range: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async fetchEvents(): Promise<Event[]> {
    try {
      logger.info("CalendarImporter", "Fetching events", { dateRange: this.dateRange });
      this.isLoading = true;
      this.error = undefined;

      // Validate date range before fetching
      if (!this.validateDateRange(this.dateRange.startDate, this.dateRange.endDate)) {
        throw new Error(this.error || "Invalid date range");
      }

      // Use debouncer to prevent rapid successive requests
      const events = await this.debouncer.debounce(
        "fetch_events",
        async () => {
          // Fetch raw events from Outlook
          const rawEvents = await this.outlookConnector.getEvents(
            this.dateRange.startDate,
            this.dateRange.endDate
          );

          // Parse raw events into Event objects
          return this.eventParser.parseEvents(rawEvents);
        }
      );

      this.events = events;
      
      logger.info("CalendarImporter", "Events fetched successfully", { count: this.events.length });
      this.isLoading = false;
      return this.events;
    } catch (error) {
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : "Failed to fetch events";
      logger.error("CalendarImporter", "Failed to fetch events", { error });
      throw new Error(`Failed to fetch events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  selectEvent(eventId: string): void {
    try {
      logger.info("CalendarImporter", "Selecting event", { eventId });
      this.selectedEventIds.add(eventId);
    } catch (error) {
      logger.error("CalendarImporter", "Failed to select event", { error, eventId });
      throw new Error(`Failed to select event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  deselectEvent(eventId: string): void {
    try {
      logger.info("CalendarImporter", "Deselecting event", { eventId });
      this.selectedEventIds.delete(eventId);
    } catch (error) {
      logger.error("CalendarImporter", "Failed to deselect event", { error, eventId });
      throw new Error(`Failed to deselect event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  getSelectedEvents(): Event[] {
    try {
      return this.events.filter(event => this.selectedEventIds.has(event.id));
    } catch (error) {
      logger.error("CalendarImporter", "Failed to get selected events", { error });
      throw new Error(`Failed to get selected events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async importSelectedEvents(): Promise<ImportResult> {
    let transactionId: string | null = null;
    
    try {
      logger.info("CalendarImporter", "Starting import", { count: this.selectedEventIds.size });
      this.isLoading = true;
      this.error = undefined;

      // Begin transaction for rollback support
      transactionId = transactionManager.beginTransaction();

      const selectedEvents = this.getSelectedEvents();
      const result: ImportResult = {
        success: true,
        importedCount: 0,
        failedCount: 0,
        duplicateCount: 0,
        errors: [],
        syncMappings: []
      };

      // Check for duplicates
      let duplicates = [];
      try {
        duplicates = await this.syncEngine.detectDuplicates(selectedEvents);
        result.duplicateCount = duplicates.length;
      } catch (error) {
        const appError = ErrorHandler.handleError(error, "CalendarImporter", { operation: "duplicate_detection" });
        logger.error("CalendarImporter", "Duplicate detection failed", { error: appError.message }, ErrorCode.DUPLICATE_DETECTION_FAILED);
        result.errors.push({
          eventId: "all",
          error: appError.userMessage
        });
      }

      // Process each selected event
      for (const event of selectedEvents) {
        let operationId: string | null = null;
        
        try {
          // Check if this event is a duplicate
          const isDuplicate = duplicates.some(dup => dup.outlookEventId === event.id);
          
          if (isDuplicate) {
            logger.warn("CalendarImporter", "Skipping duplicate event", { eventId: event.id });
            result.duplicateCount++;
            continue;
          }

          // Add operation to transaction
          operationId = transactionManager.addOperation("create_task", { eventId: event.id });

          // Convert event to task
          const task = this.eventSerializer.eventToTask(event);

          // Record the sync mapping
          await this.syncEngine.recordSync(event.id, task.id);

          // Mark operation as completed
          if (operationId) {
            transactionManager.completeOperation(operationId);
          }

          result.importedCount++;
          result.syncMappings.push({
            id: `mapping_${event.id}_${task.id}`,
            outlookEventId: event.id,
            taskId: task.id,
            syncedAt: new Date(),
            syncStatus: "synced",
            lastModified: new Date()
          });

          logger.info("CalendarImporter", "Event imported successfully", { eventId: event.id, taskId: task.id });
        } catch (error) {
          result.failedCount++;
          
          const appError = ErrorHandler.handleError(error, "CalendarImporter", { eventId: event.id });
          result.errors.push({
            eventId: event.id,
            error: appError.userMessage
          });

          if (operationId) {
            transactionManager.failOperation(operationId, error instanceof Error ? error : new Error(String(error)));
          }

          logger.error("CalendarImporter", "Failed to import event", { error: appError.message, eventId: event.id }, ErrorCode.IMPORT_FAILED);
        }
      }

      // Check if we have any failures
      if (result.failedCount > 0) {
        result.success = false;
        
        // Rollback transaction if there are failures
        try {
          await transactionManager.rollbackTransaction();
          logger.info("CalendarImporter", "Transaction rolled back due to import failures");
        } catch (rollbackError) {
          const appError = ErrorHandler.handleError(rollbackError, "CalendarImporter", { operation: "rollback" });
          logger.error("CalendarImporter", "Failed to rollback transaction", { error: appError.message }, ErrorCode.ROLLBACK_FAILED);
          this.error = "Import failed and rollback encountered an error. Please contact support.";
        }
      } else {
        // Commit transaction if all operations succeeded
        try {
          await transactionManager.commitTransaction();
          logger.info("CalendarImporter", "Transaction committed successfully");
        } catch (commitError) {
          const appError = ErrorHandler.handleError(commitError, "CalendarImporter", { operation: "commit" });
          logger.error("CalendarImporter", "Failed to commit transaction", { error: appError.message });
          result.success = false;
        }
      }

      this.isLoading = false;
      
      if (result.success) {
        this.successMessage = `Successfully imported ${result.importedCount} events`;
      } else if (result.failedCount > 0 && result.importedCount > 0) {
        this.error = `Partially imported: ${result.importedCount} succeeded, ${result.failedCount} failed`;
      } else if (result.failedCount > 0) {
        this.error = `Import failed: ${result.failedCount} events could not be imported`;
      }
      
      logger.info("CalendarImporter", "Import completed", result);
      return result;
    } catch (error) {
      this.isLoading = false;
      
      // Attempt rollback on unexpected error
      if (transactionId) {
        try {
          await transactionManager.rollbackTransaction();
        } catch (rollbackError) {
          logger.error("CalendarImporter", "Failed to rollback on unexpected error", { error: rollbackError });
        }
      }

      const appError = ErrorHandler.handleError(error, "CalendarImporter", { operation: "import" });
      this.error = appError.userMessage;
      logger.error("CalendarImporter", "Import failed unexpectedly", { error: appError.message }, ErrorCode.IMPORT_FAILED);
      
      throw appError;
    }
  }

  getUIState(): UIState {
    try {
      return {
        isAuthenticated: this.outlookConnector.isAuthenticated(),
        isLoading: this.isLoading,
        selectedEvents: new Set(this.selectedEventIds),
        dateRange: { ...this.dateRange },
        events: [...this.events],
        error: this.error,
        successMessage: this.successMessage
      };
    } catch (error) {
      logger.error("CalendarImporter", "Failed to get UI state", { error });
      throw new Error(`Failed to get UI state: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
