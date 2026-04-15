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
  isManual?: boolean            // true=手動追記, false/undefined=自動記録
}
```

interface DayJournal {
  date: string                  // YYYY-MM-DD
  entries: JournalEntry[]
}
```

- **localStorageキー**: `weekly-task-board.journals`（既存のタスクデータとは独立）
- **形式**: `DayJournal[]`

### 古いエントリの自動クローズ（排他制御）

`JournalManager` の初期化時（ページ読み込み時）に、以下の条件を満たすエントリを自動クローズする:
- `completedAt === null`（未完了）
- `startedAt` の日付が「今日」より前

クローズ時の `completedAt` は `startedAt` と同じ日の `23:59:59` に設定する。これにより、前日のセッションが残ったままになるのを防ぐ。

## UI設計

### タスクカードの「開始」ボタン

- 未完了タスクカードに「▶ 開始」ボタンを追加
- クリック時の動作:
  1. **排他チェック**: `getActiveEntry()` で既に実行中のタスクがないか確認
     - 実行中のタスクがある場合: 確認ダイアログ（「現在のタスクを完了して新しいタスクを開始」「キャンセル」）を必ず表示。「完了して開始」を選んだ場合のみ現在のエントリを自動完了させてから新しいエントリを作成
  2. `JournalEntry` を `startedAt = now`, `isManual = false` で作成・保存
  3. ジャーナル入力モーダル（小）を表示 → テキスト入力 → 保存
  4. ボタンが「● 実行中...」に変化（緑のパルスアニメーション）

### タスク完了時の Next Step ダイアログ

- 既存の完了トグル（チェックボックス等）が押された際のフロー:
  1. **完了トグルを抑制**: すぐにはタスクを完了にしない
  2. そのタスクに未完了の `JournalEntry` がある場合、先に Next Step 入力モーダルを表示
  3. モーダルの「保存」または「スキップ」が押された確定タイミングで、初めて以下を実行:
     - `completedAt = now` を記録
     - 「保存」→ Next Step を保存 / 「スキップ」→ Next Step は空文字
     - **タスクのステータスを「完了」に更新**（ここで初めて完了状態になる）
  4. 未完了の `JournalEntry` がない場合は、従来通り即座にタスクを完了にする

### タイムラインサイドパネル

- 既存のダッシュボード/テンプレートパネルと同じ位置・サイズで表示
- ヘッダーに日付ナビゲーション（前日/翌日）
- 1日のストリーム表示形式:

```
09:15  ▶ 「API設計レビュー」を開始
       メモ: 前回の続きから。認証部分の確認。
10:42  ■ 完了 → Next Step: テストケースの作成から始める
──── ☕ 休憩/割り込み: 3分 ────
10:45  ▶ 「バグ修正 #123」を開始
       メモ: ログを確認して原因特定から
12:10  ■ 完了 → Next Step: PR作成済み。マージ待ち
──── ☕ 休憩/割り込み: 45分 ────
12:55  ▶ 「ドキュメント作成」を開始
       メモ: API仕様書の更新
```

空白時間ラベルの条件:
- 前エントリの `completedAt` と次エントリの `startedAt` の差が **15分以上** の場合に表示
- 表示形式: `☕ 休憩/割り込み: XX分`（XXは切り捨てた分数）
- 15分未満の空白は表示しない（自然なタスク切替えとして扱う）

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
  // 初期化: 古い未完了エントリの自動クローズを実行
  static initialize(): void
  // 新規エントリ作成（isManual=false）
  static createEntry(taskId: string, taskName: string): JournalEntry
  // エントリ完了（completedAt = now, nextStep を記録）
  static completeEntry(entryId: string, nextStep: string): void
  // ジャーナルテキスト更新
  static updateJournal(entryId: string, text: string): void
  // 日付でエントリ取得
  static getEntriesByDate(date: string): JournalEntry[]
  // 現在実行中のエントリを取得（completedAt === null のもの）
  static getActiveEntry(): JournalEntry | null
  // タスクIDでエントリを取得
  static getEntryByTaskId(taskId: string): JournalEntry | null
  // 古い未完了エントリの自動クローズ
  static closeStaleEntries(): void
}
```

### JournalUI.ts

責務: UI要素の生成・操作

```typescript
class JournalUI {
  // タスクカードに開始ボタンを注入（既存ボタンを先にクリーンアップ）
  static injectStartButtons(): void
  // 開始ボタンのイベントリスナーをクリーンアップ（二重登録防止）
  static cleanupStartButtons(): void
  // ジャーナル入力モーダル表示
  static showJournalModal(entry: JournalEntry): void
  // Next Step 入力モーダル表示
  static showNextStepModal(entry: JournalEntry, onComplete: () => void): void
  // タイムラインパネル描画（空白時間ラベル含む）
  static renderTimelinePanel(): void
  // パネル開閉
  static openTimeline(): void
  static closeTimeline(): void
}
```

### DOM挿入の堅牢性

`injectStartButtons()` は単独で呼ぶのではなく、既存のタスクカード生成ロジックと連携する:

1. **クリーンアップファースト**: 実行時に既存の `.journal-start-btn` を全て削除してから再注入する
2. **再描画フック**: `TaskRendering.js` / `TaskOperations.js` のタスクカード生成後に `injectStartButtons()` を呼ぶよう、HybridBridge 経由でコールバックを登録
3. **イベントリスナーの管理**: `AbortController` を使用し、再注入時に古いリスナーを確実に破棄
4. **状態反映**: 実行中のタスク（`getActiveEntry()` に該当）のボタンは「● 実行中...」表示にする

### HybridBridge 追加

```typescript
// src/hybrid/bridge.ts に追加
(window as any).HybridBridge = {
  ...existing,
  // ジャーナル操作
  startJournal: (taskId: string, taskName: string) => JournalManager.createEntry(taskId, taskName),
  completeJournal: (entryId: string, nextStep: string) => JournalManager.completeEntry(entryId, nextStep),
  getActiveJournal: () => JournalManager.getActiveEntry(),
  getJournalByTaskId: (taskId: string) => JournalManager.getEntryByTaskId(taskId),
  // UI操作
  openTimeline: () => JournalUI.openTimeline(),
  injectStartButtons: () => JournalUI.injectStartButtons(),
  // 初期化
  initJournal: () => {
    JournalManager.initialize();
    JournalUI.injectStartButtons();
  },
};
```

### script.js 側の変更点

- **初期化**: `DOMContentLoaded` で `HybridBridge.initJournal()` を呼び出し
- **タスク再描画フック**: `TaskRendering.js` / `TaskOperations.js` 内のタスクカード生成後に `HybridBridge.injectStartButtons()` を呼び出し（既存ボタンをクリーンアップしてから再注入）
- **完了トグルのインターセプト**: 完了チェックボックスのクリックイベントをインターセプトし、未完了ジャーナルがあれば Next Step ダイアログを先に表示。ダイアログ確定後に初めてタスク完了処理を実行
- **ヘッダーボタン**: タイムライン表示ボタンをヘッダーに追加
- **HTML構造**: タイムラインパネルのHTMLを `index.html` に追加

## スタイリング

- **既存CSS変数**（`--primary-color`, `--card-background` 等）を使用し、ダークモードで色が浮かないようにする
- **パネル**: 既存の `.dashboard-panel` スタイルを継承し、UIの統一感を保つ
- **開始ボタン**: `.journal-start-btn` クラス。通常時は `--primary-color` ベースのアウトライン、実行中は緑背景 + パルスアニメーション（`@keyframes pulse`）
- **空白時間ラベル**: 薄いグレー背景のインラインブロック、斜体テキスト
- **タイムラインエントリ**: 左側に時刻、右側にタスク名 + メモのカード形式。完了/未完了でアイコン色を変更

## テスト戦略

- `JournalManager` の単体テスト:
  - CRUD操作、日付フィルタ、アクティブエントリ取得
  - `closeStaleEntries()` の日付跨ぎ自動クローズ
  - 排他制御: 実行中タスクがある状態での新規作成時の挙動
- `JournalUI` の統合テスト:
  - DOM操作、モーダル表示/非表示
  - `injectStartButtons()` の二重登録防止
  - クリーンアップ後の再注入が正しく動作すること
- 手動E2Eテスト:
  - 開始→完了→タイムライン表示の流れ
  - 日付を跨いでの再アクセス時の古いエントリ自動クローズ
  - 空白時間（15分以上）のラベル表示

## 実装上の注意

- ストレージキーは `weekly-task-board.journals` を使用し、既存のタスクデータと干渉させないこと
- スタイリングには既存のCSS変数（`--primary-color` 等）を使い、ダークモードで色が浮かないようにすること
- `JournalUI` は既存の `.dashboard-panel` のスタイルを継承し、UIの統一感を保つこと
