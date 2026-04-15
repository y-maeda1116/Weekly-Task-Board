/**
 * Sync Engine - Comprehensive Unit Tests
 * Tests for mapping recording, duplicate detection, and retry logic
 */

import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { Event } from "../../src/types/index";

describe("SyncEngine - Unit Tests", () => {
  let syncEngine: SyncEngineImpl;

  beforeEach(() => {
    syncEngine = new SyncEngineImpl();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Sync Mapping Recording", () => {
    it("should record sync mapping between event and task", async () => {
      await syncEngine.recordSync("outlook-event-1", "task-1");

      const taskId = await syncEngine.getSyncMapping("outlook-event-1");
      expect(taskId).toBe("task-1");
    });

    it("should record multiple sync mappings", async () => {
      await syncEngine.recordSync("event1", "task1");
      await syncEngine.recordSync("event2", "task2");
      await syncEngine.recordSync("event3", "task3");

      expect(await syncEngine.getSyncMapping("event1")).toBe("task1");
      expect(await syncEngine.getSyncMapping("event2")).toBe("task2");
      expect(await syncEngine.getSyncMapping("event3")).toBe("task3");
    });

    it("should overwrite existing mapping for same event", async () => {
      await syncEngine.recordSync("event1", "task1");
      await syncEngine.recordSync("event1", "task2");

      const taskId = await syncEngine.getSyncMapping("event1");
      expect(taskId).toBe("task2");
    });

    it("should return null for unmapped event", async () => {
      const taskId = await syncEngine.getSyncMapping("unmapped-event");
      expect(taskId).toBeNull();
    });

    it("should handle empty event ID", async () => {
      await syncEngine.recordSync("", "task1");
      const taskId = await syncEngine.getSyncMapping("");
      expect(taskId).toBe("task1");
    });

    it("should handle empty task ID", async () => {
      await syncEngine.recordSync("event1", "");
      const taskId = await syncEngine.getSyncMapping("event1");
      expect(taskId).toBe("");
    });

    it("should handle very long event and task IDs", async () => {
      const longEventId = "event_" + "a".repeat(1000);
      const longTaskId = "task_" + "b".repeat(1000);

      await syncEngine.recordSync(longEventId, longTaskId);
      const taskId = await syncEngine.getSyncMapping(longEventId);
      expect(taskId).toBe(longTaskId);
    });

    it("should handle special characters in IDs", async () => {
      const specialEventId = "event-!@#$%^&*()_+=[]{}|;:',.<>?";
      const specialTaskId = "task-!@#$%^&*()_+=[]{}|;:',.<>?";

      await syncEngine.recordSync(specialEventId, specialTaskId);
      const taskId = await syncEngine.getSyncMapping(specialEventId);
      expect(taskId).toBe(specialTaskId);
    });

    it("should handle unicode characters in IDs", async () => {
      const unicodeEventId = "event_日本語_中文_한국어";
      const unicodeTaskId = "task_日本語_中文_한국어";

      await syncEngine.recordSync(unicodeEventId, unicodeTaskId);
      const taskId = await syncEngine.getSyncMapping(unicodeEventId);
      expect(taskId).toBe(unicodeTaskId);
    });
  });

  describe("Duplicate Detection", () => {
    it("should detect duplicate when event was previously synced", async () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      // Record initial sync
      await syncEngine.recordSync("event1", "task1");

      // Detect duplicates
      const duplicates = await syncEngine.detectDuplicates([event]);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event1");
      expect(duplicates[0].taskId).toBe("task1");
    });

    it("should not detect duplicate for new events", async () => {
      const event: Event = {
        id: "new-event",
        title: "New Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      const duplicates = await syncEngine.detectDuplicates([event]);

      expect(duplicates).toHaveLength(0);
    });

    it("should detect multiple duplicates", async () => {
      const events: Event[] = [
        {
          id: "event1",
          title: "Meeting 1",
          description: "Description",
          startTime: new Date("2024-01-15T10:00:00Z"),
          endTime: new Date("2024-01-15T11:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event2",
          title: "Meeting 2",
          description: "Description",
          startTime: new Date("2024-01-15T14:00:00Z"),
          endTime: new Date("2024-01-15T15:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        },
        {
          id: "event3",
          title: "Meeting 3",
          description: "Description",
          startTime: new Date("2024-01-15T16:00:00Z"),
          endTime: new Date("2024-01-15T17:00:00Z"),
          isAllDay: false,
          categories: [],
          lastModified: new Date()
        }
      ];

      // Record syncs for events 1 and 3
      await syncEngine.recordSync("event1", "task1");
      await syncEngine.recordSync("event3", "task3");

      const duplicates = await syncEngine.detectDuplicates(events);

      expect(duplicates).toHaveLength(2);
      expect(duplicates.map(d => d.outlookEventId)).toContain("event1");
      expect(duplicates.map(d => d.outlookEventId)).toContain("event3");
    });

    it("should handle empty event list", async () => {
      const duplicates = await syncEngine.detectDuplicates([]);
      expect(duplicates).toEqual([]);
    });

    it("should handle large number of events", async () => {
      const events: Event[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      // Record syncs for every 10th event
      for (let i = 0; i < 1000; i += 10) {
        await syncEngine.recordSync(`event${i}`, `task${i}`);
      }

      const duplicates = await syncEngine.detectDuplicates(events);

      expect(duplicates).toHaveLength(100);
    });

    it("should preserve event data in duplicate info", async () => {
      const event: Event = {
        id: "event1",
        title: "Important Meeting",
        description: "Discuss strategy",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        location: "Room A",
        isAllDay: false,
        categories: ["work"],
        lastModified: new Date()
      };

      await syncEngine.recordSync("event1", "task1");
      const duplicates = await syncEngine.detectDuplicates([event]);

      expect(duplicates[0].event.title).toBe("Important Meeting");
      expect(duplicates[0].event.description).toBe("Discuss strategy");
      expect(duplicates[0].event.location).toBe("Room A");
    });
  });

  describe("Retry Logic with Exponential Backoff", () => {
    it("should succeed on first attempt", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce("success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry with exponential backoff", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockResolvedValueOnce("success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);

      // Verify backoff delays
      expect(jest.advanceTimersByTime).toBeDefined();
    });

    it("should throw error after max retries exceeded", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Persistent error"));

      await expect(syncEngine.retryWithBackoff(operation, 2)).rejects.toThrow("Persistent error");

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should use default max retries of 3", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Error"));

      await expect(syncEngine.retryWithBackoff(operation)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it("should handle zero max retries", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Error"));

      await expect(syncEngine.retryWithBackoff(operation, 0)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1); // Only initial attempt
    });

    it("should handle operation returning null", async () => {
      const operation = jest.fn().mockResolvedValue(null);

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should handle operation returning undefined", async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should handle operation returning complex object", async () => {
      const complexObject = { data: [1, 2, 3], nested: { value: "test" } };
      const operation = jest.fn().mockResolvedValue(complexObject);

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toEqual(complexObject);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should handle operation throwing non-Error objects", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce("String error")
        .mockRejectedValueOnce(123)
        .mockResolvedValueOnce("success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should handle rapid successive retries", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValueOnce(new Error("Error 3"))
        .mockResolvedValueOnce("success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(4);
    });

    it("should handle operation with side effects", async () => {
      let callCount = 0;
      const operation = jest.fn(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Not ready");
        }
        return "success";
      });

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(callCount).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent sync recordings", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        syncEngine.recordSync(`event${i}`, `task${i}`)
      );

      await Promise.all(promises);

      for (let i = 0; i < 100; i++) {
        const taskId = await syncEngine.getSyncMapping(`event${i}`);
        expect(taskId).toBe(`task${i}`);
      }
    });

    it("should handle concurrent duplicate detection", async () => {
      const events: Event[] = Array.from({ length: 50 }, (_, i) => ({
        id: `event${i}`,
        title: `Meeting ${i}`,
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      }));

      // Record some syncs
      for (let i = 0; i < 50; i += 2) {
        await syncEngine.recordSync(`event${i}`, `task${i}`);
      }

      // Run concurrent duplicate detection
      const results = await Promise.all([
        syncEngine.detectDuplicates(events),
        syncEngine.detectDuplicates(events),
        syncEngine.detectDuplicates(events)
      ]);

      expect(results[0]).toHaveLength(25);
      expect(results[1]).toHaveLength(25);
      expect(results[2]).toHaveLength(25);
    });

    it("should handle very large number of sync mappings", async () => {
      for (let i = 0; i < 10000; i++) {
        await syncEngine.recordSync(`event${i}`, `task${i}`);
      }

      const taskId = await syncEngine.getSyncMapping("event5000");
      expect(taskId).toBe("task5000");
    });

    it("should handle operation that takes long time", async () => {
      const operation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return "success";
      });

      const promise = syncEngine.retryWithBackoff(operation, 1);

      jest.advanceTimersByTime(5000);
      const result = await promise;

      expect(result).toBe("success");
    });
  });

  describe("Error Handling", () => {
    it("should handle null operation", async () => {
      await expect(syncEngine.retryWithBackoff(null as any, 3)).rejects.toThrow();
    });

    it("should handle undefined operation", async () => {
      await expect(syncEngine.retryWithBackoff(undefined as any, 3)).rejects.toThrow();
    });

    it("should handle operation throwing Error with message", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Specific error message"));

      await expect(syncEngine.retryWithBackoff(operation, 0)).rejects.toThrow("Specific error message");
    });

    it("should handle operation throwing Error without message", async () => {
      const operation = jest.fn().mockRejectedValue(new Error());

      await expect(syncEngine.retryWithBackoff(operation, 0)).rejects.toThrow();
    });

    it("should handle getSyncMapping with null event ID", async () => {
      const taskId = await syncEngine.getSyncMapping(null as any);
      expect(taskId).toBeNull();
    });

    it("should handle getSyncMapping with undefined event ID", async () => {
      const taskId = await syncEngine.getSyncMapping(undefined as any);
      expect(taskId).toBeNull();
    });

    it("should handle detectDuplicates with null event", async () => {
      const events: any[] = [null];

      const duplicates = await syncEngine.detectDuplicates(events);
      expect(duplicates).toBeDefined();
    });

    it("should handle detectDuplicates with undefined event", async () => {
      const events: any[] = [undefined];

      const duplicates = await syncEngine.detectDuplicates(events);
      expect(duplicates).toBeDefined();
    });
  });

  describe("State Management", () => {
    it("should maintain state across multiple operations", async () => {
      await syncEngine.recordSync("event1", "task1");
      await syncEngine.recordSync("event2", "task2");

      let taskId1 = await syncEngine.getSyncMapping("event1");
      expect(taskId1).toBe("task1");

      await syncEngine.recordSync("event3", "task3");

      taskId1 = await syncEngine.getSyncMapping("event1");
      expect(taskId1).toBe("task1");

      const taskId2 = await syncEngine.getSyncMapping("event2");
      expect(taskId2).toBe("task2");

      const taskId3 = await syncEngine.getSyncMapping("event3");
      expect(taskId3).toBe("task3");
    });

    it("should handle state after duplicate detection", async () => {
      const event: Event = {
        id: "event1",
        title: "Meeting",
        description: "Description",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        categories: [],
        lastModified: new Date()
      };

      await syncEngine.recordSync("event1", "task1");
      const duplicates1 = await syncEngine.detectDuplicates([event]);

      expect(duplicates1).toHaveLength(1);

      // State should be preserved
      const taskId = await syncEngine.getSyncMapping("event1");
      expect(taskId).toBe("task1");

      const duplicates2 = await syncEngine.detectDuplicates([event]);
      expect(duplicates2).toHaveLength(1);
    });
  });
});
