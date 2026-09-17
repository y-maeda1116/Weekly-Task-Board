/**
 * Palette Search Tests
 * searchTasks / filterCommands / combineResults のマッチング・ランキング・件数制限のテスト
 */

import { describe, it, expect } from "vitest";
import { Task, TaskCategory, TaskPriority } from "../../src/types";
import {
  searchTasks,
  filterCommands,
  combineResults,
  type PaletteItem
} from "../../src/features/paletteSearch";
import { PALETTE_COMMANDS, type PaletteCommandDef } from "../../src/features/paletteCommands";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t-1",
  name: "",
  estimated_time: 30,
  actual_time: 0,
  completed: false,
  priority: TaskPriority.MEDIUM,
  category: TaskCategory.TASK,
  date: "2026-09-14",
  assigned_date: "2026-09-14",
  due_date: null,
  details: "",
  is_recurring: false,
  recurrence_pattern: null,
  recurrence_end_date: null,
  ...overrides,
});

const makeCommand = (id: string, title: string, keywords: string[] = []): PaletteCommandDef => ({
  id,
  title,
  keywords,
  target: `#cmd-${id}`,
});

describe("searchTasks", () => {
  it("空クエリは空配列を返す", () => {
    expect(searchTasks("", [makeTask({ name: "会議" })])).toEqual([]);
    expect(searchTasks("   ", [makeTask({ name: "会議" })])).toEqual([]);
  });

  it("name の部分一致でヒットする", () => {
    const results = searchTasks("会議", [makeTask({ id: "t-1", name: "週次会議" })]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: "task", task: { id: "t-1" } });
  });

  it("大文字小文字を無視する", () => {
    const results = searchTasks("REVIEW", [makeTask({ id: "t-1", name: "code review" })]);
    expect(results).toHaveLength(1);
  });

  it("details 一致でもヒットする", () => {
    const results = searchTasks("締切", [makeTask({ id: "t-2", name: "報告書", details: "締切は金曜" })]);
    expect(results).toHaveLength(1);
  });

  it("name前方一致は name部分一致より上位", () => {
    const results = searchTasks("会議", [
      makeTask({ id: "t-partial", name: "週次会議" }),
      makeTask({ id: "t-prefix", name: "会議資料" }),
    ]);
    expect(results.map(r => (r.kind === "task" ? r.task.id : ""))).toEqual(["t-prefix", "t-partial"]);
  });

  it("同スコアなら未完了を優先する", () => {
    const results = searchTasks("会議", [
      makeTask({ id: "t-done", name: "会議A", completed: true }),
      makeTask({ id: "t-open", name: "会議B" }),
    ]);
    expect(results.map(r => (r.kind === "task" ? r.task.id : ""))).toEqual(["t-open", "t-done"]);
  });

  it("同スコア・同完了状態なら assigned_date 降順", () => {
    const results = searchTasks("会議", [
      makeTask({ id: "t-old", name: "会議A", assigned_date: "2026-09-14" }),
      makeTask({ id: "t-new", name: "会議B", assigned_date: "2026-09-16" }),
    ]);
    expect(results.map(r => (r.kind === "task" ? r.task.id : ""))).toEqual(["t-new", "t-old"]);
  });

  it("一致ななしは空配列を返す", () => {
    expect(searchTasks("存在しない", [makeTask({ name: "会議" })])).toEqual([]);
  });

  it("入力配列を変更しない（イミュータブル）", () => {
    const tasks = [makeTask({ name: "会議" })];
    searchTasks("会議", tasks);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.name).toBe("会議");
  });
});

describe("filterCommands", () => {
  it("空クエリは全コマンドを返す", () => {
    const commands = [makeCommand("a", "テーマ切替"), makeCommand("b", "統計")];
    expect(filterCommands("", commands)).toHaveLength(2);
  });

  it("title の部分一致でヒットする", () => {
    const commands = [makeCommand("a", "テーマ切替"), makeCommand("b", "統計")];
    const results = filterCommands("テーマ", commands);
    expect(results.map(r => (r.kind === "command" ? r.command.id : ""))).toEqual(["a"]);
  });

  it("keywords の一致でヒットする", () => {
    const commands = [makeCommand("a", "統計", ["dashboard", "かんり"])];
    const results = filterCommands("dashboard", commands);
    expect(results).toHaveLength(1);
  });

  it("大文字小文字を無視する", () => {
    const commands = [makeCommand("a", "統計", ["Statistics"])];
    expect(filterCommands("statistics", commands)).toHaveLength(1);
  });
});

describe("combineResults", () => {
  it("コマンドを先頭にタスクが続く", () => {
    const commandItem: PaletteItem = { kind: "command", command: makeCommand("a", "統計") };
    const taskItem: PaletteItem = { kind: "task", task: makeTask({ id: "t-1", name: "会議" }), score: 50 };
    const combined = combineResults([commandItem], [taskItem]);
    expect(combined[0]!.kind).toBe("command");
    expect(combined[1]!.kind).toBe("task");
  });

  it("limit（既定12）で打ち切る", () => {
    const commandItem: PaletteItem = { kind: "command", command: makeCommand("a", "統計") };
    const taskItems: PaletteItem[] = Array.from({ length: 20 }, (_, i) => ({
      kind: "task" as const,
      task: makeTask({ id: `t-${i}`, name: `会議${i}` }),
      score: 50,
    }));
    expect(combineResults([commandItem], taskItems)).toHaveLength(12);
    expect(combineResults([commandItem], taskItems, 5)).toHaveLength(5);
  });
});

describe("PALETTE_COMMANDS 雛形", () => {
  it("Task 2 の時点では空配列（Task 3 で充実させる）", () => {
    expect(PALETTE_COMMANDS).toEqual([]);
  });
});
