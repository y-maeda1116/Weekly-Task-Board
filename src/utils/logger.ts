/**
 * Logger Utility
 * Provides logging functionality for the calendar sync feature
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, any>;
  errorCode?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByComponent: Record<string, number>;
  lastError?: LogEntry;
}

export class Logger {
  private logs: LogEntry[] = [];
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCode: {},
    errorsByComponent: {}
  };
  private readonly MAX_LOGS = 10000; // Prevent memory issues

  log(
    level: LogLevel,
    component: string,
    message: string,
    context?: Record<string, any>,
    errorCode?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      message,
      context,
      errorCode
    };

    this.logs.push(entry);

    // Maintain max log size
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Update error metrics
    if (level === LogLevel.ERROR) {
      this.errorMetrics.totalErrors++;
      this.errorMetrics.lastError = entry;

      if (errorCode) {
        this.errorMetrics.errorsByCode[errorCode] = (this.errorMetrics.errorsByCode[errorCode] || 0) + 1;
      }

      this.errorMetrics.errorsByComponent[component] = (this.errorMetrics.errorsByComponent[component] || 0) + 1;
    }

    // Also log to console in development
    if (typeof console !== "undefined") {
      const logMethod = level === LogLevel.ERROR ? "error" : level === LogLevel.WARN ? "warn" : "log";
      console[logMethod](
        `[${entry.timestamp.toISOString()}] [${level}] [${component}] ${message}`,
        context || ""
      );
    }
  }

  debug(component: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, component, message, context);
  }

  info(component: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, component, message, context);
  }

  warn(component: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, component, message, context);
  }

  error(component: string, message: string, context?: Record<string, any>, errorCode?: string): void {
    this.log(LogLevel.ERROR, component, message, context, errorCode);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  clearLogs(): void {
    this.logs = [];
  }

  clearErrorMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCode: {},
      errorsByComponent: {}
    };
  }

  /**
   * Persist logs to storage (localStorage or IndexedDB in production)
   */
  persistLogs(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const logsToStore = this.logs.slice(-1000); // Store last 1000 logs
        localStorage.setItem("calendar_sync_logs", JSON.stringify(logsToStore));
        logger.info("Logger", "Logs persisted to storage", { count: logsToStore.length });
      }
    } catch (error) {
      console.error("Failed to persist logs:", error);
    }
  }

  /**
   * Load logs from storage
   */
  loadLogs(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("calendar_sync_logs");
        if (stored) {
          const loadedLogs = JSON.parse(stored) as LogEntry[];
          this.logs = loadedLogs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          logger.info("Logger", "Logs loaded from storage", { count: this.logs.length });
        }
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  }
}

export const logger = new Logger();
