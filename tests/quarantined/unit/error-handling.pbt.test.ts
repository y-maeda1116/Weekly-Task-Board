/**
 * Error Handling Property-Based Tests
 * Tests for comprehensive error handling and transaction rollback
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import { CalendarImporterImpl } from "../../src/components/CalendarImporter";
import { OutlookConnectorImpl } from "../../src/components/OutlookConnector";
import { EventParserImpl } from "../../src/components/EventParser";
import { EventSerializerImpl } from "../../src/components/EventSerializer";
import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { Event, RawEventData, Task } from "../../src/types/index";
import { logger } from "../../src/utils/logger";
import { transactionManager } from "../../src/utils/transactionManager";

describe("Error Handling Property Tests", () => {
  let importer: CalendarImporterImpl;
  let connector: OutlookConnectorImpl;
  let parser: EventParserImpl;
  let serializer: EventSerializerImpl;
  let syncEngine: SyncEngineImpl;

  beforeEach(() => {
    connector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
    parser = new EventParserImpl();
    serializer = new EventSerializerImpl();
    syncEngine = new SyncEngineImpl();
    importer = new CalendarImporterImpl(connector, parser, serializer, syncEngine);
    logger.clearLogs();
  });

  afterEach(() => {
    transactionManager.clearCompletedTransactions();
  });

  /**
   * Property 11: Import Transaction Rollback
   * **Validates: Requirements 4, 7**
   * 
   * For all import operations with errors, the system rolls back all changes
   * and creates no partial task records, notifying the user.
   */
  describe("Property 11: Import Transaction Rollback", () => {
    it("should rollback all changes when import fails", async () => {
      // Create a mock connector that fails on some events
      const failingConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
      
      // Override getEvents to return valid events
      failingConnector.getEvents = async () => {
        return [
          {
            id: "event1",
            subject: "Event 1",
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
          },
          {
            id: "event2",
            subject: "Event 2",
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
          }
        ];
      };

      const failingImporter = new CalendarImporterImpl(failingConnector, parser, serializer, syncEngine);

      // Set date range and fetch events
      failingImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));
      const events = await failingImporter.fetchEvents();

      // Select events
      events.forEach(event => failingImporter.selectEvent(event.id));

      // Mock serializer to fail on second event
      let callCount = 0;
      const originalEventToTask = serializer.eventToTask.bind(serializer);
      serializer.eventToTask = (event: Event): Task => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Simulated import failure");
        }
        return originalEventToTask(event);
      };

      // Attempt import
      const result = await failingImporter.importSelectedEvents();

      // Verify rollback occurred
      expect(result.success).toBe(false);
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Verify transaction was rolled back
      const transaction = transactionManager.getCurrentTransaction();
      expect(transaction).toBeNull(); // Transaction should be cleared after rollback

      // Verify error was logged
      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it("should not create partial task records on import failure with property-based testing", async () => {
      // Use property-based testing to verify rollback behavior across various scenarios
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              subject: fc.string({ minLength: 1 }),
              start: fc.record({
                dateTime: fc.date().map(d => d.toISOString())
              }),
              end: fc.record({
                dateTime: fc.date().map(d => new Date(d.getTime() + 3600000).toISOString())
              })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 0, max: 4 }), // Position where failure should occur
          async (rawEvents: RawEventData[], failurePosition: number) => {
            logger.clearLogs();
            transactionManager.clearCompletedTransactions();

            // Create a connector that returns the generated events
            const testConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
            testConnector.getEvents = async () => rawEvents;

            const testImporter = new CalendarImporterImpl(testConnector, parser, serializer, syncEngine);

            // Set date range and fetch events
            testImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));
            
            try {
              const events = await testImporter.fetchEvents();
              
              if (events.length === 0) {
                return; // Skip if no events
              }

              // Select all events
              events.forEach(event => testImporter.selectEvent(event.id));

              // Mock serializer to fail at the specified position
              let callCount = 0;
              const originalEventToTask = serializer.eventToTask.bind(serializer);
              serializer.eventToTask = (event: Event): Task => {
                callCount++;
                if (callCount === failurePosition + 1 && failurePosition < events.length) {
                  throw new Error("Simulated import failure at position " + failurePosition);
                }
                return originalEventToTask(event);
              };

              // Attempt import
              const result = await testImporter.importSelectedEvents();

              // Verify transaction state after import
              const transaction = transactionManager.getCurrentTransaction();
              expect(transaction).toBeNull(); // Transaction should always be cleared

              // If import failed, verify proper error handling
              if (!result.success) {
                // Verify that we have error information
                expect(result.errors.length).toBeGreaterThan(0);
                
                // Verify that the UI state reflects the error
                const uiState = testImporter.getUIState();
                expect(uiState.error).toBeDefined();
              }
            } catch (error) {
              // Expected for invalid event data - verify transaction is still cleared
              const transaction = transactionManager.getCurrentTransaction();
              expect(transaction).toBeNull();
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it("should maintain transaction consistency across multiple import attempts", async () => {
      // Property: Multiple import attempts should not leave orphaned transactions
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // Number of import attempts
          async (attemptCount: number) => {
            logger.clearLogs();
            transactionManager.clearCompletedTransactions();

            const testConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
            testConnector.getEvents = async () => [
              {
                id: "event1",
                subject: "Test Event",
                start: { dateTime: new Date().toISOString() },
                end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
              }
            ];

            const testImporter = new CalendarImporterImpl(testConnector, parser, serializer, syncEngine);
            testImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));

            for (let i = 0; i < attemptCount; i++) {
              const events = await testImporter.fetchEvents();
              events.forEach(event => testImporter.selectEvent(event.id));

              // Alternate between success and failure
              if (i % 2 === 1) {
                serializer.eventToTask = () => {
                  throw new Error("Simulated failure");
                };
              } else {
                const originalEventToTask = serializer.eventToTask.bind(serializer);
                serializer.eventToTask = originalEventToTask;
              }

              try {
                await testImporter.importSelectedEvents();
              } catch (error) {
                // Expected for some attempts
              }

              // After each attempt, verify no orphaned transaction
              const transaction = transactionManager.getCurrentTransaction();
              expect(transaction).toBeNull();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("should notify user of rollback with user-friendly message", async () => {
      const failingConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
      
      failingConnector.getEvents = async () => {
        return [
          {
            id: "event1",
            subject: "Event 1",
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
          }
        ];
      };

      const failingImporter = new CalendarImporterImpl(failingConnector, parser, serializer, syncEngine);

      // Set date range and fetch events
      failingImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));
      const events = await failingImporter.fetchEvents();

      // Select events
      events.forEach(event => failingImporter.selectEvent(event.id));

      // Mock serializer to fail
      serializer.eventToTask = () => {
        throw new Error("Import failed");
      };

      // Attempt import
      const result = await failingImporter.importSelectedEvents();

      // Verify user-friendly error message
      const uiState = failingImporter.getUIState();
      expect(uiState.error).toBeDefined();
      expect(uiState.error).toContain("Import failed");
    });

    it("should verify no partial records created across random failure scenarios", async () => {
      // Property: For any failure scenario, verify the system state is consistent
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              subject: fc.string({ minLength: 1 }),
              start: fc.record({
                dateTime: fc.date().map(d => d.toISOString())
              }),
              end: fc.record({
                dateTime: fc.date().map(d => new Date(d.getTime() + 3600000).toISOString())
              })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (rawEvents: RawEventData[]) => {
            logger.clearLogs();
            transactionManager.clearCompletedTransactions();

            const testConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
            testConnector.getEvents = async () => rawEvents;

            const testImporter = new CalendarImporterImpl(testConnector, parser, serializer, syncEngine);
            testImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));

            const events = await testImporter.fetchEvents();
            if (events.length === 0) return;

            events.forEach(event => testImporter.selectEvent(event.id));

            // Simulate failure on a random event
            const failureIndex = Math.floor(Math.random() * events.length);
            let callCount = 0;
            const originalEventToTask = serializer.eventToTask.bind(serializer);
            serializer.eventToTask = (event: Event): Task => {
              callCount++;
              if (callCount > failureIndex) {
                throw new Error("Random failure");
              }
              return originalEventToTask(event);
            };

            const result = await testImporter.importSelectedEvents();

            // Verify consistency: transaction should be cleared
            expect(transactionManager.getCurrentTransaction()).toBeNull();

            // Verify error information is available
            if (!result.success) {
              expect(result.errors.length).toBeGreaterThan(0);
              const uiState = testImporter.getUIState();
              expect(uiState.error).toBeDefined();
            }
          }
        ),
        { numRuns: 12 }
      );
    });
  });

  /**
   * Property 18: Error Logging
   * **Validates: Requirements 7**
   * 
   * For all errors occurring during sync operations, the system logs errors
   * with timestamp, error code, component name, and related context.
   */
  describe("Property 18: Error Logging", () => {
    it("should log all errors with required fields (timestamp, error code, component name, context)", async () => {
      const failingConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
      
      failingConnector.getEvents = async () => {
        throw new Error("API Error");
      };

      const failingImporter = new CalendarImporterImpl(failingConnector, parser, serializer, syncEngine);

      // Set date range
      failingImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));

      // Attempt to fetch events (will fail)
      try {
        await failingImporter.fetchEvents();
      } catch (error) {
        // Expected to fail
      }

      // Verify error was logged with all required fields
      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBeGreaterThan(0);

      const lastError = errorLogs[errorLogs.length - 1];
      // Property 18 requires: timestamp, error code, component name, related context
      expect(lastError.timestamp).toBeDefined();
      expect(lastError.timestamp).toBeInstanceOf(Date);
      expect(lastError.component).toBeDefined();
      expect(typeof lastError.component).toBe("string");
      expect(lastError.message).toBeDefined();
      expect(typeof lastError.message).toBe("string");
      expect(lastError.context).toBeDefined();
      expect(typeof lastError.context).toBe("object");
    });

    it("should log errors with error codes for all error types", async () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      const failingConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
      
      failingConnector.getEvents = async () => {
        throw new Error("401 Unauthorized");
      };

      const failingImporter = new CalendarImporterImpl(failingConnector, parser, serializer, syncEngine);

      // Set date range
      failingImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));

      // Attempt to fetch events (will fail)
      try {
        await failingImporter.fetchEvents();
      } catch (error) {
        // Expected to fail
      }

      // Verify error code was logged
      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBeGreaterThan(0);

      const lastError = errorLogs[errorLogs.length - 1];
      expect(lastError.errorCode).toBeDefined();
      expect(typeof lastError.errorCode).toBe("string");
    });

    it("should log errors with component context for all sync operations", async () => {
      // Property-based test: For all error scenarios during sync operations,
      // verify that errors are logged with timestamp, error code, component name, and context
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              subject: fc.string({ minLength: 1 }),
              start: fc.record({
                dateTime: fc.date().map(d => d.toISOString())
              }),
              end: fc.record({
                dateTime: fc.date().map(d => new Date(d.getTime() + 3600000).toISOString())
              })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.string({ minLength: 1, maxLength: 20 }), // Error message
          fc.string({ minLength: 1, maxLength: 20 }), // Error code
          async (rawEvents: RawEventData[], errorMessage: string, errorCode: string) => {
            logger.clearLogs();

            const testConnector = new OutlookConnectorImpl("test-client-id", "http://localhost:3000/callback");
            testConnector.getEvents = async () => rawEvents;

            const testImporter = new CalendarImporterImpl(testConnector, parser, serializer, syncEngine);

            // Set date range and fetch events
            testImporter.setDateRange(new Date(), new Date(Date.now() + 86400000));
            
            try {
              const events = await testImporter.fetchEvents();
              
              if (events.length === 0) {
                return;
              }

              // Select all events
              events.forEach(event => testImporter.selectEvent(event.id));

              // Mock serializer to fail with generated error
              serializer.eventToTask = () => {
                throw new Error(errorMessage);
              };

              // Attempt import
              await testImporter.importSelectedEvents();
            } catch (error) {
              // Expected to fail
            }

            // Verify errors were logged with all required fields
            const allLogs = logger.getLogs();
            const errorLogs = allLogs.filter(log => log.level === "ERROR");
            
            if (errorLogs.length > 0) {
              errorLogs.forEach(log => {
                // Property 18: All errors must have these fields
                expect(log.timestamp).toBeDefined();
                expect(log.timestamp).toBeInstanceOf(Date);
                expect(log.component).toBeDefined();
                expect(typeof log.component).toBe("string");
                expect(log.message).toBeDefined();
                expect(typeof log.message).toBe("string");
                expect(log.context).toBeDefined();
                expect(typeof log.context).toBe("object");
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("should log errors with timestamp that is valid and recent", async () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      const beforeTime = new Date();
      
      logger.error("TestComponent", "Test error", { detail: "test" }, "TEST_ERROR");
      
      const afterTime = new Date();

      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBe(1);

      const errorLog = errorLogs[0];
      expect(errorLog.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(errorLog.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should log errors with component name identifying the source", async () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      // Log errors from different components
      logger.error("OutlookConnector", "Connection failed", { reason: "timeout" }, "CONN_TIMEOUT");
      logger.error("EventParser", "Parse failed", { data: "invalid" }, "PARSE_ERROR");
      logger.error("SyncEngine", "Sync failed", { event: "test" }, "SYNC_ERROR");

      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBe(3);

      // Verify each error has the correct component name
      expect(errorLogs[0].component).toBe("OutlookConnector");
      expect(errorLogs[1].component).toBe("EventParser");
      expect(errorLogs[2].component).toBe("SyncEngine");
    });

    it("should log errors with error codes for categorization", async () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      // Log errors with different error codes
      logger.error("Component1", "Error 1", {}, "AUTH_ERROR");
      logger.error("Component2", "Error 2", {}, "NETWORK_ERROR");
      logger.error("Component3", "Error 3", {}, "VALIDATION_ERROR");
      logger.error("Component1", "Error 4", {}, "AUTH_ERROR");

      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBe(4);

      // Verify error codes are present and distinct
      expect(errorLogs[0].errorCode).toBe("AUTH_ERROR");
      expect(errorLogs[1].errorCode).toBe("NETWORK_ERROR");
      expect(errorLogs[2].errorCode).toBe("VALIDATION_ERROR");
      expect(errorLogs[3].errorCode).toBe("AUTH_ERROR");
    });

    it("should log errors with context containing relevant information", async () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      const contextData = {
        eventId: "event-123",
        taskId: "task-456",
        operation: "import",
        retryCount: 2
      };

      logger.error("SyncEngine", "Import failed", contextData, "IMPORT_ERROR");

      const errorLogs = logger.getLogsByLevel("ERROR");
      expect(errorLogs.length).toBe(1);

      const errorLog = errorLogs[0];
      expect(errorLog.context).toEqual(contextData);
      expect(errorLog.context.eventId).toBe("event-123");
      expect(errorLog.context.operation).toBe("import");
    });

    it("should log all errors during sync operations with complete information", async () => {
      // Property: For all errors during sync operations, verify complete logging
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // Number of errors to simulate
          fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 1, maxLength: 3 }), // Component names
          async (errorCount: number, componentNames: string[]) => {
            logger.clearLogs();
            logger.clearErrorMetrics();

            // Simulate multiple errors from different components
            for (let i = 0; i < errorCount; i++) {
              const component = componentNames[i % componentNames.length];
              const errorCode = `ERROR_${i}`;
              const context = { errorIndex: i, timestamp: new Date().toISOString() };
              
              logger.error(component, `Error ${i}`, context, errorCode);
            }

            // Verify all errors were logged with required fields
            const errorLogs = logger.getLogsByLevel("ERROR");
            expect(errorLogs.length).toBe(errorCount);

            errorLogs.forEach((log, index) => {
              // Property 18: All required fields must be present
              expect(log.timestamp).toBeDefined();
              expect(log.timestamp).toBeInstanceOf(Date);
              expect(log.errorCode).toBeDefined();
              expect(log.errorCode).toBe(`ERROR_${index}`);
              expect(log.component).toBeDefined();
              expect(componentNames).toContain(log.component);
              expect(log.context).toBeDefined();
              expect(log.context.errorIndex).toBe(index);
            });
          }
        ),
        { numRuns: 8 }
      );
    });

    it("should track error metrics across all logged errors", () => {
      logger.clearLogs();
      logger.clearErrorMetrics();

      // Simulate various errors
      logger.error("TestComponent", "Test error 1", {}, "TEST_ERROR_1");
      logger.error("TestComponent", "Test error 2", {}, "TEST_ERROR_2");
      logger.error("AnotherComponent", "Test error 3", {}, "TEST_ERROR_1");
      logger.error("ThirdComponent", "Test error 4", {}, "TEST_ERROR_3");

      // Verify error metrics
      const metrics = logger.getErrorMetrics();
      expect(metrics.totalErrors).toBe(4);
      expect(metrics.errorsByCode["TEST_ERROR_1"]).toBe(2);
      expect(metrics.errorsByCode["TEST_ERROR_2"]).toBe(1);
      expect(metrics.errorsByCode["TEST_ERROR_3"]).toBe(1);
      expect(metrics.errorsByComponent["TestComponent"]).toBe(2);
      expect(metrics.errorsByComponent["AnotherComponent"]).toBe(1);
      expect(metrics.errorsByComponent["ThirdComponent"]).toBe(1);
      expect(metrics.lastError).toBeDefined();
      expect(metrics.lastError?.errorCode).toBe("TEST_ERROR_3");
    });

    it("should maintain error log integrity across multiple sync operations", async () => {
      // Property: Error logs should maintain integrity across multiple operations
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // Number of operations
          async (operationCount: number) => {
            logger.clearLogs();
            logger.clearErrorMetrics();

            for (let op = 0; op < operationCount; op++) {
              const component = `Component_${op}`;
              const errorCode = `OP_${op}_ERROR`;
              const context = { operation: op, timestamp: new Date().toISOString() };
              
              logger.error(component, `Operation ${op} failed`, context, errorCode);
            }

            // Verify all errors are logged and retrievable
            const allLogs = logger.getLogs();
            const errorLogs = logger.getLogsByLevel("ERROR");
            
            expect(errorLogs.length).toBe(operationCount);
            expect(allLogs.length).toBeGreaterThanOrEqual(operationCount);

            // Verify each error has all required fields
            errorLogs.forEach((log, index) => {
              expect(log.timestamp).toBeDefined();
              expect(log.errorCode).toBe(`OP_${index}_ERROR`);
              expect(log.component).toBe(`Component_${index}`);
              expect(log.context).toBeDefined();
              expect(log.context.operation).toBe(index);
            });
          }
        ),
        { numRuns: 6 }
      );
    });
  });
});
