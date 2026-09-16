# コマンドパレット＋タスク検索 設計書

- 日付: 2026-09-16
- ステータス: 承認済み設計（ユーザー確認: Section 1・Section 2 とも合意）
- 関連: 未コミットの `src/features/KeyboardShortcuts.ts`（本機能の基盤。`Ctrl/Cmd+K` をここに追加する）

## 1. 背景と目的

Weekly Task Board には検索機能が存在せず、過去週のタスクを探すには週を手動で遡るしかない。
また、ダッシュボード・週次レビュー・モーニングページ等の主要画面にはキーボードショートカットがなく、マウス操作が必須である。

本機能は **`Ctrl/Cmd+K` で開くコマンドパレット** を提供し、

1. 全期間のアクティブなタスクを検索して該当週へジャンプする
2. 主要なナビゲーション・操作を検索可能なコマンドとして実行する

ことを目的とする。モバイルからはヘッダーのボタンで開く。

## 2. 要件（ユーザーとのQ&Aで確定）

| 項目 | 決定 |
|------|------|
| 検索対象 | **全期間のアクティブなタスク**（未割り当て含む）。アーカイブ・ジャーナル・モーニングページ本文は対象外（将来拡張） |
| 検索結果選択時 | 該当週へ自動移動し、タスクを一時ハイライト。既存の `e` キーで編集に接続 |
| コマンド範囲 | 検索＋主要ナビゲーション（統計・テンプレート・テーマ・ジャーナル・タスク移行・週次レビュー・モーニングページ・アーカイブ・週移動・新規作成） |
| 入口 | `Ctrl/Cmd+K` ＋ ヘッダーの検索ボタン（モバイル対応） |
| 実装アプローチ | A: 純関数コア＋薄いDOMラッパー（`KeyboardShortcuts.ts` と同じ deps 注入パターン） |

## 3. スコープ

### 含む

- パレットモーダルUI（検索入力・結果リスト・キーボードナビゲーション）
- タスク検索（`name` / `details` への大文字小文字無視の部分一致＋ランキング）
- コマンド実行（既存ボタンの `click()` 流しによる再利用）
- 週移動＋タスクハイライト（`.palette-highlight` ＋ `scrollIntoView`）
- 未割り当てタスクの選択時は週移動せずハイライトのみ
- ユニットテスト3ファイル、E2Eテスト1本
- `KeyboardShortcuts.ts` への `Ctrl/Cmd+K` 追加とヘルプ文言追記

### 含まない（将来拡張候補）

- アーカイブ済みタスクの検索
- ジャーナル・モーニングページ本文の検索
- fuzzy（サブシーケンス）マッチング、ローマ字変換
- 検索履歴・頻度学習

## 4. アーキテクチャ

### 4.1 新規ファイル

#### `src/features/paletteSearch.ts`（純関数、~100行）

```typescript
export type PaletteCommandDef = { id, title, keywords, target };
export type PaletteItem =
  | { kind: "command"; command: PaletteCommandDef }
  | { kind: "task"; task: Task; score: number };

searchTasks(query: string, tasks: readonly Task[]): PaletteItem[]
filterCommands(query: string, commands: readonly PaletteCommandDef[]): PaletteItem[]
combineResults(commands: readonly PaletteItem[], tasks: readonly PaletteItem[], limit?: number): PaletteItem[]
```

- マッチング: `name` / `details` への大文字小文字無視の部分一致（`toLowerCase` 比較）
- ランキング: name前方一致（スコア高）＞ name部分一致 ＞ details一致。同スコアなら未完了優先、次に `assigned_date` 降順
- 結果は最大12件、常に新配列を生成（イミュータブル）
- 入力を一切持たず、単体テストで同期テスト可能

#### `src/features/paletteCommands.ts`（コマンド定義、~80行）

- 純データの配列。実行は `document.querySelector(target).click()` で既存ハンドラを再利用し、関数名リファクタに耐える設計とする
- コマンド一覧（target は `index.html` の既存ボタンID）:

| id | title | target |
|----|-------|--------|
| create-task | タスクを追加 | `#add-task-btn` |
| prev-week | 前週へ | `#prev-week` |
| next-week | 次週へ | `#next-week` |
| today | 今週へ | `#today` |
| statistics | 統計ダッシュボード | `#statistics-toggle` |
| template | テンプレート | `#template-toggle` |
| theme | テーマ切替 | `#theme-toggle` |
| journal | ジャーナル | `#journal-toggle` |
| migration | タスク移行 | `#migration-toggle` |
| review | 週次レビュー | `#review-toggle` |
| morning-pages | モーニングページ | `#morning-pages-toggle` |
| archive | アーカイブ | `#archive-toggle` |

#### `src/features/CommandPalette.ts`（DOM、~200行）

```typescript
export interface CommandPaletteDeps {
  readonly getTasks: () => readonly Task[];
  readonly goToWeek: (date: Date) => void;
}
export function initializeCommandPalette(deps: CommandPaletteDeps): () => void; // cleanup を返す
```

- 開閉: `Ctrl/Cmd+K`、`#palette-toggle` ボタン、`Escape`、背景クリック
- 入力イベントを 150ms debounce して再検索・再描画（debounce はこのDOM層のみ）
- キーボードナビ: `↑`/`↓` で選択移動、`Enter` で実行、マウスクリック・ホバーにも対応
- IME 確定前（`event.isComposing`）は `↑↓`/`Enter` を無視（`KeyboardShortcuts.ts` と同じ配慮）
- 空クエリ時はコマンド一覧を表示（発見可能性のチュートリアルとして機能）
- タスク選択時のシーケンス:
  1. パレットを閉じる
  2. `assigned_date` があれば `deps.goToWeek(new Date(assigned_date))`（同期的再描画を前提。実装時に `goToWeek` の描画タイミングを検証すること）
  3. `[data-task-id="<id>"]` に `.palette-highlight` を付与し `scrollIntoView({ behavior: "smooth", block: "center" })`
  4. 3秒後にハイライト自動解除（タイマーは再選択時に解除し直す）
- 未割り当てタスク（`assigned_date === null`）は 2. をスキップ

### 4.2 既存ファイルの修正（最小限）

| ファイル | 変更 |
|----------|------|
| `src/features/KeyboardShortcuts.ts` | `Ctrl/Cmd+K` → `deps.openPalette()` 分岐（現状 modifiers は `getShortcutAction` で早期return されるため独立ブランチで処理）。`KeyboardShortcutDeps` に `openPalette` を追加。ヘルプモーダルの文言に追記 |
| `index.html` | `#header-group-utility` に `<button id="palette-toggle" title="検索">🔎</button>` を追加、パレットモーダルDOM（**`.modal` クラスを流用**するため `isAnyOverlayOpen()` の `OVERLAY_SELECTOR` 変更は不要。パレット表示中の board ショートカットは既存のオーバーレイ判定で自動的に無効化される） |
| `style.css` | パレット用スタイル。既存の `--card-background` / `--border-color` 等のCSS変数を流用しダークモードに自動対応。`.palette-highlight` のアニメーション |
| `src/app/init.ts` | `initializeCommandPalette(deps)` を呼び出し（deps は既存の `loadTasksFromStorage` / `goToWeek` / `openCreateModal` を束ねる） |

## 5. データフロー

```
[開く] Ctrl/Cmd+K または #palette-toggle
   → モーダル表示・input フォーカス・空クエリならコマンド一覧表示
[入力] input イベント（150ms debounce）
   → deps.getTasks() → searchTasks + filterCommands → combineResults(12) → 再描画
[選択] command → 対象ボタンを click() → パレット閉じる
       task   → パレット閉じる → goToWeek → [data-task-id] ハイライト+スクロール
[閉じる] Escape / 背景クリック / 選択実行後
```

- 検索は入力ごとに `loadTasksFromStorage()` の全走査。LocalStorage 前提の個人データ（〜数千件）で十分高速と判断し、インデックスは持たない

## 6. エラー処理

| 状況 | 挙動 |
|------|------|
| `deps.getTasks()` が例外 | `showNotification('タスクの検索に失敗しました', 'error')`、パレットは開いたまま |
| コマンドの `target` が DOM に存在しない | 実行せず warning ログ（fail-soft） |
| 選択タスクがカテゴリフィルタ等で非表示 | ハイライト失敗を `showNotification` で案内（フィルタ解除を促す） |
| 一致なし | リスト内に「一致する結果はありません」を表示 |

## 7. テスト方針

TDD（RED → GREEN → REFACTOR）で実装する。目標カバレッジは既存ルールに従い 80% 以上。

| ファイル | 内容 |
|----------|------|
| `tests/unit/palette-search.unit.test.ts` | `searchTasks`: マッチング・ランキング（name前方＞部分＞details、未完了優先、`assigned_date` 降順）、`details` 一致、大文字小字符無視。`filterCommands`: タイトル・キーワード一致。`combineResults`: 件数制限・順序（コマンド上位）。空クエリ・空結果・空配列 |
| `tests/unit/palette-commands.unit.test.ts` | コマンド定義のスキーマ検証（必須フィールド、`target` が `#` + 有効ID形式、ID一意性） |
| `tests/unit/command-palette.unit.test.ts` | jsdom: 開閉（Escape・背景クリック）、キーボードナビ、`isComposing` 中の Enter 無視、選択時の `goToWeek` 呼び出し・ハイライトクラス付与を deps モックで検証 |
| `e2e/command-palette.spec.js` に1本 | Ctrl+K → 入力 → 選択 → ハイライト表示 の基本シナリオ |

テンプレート: 未コミットの `tests/unit/keyboard-shortcuts.unit.test.ts` の構成を踏襲する。

## 8. 実装順序の前提

1. 未コミットの `KeyboardShortcuts.ts` + テストを先に commit する（本機能がその上に載るため）
2. `paletteSearch.ts`（TDD）→ `paletteCommands.ts`（TDD）→ `CommandPalette.ts`（TDD）→ 既存ファイル修正 → E2E
3. バージョン bump ルール（`src/app/init.ts` の `APP_VERSION` と `public/sw.js` の `CACHE_NAME`、パッチバージョン）を最後に適用する

## 9. その後のロードマップ（別サイクル）

1. コマンドパレット＋検索（本書）
2. フォーカスタイマー
3. 長期トレンド統計
4. 期限リマインダー通知
