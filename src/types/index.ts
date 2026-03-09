/**
 * Outlook Calendar Sync - Core Type Definitions
 * Defines all data models and enums for the calendar synchronization feature
 */

/**
 * Sync Status Enum
 * Represents the current state of a synchronization operation
 */
export enum SyncStatus {
  SYNCED = "synced",           // Successfully synchronized
  PENDING = "pending",         // Waiting to be synchronized
  FAILED = "failed",           // Synchronization failed
  DUPLICATE = "duplicate"      // Duplicate event detected
}

/**
 * Task Status Enum
 * Represents the current state of a task
 */
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

/**
 * Priority Enum
 * Represents the priority level of a task
 */
export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

/**
 * Recurrence Rule
 * Represents the recurrence pattern of an event
 */
export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  endDate?: Date;
  daysOfWeek?: number[];
}

/**
 * Event Object
 * Represents an Outlook calendar event
 */
export interface Event {
  id: string;                    // Outlook event ID
  title: string;                 // Event title
  description: string;           // Event description
  startTime: Date;              // Event start time (UTC)
  endTime: Date;                // Event end time (UTC)
  location?: string;            // Event location
  organizer?: string;           // Event organizer email
  attendees?: string[];         // Attendee emails
  isAllDay: boolean;            // All-day event flag
  recurrence?: RecurrenceRule;  // Recurrence pattern
  categories?: string[];        // Event categories
  lastModified: Date;           // Last modification timestamp
  rawData?: Record<string, any>; // Original API response
}

/**
 * Task Object
 * Represents a task in the task board
 */
export interface Task {
  id: string;                    // Unique task ID
  title: string;                 // Task title
  description: string;           // Task description
  dueDate: Date;                // Task due date
  startDate?: Date;             // Task start date
  endDate?: Date;               // Task end date
  status: TaskStatus;           // Task status
  priority?: Priority;          // Task priority
  tags?: string[];              // Task tags
  metadata?: {
    outlookEventId?: string;    // Link to original Outlook event
    syncedAt?: Date;            // Synchronization timestamp
    syncStatus?: SyncStatus;    // Synchronization status
  };
}

/**
 * Sync Mapping Object
 * Represents the mapping between Outlook events and tasks
 */
export interface SyncMapping {
  id: string;                    // Mapping ID
  outlookEventId: string;       // Outlook event ID
  taskId: string;               // Task board task ID
  syncedAt: Date;               // Synchronization timestamp
  syncStatus: SyncStatus;       // Current synchronization status
  lastModified: Date;           // Last modification timestamp
}

/**
 * Raw Event Data
 * Represents the raw JSON response from Outlook API
 */
export interface RawEventData {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  location?: {
    displayName?: string;
  };
  organizer?: {
    emailAddress?: {
      address?: string;
    };
  };
  attendees?: Array<{
    emailAddress?: {
      address?: string;
    };
  }>;
  isReminderOn?: boolean;
  isAllDay?: boolean;
  categories?: string[];
  lastModifiedDateTime?: string;
  [key: string]: any;
}

/**
 * Duplicate Info
 * Information about a detected duplicate event
 */
export interface DuplicateInfo {
  outlookEventId: string;
  taskId: string;
  event: Event;
  task: Task;
  syncMapping: SyncMapping;
}

/**
 * Import Result
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  duplicateCount: number;
  errors: Array<{
    eventId: string;
    error: string;
  }>;
  syncMappings: SyncMapping[];
}

/**
 * UI State
 * Represents the current state of the calendar sync UI
 */
export interface UIState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedEvents: Set<string>;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  events: Event[];
  error?: string;
  successMessage?: string;
}
