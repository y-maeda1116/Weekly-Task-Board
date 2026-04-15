/**
 * Error Handler Utility
 * Provides comprehensive error handling, user-friendly messages, and recovery mechanisms
 */

import { logger, LogLevel } from "./logger";

export enum ErrorCode {
  // Authentication errors
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  AUTH_REVOKED = "AUTH_REVOKED",
  
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  
  // Validation errors
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
  INVALID_EVENT_DATA = "INVALID_EVENT_DATA",
  INVALID_INPUT = "INVALID_INPUT",
  
  // Import errors
  IMPORT_FAILED = "IMPORT_FAILED",
  IMPORT_PARTIAL = "IMPORT_PARTIAL",
  ROLLBACK_FAILED = "ROLLBACK_FAILED",
  
  // Sync errors
  SYNC_FAILED = "SYNC_FAILED",
  DUPLICATE_DETECTION_FAILED = "DUPLICATE_DETECTION_FAILED",
  
  // General errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  component: string;
  context?: Record<string, any>;
  originalError?: Error;
  timestamp: Date;
  isRecoverable: boolean;
}

export class ErrorHandler {
  private static readonly ERROR_MESSAGES: Record<ErrorCode, { message: string; userMessage: string }> = {
    [ErrorCode.AUTH_FAILED]: {
      message: "Authentication with Outlook failed",
      userMessage: "Unable to connect to Outlook. Please check your credentials and try again."
    },
    [ErrorCode.AUTH_EXPIRED]: {
      message: "Authentication token has expired",
      userMessage: "Your session has expired. Please reconnect to Outlook."
    },
    [ErrorCode.AUTH_REVOKED]: {
      message: "Authentication has been revoked",
      userMessage: "Your Outlook connection has been revoked. Please reconnect."
    },
    [ErrorCode.NETWORK_ERROR]: {
      message: "Network error occurred",
      userMessage: "Network connection failed. Please check your internet connection and try again."
    },
    [ErrorCode.API_ERROR]: {
      message: "Outlook API error occurred",
      userMessage: "Failed to communicate with Outlook. Please try again later."
    },
    [ErrorCode.TIMEOUT_ERROR]: {
      message: "Request timeout",
      userMessage: "The request took too long. Please try again."
    },
    [ErrorCode.INVALID_DATE_RANGE]: {
      message: "Invalid date range provided",
      userMessage: "Start date cannot be after end date. Please select a valid date range."
    },
    [ErrorCode.INVALID_EVENT_DATA]: {
      message: "Invalid event data received",
      userMessage: "The event data is invalid. Please try again."
    },
    [ErrorCode.INVALID_INPUT]: {
      message: "Invalid input provided",
      userMessage: "Please check your input and try again."
    },
    [ErrorCode.IMPORT_FAILED]: {
      message: "Import operation failed",
      userMessage: "Failed to import events. Please try again."
    },
    [ErrorCode.IMPORT_PARTIAL]: {
      message: "Import operation partially failed",
      userMessage: "Some events could not be imported. Please review the errors and try again."
    },
    [ErrorCode.ROLLBACK_FAILED]: {
      message: "Failed to rollback import transaction",
      userMessage: "Failed to undo the import operation. Please contact support."
    },
    [ErrorCode.SYNC_FAILED]: {
      message: "Synchronization failed",
      userMessage: "Failed to synchronize events. Please try again."
    },
    [ErrorCode.DUPLICATE_DETECTION_FAILED]: {
      message: "Duplicate detection failed",
      userMessage: "Failed to check for duplicate events. Please try again."
    },
    [ErrorCode.UNKNOWN_ERROR]: {
      message: "An unknown error occurred",
      userMessage: "An unexpected error occurred. Please try again or contact support."
    }
  };

  static createError(
    code: ErrorCode,
    component: string,
    context?: Record<string, any>,
    originalError?: Error,
    isRecoverable: boolean = true
  ): AppError {
    const { message, userMessage } = this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];

    const appError: AppError = {
      code,
      message,
      userMessage,
      component,
      context,
      originalError,
      timestamp: new Date(),
      isRecoverable
    };

    // Log the error
    logger.error(component, message, {
      code,
      context,
      originalError: originalError?.message,
      isRecoverable
    });

    return appError;
  }

  static handleError(error: unknown, component: string, context?: Record<string, any>): AppError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      return error as AppError;
    }

    const originalError = error instanceof Error ? error : new Error(String(error));
    const message = originalError.message;

    // Determine error code based on error message
    let code = ErrorCode.UNKNOWN_ERROR;
    let isRecoverable = true;

    if (message.includes("401") || message.includes("Unauthorized")) {
      code = ErrorCode.AUTH_EXPIRED;
    } else if (message.includes("403") || message.includes("Forbidden")) {
      code = ErrorCode.AUTH_REVOKED;
    } else if (message.includes("Network") || message.includes("fetch")) {
      code = ErrorCode.NETWORK_ERROR;
    } else if (message.includes("timeout")) {
      code = ErrorCode.TIMEOUT_ERROR;
    } else if (message.includes("date range")) {
      code = ErrorCode.INVALID_DATE_RANGE;
    } else if (message.includes("event data")) {
      code = ErrorCode.INVALID_EVENT_DATA;
    } else if (message.includes("import")) {
      code = ErrorCode.IMPORT_FAILED;
    } else if (message.includes("sync")) {
      code = ErrorCode.SYNC_FAILED;
    }

    return this.createError(code, component, context, originalError, isRecoverable);
  }

  static isNetworkError(error: AppError): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.API_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.AUTH_EXPIRED
    ].includes(error.code);
  }

  static isRecoverable(error: AppError): boolean {
    return error.isRecoverable;
  }

  static formatErrorForUser(error: AppError): string {
    return error.userMessage;
  }

  static formatErrorForLogging(error: AppError): string {
    return `[${error.code}] ${error.message} (${error.component}) - ${error.originalError?.message || "No details"}`;
  }
}
