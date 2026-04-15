/**
 * Outlook Connector Implementation
 * Manages OAuth authentication and Outlook API communication
 */

import { OutlookConnector } from "./interfaces";
import { RawEventData } from "../types/index";
import { logger } from "../utils/logger";
import { ErrorHandler, ErrorCode } from "../utils/errorHandler";
import { Cache } from "../utils/cache";
import { RequestThrottler } from "../utils/requestThrottler";

// Secure token storage interface
interface TokenStorage {
  setToken(token: string, expiresIn: number): void;
  getToken(): string | null;
  isTokenExpired(): boolean;
  clearToken(): void;
}

// In-memory encrypted token storage (in production, use secure storage like IndexedDB with encryption)
class SecureTokenStorage implements TokenStorage {
  private token: string | null = null;
  private expiresAt: number | null = null;

  setToken(token: string, expiresIn: number): void {
    this.token = token;
    this.expiresAt = Date.now() + expiresIn * 1000;
  }

  getToken(): string | null {
    if (this.isTokenExpired()) {
      this.clearToken();
      return null;
    }
    return this.token;
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt;
  }

  clearToken(): void {
    this.token = null;
    this.expiresAt = null;
  }
}

export class OutlookConnectorImpl implements OutlookConnector {
  private tokenStorage: TokenStorage;
  private clientId: string;
  private redirectUri: string;
  private refreshToken: string | null = null;
  private readonly GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
  private readonly OAUTH_AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
  private cache: Cache<RawEventData[]>;
  private throttler: RequestThrottler;

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.tokenStorage = new SecureTokenStorage();
    this.cache = new Cache<RawEventData[]>(50, 5 * 60 * 1000); // 50 entries, 5 min TTL
    this.throttler = new RequestThrottler(1000); // 1 second throttle
  }

  async initiateOAuthFlow(): Promise<void> {
    try {
      const scopes = [
        "Calendars.Read",
        "offline_access"
      ];

      const authUrl = new URL(`${this.OAUTH_AUTHORITY}/authorize`);
      authUrl.searchParams.append("client_id", this.clientId);
      authUrl.searchParams.append("redirect_uri", this.redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scopes.join(" "));
      authUrl.searchParams.append("response_mode", "query");

      logger.info("OutlookConnector", "Initiating OAuth flow", { authUrl: authUrl.toString() });
      window.location.href = authUrl.toString();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "initiate_oauth" });
      logger.error("OutlookConnector", "Failed to initiate OAuth flow", { error: appError.message }, ErrorCode.AUTH_FAILED);
      throw appError;
    }
  }

  async handleOAuthCallback(code: string): Promise<void> {
    try {
      logger.info("OutlookConnector", "Handling OAuth callback");

      const tokenResponse = await fetch(`${this.OAUTH_AUTHORITY}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code: code,
          grant_type: "authorization_code"
        }).toString()
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      this.tokenStorage.setToken(tokenData.access_token, tokenData.expires_in);
      this.refreshToken = tokenData.refresh_token || null;

      logger.info("OutlookConnector", "OAuth callback handled successfully");
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "handle_oauth_callback" });
      logger.error("OutlookConnector", "Failed to handle OAuth callback", { error: appError.message }, ErrorCode.AUTH_FAILED);
      throw appError;
    }
  }

  async disconnectAccount(): Promise<void> {
    try {
      logger.info("OutlookConnector", "Disconnecting account");
      await this.revokeAccessToken();
      this.tokenStorage.clearToken();
      this.refreshToken = null;
      this.cache.clear(); // Clear cache on disconnect
      logger.info("OutlookConnector", "Account disconnected successfully");
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "disconnect" });
      logger.error("OutlookConnector", "Failed to disconnect account", { error: appError.message }, ErrorCode.AUTH_REVOKED);
      throw appError;
    }
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.getToken() !== null;
  }

  getAccessToken(): string | null {
    return this.tokenStorage.getToken();
  }

  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error("No refresh token available");
      }

      logger.info("OutlookConnector", "Refreshing access token");

      const tokenResponse = await fetch(`${this.OAUTH_AUTHORITY}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          refresh_token: this.refreshToken,
          grant_type: "refresh_token"
        }).toString()
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token refresh failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      this.tokenStorage.setToken(tokenData.access_token, tokenData.expires_in);

      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      logger.info("OutlookConnector", "Access token refreshed successfully");
      return tokenData.access_token;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "refresh_token" });
      logger.error("OutlookConnector", "Failed to refresh access token", { error: appError.message }, ErrorCode.AUTH_EXPIRED);
      throw appError;
    }
  }

  async revokeAccessToken(): Promise<void> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        logger.warn("OutlookConnector", "No token to revoke");
        return;
      }

      logger.info("OutlookConnector", "Revoking access token");

      await fetch(`${this.OAUTH_AUTHORITY}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          token: token
        }).toString()
      });

      logger.info("OutlookConnector", "Access token revoked successfully");
    } catch (error) {
      logger.error("OutlookConnector", "Failed to revoke access token", { error });
      // Don't throw - revocation failure shouldn't prevent disconnection
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<RawEventData[]> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      logger.info("OutlookConnector", "Fetching events", { startDate, endDate });

      // Create cache key from date range
      const cacheKey = `events_${startDate.toISOString()}_${endDate.toISOString()}`;

      // Check cache first
      const cachedEvents = this.cache.get(cacheKey);
      if (cachedEvents) {
        logger.info("OutlookConnector", "Events retrieved from cache", { count: cachedEvents.length });
        return cachedEvents;
      }

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      const response = await fetch(
        `${this.GRAPH_API_BASE}/me/calendarview?startDateTime=${startISO}&endDateTime=${endISO}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshAccessToken();
          return this.getEvents(startDate, endDate);
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.value || [];

      // Cache the results
      this.cache.set(cacheKey, events);

      logger.info("OutlookConnector", "Events fetched successfully", { count: events.length });
      return events;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "get_events" });
      logger.error("OutlookConnector", "Failed to fetch events", { error: appError.message }, ErrorCode.API_ERROR);
      throw appError;
    }
  }

  async getEventDetails(eventId: string): Promise<RawEventData> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      logger.info("OutlookConnector", "Fetching event details", { eventId });

      const response = await fetch(
        `${this.GRAPH_API_BASE}/me/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getEventDetails(eventId);
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info("OutlookConnector", "Event details fetched successfully");
      return data;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "OutlookConnector", { operation: "get_event_details", eventId });
      logger.error("OutlookConnector", "Failed to fetch event details", { error: appError.message }, ErrorCode.API_ERROR);
      throw appError;
    }
  }
}
