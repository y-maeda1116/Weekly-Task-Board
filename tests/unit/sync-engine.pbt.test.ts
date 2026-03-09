/**
 * Sync Engine - Property-Based Tests
 * Tests for sync mapping, duplicate detection, and retry logic
 * 
 * **Validates: Requirements 5, 7**
 */

import { SyncEngineImpl } from "../../src/components/SyncEngine";
import { Event, SyncStatus } from "../../src/types/index";

describe("SyncEngine - Property-Based Tests", () => {
  let syncEngine: SyncEngineImpl;

  beforeEach(() => {
    syncEngine = new SyncEngineImpl();
  });

  describe("Property 12: Sync Mapping Recording", () => {
    it("should record mapping between Outlook event ID and task ID", async () => {
      const outlookEventId = "outlook-event-123";
      const taskId = "task-456";

      await syncEngine.recordSync(outlookEventId, taskId);

      const retrievedTaskId = await syncEngine.getSyncMapping(outlookEventId);
      expect(retrievedTaskId).toBe(taskId);
    });

    it("should record multiple mappings independently", async () => {
      const mappings = [
        { outlookEventId: "event-1", taskId: "task-1" },
        { outlookEventId: "event-2", taskId: "task-2" },
        { outlookEventId: "event-3", taskId: "task-3" }
      ];

      for (const mapping of mappings) {
        await syncEngine.recordSync(mapping.outlookEventId, mapping.taskId);
      }

      for (const mapping of mappings) {
        const retrievedTaskId = await syncEngine.getSyncMapping(mapping.outlookEventId);
        expect(retrievedTaskId).toBe(mapping.taskId);
      }
    });

    it("should return null for unmapped event IDs", async () => {
      const result = await syncEngine.getSyncMapping("non-existent-event");
      expect(result).toBeNull();
    });

    it("should update mapping when recording same event ID again", async () => {
      const outlookEventId = "event-update";
      
      await syncEngine.recordSync(outlookEventId, "task-old");
      let taskId = await syncEngine.getSyncMapping(outlookEventId);
      expect(taskId).toBe("task-old");

      await syncEngine.recordSync(outlookEventId, "task-new");
      taskId = await syncEngine.getSyncMapping(outlookEventId);
      expect(taskId).toBe("task-new");
    });
  });

  describe("Property 13: Duplicate Detection", () => {
    it("should detect previously imported events as duplicates", async () => {
      // Record a sync mapping
      await syncEngine.recordSync("event-dup-1", "task-dup-1");

      // Create an event with the same ID
      const event: Event = {
        id: "event-dup-1",
        title: "Duplicate Event",
        description: "This event was already imported",
        startTime: new Date("2024-01-15T10:00:00Z"),
        endTime: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      const duplicates = await syncEngine.detectDuplicates([event]);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].outlookEventId).toBe("event-dup-1");
      expect(duplicates[0].taskId).toBe("task-dup-1");
    });

    it("should not flag new events as duplicates", async () => {
      const event: Event = {
        id: "event-new",
        title: "New Event",
        description: "This is a new event",
        startTime: new Date("2024-02-20T14:00:00Z"),
        endTime: new Date("2024-02-20T15:00:00Z"),
        isAllDay: false,
        lastModified: new Date()
      };

      const duplicates = await syncEngine.detectDuplicates([event]);

      expect(duplicates).toHaveLength(0);
    });

    it("should detect duplicates in mixed event list", async () => {
      // Record some mappings
      await syncEngine.recordSync("event-existing-1", "task-1");
      await syncEngine.recordSync("event-existing-2", "task-2");

      const events: Event[] = [
        {
          id: "event-existing-1",
          title: "Existing Event 1",
          description: "Already imported",
          startTime: new Date("2024-01-10T10:00:00Z"),
          endTime: new Date("2024-01-10T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-new-1",
          title: "New Event 1",
          description: "Not imported yet",
          startTime: new Date("2024-01-11T10:00:00Z"),
          endTime: new Date("2024-01-11T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        },
        {
          id: "event-existing-2",
          title: "Existing Event 2",
          description: "Already imported",
          startTime: new Date("2024-01-12T10:00:00Z"),
          endTime: new Date("2024-01-12T11:00:00Z"),
          isAllDay: false,
          lastModified: new Date()
        }
      ];

      const duplicates = await syncEngine.detectDuplicates(events);

      expect(duplicates).toHaveLength(2);
      expect(duplicates.map(d => d.outlookEventId)).toContain("event-existing-1");
      expect(duplicates.map(d => d.outlookEventId)).toContain("event-existing-2");
    });

    it("should handle empty event list", async () => {
      const duplicates = await syncEngine.detectDuplicates([]);
      expect(duplicates).toEqual([]);
    });
  });

  describe("Property 17: Exponential Backoff Retry Logic", () => {
    it("should retry operation on failure with exponential backoff", async () => {
      let attemptCount = 0;
      const operation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      });

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max retries exceeded", async () => {
      const operation = jest.fn(async () => {
        throw new Error("Persistent failure");
      });

      await expect(
        syncEngine.retryWithBackoff(operation, 2)
      ).rejects.toThrow("Persistent failure");

      // Should be called 3 times (initial + 2 retries)
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should succeed on first attempt without retries", async () => {
      const operation = jest.fn(async () => "immediate success");

      const result = await syncEngine.retryWithBackoff(operation, 3);

      expect(result).toBe("immediate success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should increase wait time between retries (exponential backoff)", async () => {
      const timings: number[] = [];
      let attemptCount = 0;

      const operation = jest.fn(async () => {
        timings.push(Date.now());
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Retry needed");
        }
        return "success";
      });

      const startTime = Date.now();
      await syncEngine.retryWithBackoff(operation, 3);

      // Verify that there were delays between attempts
      // The exact timing may vary, but we should see increasing delays
      expect(timings.length).toBe(3);
      
      // First attempt should be immediate
      expect(timings[0] - startTime).toBeLessThan(100);
      
      // Second attempt should have some delay
      expect(timings[1] - timings[0]).toBeGreaterThan(500);
      
      // Third attempt should have more delay than second
      expect(timings[2] - timings[1]).toBeGreaterThan(timings[1] - timings[0]);
    });

    it("should handle async operations correctly", async () => {
      let callCount = 0;
      const asyncOperation = jest.fn(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error("First attempt fails");
        }
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10));
        return "async success";
      });

      const result = await syncEngine.retryWithBackoff(asyncOperation, 2);

      expect(result).toBe("async success");
      expect(asyncOperation).toHaveBeenCalledTimes(2);
    });

    it("should preserve error message from final failure", async () => {
      const errorMessage = "Custom error message";
      const operation = jest.fn(async () => {
        throw new Error(errorMessage);
      });

      await expect(
        syncEngine.retryWithBackoff(operation, 1)
      ).rejects.toThrow(errorMessage);
    });

    it("should handle network errors with retry", async () => {
      let attemptCount = 0;
      const networkOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("Network timeout");
        }
        if (attemptCount === 2) {
          throw new Error("Connection refused");
        }
        return "network success";
      });

      const result = await syncEngine.retryWithBackoff(networkOperation, 3);

      expect(result).toBe("network success");
      expect(networkOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe("Sync Engine Edge Cases", () => {
    it("should handle concurrent sync recordings", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          syncEngine.recordSync(`event-${i}`, `task-${i}`)
        );
      }

      await Promise.all(promises);

      // Verify all mappings were recorded
      for (let i = 0; i < 10; i++) {
        const taskId = await syncEngine.getSyncMapping(`event-${i}`);
        expect(taskId).toBe(`task-${i}`);
      }
    });

    it("should handle large event lists for duplicate detection", async () => {
      // Record some mappings
      for (let i = 0; i < 100; i += 10) {
        await syncEngine.recordSync(`event-${i}`, `task-${i}`);
      }

      // Create a large event list
      const events: Event[] = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          id: `event-${i}`,
          title: `Event ${i}`,
          description: `Description ${i}`,
          startTime: new Date(`2024-01-${(i % 28) + 1}T10:00:00Z`),
          endTime: new Date(`2024-01-${(i % 28) + 1}T11:00:00Z`),
          isAllDay: false,
          lastModified: new Date()
        });
      }

      const duplicates = await syncEngine.detectDuplicates(events);

      // Should find 10 duplicates (every 10th event)
      expect(duplicates).toHaveLength(10);
    });
  });
});
