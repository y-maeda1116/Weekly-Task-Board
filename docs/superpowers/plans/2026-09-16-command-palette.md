# コマンドパレット＋タスク検索 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Ctrl/Cmd+K` で開くコマンドパレットを追加し、全期間のタスク検索（週移動＋ハイライト）と主要ナビゲーションコマンドを提供する。

**Architecture:** 純関数コア（`paletteSearch.ts` / `paletteCommands.ts`）＋薄いDOMラッパー（`CommandPalette.ts`）の3新規ファイル。既存の `KeyboardShortcuts.ts` の deps 注入パターンを踏襲する。コマンド実行は既存ボタンの `click()` 流しで既存ハンドラを再利用する。

**Tech Stack:** TypeScript 7.0 Beta (tsgo) / Vite 8 / Vitest (jsdom) / Playwright。依存ライブラリ追加なし。

**Spec:** `docs/superpowers/specs/2026-09-16-command-palette-design.md`

## Global Constraints

- コミットメッセージは Conventional Commits（`feat:` / `fix:` / `test:` / `docs:` / `chore:`）。Attribution 無効。
- イミュータブル操作のみ（既存オブジェクトへの mutation 禁止。`map` / `filter` / スプレッドで新オブジェクト生成）。
- `console.log` 禁止。catch ブロック内の `console.error` のみ可（`init.ts` の既存パターン準拠）。
- 型チェック: `npm run type-check`（tsgo）。**`noUncheckedIndexedAccess` 有効**（配列アクセスは undefined ガード）。
- テスト実行: `npx vitest run <file>`（全体は `npm test`）。coverage しきい値 80%（vitest.config.ts）。
- コメント・テスト名は日本語（既存テストファイルの文体準拠）。
- Node >= 26。GitHub Actions プラグイン・依存の追加変更はしない。
- ファイルは 800 行以内。

## 事前状況（重要）

- `src/features/KeyboardShortcuts.ts` と `tests/unit/keyboard-shortcuts.unit.test.ts` は**未コミット**（untracked）。
- `KeyboardShortcuts.ts` は `getFocusedTaskId` が未定義で**型チェックエラー**（前セッションの中断物）。Task 1 で完成させる。
- `Task` 型の enum は `src/types/task.ts` 参照: `TaskCategory` = `task|meeting|review|bugfix|document|research`、`TaskPriority` = `low|medium|high|urgent`。
- `assigned_date` は `"YYYY-MM-DD"` 文字列（`null` で未割り当て）。`new Date(x + "T00:00:00")` でローカル0時解釈すること（UTC解釈の週ずれ防止）。

---

### Task 1: KeyboardShortcuts を完成させる

**Files:**
- Modify: `src/features/KeyboardShortcuts.ts`（`getFocusedTaskId` 実装を追加）
- Modify: `index.html`（ヘルプモーダルDOM追加。`#signifier-help-modal`（396行目付近）の後に挿入）
- Modify: `src/app/init.ts`（`initializeApp` 末尾付近に wiring 追加）
- Test: `tests/unit/keyboard-shortcuts.unit.test.ts`（既存。追記なし — `getFocusedTaskId` は E キーのテストで間接カバー済み）

**Interfaces:**
- Consumes: `initializeKeyboardShortcuts(deps)`（既存・未変更）、`w.openCreateModal(date?)` / `w.HybridTaskModal?.openEditModal?.(taskId)`（init.ts:319-320 で既存）、`previousWeek` / `nextWeek` / `currentWeek`（`src/features/WeekNavigation.ts` の既存 export）
- Produces: 型チェックが通り初期化されるキーボードショートカット機能。`KeyboardShortcutDeps` の形状はこの時点では変更しない

- [ ] **Step 1: getFocusedTaskId を実装する**

`src/features/KeyboardShortcuts.ts` の `isAnyOverlayOpen` 関数（59-63行目）の後に追加:

```typescript
function getFocusedTaskId(): string | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  const taskElement = active.closest<HTMLElement>("[data-task-id]");
  return taskElement?.dataset.taskId ?? null;
}
```

- [ ] **Step 2: 型チェックでエラー消失を確認**

Run: `npm run type-check`
Expected: `KeyboardShortcuts.ts` の `getFocusedTaskId` エラー（3件）が消える。他の既存エラーは出ない。

- [ ] **Step 3: index.html にヘルプモーダルを追加**

`#signifier-help-modal` の閉じタグ `</div>` の後に挿入（構造は既存モーダルと同じ `.modal > .modal-content > .close-btn + h2`）:

```html
    <div id="keyboard-shortcuts-help" class="modal" style="display:none;">
        <div class="modal-content" style="max-width:420px;">
            <span class="close-btn" id="close-keyboard-shortcuts-help">&times;</span>
            <h2 style="margin-top:0;">キーボードショートカット</h2>
            <table style="width:100%;border-collapse:collapse;color:var(--font-color);">
                <tr><td style="padding:6px 12px;"><kbd>N</kbd></td><td>タスクを追加</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>E</kbd></td><td>フォーカス中のタスクを編集</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>完了をトグル</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>D</kbd></td><td>フォーカス中のタスクを削除</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>←</kbd> / <kbd>→</kbd></td><td>前週 / 次週</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>T</kbd></td><td>今週へ戻る</td></tr>
                <tr><td style="padding:6px 12px;"><kbd>?</kbd></td><td>このヘルプを表示</td></tr>
            </table>
        </div>
    </div>
```

- [ ] **Step 4: KeyboardShortcuts.ts に閉じボタン対応を追加**

`initializeKeyboardShortcuts` 内（`document.addEventListener("keydown", handler);` の直前）に追加:

```typescript
  document.getElementById("close-keyboard-shortcuts-help")?.addEventListener("click", () => {
    const help = document.getElementById(HELP_MODAL_ID);
    if (help) help.style.display = "none";
  });
```

- [ ] **Step 5: init.ts に wiring を追加**

`src/app/init.ts` のファイル先頭 import 群に追加:

```typescript
import { initializeKeyboardShortcuts } from '../features/KeyboardShortcuts';
import { previousWeek, nextWeek, currentWeek } from '../features/WeekNavigation';
```

`initializeApp()` 内の「11. Export/Import buttons」ブロックの後に追加（`renderWeekFn` は関数内の既存変数。未定義なら `w.renderWeek` を使う）:

```typescript
  // 12. Keyboard shortcuts
  try {
    initializeKeyboardShortcuts({
      openCreateModal: () => w.openCreateModal?.(),
      openEditModal: (taskId: string) => w.HybridTaskModal?.openEditModal?.(taskId),
      toggleTaskCompletion: (taskId: string) => {
        const checkbox = document.querySelector<HTMLInputElement>(`[data-task-id="${taskId}"] .task-checkbox`);
        checkbox?.click(); // 既存のチェックボックスハンドラ（アニメーション・保存）を再利用
      },
      deleteTask: (taskId: string) => {
        appContext.tasks = appContext.tasks.filter(t => t.id !== taskId);
        saveTasksValidated(appContext.tasks);
        w.tasks = appContext.tasks;
        renderWeekFn?.();
        w.updateDashboard?.();
      },
      navigateWeek: (direction: -1 | 1) => { direction === -1 ? previousWeek() : nextWeek(); },
      goToToday: () => currentWeek(),
    });
  } catch (e) { console.error('[Init] KeyboardShortcuts failed:', e); }
```

注意: `renderWeekFn` が `initializeApp` 内のその位置でスコープに入らない場合は `w.renderWeek?.()` に読み替える（両方とも既存の再描画エントリ）。

- [ ] **Step 6: 型チェックとテストを実行**

Run: `npm run type-check && npx vitest run tests/unit/keyboard-shortcuts.unit.test.ts`
Expected: 型エラーなし、テスト全PASS（14件）。

- [ ] **Step 7: 手動確認**

Run: `npm run dev` → ブラウザで `http://localhost:5173`
- タスクをクリックしてフォーカス → `e` で編集モーダル、`Enter` で完了トグル
- `←`/`→` で週移動、`t` で今週、`?` でヘルプ表示・`Escape` で閉じる
確認後 Ctrl+C で停止。

- [ ] **Step 8: Commit**

```bash
git add src/features/KeyboardShortcuts.ts tests/unit/keyboard-shortcuts.unit.test.ts index.html src/app/init.ts
git commit -m "feat: add keyboard shortcuts with help modal"
```

---

### Task 2: paletteSearch.ts（検索・ランキング純関数）

**Files:**
- Create: `src/features/paletteSearch.ts`
- Test: `tests/unit/palette-search.unit.test.ts`

**Interfaces:**
- Consumes: `Task`（`src/types`）、`PaletteCommandDef`（Task 3 で定義。**Task 2 では型 import のみで実装は空でもよい** — ただしテストの fixture で `PALETTE_COMMANDS` が要るため、Task 3 の `paletteCommands.ts` を先に skeleton として作る。順序を変えず、Step 1 で型と空配列だけ先に作ること）
- Produces:
  - `type PaletteItem = { kind: "command"; command: PaletteCommandDef } | { kind: "task"; task: Task; score: number }`
  - `searchTasks(query: string, tasks: readonly Task[]): PaletteItem[]`
  - `filterCommands(query: string, commands: readonly PaletteCommandDef[]): PaletteItem[]`
  - `combineResults(commands: readonly PaletteItem[], tasks: readonly PaletteItem[], limit?: number): PaletteItem[]`（既定 limit = 12）

- [ ] **Step 1: paletteCommands.ts の最小雛形を作る（Task 3 で完成させる）**

`src/features/paletteCommands.ts` を作成:

```typescript
/**
 * Palette Commands
 * コマンドパレットから実行できるコマンド定義
 */

export interface PaletteCommandDef {
  readonly id: string;
  readonly title: string;
  readonly keywords: readonly string[];
  readonly target: string; // 実行対象のCSSセレクタ（既存ボタン）
}

export const PALETTE_COMMANDS: readonly PaletteCommandDef[] = [];

export function executeCommand(_command: PaletteCommandDef): boolean {
  return false; // Task 3 で実装
}
```

- [ ] **Step 2: 失敗テストを書く**

`tests/unit/palette-search.unit.test.ts` を作成:

```typescript
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
```

- [ ] **Step 3: テストを実行して失敗を確認**

Run: `npx vitest run tests/unit/palette-search.unit.test.ts`
Expected: FAIL（`paletteSearch` モジュールが存在しない）。

- [ ] **Step 4: paletteSearch.ts を実装する**

```typescript
/**
 * Palette Search
 * コマンドパレットの検索・ランキング（純関数・状態を持たない）
 */
import type { Task } from "../types";
import type { PaletteCommandDef } from "./paletteCommands";

export type PaletteItem =
  | { readonly kind: "command"; readonly command: PaletteCommandDef }
  | { readonly kind: "task"; readonly task: Task; readonly score: number };

const SCORE_NAME_PREFIX = 100;
const SCORE_NAME_CONTAINS = 50;
const SCORE_DETAILS = 10;
const SCORE_INCOMPLETE_BONUS = 5;

export function searchTasks(query: string, tasks: readonly Task[]): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [];
  const matched: PaletteItem[] = [];
  for (const task of tasks) {
    const name = task.name.toLowerCase();
    let score = 0;
    if (name.startsWith(q)) score = SCORE_NAME_PREFIX;
    else if (name.includes(q)) score = SCORE_NAME_CONTAINS;
    else if (task.details.toLowerCase().includes(q)) score = SCORE_DETAILS;
    if (score === 0) continue;
    if (!task.completed) score += SCORE_INCOMPLETE_BONUS;
    matched.push({ kind: "task", task, score });
  }
  return [...matched].sort((a, b) => {
    if (a.kind !== "task" || b.kind !== "task") return 0;
    if (a.score !== b.score) return b.score - a.score;
    return (b.task.assigned_date ?? "").localeCompare(a.task.assigned_date ?? "");
  });
}

export function filterCommands(query: string, commands: readonly PaletteCommandDef[]): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return commands.map(command => ({ kind: "command" as const, command }));
  return commands
    .filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.keywords.some(k => k.toLowerCase().includes(q))
    )
    .map(command => ({ kind: "command" as const, command }));
}

export function combineResults(
  commands: readonly PaletteItem[],
  tasks: readonly PaletteItem[],
  limit = 12
): PaletteItem[] {
  return [...commands, ...tasks].slice(0, limit);
}
```

- [ ] **Step 5: テストを実行して PASS を確認**

Run: `npx vitest run tests/unit/palette-search.unit.test.ts`
Expected: 全PASS。

- [ ] **Step 6: 型チェック**

Run: `npm run type-check`
Expected: エラーなし。

- [ ] **Step 7: Commit**

```bash
git add src/features/paletteSearch.ts src/features/paletteCommands.ts tests/unit/palette-search.unit.test.ts
git commit -m "feat: add palette search and ranking pure functions"
```

---

### Task 3: paletteCommands.ts（コマンド定義と実行）

**Files:**
- Modify: `src/features/paletteCommands.ts`（雛形を完成させる）
- Test: `tests/unit/palette-commands.unit.test.ts`

**Interfaces:**
- Consumes: Task 2 の `PaletteCommandDef` interface（同ファイル内で定義済み）
- Produces:
  - `PALETTE_COMMANDS: readonly PaletteCommandDef[]`（12コマンド。target は index.html の実在ボタンID）
  - `executeCommand(command: PaletteCommandDef): boolean`（target が見つかり click できたら true）

- [ ] **Step 1: 失敗テストを書く**

`tests/unit/palette-commands.unit.test.ts` を作成:

```typescript
/**
 * Palette Commands Tests
 * コマンド定義のスキーマ検証と executeCommand のテスト
 */

import { describe, it, expect, afterEach } from "vitest";
import { PALETTE_COMMANDS, executeCommand } from "../../src/features/paletteCommands";

const VALID_ID = /^#[a-z][a-z0-9-]*$/;

describe("PALETTE_COMMANDS スキーマ", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("12コマンド定義されている", () => {
    expect(PALETTE_COMMANDS).toHaveLength(12);
  });

  it("各コマンドが必須フィールドを持つ", () => {
    for (const c of PALETTE_COMMANDS) {
      expect(typeof c.id).toBe("string");
      expect(c.id.length).toBeGreaterThan(0);
      expect(typeof c.title).toBe("string");
      expect(c.title.length).toBeGreaterThan(0);
      expect(Array.isArray(c.keywords)).toBe(true);
      expect(c.keywords.length).toBeGreaterThan(0);
      expect(typeof c.target).toBe("string");
    }
  });

  it("id が一意", () => {
    const ids = PALETTE_COMMANDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("target が '#id' 形式", () => {
    for (const c of PALETTE_COMMANDS) {
      expect(c.target).toMatch(VALID_ID);
    }
  });

  it("title が重複しない", () => {
    const titles = PALETTE_COMMANDS.map(c => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("executeCommand", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("target 要素を click する", () => {
    const button = document.createElement("button");
    button.id = "theme-toggle";
    const clicked: string[] = [];
    button.addEventListener("click", () => clicked.push("theme"));
    document.body.appendChild(button);

    const command = PALETTE_COMMANDS.find(c => c.id === "theme");
    expect(command).toBeDefined();
    const result = executeCommand(command!);
    expect(result).toBe(true);
    expect(clicked).toEqual(["theme"]);
  });

  it("target が存在しない場合は false を返し例外を出さない", () => {
    const result = executeCommand({ id: "x", title: "不在", keywords: ["なし"], target: "#not-exist" });
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run tests/unit/palette-commands.unit.test.ts`
Expected: FAIL（PALETTE_COMMANDS が空で12件の期待に失敗）。

- [ ] **Step 3: paletteCommands.ts を完成させる**

```typescript
/**
 * Palette Commands
 * コマンドパレットから実行できるコマンド定義と実行
 * 実行は既存ボタンの click() 流し — 既存ハンドラを再利用し関数名リファクタに耐える
 */
import { logger } from "../utils/logger";

export interface PaletteCommandDef {
  readonly id: string;
  readonly title: string;
  readonly keywords: readonly string[];
  readonly target: string; // 実行対象のCSSセレクタ（既存ボタン）
}

export const PALETTE_COMMANDS: readonly PaletteCommandDef[] = [
  { id: "create-task", title: "タスクを追加", keywords: ["新規", "ついか", "add", "new", "task"], target: "#add-task-btn" },
  { id: "prev-week", title: "前週へ", keywords: ["せんしゅう", "previous", "prev"], target: "#prev-week" },
  { id: "next-week", title: "次週へ", keywords: ["じしゅう", "next"], target: "#next-week" },
  { id: "today", title: "今週へ戻る", keywords: ["こんしゅう", "today", "current"], target: "#today" },
  { id: "statistics", title: "統計ダッシュボード", keywords: ["とうけい", "statistics", "dashboard", "graph"], target: "#statistics-toggle" },
  { id: "template", title: "テンプレート", keywords: ["てんぷれーと", "template"], target: "#template-toggle" },
  { id: "theme", title: "テーマ切替", keywords: ["だーく", "ダーク", "theme", "dark", "light"], target: "#theme-toggle" },
  { id: "journal", title: "ジャーナル", keywords: ["にっき", "journal", "log"], target: "#journal-toggle" },
  { id: "migration", title: "タスク移行", keywords: ["いこう", "migration", "move"], target: "#migration-toggle" },
  { id: "review", title: "週次レビュー", keywords: ["しゅうじ", "review", "weekly"], target: "#review-toggle" },
  { id: "morning-pages", title: "モーニングページ", keywords: ["もーにんぐ", "morning", "pages", "こうし"], target: "#morning-pages-toggle" },
  { id: "archive", title: "アーカイブ", keywords: ["あーかいぶ", "archive"], target: "#archive-toggle" },
];

export function executeCommand(command: PaletteCommandDef): boolean {
  const element = document.querySelector<HTMLElement>(command.target);
  if (element === null) {
    logger.warn("CommandPalette", `command target not found: ${command.target}`);
    return false;
  }
  element.click();
  return true;
}
```

注意: `src/utils/logger.ts` の export が `logger` 定数でない場合は、`WeekNavigation.ts` の import 文（`import { logger } from '../utils/logger';` 相当）を確認して同じ形に合わせる。

- [ ] **Step 4: テストを実行して PASS を確認**

Run: `npx vitest run tests/unit/palette-commands.unit.test.ts`
Expected: 全PASS。

- [ ] **Step 5: Task 2 の雛形テストを更新**

`tests/unit/palette-search.unit.test.ts` の末尾の describe を削除:

```typescript
describe("PALETTE_COMMANDS 雛形", () => {
  it("Task 2 の時点では空配列（Task 3 で充実させる）", () => {
    expect(PALETTE_COMMANDS).toEqual([]);
  });
});
```

このブロックを削除し、`PALETTE_COMMANDS` の import も外す。

- [ ] **Step 6: 全 palette テストと型チェック**

Run: `npx vitest run tests/unit/palette-search.unit.test.ts tests/unit/palette-commands.unit.test.ts && npm run type-check`
Expected: 全PASS・型エラーなし。

- [ ] **Step 7: Commit**

```bash
git add src/features/paletteCommands.ts tests/unit/palette-commands.unit.test.ts tests/unit/palette-search.unit.test.ts
git commit -m "feat: add palette command registry and executor"
```

---

### Task 4: CommandPalette.ts（DOM層）

**Files:**
- Create: `src/features/CommandPalette.ts`
- Test: `tests/unit/command-palette.unit.test.ts`

**Interfaces:**
- Consumes: `searchTasks` / `filterCommands` / `combineResults` / `PaletteItem`（Task 2）、`PALETTE_COMMANDS` / `executeCommand`（Task 3）、`showNotification(message, type)`（`src/app/notifications.ts`）、`Task`（`src/types`）
- Produces:
  - `interface CommandPaletteDeps { readonly getTasks: () => readonly Task[]; readonly goToWeek: (date: Date) => void; }`
  - `interface CommandPaletteHandle { readonly open: () => void; readonly dispose: () => void; }`
  - `initializeCommandPalette(deps: CommandPaletteDeps): CommandPaletteHandle`
  - DOM要件: `#command-palette`（.modal）、`#command-palette-input`、`#command-palette-results` が存在すること（Task 6 で index.html に追加。テストでは自前構築）

- [ ] **Step 1: 失敗テストを書く**

`tests/unit/command-palette.unit.test.ts` を作成:

```typescript
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
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run tests/unit/command-palette.unit.test.ts`
Expected: FAIL（`CommandPalette` モジュールが存在しない）。

- [ ] **Step 3: CommandPalette.ts を実装する**

```typescript
/**
 * Command Palette
 * Ctrl/Cmd+K で開く検索パレットのDOM層（開閉・描画・キーボードナビ・選択実行）
 */
import type { Task } from "../types";
import { showNotification } from "../app/notifications";
import { searchTasks, filterCommands, combineResults, type PaletteItem } from "./paletteSearch";
import { PALETTE_COMMANDS, executeCommand } from "./paletteCommands";

export interface CommandPaletteDeps {
  readonly getTasks: () => readonly Task[];
  readonly goToWeek: (date: Date) => void;
}

export interface CommandPaletteHandle {
  readonly open: () => void;
  readonly dispose: () => void;
}

const PALETTE_ID = "command-palette";
const INPUT_ID = "command-palette-input";
const RESULTS_ID = "command-palette-results";
const HIGHLIGHT_CLASS = "palette-highlight";
const SELECTED_CLASS = "palette-item-selected";
const NO_RESULT_CLASS = "palette-no-result";
const HIGHLIGHT_MS = 3000;
const DEBOUNCE_MS = 150;

export function initializeCommandPalette(deps: CommandPaletteDeps): CommandPaletteHandle {
  const palette = document.getElementById(PALETTE_ID);
  const input = document.getElementById(INPUT_ID) as HTMLInputElement | null;
  const resultsEl = document.getElementById(RESULTS_ID);
  if (palette === null || input === null || resultsEl === null) {
    console.error("CommandPalette: required DOM elements are missing");
    return { open: () => undefined, dispose: () => undefined };
  }

  let items: readonly PaletteItem[] = [];
  let selectedIndex = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let highlightTimer: ReturnType<typeof setTimeout> | undefined;

  const clearHighlightTimer = (): void => {
    if (highlightTimer !== undefined) {
      clearTimeout(highlightTimer);
      highlightTimer = undefined;
    }
  };

  const highlightTask = (taskId: string): void => {
    const taskEl = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
    if (taskEl === null) {
      showNotification("タスクを表示できません（カテゴリフィルタで非表示の可能性があります）", "info");
      return;
    }
    clearHighlightTimer();
    taskEl.classList.add(HIGHLIGHT_CLASS);
    taskEl.scrollIntoView({ behavior: "smooth", block: "center" });
    highlightTimer = setTimeout(() => {
      taskEl.classList.remove(HIGHLIGHT_CLASS);
      highlightTimer = undefined;
    }, HIGHLIGHT_MS);
  };

  const renderResults = (): void => {
    resultsEl.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = NO_RESULT_CLASS;
      empty.textContent = "一致する結果はありません";
      resultsEl.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = index === selectedIndex ? `palette-item ${SELECTED_CLASS}` : "palette-item";
      li.setAttribute("role", "option");
      if (item.kind === "command") {
        li.textContent = `▸ ${item.command.title}`;
      } else {
        const dateLabel = item.task.assigned_date ?? "未割り当て";
        li.textContent = `${item.task.name}（${dateLabel}）`;
      }
      li.addEventListener("click", () => selectItem(item));
      li.addEventListener("mouseenter", () => {
        selectedIndex = index;
        renderResults();
      });
      resultsEl.appendChild(li);
    });
  };

  const refresh = (query: string): void => {
    let taskItems: readonly PaletteItem[] = [];
    try {
      taskItems = searchTasks(query, deps.getTasks());
    } catch (error) {
      console.error("CommandPalette: task search failed:", error);
      showNotification("タスクの検索に失敗しました", "error");
    }
    const commandItems = filterCommands(query, PALETTE_COMMANDS);
    items = combineResults(commandItems, taskItems);
    selectedIndex = 0;
    renderResults();
  };

  const close = (): void => {
    palette.style.display = "none";
  };

  const selectItem = (item: PaletteItem): void => {
    close();
    if (item.kind === "command") {
      executeCommand(item.command);
      return;
    }
    if (item.task.assigned_date !== null) {
      // "YYYY-MM-DD" + T00:00:00 でローカル0時解釈（UTC解釈の週ずれ防止）
      deps.goToWeek(new Date(`${item.task.assigned_date}T00:00:00`));
    }
    highlightTask(item.task.id);
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      close();
      event.preventDefault();
      return;
    }
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
      renderResults();
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      renderResults();
      event.preventDefault();
    } else if (event.key === "Enter") {
      const selected = items[selectedIndex];
      if (selected !== undefined) selectItem(selected);
      event.preventDefault();
    }
  };

  const handleInput = (): void => {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      refresh(input.value);
    }, DEBOUNCE_MS);
  };

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === palette) close();
  };

  const open = (): void => {
    palette.style.display = "block";
    input.value = "";
    refresh("");
    input.focus();
  };

  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("input", handleInput);
  palette.addEventListener("click", handleBackdropClick);

  return {
    open,
    dispose: () => {
      input.removeEventListener("keydown", handleKeydown);
      input.removeEventListener("input", handleInput);
      palette.removeEventListener("click", handleBackdropClick);
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      clearHighlightTimer();
    },
  };
}
```

- [ ] **Step 4: テストを実行して PASS を確認**

Run: `npx vitest run tests/unit/command-palette.unit.test.ts`
Expected: 全PASS。

- [ ] **Step 5: 型チェック**

Run: `npm run type-check`
Expected: エラーなし。

- [ ] **Step 6: Commit**

```bash
git add src/features/CommandPalette.ts tests/unit/command-palette.unit.test.ts
git commit -m "feat: add command palette DOM layer"
```

---

### Task 5: Ctrl/Cmd+K 統合（KeyboardShortcuts 拡張）

**Files:**
- Modify: `src/features/KeyboardShortcuts.ts`（`KeyboardShortcutDeps` に `openPalette` 追加、Ctrl/Cmd+K 分岐、ヘルプ文言）
- Modify: `index.html`（ヘルプ表に Ctrl/Cmd+K 行を追加）
- Modify: `src/app/init.ts`（shortcutDeps に一時 stub の `openPalette` を追加）
- Test: `tests/unit/keyboard-shortcuts.unit.test.ts`（追記）

**Interfaces:**
- Consumes: `KeyboardShortcutDeps`（Task 1 で確立）
- Produces: `KeyboardShortcutDeps` に `readonly openPalette: () => void` が必須追加（Task 6 の init.ts wiring が依存）

- [ ] **Step 1: 失敗テストを書く**

`tests/unit/keyboard-shortcuts.unit.test.ts` の `initializeKeyboardShortcuts` describe 内:

`ShortcutDeps` interface と beforeEach の deps 定義に `openPalette: ReturnType<typeof vi.fn>;` / `openPalette: vi.fn(),` を追加した上で、テストを2件追加:

```typescript
  it("Ctrl+K / Cmd+K でコマンドパレットを開く", () => {
    dispatchKey("k", { ctrlKey: true });
    dispatchKey("k", { metaKey: true });
    expect(deps.openPalette).toHaveBeenCalledTimes(2);
  });

  it("オーバーレイ表示中は Ctrl+K も無視する", () => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "block";
    document.body.appendChild(modal);
    dispatchKey("k", { ctrlKey: true });
    expect(deps.openPalette).not.toHaveBeenCalled();
  });
```

2件目は「オーバーレイ表示中は Ctrl+K も無効」が仕様であることを固定するテスト（他モーダル編集中にパレットが開くと入力が失われるのを防ぐ）。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run tests/unit/keyboard-shortcuts.unit.test.ts`
Expected: FAIL（`openPalette` が deps に無く型エラー／呼ばれない）。

- [ ] **Step 3: KeyboardShortcuts.ts を変更する**

`KeyboardShortcutDeps` に追加:

```typescript
export interface KeyboardShortcutDeps {
  readonly openCreateModal: () => void;
  readonly openEditModal: (taskId: string) => void;
  readonly toggleTaskCompletion: (taskId: string) => void;
  readonly deleteTask: (taskId: string) => void;
  readonly navigateWeek: (direction: -1 | 1) => void;
  readonly goToToday: () => void;
  readonly openPalette: () => void;
}
```

`initializeKeyboardShortcuts` の handler 冒頭（`if (event.key === "Escape")` の前）に追加:

```typescript
    if ((event.ctrlKey || event.metaKey) && (event.key === "k" || event.key === "K")) {
      if (isAnyOverlayOpen()) return;
      event.preventDefault();
      deps.openPalette();
      return;
    }
```

- [ ] **Step 4: index.html のヘルプ表に追記**

`#keyboard-shortcuts-help` の表の `<kbd>?</kbd>` 行の前に追加:

```html
                <tr><td style="padding:6px 12px;"><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>コマンドパレット（検索）</td></tr>
```

- [ ] **Step 5: init.ts の shortcutDeps に一時 stub を追加**

Task 1 で追加した `initializeKeyboardShortcuts({...})` の呼び出しに `openPalette: () => undefined,` を追加（Task 6 で本物に差し替える）。コメント `// TODO: Task 6 で paletteHandle.open に差し替え` は付けず、Task 6 のステップで必ず置換する。

- [ ] **Step 6: テストと型チェック**

Run: `npx vitest run tests/unit/keyboard-shortcuts.unit.test.ts && npm run type-check`
Expected: 全PASS・型エラーなし。

- [ ] **Step 7: Commit**

```bash
git add src/features/KeyboardShortcuts.ts tests/unit/keyboard-shortcuts.unit.test.ts index.html src/app/init.ts
git commit -m "feat: open command palette with Ctrl/Cmd+K"
```

---

### Task 6: UI統合（index.html・style.css・init.ts）

**Files:**
- Modify: `index.html`（`#palette-toggle` ボタン、`#command-palette` モーダルDOM）
- Modify: `style.css`（パレットスタイル・`.palette-highlight`）
- Modify: `src/app/init.ts`（`initializeCommandPalette` wiring と stub 差し替え）

**Interfaces:**
- Consumes: `initializeCommandPalette(deps)`（Task 4）、`goToWeek`（`WeekNavigation`）、`appContext.tasks`
- Produces: 動作するコマンドパレット（ボタン入口・Ctrl/Cmd+K入口）

- [ ] **Step 1: index.html に検索ボタンを追加**

`#header-group-utility`（73行目付近）の `#statistics-toggle` の前に追加:

```html
                <button id="palette-toggle" title="検索 (Ctrl+K)">🔎</button>
```

- [ ] **Step 2: index.html にパレットモーダルDOMを追加**

`#keyboard-shortcuts-help` モーダルの後に追加:

```html
    <div id="command-palette" class="modal" style="display:none;">
        <div class="modal-content palette-panel" role="dialog" aria-modal="true" aria-label="検索パレット">
            <input type="text" id="command-palette-input" placeholder="タスクやコマンドを検索…" autocomplete="off">
            <ul id="command-palette-results" role="listbox"></ul>
        </div>
    </div>
```

- [ ] **Step 3: style.css にスタイルを追加（ファイル末尾）**

```css
/* ===== Command Palette ===== */
#command-palette {
    z-index: 2000;
}

#command-palette .palette-panel {
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    width: min(560px, calc(100vw - 32px));
    padding: 0;
    max-height: 70vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

#command-palette-input {
    width: 100%;
    box-sizing: border-box;
    padding: 14px 16px;
    border: none;
    border-bottom: 1px solid var(--border-color);
    border-radius: 8px 8px 0 0;
    font-size: 16px;
    background: transparent;
    color: var(--font-color);
    outline: none;
}

#command-palette-results {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 320px;
    overflow-y: auto;
}

#command-palette-results .palette-item {
    padding: 10px 16px;
    cursor: pointer;
    color: var(--font-color);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

#command-palette-results .palette-item-selected {
    background: rgba(74, 144, 226, 0.18);
}

#command-palette-results .palette-no-result {
    padding: 14px 16px;
    color: var(--font-color);
    opacity: 0.6;
}

.palette-highlight {
    outline: 2px solid #4a90e2;
    outline-offset: 1px;
    animation: palettePulse 0.6s ease-in-out 3;
}

@keyframes palettePulse {
    50% { background-color: rgba(74, 144, 226, 0.25); }
}
```

注意: `.modal-content` に `position: relative` 系の既定が無く absolute が画面基準になる場合は、`.palette-panel` に `position: fixed` を使う。dev サーバーで見た目を確認して調整する。

- [ ] **Step 4: init.ts に wiring する**

import に追加:

```typescript
import { initializeCommandPalette } from '../features/CommandPalette';
import { goToWeek } from '../features/WeekNavigation';
```

（Task 1 で `previousWeek, nextWeek, currentWeek` を import 済みなので、`goToWeek` を同じ import 文に追加。）

`initializeApp()` 内、「12. Keyboard shortcuts」ブロックの前に追加（keyboard shortcuts の deps が paletteHandle を参照するため先に初期化）:

```typescript
  // Command palette
  const paletteHandle = initializeCommandPalette({
    getTasks: () => appContext.tasks,
    goToWeek: (date: Date) => goToWeek(date),
  });
```

Task 5 で追加した stub `openPalette: () => undefined,` を `openPalette: () => paletteHandle.open(),` に差し替える。

- [ ] **Step 5: 型チェックと全ユニットテスト**

Run: `npm run type-check && npm test`
Expected: 型エラーなし・全テストPASS。

- [ ] **Step 6: 手動確認**

Run: `npm run dev` → `http://localhost:5173`
- ヘッダーの 🔎 ボタンと `Ctrl/Cmd+K` 両方でパレットが開く
- 空クエリで12コマンド、「テーマ」等で絞り込み
- 既存タスク名の一部を入力 → Enter → 該当週へ移動しタスクがハイライト → `e` で編集モーダル
- Escape・背景クリックで閉じる
- `?` ヘルプに Ctrl+K 行がある
- ダークモードでパレットの色が追従する
確認後 Ctrl+C。

- [ ] **Step 7: Commit**

```bash
git add index.html style.css src/app/init.ts
git commit -m "feat: integrate command palette into UI"
```

---

### Task 7: E2E テスト・バージョン bump・最終検証

**Files:**
- Create: `e2e/command-palette.spec.js`
- Modify: `src/app/init.ts:324`（`APP_VERSION = '1.9.3'` → `'1.9.4'`）
- Modify: `public/sw.js:6`（`CACHE_NAME = 'weekly-task-board-v1'` → `'weekly-task-board-v2'`）

**Interfaces:**
- Consumes: Task 6 までの全成果
- Produces: 検証済みの完成状態

- [ ] **Step 1: E2E テストを書く**

`e2e/command-palette.spec.js` を作成（既存 spec と同じ形式）:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Ctrl+K opens palette, filtering works, Escape closes', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const input = page.locator('#command-palette-input');
    await expect(input).toBeVisible();
    await expect(page.locator('#command-palette-results li')).not.toHaveCount(0);

    await input.fill('テーマ');
    await expect(page.locator('#command-palette-results li')).not.toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).toBeHidden();
  });

  test('header search button opens palette', async ({ page }) => {
    await page.locator('#palette-toggle').click();
    await expect(page.locator('#command-palette-input')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('arrow keys navigate and Enter executes a command', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.keyboard.press('ArrowDown');
    const selected = page.locator('#command-palette-results .palette-item-selected');
    await expect(selected).toHaveCount(1);
    // 選択状態の項目が Enter で実行されパレットが閉じること（実行結果の画面遷移はコマンド次第）
    await page.keyboard.press('Enter');
    await expect(page.locator('#command-palette')).toBeHidden();
  });
});
```

- [ ] **Step 2: E2E を実行**

Run: `npm run test:e2e`
Expected: 全 spec（既存含む）PASS。失敗したら該当 spec のみ `npx playwright test e2e/command-palette.spec.js` で切り分けて修正。

- [ ] **Step 3: バージョンを bump する**

- `src/app/init.ts:324`: `const APP_VERSION = '1.9.3';` → `const APP_VERSION = '1.9.4';`
- `public/sw.js:6`: `const CACHE_NAME = 'weekly-task-board-v1';` → `const CACHE_NAME = 'weekly-task-board-v2';`

- [ ] **Step 4: 最終検証**

Run: `npm run type-check && npm test && npm run build:vite`
Expected: すべて成功。

- [ ] **Step 5: Commit**

```bash
git add e2e/command-palette.spec.js src/app/init.ts public/sw.js
git commit -m "test: add command palette e2e and bump version to 1.9.4"
```
