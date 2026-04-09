# Interstitial Journaling (実行ログ) 機能設計

## 概要

Weekly Task Boardに「インタースティシャル・ジャーナリング」機能を追加する。各タスクの開始・完了時にタイムスタンプを自動記録し、タスク切替え時の認知負荷を軽減する仕組みを提供する。

## 要件

1. 各タスクカードに「開始」ボタンを追加し、クリックで現在時刻を自動記録 + ジャーナル入力欄を開く
2. タスク完了時にも時刻を自動記録し、「Next Step」入力ダイアログを表示
3. 1日の作業ログをストリーム形式で表示するタイムラインサイドパネル

## データモデル

```typescript
interface JournalEntry {
  id: string                    // UUID
  taskId: string                // 紐づくタスクID
  taskName: string              // タスク名（キャッシュ、表示用）
  startedAt: string             // ISO 8601 開始時刻
  completedAt: string | null    // ISO 8601 終了時刻（未完了ならnull）
  journal: string               // 開始時のメモ（思考の現状維持）
  nextStep: string              // 次のタスクへの申し送り
}

interface DayJournal {
  date: string                  // YYYY-MM-DD
  entries: JournalEntry[]
}
```

- **localStorageキー**: `weekly-task-board.journals`
- **形式**: `DayJournal[]`

## UI設計

### タスクカードの「開始」ボタン

- 未完了タスクカードに「▶ 開始」ボタンを追加
- クリック時の動作:
  1. `JournalEntry` を `startedAt = now` で作成・保存
  2. ジャーナル入力モーダル（小）を表示 → テキスト入力 → 保存
  3. ボタンが「● 実行中...」に変化（緑のパルスアニメーション）
- 実行中のタスクは同時に1つのみ（既存の実行中タスクがあれば確認ダイアログ）

### タスク完了時の Next Step ダイアログ

- 既存の完了トグル操作時に、そのタスクに未完了の `JournalEntry` があれば:
  1. `completedAt = now` を記録
  2. Next Step 入力ダイアログを表示
  3. 保存後、タスクを完了状態に更新

### タイムラインサイドパネル

- 既存のダッシュボード/テンプレートパネルと同じ位置・サイズで表示
- ヘッダーに日付ナビゲーション（前日/翌日）
- 1日のストリーム表示形式:

```
09:15  ▶ 「API設計レビュー」を開始
       メモ: 前回の続きから。認証部分の確認。
10:42  ■ 完了 → Next Step: テストケースの作成から始める
─────────────────────
10:45  ▶ 「バグ修正 #123」を開始
       メモ: ログを確認して原因特定から
12:10  ■ 完了 → Next Step: PR作成済み。マージ待ち
```

## ファイル構成

```
src/hybrid/
  JournalManager.ts    — データCRUD + localStorage永続化
  JournalUI.ts         — UI要素（開始ボタン、入力ダイアログ、タイムライン）
src/types/
  journal.ts           — JournalEntry, DayJournal 型定義
```

### JournalManager.ts

責務: ジャーナルデータのCRUD操作とlocalStorage永続化

```typescript
class JournalStorage {
  static loadAll(): DayJournal[]
  static saveAll(journals: DayJournal[]): void
}

class JournalManager {
  static createEntry(taskId: string, taskName: string): JournalEntry
  static completeEntry(entryId: string, nextStep: string): void
  static updateJournal(entryId: string, text: string): void
  static getEntriesByDate(date: string): JournalEntry[]
  static getActiveEntry(): JournalEntry | null
  static getEntryByTaskId(taskId: string): JournalEntry | null
}
```

### JournalUI.ts

責務: UI要素の生成・操作

```typescript
class JournalUI {
  static injectStartButtons(): void
  static showJournalModal(entry: JournalEntry): void
  static showNextStepModal(entry: JournalEntry, onComplete: () => void): void
  static renderTimelinePanel(): void
  static openTimeline(): void
  static closeTimeline(): void
}
```

### HybridBridge 追加

```typescript
// src/hybrid/bridge.ts に追加
(window as any).HybridBridge = {
  ...existing,
  startJournal: (taskId: string, taskName: string) => JournalManager.createEntry(taskId, taskName),
  completeJournal: (entryId: string, nextStep: string) => JournalManager.completeEntry(entryId, nextStep),
  getActiveJournal: () => JournalManager.getActiveEntry(),
  openTimeline: () => JournalUI.openTimeline(),
};
```

### script.js 側の変更点

- タスクカード描画後の `injectStartButtons()` 呼び出しフック追加
- 完了トグル時の Next Step ダイアログ発火ロジック追加
- ヘッダーにタイムライン表示ボタン追加
- タイムラインパネルのHTML構造を `index.html` に追加

## スタイリング

- 既存のCSS変数（`--primary-color`, `--card-background` 等）を使用
- ダッシュボード/テンプレートパネルと同じ `.dashboard-panel` スタイルパターンを踏襲
- 「実行中」ボタンにパルスアニメーション（CSS `@keyframes pulse`）を追加
- ダークモード対応は既存のCSS変数仕組みで自動対応

## テスト戦略

- `JournalManager` の単体テスト（CRUD操作、日付フィルタ、アクティブエントリ取得）
- `JournalUI` の統合テスト（DOM操作、モーダル表示/非表示）
- 手動E2Eテスト: 開始→完了→タイムライン表示の流れ
