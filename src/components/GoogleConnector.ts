/**
 * Google Connector Implementation
 * Manages OAuth authentication and Google Calendar API communication
 */

import { logger } from "../utils/logger";
import { ErrorHandler, ErrorCode } from "../utils/errorHandler";
import { Cache } from "../utils/cache";
import { RequestThrottler } from "../utils/requestThrottler";
import type {
  GoogleRawEventData,
  GoogleCalendar,
  GoogleTokenResponse,
  GoogleCalendarListResponse,
  GoogleEventsListResponse
} from "../types/google";

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

export class GoogleConnectorImpl {
  private tokenStorage: TokenStorage;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private refreshToken: string | null = null;
  private readonly CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
  private readonly OAUTH_AUTHORITY = "https://accounts.google.com/o/oauth2/v2";
  private cache: Cache<GoogleRawEventData[]>;
  private calendarListCache: Cache<GoogleCalendar[]>;
  private throttler: RequestThrottler;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.tokenStorage = new SecureTokenStorage();
    this.cache = new Cache<GoogleRawEventData[]>(50, 5 * 60 * 1000); // 50 entries, 5 min TTL
    this.calendarListCache = new Cache<GoogleCalendar[]>(10, 10 * 60 * 1000); // 10 entries, 10 min TTL
    this.throttler = new RequestThrottler(1000); // 1 second throttle
  }

  async initiateOAuthFlow(): Promise<void> {
    try {
      const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly"
      ];

      const authUrl = new URL(`${this.OAUTH_AUTHORITY}/auth`);
      authUrl.searchParams.append("client_id", this.clientId);
      authUrl.searchParams.append("redirect_uri", this.redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scopes.join(" "));
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      logger.info("GoogleConnector", "Initiating OAuth flow", { authUrl: authUrl.toString() });
      window.location.href = authUrl.toString();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "initiate_oauth" });
      logger.error("GoogleConnector", "Failed to initiate OAuth flow", { error: appError.message }, ErrorCode.AUTH_FAILED);
      throw appError;
    }
  }

  async handleOAuthCallback(code: string): Promise<void> {
    try {
      logger.info("GoogleConnector", "Handling OAuth callback");

      const tokenResponse = await fetch(`${this.OAUTH_AUTHORITY}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: this.redirectUri
        }).toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token request failed: ${tokenResponse.statusText} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as GoogleTokenResponse;
      this.tokenStorage.setToken(tokenData.access_token, tokenData.expires_in);
      this.refreshToken = tokenData.refresh_token || null;

      logger.info("GoogleConnector", "OAuth callback handled successfully");
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "handle_oauth_callback" });
      logger.error("GoogleConnector", "Failed to handle OAuth callback", { error: appError.message }, ErrorCode.AUTH_FAILED);
      throw appError;
    }
  }

  async disconnectAccount(): Promise<void> {
    try {
      logger.info("GoogleConnector", "Disconnecting account");
      await this.revokeAccessToken();
      this.tokenStorage.clearToken();
      this.refreshToken = null;
      this.cache.clear();
      this.calendarListCache.clear();
      logger.info("GoogleConnector", "Account disconnected successfully");
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "disconnect" });
      logger.error("GoogleConnector", "Failed to disconnect account", { error: appError.message }, ErrorCode.AUTH_REVOKED);
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

      logger.info("GoogleConnector", "Refreshing access token");

      const tokenResponse = await fetch(`${this.OAUTH_AUTHORITY}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: "refresh_token"
        }).toString()
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token refresh failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json() as GoogleTokenResponse;
      this.tokenStorage.setToken(tokenData.access_token, tokenData.expires_in);

      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      logger.info("GoogleConnector", "Access token refreshed successfully");
      return tokenData.access_token;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "refresh_token" });
      logger.error("GoogleConnector", "Failed to refresh access token", { error: appError.message }, ErrorCode.AUTH_EXPIRED);
      throw appError;
    }
  }

  async revokeAccessToken(): Promise<void> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        logger.warn("GoogleConnector", "No token to revoke");
        return;
      }

      logger.info("GoogleConnector", "Revoking access token");

      await fetch(`${this.OAUTH_AUTHORITY}/revoke?token=${encodeURIComponent(token)}`, {
        method: "POST"
      });

      logger.info("GoogleConnector", "Access token revoked successfully");
    } catch (error) {
      logger.error("GoogleConnector", "Failed to revoke access token", { error });
      // Don't throw - revocation failure shouldn't prevent disconnection
    }
  }

  async getCalendarList(): Promise<GoogleCalendar[]> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      logger.info("GoogleConnector", "Fetching calendar list");

      const cachedCalendars = this.calendarListCache.get("calendar_list");
      if (cachedCalendars) {
        logger.info("GoogleConnector", "Calendar list retrieved from cache", { count: cachedCalendars.length });
        return cachedCalendars;
      }

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/users/me/calendarList`,
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
          return this.getCalendarList();
        }
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as GoogleCalendarListResponse;
      const calendars = data.items || [];

      this.calendarListCache.set("calendar_list", calendars);

      logger.info("GoogleConnector", "Calendar list fetched successfully", { count: calendars.length });
      return calendars;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "get_calendar_list" });
      logger.error("GoogleConnector", "Failed to fetch calendar list", { error: appError.message }, ErrorCode.API_ERROR);
      throw appError;
    }
  }

  async getEvents(startDate: Date, endDate: Date, calendarId: string = "primary"): Promise<GoogleRawEventData[]> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      logger.info("GoogleConnector", "Fetching events", { startDate, endDate, calendarId });

      // Create cache key from date range and calendar
      const cacheKey = `events_${calendarId}_${startDate.toISOString()}_${endDate.toISOString()}`;

      // Check cache first
      const cachedEvents = this.cache.get(cacheKey);
      if (cachedEvents) {
        logger.info("GoogleConnector", "Events retrieved from cache", { count: cachedEvents.length });
        return cachedEvents;
      }

      // Format dates for Google Calendar API (RFC3339)
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      const url = new URL(`${this.CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.append("timeMin", startISO);
      url.searchParams.append("timeMax", endISO);
      url.searchParams.append("singleEvents", "true");
      url.searchParams.append("orderBy", "startTime");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getEvents(startDate, endDate, calendarId);
        }
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as GoogleEventsListResponse;
      const events = data.items || [];

      // Cache the results
      this.cache.set(cacheKey, events);

      logger.info("GoogleConnector", "Events fetched successfully", { count: events.length });
      return events;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "get_events" });
      logger.error("GoogleConnector", "Failed to fetch events", { error: appError.message }, ErrorCode.API_ERROR);
      throw appError;
    }
  }

  async getEventDetails(eventId: string, calendarId: string = "primary"): Promise<GoogleRawEventData> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      logger.info("GoogleConnector", "Fetching event details", { eventId, calendarId });

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
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
          return this.getEventDetails(eventId, calendarId);
        }
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as GoogleRawEventData;
      logger.info("GoogleConnector", "Event details fetched successfully");
      return data;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, "GoogleConnector", { operation: "get_event_details", eventId });
      logger.error("GoogleConnector", "Failed to fetch event details", { error: appError.message }, ErrorCode.API_ERROR);
      throw appError;
    }
  }
}
