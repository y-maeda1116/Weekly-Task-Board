/**
 * Request throttler and debouncer
 * Optimizes network requests by throttling and debouncing
 */

export class RequestThrottler {
  private lastExecutionTime: Map<string, number> = new Map();
  private readonly throttleInterval: number;

  constructor(throttleInterval: number = 1000) {
    this.throttleInterval = throttleInterval;
  }

  /**
   * Throttle a request - execute at most once per throttleInterval
   */
  async throttle<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const lastTime = this.lastExecutionTime.get(key) || 0;

    if (now - lastTime < this.throttleInterval) {
      throw new Error(`Request throttled. Try again in ${this.throttleInterval - (now - lastTime)}ms`);
    }

    this.lastExecutionTime.set(key, now);
    return fn();
  }

  reset(key?: string): void {
    if (key) {
      this.lastExecutionTime.delete(key);
    } else {
      this.lastExecutionTime.clear();
    }
  }
}

export class RequestDebouncer {
  private timeoutId: Map<string, NodeJS.Timeout> = new Map();
  private readonly debounceDelay: number;

  constructor(debounceDelay: number = 500) {
    this.debounceDelay = debounceDelay;
  }

  /**
   * Debounce a request - execute only after delay with no new calls
   */
  debounce<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear existing timeout for this key
      const existingTimeout = this.timeoutId.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const newTimeout = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.timeoutId.delete(key);
        }
      }, this.debounceDelay);

      this.timeoutId.set(key, newTimeout);
    });
  }

  cancel(key?: string): void {
    if (key) {
      const timeout = this.timeoutId.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeoutId.delete(key);
      }
    } else {
      this.timeoutId.forEach(timeout => clearTimeout(timeout));
      this.timeoutId.clear();
    }
  }
}
