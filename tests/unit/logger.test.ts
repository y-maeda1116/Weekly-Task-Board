/**
 * Logger Utility Unit Tests
 * Verifies that the logger utility works correctly
 */

import { Logger, LogLevel } from "../../src/utils/logger";

describe("Logger Utility", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe("log method", () => {
    it("should create a log entry with all fields", () => {
      logger.log(LogLevel.INFO, "TestComponent", "Test message", {
        key: "value"
      });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].component).toBe("TestComponent");
      expect(logs[0].message).toBe("Test message");
      expect(logs[0].context).toEqual({ key: "value" });
    });

    it("should create a log entry without context", () => {
      logger.log(LogLevel.DEBUG, "TestComponent", "Test message");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBeUndefined();
    });

    it("should set timestamp on log entry", () => {
      const beforeTime = new Date();
      logger.log(LogLevel.INFO, "TestComponent", "Test message");
      const afterTime = new Date();

      const logs = logger.getLogs();
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });
  });

  describe("convenience methods", () => {
    it("should log debug messages", () => {
      logger.debug("TestComponent", "Debug message");

      const logs = logger.getLogs();
      expect(logs[0].level).toBe(LogLevel.DEBUG);
    });

    it("should log info messages", () => {
      logger.info("TestComponent", "Info message");

      const logs = logger.getLogs();
      expect(logs[0].level).toBe(LogLevel.INFO);
    });

    it("should log warn messages", () => {
      logger.warn("TestComponent", "Warn message");

      const logs = logger.getLogs();
      expect(logs[0].level).toBe(LogLevel.WARN);
    });

    it("should log error messages", () => {
      logger.error("TestComponent", "Error message");

      const logs = logger.getLogs();
      expect(logs[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe("getLogs method", () => {
    it("should return all logged entries", () => {
      logger.info("Component1", "Message 1");
      logger.warn("Component2", "Message 2");
      logger.error("Component3", "Message 3");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
    });

    it("should return a copy of logs array", () => {
      logger.info("TestComponent", "Message");

      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe("clearLogs method", () => {
    it("should clear all logged entries", () => {
      logger.info("Component1", "Message 1");
      logger.warn("Component2", "Message 2");

      expect(logger.getLogs()).toHaveLength(2);

      logger.clearLogs();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe("multiple log levels", () => {
    it("should handle multiple log levels in sequence", () => {
      logger.debug("Component", "Debug");
      logger.info("Component", "Info");
      logger.warn("Component", "Warn");
      logger.error("Component", "Error");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[1].level).toBe(LogLevel.INFO);
      expect(logs[2].level).toBe(LogLevel.WARN);
      expect(logs[3].level).toBe(LogLevel.ERROR);
    });
  });
});
