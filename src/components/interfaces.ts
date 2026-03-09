/**
 * Outlook Calendar Sync - Component Interfaces
 * Defines all component interfaces for the calendar synchronization feature
 */

import {
  Event,
  Task,
  SyncMapping,
  SyncStatus,
  RawEventData,
  DuplicateInfo,
  ImportResult,
  UIState
} from "../types/index";

/**
 * Outlook Connector Interface
 * Manages OAuth authentication and Outlook API communication
 */
export interface OutlookConnector {
  // Authentication
  initiateOAuthFlow(): Promise<void>;
  handleOAuthCallback(code: string): Promise<void>;
  disconnectAccount(): Promise<void>;
  isAuthenticated(): boolean;

  // Token management
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string>;
  revokeAccessToken(): Promise<void>;

  // Event retrieval
  getEvents(startDate: Date, endDate: Date): Promise<RawEventData[]>;
  getEventDetails(eventId: string): Promise<RawEventData>;
}

/**
 * Event Parser Interface
 * Parses raw Outlook API responses into structured Event objects
 */
export interface EventParser {
  parseEvent(rawData: RawEventData): Event;
  parseEvents(rawDataArray: RawEventData[]): Event[];
  validateEventData(data: unknown): boolean;
}

/**
 * Event Serializer Interface
 * Converts Event objects to Task objects for the task board
 */
export interface EventSerializer {
  eventToTask(event: Event): Task;
  eventsToTasks(events: Event[]): Task[];
  taskToEvent(task: Task): Event;
}

/**
 * Event Printer Interface
 * Formats Event objects into human-readable strings
 */
export interface EventPrinter {
  formatEvent(event: Event): string;
  formatEventList(events: Event[]): string;
  formatEventDetails(event: Event): string;
}

/**
 * Sync Engine Interface
 * Manages synchronization state and duplicate detection
 */
export interface SyncEngine {
  // State management
  recordSync(outlookEventId: string, taskId: string): Promise<void>;
  getSyncMapping(outlookEventId: string): Promise<string | null>;

  // Duplicate detection
  detectDuplicates(events: Event[]): Promise<DuplicateInfo[]>;

  // Retry logic
  retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T>;
}

/**
 * Calendar Importer Interface
 * Orchestrates the import process and manages UI interactions
 */
export interface CalendarImporter {
  // Date range management
  setDateRange(startDate: Date, endDate: Date): void;
  validateDateRange(startDate: Date, endDate: Date): boolean;

  // Event retrieval
  fetchEvents(): Promise<Event[]>;

  // Selection management
  selectEvent(eventId: string): void;
  deselectEvent(eventId: string): void;
  getSelectedEvents(): Event[];

  // Import execution
  importSelectedEvents(): Promise<ImportResult>;

  // UI state
  getUIState(): UIState;
}

/**
 * Calendar Sync UI Interface
 * Provides user interface for calendar synchronization
 */
export interface CalendarSyncUI {
  // Authentication UI
  renderAuthButton(): HTMLElement;
  renderDisconnectButton(): HTMLElement;

  // Date range selection
  renderDateRangePicker(): HTMLElement;

  // Event list display
  renderEventList(events: Event[]): HTMLElement;
  renderEventDetails(event: Event): HTMLElement;

  // Selection controls
  renderCheckbox(eventId: string): HTMLElement;
  renderSelectAllButton(): HTMLElement;

  // Action buttons
  renderImportButton(): HTMLElement;
  renderCancelButton(): HTMLElement;

  // Status display
  renderSyncStatus(status: SyncStatus): HTMLElement;
  renderErrorMessage(error: Error): HTMLElement;
}
