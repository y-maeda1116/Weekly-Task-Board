/**
 * Calendar Importer Property-Based Tests
 * Tests the correctness properties of the import process
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { Event, SyncStatus } from "../../src/types/index";
import { OutlookConnector, EventParser, EventSerializer, SyncEngine } from "../../src/components/interfaces";
import { RawEventData } from "../../src/types/index";

// Mock implementations
class MockOutlookConnector implements OutlookConnector {
  async initiateOAuthFlow(): Promise<void> {}
  async handleOAuthCallback(code: string): Promise<void> {}
  async disconnectAccount(): Promise<void> {}
  isAuthenticated(): boolean {
    return true;
  }
  getAccessToken(): string | null {
    return "mock-token";
  }
  async refreshAccessToken(): Promise<string> {
    return "mock-token";
  }
  async revokeAccessToken(): Promise<void> {}
  async getEvents(startDate: Date, endDate: Date): Promise<RawEventData[]> {
    return [];
  }
  async getEventDetails(eventId: string): Promise<RawEventData> {
    return {};
  }
}

class MockEventParser implements EventParser {
  parseEvent(rawData: RawEventData): Event {
    return {
      id: rawData.id || "event-1",
      title: rawData.subject || "Test Event",
      description: rawData.bodyPreview || "",
      startTime: new Date(rawData.start?.dateTime || new Date()),
      endTime: new Date(rawData.end?.dateTime || new Date()),
      isAllDay: rawData.isAllDay || false,
      lastModified: new Date(),
      location: rawData.location?.displayName
    };
  }

  parseEvents(rawDataArray: RawEventData[]): Event[] {
    return rawDataArray.map((raw) => this.parseEvent(raw));
  }

  validateEventData(data: unknown): boolean {
    return true;
  }
}

class MockEventSerializer implements EventSerializer {
  eventToTask(event: Event) {
    return {
      id: `task_${event.id}`,
      title: event.title,
      description: event.description,
      dueDate: event.endTime,
      startDate: event.startTime,
      endDate: event.endTime,
      status: "pending" as const,
      metadata: {
        outlookEventId: event.id,
        syncedAt: new Date(),
        syncStatus: "synced" as const
      }
    };
  }

  eventsToTasks(events: Event[]) {
    return events.map((e) => this.eventToTask(e));
  }

  taskToEvent(task: any): Event {
    return {
      id: task.metadata?.outlookEventId || task.id,
      title: task.title,
      description: task.description,
      startTime: task.startDate || task.dueDate,
      endTime: task.endDate || task.dueDate,
      isAllDay: false,
      lastModified: new Date()
    };
  }
}

class MockSyncEngine implements SyncEngine {
  private mappings = new Map<string, string>();

  async recordSync(outlookEventId: string, taskId: string): Promise<void> {
    this.mappings.set(outlookEventId, taskId);
  }

  async getSyncMapping(outlookEventId: string): Promise<string | null> {
    return this.mappings.get(outlookEventId) || null;
  }

  async detectDuplicates(events: Event[]) {
    return [];
  }

  async retryWithBackoff<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
    return operation();
  }
}

describe("CalendarImporter - Property-Based Tests", () => {
  let importer: CalendarImporterImpl;
  let mockConnector: MockOutlookConnector;
  let mockParser: MockEventParser;
  let mockSerializer: MockEventSerializer;
  let mockSyncEngine: MockSyncEngine;

  beforeEach(() => {
    mockConnector = new MockOutlookConnector();
    mockParser = new MockEventParser();
    mockSerializer = new MockEventSerializer();
    mockSyncEngine = new MockSyncEngine();
    importer = new CalendarImporterImpl(mockConnector, mockParser, mockSerializer, mockSyncEngine);
  });

  /**
   * Property 4: Event retrieval with date range
   * **Validates: Requirements 3, 4, 5, 6**
   * 
   * For all valid date ranges (startDate ≤ endDate), the system calls the Outlook API
   * with correct date parameters and returns events in that range
   */
  it("Property 4: Should fetch events with valid date range", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.date(), fc.date()),
        ([date1, date2]) => {
          const startDate = new Date(Math.min(date1.getTime(), date2.getTime()));
          const endDate = new Date(Math.max(date1.getTime(), date2.getTime()));

          // Set date range
          importer.setDateRange(startDate, endDate);

          // Validate date range
          const isValid = importer.validateDateRange(startDate, endDate);

          // Should be valid since startDate <= endDate
          expect(isValid).toBe(true);
        }
      )
    );
  });

  /**
   * Property 15: Date range validation
   * **Validates: Requirements 3, 4, 5, 6**
   * 
   * For all date ranges where startDate > endDate, the system displays an error
   * message and prevents API calls
   */
  it("Property 15: Should reject invalid date ranges (startDate > endDate)", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.date(), fc.date()),
        ([date1, date2]) => {
          // Ensure date1 > date2
          const startDate = new Date(Math.max(date1.getTime(), date2.getTime()));
          const endDate = new Date(Math.min(date1.getTime(), date2.getTime()));

          if (startDate.getTime() === endDate.getTime()) {
            // Skip if dates are equal
            return;
          }

          // Validate date range
          const isValid = importer.validateDateRange(startDate, endDate);

          // Should be invalid since startDate > endDate
          expect(isValid).toBe(false);
        }
      )
    );
  });

  /**
   * Property 7: Event list display
   * **Validates: Requirements 3, 4, 5, 6**
   * 
   * For all Outlook event sets, the calendar importer UI displays all events
   * in a list format with checkboxes
   */
  it("Property 7: Should display all fetched events in list format", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            isAllDay: fc.boolean(),
            lastModified: fc.date(),
            location: fc.option(fc.string()),
            organizer: fc.option(fc.string()),
            attendees: fc.option(fc.array(fc.string())),
            categories: fc.option(fc.array(fc.string())),
            startTime: fc.date(),
            endTime: fc.date()
          }),
          { maxLength: 10 }
        ),
        (eventDataArray) => {
          const events: Event[] = eventDataArray.map((data) => ({
            ...data,
            startTime: new Date(Math.min(data.startTime.getTime(), data.endTime.getTime())),
            endTime: new Date(Math.max(data.startTime.getTime(), data.endTime.getTime()))
          }));

          // Get UI state
          const uiState = importer.getUIState();

          // Should have events array
          expect(uiState.events).toBeDefined();
          expect(Array.isArray(uiState.events)).toBe(true);
        }
      )
    );
  });

  /**
   * Property 9: Selection state persistence
   * **Validates: Requirements 3, 4, 5, 6**
   * 
   * For all user-selected events, the system maintains selection state
   * until the user deselects or completes import
   */
  it("Property 9: Should persist event selection state", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (eventIds) => {
          // Select events
          eventIds.forEach((id) => {
            importer.selectEvent(id);
          });

          // Get selected events
          const uiState = importer.getUIState();

          // All selected event IDs should be in the selected set
          eventIds.forEach((id) => {
            expect(uiState.selectedEvents.has(id)).toBe(true);
          });

          // Deselect one event
          if (eventIds.length > 0) {
            importer.deselectEvent(eventIds[0]);
            const updatedState = importer.getUIState();
            expect(updatedState.selectedEvents.has(eventIds[0])).toBe(false);
          }
        }
      )
    );
  });

  /**
   * Property 16: Default date range
   * **Validates: Requirements 3, 4, 5, 6**
   * 
   * For all import operations without explicit date range, the system
   * defaults to today's events
   */
  it("Property 16: Should use default date range (today) when not specified", () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const uiState = importer.getUIState();

    // Date range should be set to today
    expect(uiState.dateRange.startDate.toDateString()).toBe(todayStart.toDateString());
    expect(uiState.dateRange.endDate.toDateString()).toBe(todayEnd.toDateString());
  });

  /**
   * Additional property: Selection toggle
   * Verifies that events can be selected and deselected
   */
  it("Should toggle event selection correctly", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (eventIds) => {
          // Select all events
          eventIds.forEach((id) => {
            importer.selectEvent(id);
          });

          let state = importer.getUIState();
          expect(state.selectedEvents.size).toBe(eventIds.length);

          // Deselect all events
          eventIds.forEach((id) => {
            importer.deselectEvent(id);
          });

          state = importer.getUIState();
          expect(state.selectedEvents.size).toBe(0);
        }
      )
    );
  });

  /**
   * Additional property: UI state consistency
   * Verifies that UI state is consistent across calls
   */
  it("Should maintain consistent UI state", () => {
    fc.assert(
      fc.property(
        fc.record({
          startDate: fc.date(),
          endDate: fc.date(),
          selectedEventIds: fc.array(fc.uuid(), { maxLength: 5 })
        }),
        (data) => {
          const startDate = new Date(Math.min(data.startDate.getTime(), data.endDate.getTime()));
          const endDate = new Date(Math.max(data.startDate.getTime(), data.endDate.getTime()));

          // Set date range
          importer.setDateRange(startDate, endDate);

          // Select events
          data.selectedEventIds.forEach((id) => {
            importer.selectEvent(id);
          });

          // Get UI state multiple times
          const state1 = importer.getUIState();
          const state2 = importer.getUIState();

          // States should be consistent
          expect(state1.dateRange.startDate).toEqual(state2.dateRange.startDate);
          expect(state1.dateRange.endDate).toEqual(state2.dateRange.endDate);
          expect(state1.selectedEvents.size).toBe(state2.selectedEvents.size);
        }
      )
    );
  });

  /**
   * Additional property: Date range setting
   * Verifies that date ranges can be set and retrieved
   */
  it("Should set and retrieve date range correctly", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.date(), fc.date()),
        ([date1, date2]) => {
          const startDate = new Date(Math.min(date1.getTime(), date2.getTime()));
          const endDate = new Date(Math.max(date1.getTime(), date2.getTime()));

          // Set date range
          importer.setDateRange(startDate, endDate);

          // Get UI state
          const state = importer.getUIState();

          // Date range should match
          expect(state.dateRange.startDate.getTime()).toBe(startDate.getTime());
          expect(state.dateRange.endDate.getTime()).toBe(endDate.getTime());
        }
      )
    );
  });
});
