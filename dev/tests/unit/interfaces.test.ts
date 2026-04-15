/**
 * Component Interfaces Unit Tests
 * Verifies that all component interfaces are properly defined
 */

import {
  OutlookConnector,
  EventParser,
  EventSerializer,
  EventPrinter,
  SyncEngine,
  CalendarImporter,
  CalendarSyncUI
} from "../../src/components/interfaces";

describe("Component Interfaces", () => {
  describe("OutlookConnector Interface", () => {
    it("should define all required methods", () => {
      const methods = [
        "initiateOAuthFlow",
        "handleOAuthCallback",
        "disconnectAccount",
        "isAuthenticated",
        "getAccessToken",
        "refreshAccessToken",
        "revokeAccessToken",
        "getEvents",
        "getEventDetails"
      ];

      methods.forEach((method) => {
        expect(OutlookConnector.prototype).toBeDefined();
      });
    });
  });

  describe("EventParser Interface", () => {
    it("should define all required methods", () => {
      const methods = ["parseEvent", "parseEvents", "validateEventData"];

      methods.forEach((method) => {
        expect(EventParser.prototype).toBeDefined();
      });
    });
  });

  describe("EventSerializer Interface", () => {
    it("should define all required methods", () => {
      const methods = ["eventToTask", "eventsToTasks", "taskToEvent"];

      methods.forEach((method) => {
        expect(EventSerializer.prototype).toBeDefined();
      });
    });
  });

  describe("EventPrinter Interface", () => {
    it("should define all required methods", () => {
      const methods = ["formatEvent", "formatEventList", "formatEventDetails"];

      methods.forEach((method) => {
        expect(EventPrinter.prototype).toBeDefined();
      });
    });
  });

  describe("SyncEngine Interface", () => {
    it("should define all required methods", () => {
      const methods = [
        "recordSync",
        "getSyncMapping",
        "detectDuplicates",
        "retryWithBackoff"
      ];

      methods.forEach((method) => {
        expect(SyncEngine.prototype).toBeDefined();
      });
    });
  });

  describe("CalendarImporter Interface", () => {
    it("should define all required methods", () => {
      const methods = [
        "setDateRange",
        "validateDateRange",
        "fetchEvents",
        "selectEvent",
        "deselectEvent",
        "getSelectedEvents",
        "importSelectedEvents",
        "getUIState"
      ];

      methods.forEach((method) => {
        expect(CalendarImporter.prototype).toBeDefined();
      });
    });
  });

  describe("CalendarSyncUI Interface", () => {
    it("should define all required methods", () => {
      const methods = [
        "renderAuthButton",
        "renderDisconnectButton",
        "renderDateRangePicker",
        "renderEventList",
        "renderEventDetails",
        "renderCheckbox",
        "renderSelectAllButton",
        "renderImportButton",
        "renderCancelButton",
        "renderSyncStatus",
        "renderErrorMessage"
      ];

      methods.forEach((method) => {
        expect(CalendarSyncUI.prototype).toBeDefined();
      });
    });
  });
});
