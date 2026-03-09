/**
 * Batch processor utility
 * Groups requests into batches for efficient processing
 */

export interface BatchConfig {
  batchSize: number;
  maxWaitTime: number; // Maximum time to wait before processing partial batch (ms)
}

export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (result: R) => void; reject: (error: Error) => void }> = [];
  private config: BatchConfig;
  private timeoutId: NodeJS.Timeout | null = null;
  private processing: boolean = false;

  constructor(config: BatchConfig) {
    this.config = config;
  }

  /**
   * Add item to batch queue
   */
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      // Process immediately if batch is full
      if (this.queue.length >= this.config.batchSize) {
        this.processBatch();
      } else if (!this.timeoutId) {
        // Set timeout to process partial batch
        this.timeoutId = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Extract batch
    const batch = this.queue.splice(0, this.config.batchSize);

    try {
      // Process batch items
      const results = await this.processBatchItems(batch.map(b => b.item));

      // Resolve promises
      batch.forEach((entry, index) => {
        entry.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(entry => {
        entry.reject(error instanceof Error ? error : new Error(String(error)));
      });
    } finally {
      this.processing = false;

      // Process remaining items if any
      if (this.queue.length > 0) {
        if (this.queue.length >= this.config.batchSize) {
          this.processBatch();
        } else if (!this.timeoutId) {
          this.timeoutId = setTimeout(() => {
            this.processBatch();
          }, this.config.maxWaitTime);
        }
      }
    }
  }

  /**
   * Override this method to implement batch processing logic
   */
  protected async processBatchItems(items: T[]): Promise<R[]> {
    throw new Error("processBatchItems must be implemented by subclass");
  }

  /**
   * Flush remaining items in queue
   */
  async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    while (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach(entry => {
      entry.reject(new Error("Batch processor cleared"));
    });
    this.queue = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
