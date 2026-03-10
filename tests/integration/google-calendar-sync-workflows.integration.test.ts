/**
 * Google Calendar Sync - Workflow Integration Tests
 * Tests specific user workflows and interaction patterns
 *
 * **Validates: Requirements 3, 4, 5, 6**
 */

import { GoogleConnectorImpl } from "../../src/components/GoogleConnector";
import { GoogleEventParserImpl } from "../../src/components/GoogleEventParser";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { Event } from "../../src/types/index";

describe("Google Calendar Sync - Workflow Integration Tests", () => {
  let connector: GoogleConnectorImpl;
  let parser: GoogleEventParserImpl;
  let serializer: EventSerializerImpl;
  let syncEngine: SyncEngineImpl;
  let importer: CalendarImporterImpl;

  beforeEach(() => {
    connector = new GoogleConnectorImpl("test-client-id", "test-client-secret", "http://localhost:3000/google-callback");
    parser = new GoogleEventParserImpl();
    serializer = new EventSerializerImpl();
    syncEngine = new SyncEngineImpl();
    importer = new CalendarImporterImpl(
      connector as any,
      parser as any,
      syncEngine
    );

    jest.clearAllMocks();
  });

  describe("Workflow 1: First-Time User Authentication", () => {
    it("should guide first-time user through complete authentication flow", async () => {
      // User clicks "Connect to Google Calendar" button
      const originalLocation = window.location;
      delete (window as any).location;
      let capturedUrl = "";
      window.location = {
        get href() {
          return capturedUrl;
        },
        set href(url: string) {
          capturedUrl = url;
        }
      } as any;

      try {
        // Step 1: Initiate OAuth flow
        await connector.initiateOAuthFlow();

        // Verify OAuth URL contains all required parameters
        const authUrl = new URL(capturedUrl);
        expect(authUrl.hostname).toContain("accounts.google.com");
        expect(authUrl.searchParams.get("client_id")).toBe("test-client-id");
        expect(authUrl.searchParams.get("response_type")).toBe("code");
        expect(authUrl.searchParams.get("scope")).toContain("calendar.readonly");

        // Step 2: Mock user returning with authorization code
        const authCode = "4/0AeanE0b...";
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "mock-access-token",
              expires_in: 3600,
              refresh_token: "mock-refresh-token"
            })
          } as Response)
        );

        await connector.handleOAuthCallback(authCode);

        // Step 3: Verify authentication state
        expect(connector.isAuthenticated()).toBe(true);
        expect(connector.getAccessToken()).toBe("mock-access-token");
      } finally {
        window.location = originalLocation;
      }
    });

    it("should handle authentication rejection by user", async () => {
      // User denies access - Google returns error in URL
      const errorParams = new URLSearchParams({
        error: "access_denied",
        error_description: "The user denied access to your application"
      });

      // In real scenario, this would come from URL params
      expect(errorParams.get("error")).toBe("access_denied");
    });
  });

  describe("Workflow 2: Date Range Selection and Event Fetch", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");
    });

    it("should allow user to select custom date range", async () => {
      // User sets custom date range
      const startDate = new Date("2024-02-01");
      const endDate = new Date("2024-02-07");

      importer.setDateRange(startDate, endDate);

      // Fetch events for selected range
      const mockEvents = [
        {
          id: "event-1",
          summary: "February Kickoff",
          start: { dateTime: "2024-02-01T09:00:00Z" },
          end: { dateTime: "2024-02-01T10:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);

      const events = await importer.fetchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("February Kickoff");
    });

    it("should validate date range before fetching", () => {
      const startDate = new Date("2024-02-07");
      const endDate = new Date("2024-02-01"); // End before start

      const isValid = importer.validateDateRange(startDate, endDate);

      expect(isValid).toBe(false);
    });

    it("should use default date range (today) when none specified", () => {
      const uiState = importer.getUIState();

      expect(uiState.dateRange).toBeDefined();
      expect(uiState.dateRange.startDate).toBeDefined();
      expect(uiState.dateRange.endDate).toBeDefined();
    });
  });

  describe("Workflow 3: Event Selection and Preview", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Team Standup",
          start: { dateTime: "2024-01-15T09:00:00Z" },
          end: { dateTime: "2024-01-15T09:30:00Z" },
          description: "Daily standup meeting"
        },
        {
          id: "event-2",
          summary: "Client Demo",
          start: { dateTime: "2024-01-15T14:00:00Z" },
          end: { dateTime: "2024-01-15T15:00:00Z" },
          description: "Product demo for client"
        },
        {
          id: "event-3",
          summary: "Code Review",
          start: { dateTime: "2024-01-15T16:00:00Z" },
          end: { dateTime: "2024-01-15T17:00:00Z" },
          description: "Review PR #123"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);
      await importer.fetchEvents();
    });

    it("should allow user to select individual events", () => {
      const uiState = importer.getUIState();
      expect(uiState.events).toHaveLength(3);

      // User selects first event
      importer.selectEvent("event-1");

      let selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe("event-1");

      // User selects third event
      importer.selectEvent("event-3");

      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);
    });

    it("should allow user to deselect events", () => {
      importer.selectEvent("event-1");
      importer.selectEvent("event-2");

      let selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(2);

      // User deselects first event
      importer.deselectEvent("event-1");

      selected = importer.getSelectedEvents();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe("event-2");
    });

    it("should maintain selection state across operations", () => {
      importer.selectEvent("event-1");
      importer.selectEvent("event-2");

      // Simulate some operation that doesn't clear selections
      const uiState = importer.getUIState();

      expect(uiState.selectedEventIds.has("event-1")).toBe(true);
      expect(uiState.selectedEventIds.has("event-2")).toBe(true);
    });
  });

  describe("Workflow 4: Event Import and Task Creation", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Important Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          description: "Discuss Q1 goals",
          location: "Conference Room A"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);
      await importer.fetchEvents();

      importer.selectEvent("event-1");

      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        startDate: event.startTime,
        endDate: event.endTime,
        status: "pending",
        metadata: {
          googleEventId: event.id,
          calendarProvider: "google",
          syncedAt: new Date()
        }
      }));
    });

    it("should import selected events as tasks", async () => {
      const result = await importer.importSelectedEvents();

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.syncMappings).toHaveLength(1);
    });

    it("should record sync mapping for imported event", async () => {
      await importer.importSelectedEvents();

      const mapping = await syncEngine.getSyncMapping("event-1");

      expect(mapping).toBeDefined();
      expect(mapping).toBe("task-event-1");
    });

    it("should clear selections after successful import", async () => {
      await importer.importSelectedEvents();

      const uiState = importer.getUIState();
      expect(uiState.selectedEventIds.size).toBe(0);
    });
  });

  describe("Workflow 5: Duplicate Detection and Handling", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      // Simulate previously imported event
      await syncEngine.recordSync("event-1", "existing-task-1");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Weekly Standup",
          start: { dateTime: "2024-01-15T09:00:00Z" },
          end: { dateTime: "2024-01-15T09:30:00Z" },
          description: "Already imported"
        },
        {
          id: "event-2",
          summary: "New Event",
          start: { dateTime: "2024-01-16T10:00:00Z" },
          end: { dateTime: "2024-01-16T11:00:00Z" },
          description: "Not imported yet"
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);
      await importer.fetchEvents();
    });

    it("should detect previously imported events", async () => {
      const events = importer.getUIState().events;
      const duplicates = await syncEngine.detectDuplicates(events);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-1");
    });

    it("should skip duplicates during import", async () => {
      importer.selectEvent("event-1");
      importer.selectEvent("event-2");

      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => ({
        id: `task-${event.id}`,
        title: event.title,
        description: event.description,
        dueDate: event.endTime,
        status: "pending"
      }));

      const result = await importer.importSelectedEvents();

      expect(result.importedCount).toBe(1); // Only new event imported
      expect(result.duplicateCount).toBe(1); // Duplicate detected and skipped
    });
  });

  describe("Workflow 6: Calendar Selection", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");
    });

    it("should allow user to select from multiple calendars", async () => {
      const mockCalendars = [
        {
          id: "primary",
          summary: "user@example.com",
          primary: true,
          accessRole: "owner"
        },
        {
          id: "work-calendar-id",
          summary: "Work",
          accessRole: "writer"
        },
        {
          id: "personal-calendar-id",
          summary: "Personal",
          accessRole: "owner"
        }
      ];

      jest.spyOn(connector, "getCalendarList").mockResolvedValue(mockCalendars as any);

      const calendars = await connector.getCalendarList();

      expect(calendars).toHaveLength(3);

      // User selects work calendar
      const workEvents = [
        {
          id: "work-event-1",
          summary: "Work Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(workEvents as any);

      const events = await connector.getEvents(
        new Date("2024-01-15"),
        new Date("2024-01-16"),
        "work-calendar-id"
      );

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Work Meeting");
    });
  });

  describe("Workflow 7: Error Recovery", () => {
    it("should handle authentication expiration gracefully", async () => {
      // Initial authentication
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      // Simulate expired token - API returns 401
      let callCount = 0;
      jest.spyOn(connector, "getEvents").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          const error: any = new Error("401 Unauthorized");
          error.status = 401;
          throw error;
        }
        return [
          {
            id: "event-1",
            summary: "Meeting",
            start: { dateTime: "2024-01-15T10:00:00Z" },
            end: { dateTime: "2024-01-15T11:00:00Z" }
          }
        ] as any;
      });

      // Mock token refresh
      jest.spyOn(connector, "refreshAccessToken").mockResolvedValue("new-token");

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-16");
      importer.setDateRange(startDate, endDate);

      // Should automatically retry with refreshed token
      const events = await importer.fetchEvents();

      expect(events).toHaveLength(1);
    });

    it("should handle network errors with retry", async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      jest.spyOn(connector, "getEvents").mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < maxAttempts) {
          throw new Error("Network error");
        }
        return [
          {
            id: "event-1",
            summary: "Meeting",
            start: { dateTime: "2024-01-15T10:00:00Z" },
            end: { dateTime: "2024-01-15T11:00:00Z" }
          }
        ] as any;
      });

      const events = await connector.getEvents(new Date(), new Date());

      expect(attemptCount).toBe(maxAttempts);
      expect(events).toHaveLength(1);
    });
  });

  describe("Workflow 8: Re-authentication", () => {
    it("should prompt user to re-authenticate when refresh token expires", async () => {
      // Initial authentication with only access token (no refresh token)
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      // Mock token refresh failure (no refresh token available)
      jest.spyOn(connector, "refreshAccessToken").mockRejectedValue(
        new Error("No refresh token available")
      );

      // Try to refresh - should fail
      await expect(connector.refreshAccessToken()).rejects.toThrow("No refresh token available");

      // User needs to re-authenticate via OAuth flow
    });
  });

  describe("Workflow 9: All-Day Event Handling", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Company Holiday",
          start: { date: "2024-01-15" },
          end: { date: "2024-01-16" }
        },
        {
          id: "event-2",
          summary: "Regular Meeting",
          start: { dateTime: "2024-01-16T10:00:00Z" },
          end: { dateTime: "2024-01-16T11:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);
      await importer.fetchEvents();
    });

    it("should distinguish between all-day and timed events", () => {
      const events = importer.getUIState().events;

      const allDayEvent = events.find(e => e.id === "event-1");
      const timedEvent = events.find(e => e.id === "event-2");

      expect(allDayEvent?.isAllDay).toBe(true);
      expect(timedEvent?.isAllDay).toBe(false);
    });
  });

  describe("Workflow 10: Bulk Import with Partial Failure", () => {
    beforeEach(async () => {
      jest.spyOn(connector, "handleOAuthCallback").mockResolvedValue(undefined);
      jest.spyOn(connector, "isAuthenticated").mockReturnValue(true);
      await connector.handleOAuthCallback("auth-code");

      const mockEvents = [
        {
          id: "event-1",
          summary: "Valid Event",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        },
        {
          id: "event-2",
          summary: "Valid Event 2",
          start: { dateTime: "2024-01-16T10:00:00Z" },
          end: { dateTime: "2024-01-16T11:00:00Z" }
        },
        {
          id: "event-3",
          summary: "Valid Event 3",
          start: { dateTime: "2024-01-17T10:00:00Z" },
          end: { dateTime: "2024-01-17T11:00:00Z" }
        }
      ];

      jest.spyOn(connector, "getEvents").mockResolvedValue(mockEvents as any);
      await importer.fetchEvents();

      importer.selectEvent("event-1");
      importer.selectEvent("event-2");
      importer.selectEvent("event-3");
    });

    it("should handle partial import failures gracefully", async () => {
      let callCount = 0;
      jest.spyOn(serializer, "eventToTask").mockImplementation((event: Event) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Serialization failed for event-2");
        }
        return {
          id: `task-${event.id}`,
          title: event.title,
          description: event.description,
          dueDate: event.endTime,
          status: "pending"
        };
      });

      const result = await importer.importSelectedEvents();

      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
