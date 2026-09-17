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
