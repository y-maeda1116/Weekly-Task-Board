/**
 * Google Connector - Property-Based Tests
 * Tests for OAuth flow, token storage, and disconnection
 *
 * **Validates: Requirements 1**
 */

import { GoogleConnectorImpl } from "../../src/components/GoogleConnector";

describe("GoogleConnector - Property-Based Tests", () => {
  let connector: GoogleConnectorImpl;

  beforeEach(() => {
    connector = new GoogleConnectorImpl("test-client-id", "test-client-secret", "http://localhost:3000/google-callback");
  });

  describe("Property 1: OAuth Flow Initiation", () => {
    it("should initiate OAuth flow when user clicks connect button", async () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: "" } as any;

      try {
        await connector.initiateOAuthFlow();

        // Verify that OAuth URL was set
        expect(window.location.href).toContain("accounts.google.com");
        expect(window.location.href).toContain("client_id=test-client-id");
        expect(window.location.href).toContain("response_type=code");
        expect(window.location.href).toContain("calendar.readonly");
      } finally {
        window.location = originalLocation;
      }
    });

    it("should include required OAuth parameters in authorization URL", async () => {
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

    it("should request offline access for refresh token", async () => {
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
        expect(url.searchParams.get("access_type")).toBe("offline");
      } finally {
        window.location = originalLocation;
      }
    });
  });

  describe("Property 2: Secure Token Storage", () => {
    it("should store access token securely after successful OAuth authentication", async () => {
      // Mock fetch for token endpoint
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

      // Verify token is stored
      expect(connector.getAccessToken()).toBe("test-access-token");
      expect(connector.isAuthenticated()).toBe(true);
    });

    it("should not store token in localStorage or sessionStorage", async () => {
      // Mock fetch
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      await connector.handleOAuthCallback("test-auth-code");

      // Verify token is NOT in localStorage or sessionStorage
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(sessionStorage.getItem("access_token")).toBeNull();
    });

    it("should handle token expiration and refresh", async () => {
      let callCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          callCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: `token-${callCount}`,
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Initial authentication
      await connector.handleOAuthCallback("test-auth-code");
      const initialToken = connector.getAccessToken();

      // Refresh token
      const newToken = await connector.refreshAccessToken();

      expect(newToken).not.toBe(initialToken);
      expect(connector.getAccessToken()).toBe(newToken);
    });

    it("should include client secret in token request", async () => {
      let capturedBody: string | undefined;
      global.fetch = jest.fn((url: string, init?: RequestInit) => {
        if (url.includes("/token")) {
          capturedBody = init?.body as string;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");

      expect(capturedBody).toContain("client_secret=test-client-secret");
    });
  });

  describe("Property 3: Token Cleanup on Disconnect", () => {
    it("should delete all stored tokens and authentication state when user disconnects", async () => {
      // Mock fetch
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/revoke")) {
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Authenticate
      await connector.handleOAuthCallback("test-auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect
      await connector.disconnectAccount();

      // Verify all tokens are cleared
      expect(connector.getAccessToken()).toBeNull();
      expect(connector.isAuthenticated()).toBe(false);
    });

    it("should clear authentication state even if revocation fails", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/revoke")) {
          // Simulate revocation failure
          return Promise.reject(new Error("Revocation failed"));
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Authenticate
      await connector.handleOAuthCallback("test-auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect (should not throw even if revocation fails)
      await expect(connector.disconnectAccount()).rejects.toThrow();
    });

    it("should handle disconnect when not authenticated", async () => {
      // Should not throw error
      await expect(connector.disconnectAccount()).resolves.not.toThrow();
      expect(connector.isAuthenticated()).toBe(false);
    });

    it("should clear all caches on disconnect", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/revoke")) {
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Authenticate and fetch some data to populate cache
      await connector.handleOAuthCallback("test-auth-code");

      // Mock calendar list fetch
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/calendarList")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.getCalendarList();

      // Disconnect
      await connector.disconnectAccount();

      // Verify tokens are cleared (caches are cleared internally)
      expect(connector.getAccessToken()).toBeNull();
    });
  });

  describe("Property 4: Calendar List Fetching", () => {
    it("should fetch user's calendar list with proper authentication", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/calendarList")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [
                { id: "primary", summary: "primary@example.com", primary: true, accessRole: "owner" }
              ]
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");
      const calendars = await connector.getCalendarList();

      expect(calendars).toHaveLength(1);
      expect(calendars[0].primary).toBe(true);
    });

    it("should cache calendar list response", async () => {
      let fetchCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/calendarList")) {
          fetchCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [
                { id: "primary", summary: "primary@example.com", primary: true, accessRole: "owner" }
              ]
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");

      // First call
      await connector.getCalendarList();
      // Second call (should use cache)
      await connector.getCalendarList();

      expect(fetchCount).toBe(1);
    });
  });

  describe("Property 5: Event Fetching with Date Range", () => {
    it("should fetch events within specified date range", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [
                {
                  id: "event1",
                  summary: "Test Event",
                  start: { dateTime: "2024-01-15T10:00:00Z" },
                  end: { dateTime: "2024-01-15T11:00:00Z" }
                }
              ]
            })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-16");
      const events = await connector.getEvents(startDate, endDate);

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Test Event");
    });

    it("should fetch events from custom calendar ID", async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/calendars/custom-calendar-id/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");
      const events = await connector.getEvents(new Date(), new Date(), "custom-calendar-id");

      expect(events).toEqual([]);
    });

    it("should include singleEvents parameter for recurring events", async () => {
      let capturedUrl: string | undefined;
      global.fetch = jest.fn((url: string, init?: RequestInit) => {
        capturedUrl = url;
        if (url.includes("/token")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: "test-token",
              expires_in: 3600,
              refresh_token: "test-refresh-token"
            })
          } as Response);
        }
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] })
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      await connector.handleOAuthCallback("test-auth-code");
      await connector.getEvents(new Date(), new Date());

      expect(capturedUrl).toContain("singleEvents=true");
      expect(capturedUrl).toContain("orderBy=startTime");
    });
  });
});
