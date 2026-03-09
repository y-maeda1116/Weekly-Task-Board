/**
 * Performance Optimization Tests
 * Tests for caching, virtual scrolling, request throttling, and batch processing
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Cache } from "../../src/utils/cache";
import { RequestThrottler, RequestDebouncer } from "../../src/utils/requestThrottler";
import { VirtualScroller } from "../../src/utils/virtualScroller";
import { BatchProcessor } from "../../src/utils/batchProcessor";

describe("Performance Optimizations", () => {
  describe("Cache", () => {
    let cache: Cache<string>;

    beforeEach(() => {
      cache = new Cache<string>(3, 1000); // 3 items, 1 second TTL
    });

    it("should store and retrieve values", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return null for non-existent keys", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should respect max size and evict oldest entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4"); // Should evict key1

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key4")).toBe("value4");
    });

    it("should expire entries after TTL", async () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get("key1")).toBeNull();
    });

    it("should check if key exists", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should clear all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get("key1")).toBeNull();
    });
  });

  describe("RequestThrottler", () => {
    let throttler: RequestThrottler;

    beforeEach(() => {
      throttler = new RequestThrottler(100); // 100ms throttle
    });

    it("should allow first request immediately", async () => {
      const fn = vi.fn(async () => "result");
      const result = await throttler.throttle("key1", fn);

      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should throttle subsequent requests", async () => {
      const fn = vi.fn(async () => "result");

      await throttler.throttle("key1", fn);
      
      try {
        await throttler.throttle("key1", fn);
        expect.fail("Should have thrown throttle error");
      } catch (error) {
        expect((error as Error).message).toContain("throttled");
      }
    });

    it("should allow requests after throttle interval", async () => {
      const fn = vi.fn(async () => "result");

      await throttler.throttle("key1", fn);
      
      // Wait for throttle interval
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await throttler.throttle("key1", fn);
      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should reset throttle state", async () => {
      const fn = vi.fn(async () => "result");

      await throttler.throttle("key1", fn);
      throttler.reset("key1");

      const result = await throttler.throttle("key1", fn);
      expect(result).toBe("result");
    });
  });

  describe("RequestDebouncer", () => {
    let debouncer: RequestDebouncer;

    beforeEach(() => {
      debouncer = new RequestDebouncer(100); // 100ms debounce
    });

    it("should debounce requests", async () => {
      const fn = vi.fn(async () => "result");

      const promise1 = debouncer.debounce("key1", fn);
      const promise2 = debouncer.debounce("key1", fn);
      const promise3 = debouncer.debounce("key1", fn);

      const result = await promise3;

      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledOnce(); // Only called once despite 3 debounce calls
    });

    it("should execute after debounce delay", async () => {
      const fn = vi.fn(async () => "result");

      const promise = debouncer.debounce("key1", fn);
      
      // Function should not be called immediately
      expect(fn).not.toHaveBeenCalled();

      const result = await promise;
      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should cancel debounced requests", async () => {
      const fn = vi.fn(async () => "result");

      const promise = debouncer.debounce("key1", fn);
      debouncer.cancel("key1");

      // Wait for original debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("VirtualScroller", () => {
    it("should calculate visible range correctly", () => {
      const scroller = new VirtualScroller({
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2
      });

      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      scroller.setItems(items);
      scroller.setScrollTop(0);

      const range = scroller.getVisibleRange();
      expect(range.startIndex).toBe(0);
      expect(range.endIndex).toBeGreaterThan(0);
      expect(range.totalHeight).toBe(100 * 50);
    });

    it("should update visible range on scroll", () => {
      const scroller = new VirtualScroller({
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2
      });

      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      scroller.setItems(items);

      scroller.setScrollTop(0);
      const range1 = scroller.getVisibleRange();

      scroller.setScrollTop(500);
      const range2 = scroller.getVisibleRange();

      expect(range2.startIndex).toBeGreaterThan(range1.startIndex);
    });

    it("should get visible items", () => {
      const scroller = new VirtualScroller({
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2
      });

      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      scroller.setItems(items);
      scroller.setScrollTop(0);

      const visibleItems = scroller.getVisibleItems();
      expect(visibleItems.length).toBeGreaterThan(0);
      expect(visibleItems.length).toBeLessThanOrEqual(items.length);
    });

    it("should calculate correct offset", () => {
      const scroller = new VirtualScroller({
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2
      });

      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      scroller.setItems(items);

      scroller.setScrollTop(0);
      const offset1 = scroller.getOffset();

      scroller.setScrollTop(500);
      const offset2 = scroller.getOffset();

      expect(offset2).toBeGreaterThan(offset1);
    });
  });

  describe("BatchProcessor", () => {
    class TestBatchProcessor extends BatchProcessor<number, number> {
      protected async processBatchItems(items: number[]): Promise<number[]> {
        // Simulate batch processing - sum all items
        const sum = items.reduce((a, b) => a + b, 0);
        return items.map(() => sum);
      }
    }

    it("should process items in batches", async () => {
      const processor = new TestBatchProcessor({
        batchSize: 3,
        maxWaitTime: 1000
      });

      const results = await Promise.all([
        processor.add(1),
        processor.add(2),
        processor.add(3)
      ]);

      expect(results).toEqual([6, 6, 6]); // 1+2+3=6
    });

    it("should process partial batch after max wait time", async () => {
      const processor = new TestBatchProcessor({
        batchSize: 5,
        maxWaitTime: 100
      });

      const results = await Promise.all([
        processor.add(1),
        processor.add(2)
      ]);

      expect(results).toEqual([3, 3]); // 1+2=3
    });

    it("should flush remaining items", async () => {
      const processor = new TestBatchProcessor({
        batchSize: 3,
        maxWaitTime: 1000
      });

      const promise1 = processor.add(1);
      const promise2 = processor.add(2);

      await processor.flush();

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual([3, 3]); // 1+2=3
    });

    it("should clear queue", async () => {
      const processor = new TestBatchProcessor({
        batchSize: 3,
        maxWaitTime: 1000
      });

      const promise = processor.add(1);
      processor.clear();

      try {
        await promise;
        expect.fail("Should have rejected");
      } catch (error) {
        expect((error as Error).message).toContain("cleared");
      }
    });
  });
});
