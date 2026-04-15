/**
 * Sync Engine Implementation
 * Manages synchronization state and duplicate detection
 */

import { SyncEngine } from "./interfaces";
import { Event, DuplicateInfo, SyncMapping, SyncStatus } from "../types/index";
import { logger } from "../utils/logger";
import { ErrorHandler, ErrorCode } from "../utils/errorHandler";

// In-memory sync mapping storage (in production, use persistent storage)
interface SyncMappingStore {
  [outlookEventId: string]: SyncMapping;
}

export class SyncEngineImpl implements SyncEngine {
  private syncMappings: SyncMappingStore = {};
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_BACKOFF_MS = 1000;

  async recordSync(outlookEventId: string, taskId: string): Promise<void> {
    try {
      logger.info("SyncEngine", "Recording sync mapping", { outlookEventId, taskId });

      const mapping: SyncMapping = {
        id: `sync_${outlookEventId}_${Date.now()}`,
        outlookEventId,
        taskId,
        syncedAt: new Date(),
        syncStatus: SyncStatus.SYNCED,
        lastModified: new Date()
      };

      this.syncMappings[outlookEventId] = mapping;
      logger.info("SyncEngine", "Sync mapping recorded successfully");
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "SyncEngine", { operation: "record_sync", outlookEventId, taskId });
      logger.error("SyncEngine", "Failed to record sync mapping", { error: appError.message }, ErrorCode.SYNC_FAILED);
      throw appError;
    }
  }

  async getSyncMapping(outlookEventId: string): Promise<string | null> {
    try {
      const mapping = this.syncMappings[outlookEventId];
      if (mapping) {
        logger.info("SyncEngine", "Sync mapping found", { outlookEventId, taskId: mapping.taskId });
        return mapping.taskId;
      }
      logger.info("SyncEngine", "No sync mapping found", { outlookEventId });
      return null;
    } catch (error) {
      logger.error("SyncEngine", "Failed to get sync mapping", { error });
      throw new Error("Failed to get sync mapping");
    }
  }

  async detectDuplicates(events: Event[]): Promise<DuplicateInfo[]> {
    try {
      logger.info("SyncEngine", "Detecting duplicates", { eventCount: events.length });

      const duplicates: DuplicateInfo[] = [];

      for (const event of events) {
        try {
          const existingTaskId = await this.getSyncMapping(event.id);
          
          if (existingTaskId) {
            const mapping = this.syncMappings[event.id];
            if (mapping) {
              duplicates.push({
                outlookEventId: event.id,
                taskId: existingTaskId,
                event,
                task: {} as any, // In production, fetch the actual task
                syncMapping: mapping
              });
            }
          }
        } catch (error) {
          logger.warn("SyncEngine", "Error checking duplicate for event", { eventId: event.id, error });
          // Continue checking other events
        }
      }

      logger.info("SyncEngine", "Duplicate detection completed", { duplicateCount: duplicates.length });
      return duplicates;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "SyncEngine", { operation: "detect_duplicates" });
      logger.error("SyncEngine", "Failed to detect duplicates", { error: appError.message }, ErrorCode.DUPLICATE_DETECTION_FAILED);
      throw appError;
    }
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    let backoffMs = this.INITIAL_BACKOFF_MS;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info("SyncEngine", "Executing operation", { attempt: attempt + 1, maxRetries: maxRetries + 1 });
        const result = await operation();
        logger.info("SyncEngine", "Operation succeeded", { attempt: attempt + 1 });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          logger.warn("SyncEngine", "Operation failed, retrying with backoff", {
            attempt: attempt + 1,
            backoffMs,
            error: lastError.message
          });
          
          // Wait before retrying
          await this.delay(backoffMs);
          
          // Exponential backoff: double the wait time for next attempt
          backoffMs *= 2;
        } else {
          logger.error("SyncEngine", "Operation failed after all retries", {
            attempts: attempt + 1,
            error: lastError.message
          });
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
