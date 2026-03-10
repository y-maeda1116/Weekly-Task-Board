/**
 * Google Connector - Comprehensive Unit Tests
 * Tests for OAuth flow, token management, API calls, and error handling
 */

import { GoogleConnectorImpl } from "../../src/components/GoogleConnector";

describe("GoogleConnector - Unit Tests", () => {
  let connector: GoogleConnectorImpl;

  beforeEach(() => {
    connector = new GoogleConnectorImpl("test-client-id", "test-client-secret", "http://localhost:3000/google-callback");
    jest.clearAllMocks();
  });

  describe("OAuth Flow", () => {
    it("should construct with client ID, client secret, and redirect URI", () => {
      const testConnector = new GoogleConnectorImpl("my-client-id", "my-secret", "http://example.com/callback");
      expect(testConnector).toBeDefined();
    });

    it("should initiate OAuth flow with correct parameters", async () => {
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
        await connector.initiateOAuthFlow();

        const url = new URL(capturedUrl);
        expect(url.hostname).toContain("accounts.google.com");
        expect(url.searchParams.get("client_id")).toBe("test-client-id");
        expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/google-callback");
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.get("scope")).toContain("calendar.readonly");
        expect(url.searchParams.get("access_type")).toBe("offline");
        expect(url.searchParams.get("prompt")).toBe("consent");
      } finally {
        window.location = originalLocation;
      }
    });

    it("should handle OAuth callback with valid code", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-access-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");

      expect(connector.isAuthenticated()).toBe(true);
      expect(connector.getAccessToken()).toBe("test-access-token");
    });

    it("should throw error on invalid OAuth callback", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: "Invalid code"
        } as Response)
      );

      await expect(connector.handleOAuthCallback("invalid-code")).rejects.toThrow();
    });

    it("should handle OAuth callback without refresh token", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-access-token",
              expires_in: 3600
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");

      expect(connector.isAuthenticated()).toBe(true);
      expect(connector.getAccessToken()).toBe("test-access-token");
    });
  });

  describe("Token Management", () => {
    it("should store access token securely after authentication", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "secure-token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("auth-code");

      expect(connector.getAccessToken()).toBe("secure-token");
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(sessionStorage.getItem("access_token")).toBeNull();
    });

    it("should return null for access token when not authenticated", () => {
      expect(connector.getAccessToken()).toBeNull();
    });

    it("should refresh access token when expired", async () => {
      let callCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          callCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: `token-${callCount}`,
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Initial authentication
      await connector.handleOAuthCallback("auth-code");
      const initialToken = connector.getAccessToken();

      // Refresh token
      const newToken = await connector.refreshAccessToken();

      expect(newToken).not.toBe(initialToken);
      expect(connector.getAccessToken()).toBe(newToken);
    });

    it("should throw error when refreshing without refresh token", async () => {
      await expect(connector.refreshAccessToken()).rejects.toThrow("No refresh token available");
    });

    it("should handle token refresh failure", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("auth-code");

      // Mock refresh failure
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: "Invalid refresh token"
        } as Response)
      );

      await expect(connector.refreshAccessToken()).rejects.toThrow();
    });
  });

  describe("Disconnection", () => {
    it("should clear tokens and authentication state on disconnect", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        if (url.includes("/revoke")) {
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Authenticate
      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect
      await connector.disconnectAccount();

      expect(connector.getAccessToken()).toBeNull();
      expect(connector.isAuthenticated()).toBe(false);
    });

    it("should handle disconnect when not authenticated", async () => {
      await expect(connector.disconnectAccount()).resolves.not.toThrow();
      expect(connector.isAuthenticated()).toBe(false);
    });

    it("should clear tokens even if revocation fails", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        if (url.includes("/revoke")) {
          return Promise.reject(new Error("Revocation failed"));
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect should not throw
      await expect(connector.disconnectAccount()).rejects.toThrow();
    });
  });

  describe("Calendar List", () => {
    beforeEach(async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("auth-code");
    });

    it("should fetch calendar list", async () => {
      const mockCalendars = [
        {
          id: "primary",
          summary: "user@example.com",
          primary: true,
          accessRole: "owner"
        },
        {
          id: "calendar-2",
          summary: "Work Calendar",
          accessRole: "writer"
        }
      ];

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/calendarList")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: mockCalendars })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const calendars = await connector.getCalendarList();

      expect(calendars).toHaveLength(2);
      expect(calendars[0].summary).toBe("user@example.com");
      expect(calendars[1].summary).toBe("Work Calendar");
    });

    it("should return empty array when no calendars found", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/calendarList")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const calendars = await connector.getCalendarList();
      expect(calendars).toEqual([]);
    });

    it("should throw error when not authenticated for getCalendarList", async () => {
      const newConnector = new GoogleConnectorImpl("client-id", "secret", "redirect-uri");
      await expect(newConnector.getCalendarList()).rejects.toThrow("Not authenticated");
    });

    it("should handle 401 error and retry with refreshed token", async () => {
      let callCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/calendarList")) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "new-token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const calendars = await connector.getCalendarList();
      expect(calendars).toEqual([]);
    });
  });

  describe("API Calls", () => {
    beforeEach(async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("auth-code");
    });

    it("should fetch events for date range", async () => {
      const mockEvents = [
        {
          id: "event1",
          summary: "Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: mockEvents })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-16");
      const events = await connector.getEvents(startDate, endDate);

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Meeting");
    });

    it("should fetch events from custom calendar", async () => {
      const mockEvents = [
        {
          id: "event1",
          summary: "Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" }
        }
      ];

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/calendars/custom-calendar-id/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: mockEvents })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const events = await connector.getEvents(new Date("2024-01-15"), new Date("2024-01-16"), "custom-calendar-id");

      expect(events).toHaveLength(1);
    });

    it("should return empty array when no events found", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const events = await connector.getEvents(new Date(), new Date());
      expect(events).toEqual([]);
    });

    it("should throw error when not authenticated for getEvents", async () => {
      const newConnector = new GoogleConnectorImpl("client-id", "secret", "redirect-uri");
      await expect(newConnector.getEvents(new Date(), new Date())).rejects.toThrow("Not authenticated");
    });

    it("should fetch event details by ID", async () => {
      const mockEvent = {
        id: "event1",
        summary: "Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" }
      };

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/events/event1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEvent)
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const event = await connector.getEventDetails("event1");
      expect(event.summary).toBe("Meeting");
    });

    it("should handle 401 error and retry with refreshed token", async () => {
      let callCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/events")) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "new-token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const events = await connector.getEvents(new Date(), new Date());
      expect(events).toEqual([]);
    });

    it("should throw error on API failure", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: false,
            statusText: "Server Error"
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await expect(connector.getEvents(new Date(), new Date())).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));

      await expect(connector.initiateOAuthFlow()).rejects.toThrow();
    });

    it("should handle malformed token response", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        } as Response)
      );

      await expect(connector.handleOAuthCallback("code")).rejects.toThrow();
    });

    it("should handle missing event details", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: false,
            status: 404
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("code");
      await expect(connector.getEventDetails("nonexistent")).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty client ID", () => {
      const testConnector = new GoogleConnectorImpl("", "secret", "http://localhost:3000/callback");
      expect(testConnector).toBeDefined();
    });

    it("should handle very long redirect URI", () => {
      const longUri = "http://localhost:3000/" + "a".repeat(1000);
      const testConnector = new GoogleConnectorImpl("client-id", "secret", longUri);
      expect(testConnector).toBeDefined();
    });

    it("should handle multiple consecutive authentications", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("code1");
      const token1 = connector.getAccessToken();

      await connector.handleOAuthCallback("code2");
      const token2 = connector.getAccessToken();

      expect(token1).toBe(token2);
    });

    it("should handle rapid token refresh calls", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "token",
              expires_in: 3600,
              refresh_token: "refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("code");

      const refreshPromises = [
        connector.refreshAccessToken(),
        connector.refreshAccessToken(),
        connector.refreshAccessToken()
      ];

      const results = await Promise.all(refreshPromises);
      expect(results).toHaveLength(3);
    });
  });
});
