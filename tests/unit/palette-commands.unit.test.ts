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
