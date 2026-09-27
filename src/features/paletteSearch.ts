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
