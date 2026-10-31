/**
 * Command Palette Tests
 * パレットDOM層の開閉・検索・キーボードナビ・選択実行のテスト（deps モック）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Task, TaskCategory, TaskPriority } from "../../src/types";
import { initializeCommandPalette } from "../../src/features/CommandPalette";

const makeTask = (id: string, name: string, overrides: Partial<Task> = {}): Task => ({
  id,
  name,
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

const setupPaletteDom = (): void => {
  const palette = document.createElement("div");
  palette.id = "command-palette";
  palette.className = "modal";
  palette.style.display = "none";
  const input = document.createElement("input");
  input.id = "command-palette-input";
  const results = document.createElement("ul");
  results.id = "command-palette-results";
  palette.append(input, results);
  document.body.appendChild(palette);
};

const inputEl = (): HTMLInputElement =>
  document.getElementById("command-palette-input") as HTMLInputElement;

const resultItems = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>("#command-palette-results li"));

describe("initializeCommandPalette", () => {
  let goToWeek: ReturnType<typeof vi.fn>;
  let handle: { open: () => void; dispose: () => void } | undefined;
  let tasks: Task[];

  beforeEach(() => {
    vi.useFakeTimers();
    setupPaletteDom();
    goToWeek = vi.fn();
    tasks = [
      makeTask("t-1", "会議資料を作る"),
      makeTask("t-2", "週次会議", { assigned_date: "2026-09-16" }),
      makeTask("t-3", "未割り当ての仕事", { assigned_date: null }),
    ];
    handle = initializeCommandPalette({ getTasks: () => tasks, goToWeek });
  });

  afterEach(() => {
    handle?.dispose();
    handle = undefined;
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("open でパレットを表示しフォーカスし、空クエリならコマンド一覧を表示する", () => {
    handle!.open();
    const palette = document.getElementById("command-palette")!;
    expect(palette.style.display).toBe("block");
    expect(document.activeElement).toBe(inputEl());
    // 12コマンド表示（コマンドレジストリ由来）
    expect(resultItems().length).toBe(12);
  });

  it("入力（debounce後）でタスク結果が絞り込まれる", () => {
    handle!.open();
    inputEl().value = "会議";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    const items = resultItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(li => li.textContent?.includes("会議資料"))).toBe(true);
  });

  it("一致なしの場合は『一致する結果はありません』を表示する", () => {
    handle!.open();
    inputEl().value = "絶対に存在しないクエリ";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    expect(resultItems()[0]!.textContent).toBe("一致する結果はありません");
  });

  it("ArrowDown で選択が移り Enter でコマンドを実行して閉じる", () => {
    // PALETTE_COMMANDS[1] = prev-week。ArrowDown 1回 → index 1 が選択される
    const prevBtn = document.createElement("button");
    prevBtn.id = "prev-week";
    const clicked: string[] = [];
    prevBtn.addEventListener("click", () => clicked.push("prev"));
    document.body.appendChild(prevBtn);

    handle!.open();
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const selected = resultItems().find(li => li.classList.contains("palette-item-selected"));
    expect(selected?.textContent).toContain("前週へ");
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(clicked).toEqual(["prev"]);
    expect(document.getElementById("command-palette")!.style.display).toBe("none");
  });

  it("タスク結果を Enter で選ぶと goToWeek を呼びハイライトする", () => {
    // 「資料」は t-1 のみにヒット → コマンド0件・タスク1件
    const taskEl = document.createElement("div");
    taskEl.dataset.taskId = "t-1";
    document.body.appendChild(taskEl);

    handle!.open();
    inputEl().value = "資料";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(goToWeek).toHaveBeenCalledTimes(1);
    expect(goToWeek.mock.calls[0]![0]).toBeInstanceOf(Date);
    expect((goToWeek.mock.calls[0]![0] as Date).getDate()).toBe(14);
    expect(taskEl.classList.contains("palette-highlight")).toBe(true);
    expect(document.getElementById("command-palette")!.style.display).toBe("none");
  });

  it("未割り当てタスクは goToWeek を呼ばない", () => {
    const taskEl = document.createElement("div");
    taskEl.dataset.taskId = "t-3";
    document.body.appendChild(taskEl);

    handle!.open();
    inputEl().value = "未割り当て";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(goToWeek).not.toHaveBeenCalled();
    expect(taskEl.classList.contains("palette-highlight")).toBe(true);
  });

  it("Escape で閉じる", () => {
    handle!.open();
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.getElementById("command-palette")!.style.display).toBe("none");
  });

  it("IME変換中 (isComposing) の Enter は無視する", () => {
    handle!.open();
    inputEl().value = "会議";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    inputEl().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true } as KeyboardEventInit));
    expect(goToWeek).not.toHaveBeenCalled();
    expect(document.getElementById("command-palette")!.style.display).toBe("block");
  });

  it("背景クリックで閉じる", () => {
    handle!.open();
    document.getElementById("command-palette")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(document.getElementById("command-palette")!.style.display).toBe("none");
  });

  it("dispose 後は入力に反応しない", () => {
    handle!.open();
    const before = resultItems().length; // 空クエリなので12（コマンド一覧）
    handle!.dispose();
    inputEl().value = "テーマ";
    inputEl().dispatchEvent(new Event("input", { bubbles: true }));
    vi.advanceTimersByTime(150);
    expect(resultItems().length).toBe(before); // フィルタされずコマンド一覧のまま
  });

  it("選択済み項目への mouseenter では再描画しない", () => {
    handle!.open();
    const first = resultItems()[0]!; // index 0 が選択状態
    first.dispatchEvent(new MouseEvent("mouseenter"));
    // 再描画されていると DOM が入れ替わり、first は結果リストから外れる
    expect(resultItems()[0]).toBe(first);
  });

  it("未選択項目への mouseenter では選択が移動する", () => {
    handle!.open();
    const before = resultItems();
    before[1]!.dispatchEvent(new MouseEvent("mouseenter"));
    const after = resultItems();
    expect(after[1]?.classList.contains("palette-item-selected")).toBe(true);
    expect(after[0]).not.toBe(before[0]); // 再描画で DOM が組み替わる
  });
});
