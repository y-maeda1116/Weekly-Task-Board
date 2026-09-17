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
