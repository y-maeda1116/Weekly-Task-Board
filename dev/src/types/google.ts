/**
 * Google Calendar API - Type Definitions
 * Defines all data models for Google Calendar API responses
 */

/**
 * Google Calendar Event Data
 * Represents a single event from Google Calendar API
 */
export interface GoogleRawEventData {
  id: string;
  summary?: string;
  description?: string;
  start: GoogleEventTime;
  end: GoogleEventTime;
  location?: string;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  recurrence?: string[];
  recurrenceRule?: string[];
  status?: "confirmed" | "tentative" | "cancelled";
  transparency?: "opaque" | "transparent";
  visibility?: "default" | "public" | "private" | "confidential";
  colorId?: string;
  created?: string;
  updated?: string;
  [key: string]: any;
}

/**
 * Google Event Time
 * Represents either a specific datetime or an all-day date
 */
export interface GoogleEventTime {
  dateTime?: string; // ISO 8601 datetime (e.g., "2024-01-15T10:00:00Z")
  date?: string; // ISO 8601 date for all-day events (e.g., "2024-01-15")
  timeZone?: string;
}

/**
 * Google Calendar
 * Represents a calendar from the user's calendar list
 */
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  primary?: boolean;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole: string;
  kind?: string;
  etag?: string;
}

/**
 * Google Calendar List Response
 * Response from calendar list API endpoint
 */
export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
  nextPageToken?: string;
}

/**
 * Google Events List Response
 * Response from events list API endpoint
 */
export interface GoogleEventsListResponse {
  kind: string;
  etag: string;
  summary?: string;
  updated?: string;
  timeZone?: string;
  accessRole?: string;
  defaultReminders?: Array<{
    method: string;
    minutes: number;
  }>;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleRawEventData[];
}

/**
 * Google OAuth Token Response
 * Response from Google OAuth token endpoint
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Google OAuth Error Response
 * Error response from Google OAuth endpoints
 */
export interface GoogleOAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Google API Error Response
 * Error response from Google Calendar API
 */
export interface GoogleAPIError {
  error: {
    code: number;
    message: string;
    status: string;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

/**
 * Google Recurrence Rule
 * Parsed RRULE from Google event
 */
export interface GoogleRecurrenceRule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval?: number;
  until?: string; // ISO date
  count?: number;
  byDay?: string[]; // MO, TU, WE, TH, FR, SA, SU
  byMonthDay?: number[];
  byMonth?: number[];
  bySetPos?: number[];
}

/**
 * Google Event Extended Properties
 * Custom properties for events
 */
export interface GoogleExtendedProperties {
  private?: Record<string, string>;
  shared?: Record<string, string>;
}

/**
 * Google Conference Data
 * Conference solution data for events
 */
export interface GoogleConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: {
      type: string;
    };
    status: {
      statusCode: string;
    };
  };
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri?: string;
  };
  entryPoints?: Array<{
    entryPointType: string;
    uri?: string;
    label?: string;
    pin?: string;
    accessCode?: string;
    meetingCode?: string;
    password?: string;
  }>;
}
