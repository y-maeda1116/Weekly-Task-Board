/**
 * Outlook Connector - Property-Based Tests
 * Tests for OAuth flow, token storage, and disconnection
 * 
 * **Validates: Requirements 1**
 */

import { OutlookConnectorImpl } from "../../src/components/OutlookConnector";

describe("OutlookConnector - Property-Based Tests", () => {
  let connector: OutlookConnectorImpl;

  beforeEach(() => {
    connector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
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
        expect(window.location.href).toContain("login.microsoftonline.com");
        expect(window.location.href).toContain("client_id=test-client-id");
        expect(window.location.href).toContain("response_type=code");
        expect(window.location.href).toContain("Calendars.Read");
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
        expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/callback");
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.get("scope")).toContain("Calendars.Read");
        expect(url.searchParams.get("scope")).toContain("offline_access");
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
        if (url.includes("/logout")) {
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
        if (url.includes("/logout")) {
          // Simulate revocation failure
          return Promise.reject(new Error("Revocation failed"));
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Authenticate
      await connector.handleOAuthCallback("test-auth-code");
      expect(connector.isAuthenticated()).toBe(true);

      // Disconnect (should not throw even if revocation fails)
      await connector.disconnectAccount();

      // Verify tokens are still cleared
      expect(connector.getAccessToken()).toBeNull();
      expect(connector.isAuthenticated()).toBe(false);
    });

    it("should handle disconnect when not authenticated", async () => {
      // Should not throw error
      await expect(connector.disconnectAccount()).resolves.not.toThrow();
      expect(connector.isAuthenticated()).toBe(false);
    });
  });
});
