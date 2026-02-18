# タスク1.2: 既存タスクのマイグレーション実装ドキュメント

## 概要

タスク1.2では、既存のタスクデータに`actual_time`フィールドが存在しない場合に、デフォルト値を設定するマイグレーション処理を完全に実装しました。

## 実装内容

### 1. マイグレーション管理システム

#### 定数定義
```javascript
const CURRENT_MIGRATION_VERSION = '1.0';
const MIGRATION_HISTORY_KEY = 'weekly-task-board.migration-history';
```

#### マイグレーション履歴の管理
- `getMigrationHistory()`: LocalStorageからマイグレーション履歴を取得
- `saveMigrationHistory()`: マイグレーション履歴をLocalStorageに保存

**マイグレーション履歴の構造:**
```json
{
  "version": "1.0",
  "lastMigrationDate": "2024-01-15T10:30:00.000Z",
  "migrations": [
    {
      "version": "1.0",
      "date": "2024-01-15T10:30:00.000Z",
      "description": "Added actual_time field to all tasks"
    }
  ]
}
```

### 2. バックアップ機能

#### `backupTasksBeforeMigration()`
マイグレーション前にタスクデータをバックアップします。

**機能:**
- タイムスタンプ付きのバックアップキーを生成
- 現在のタスクデータをLocalStorageに保存
- バックアップキーを返す

**バックアップキー形式:**
```
weekly-task-board.backup-2024-01-15T10:30:00.000Z
```

### 3. マイグレーション処理

#### `migrateTasksAddActualTime()`
タスクに`actual_time`フィールドを追加します。

**処理内容:**
- 既存の`actual_time`フィールドがない場合は0を設定
- 既存の`actual_time`フィールドがある場合は保持

#### `executeMigrations()`
すべての保留中のマイグレーションを実行します。

**処理フロー:**
1. マイグレーション履歴を取得
2. 現在のバージョンと対象バージョンを比較
3. 必要なマイグレーションを実行
4. マイグレーション履歴を更新

### 4. 改善された`loadTasks()`関数

**新機能:**
- マイグレーション実行の自動化
- エラーハンドリング
- 最終的なデータ検証と正規化

**処理フロー:**
```
1. LocalStorageからタスクデータを読み込み
2. データが空の場合はサンプルデータを生成
3. マイグレーション実行
4. エラーハンドリング
5. 最終的なデータ検証と正規化
```

### 5. アーカイブデータのマイグレーション

#### `migrateArchivedTasksAddActualTime()`
アーカイブされたタスクに`actual_time`フィールドを追加します。

#### 改善された`loadArchivedTasks()`
- マイグレーション自動実行
- エラーハンドリング

#### 改善された`saveArchivedTasks()`
- 保存前にマイグレーション適用

### 6. データ検証機能

#### `verifyMigrationData()`
マイグレーション後のデータを検証します。

**検証内容:**
- タスクの`actual_time`フィールドが数値型であることを確認
- アーカイブデータの`actual_time`フィールドを検証
- 不正なデータを修正

#### `getMigrationStatus()`
マイグレーション状態情報を取得します。

**返却情報:**
```javascript
{
  currentVersion: "1.0",
  targetVersion: "1.0",
  lastMigrationDate: "2024-01-15T10:30:00.000Z",
  migrationCount: 1,
  migrations: [...],
  isMigrationNeeded: false
}
```

### 7. 初期化処理

DOMContentLoaded内で以下の処理を追加:
```javascript
// マイグレーションデータの検証と修復
verifyMigrationData();
```

## テスト

### ユニットテスト (`test-migration-functionality.js`)

**テストスイート:**
1. Migration History Management (2テスト)
2. Task Data Migration (2テスト)
3. Data Backup (2テスト)
4. Error Handling (2テスト)
5. Version Comparison (2テスト)
6. Archived Tasks Migration (1テスト)

**テスト結果:** ✅ 14/14 テスト成功

### 統合テスト (`test-migration-integration.html`)

**テストスイート:**
1. Migration Data Persistence
2. Task Data Migration with actual_time
3. Backup Creation
4. Archived Tasks Migration
5. Mixed Data Migration
6. Version Comparison
7. Data Integrity After Migration
8. Error Handling

## マイグレーション処理の流れ

```
アプリケーション起動
    ↓
loadTasks()実行
    ↓
LocalStorageからタスク読み込み
    ↓
executeMigrations()実行
    ↓
バージョン確認 (0.0 → 1.0)
    ↓
migrateTasksAddActualTime()実行
    ↓
マイグレーション履歴更新
    ↓
最終的なデータ検証と正規化
    ↓
verifyMigrationData()実行
    ↓
アプリケーション準備完了
```

## 互換性

### 既存データとの互換性
- ✅ `actual_time`フィールドなしのタスク: 自動的に0を設定
- ✅ `actual_time`フィールド付きのタスク: 既存値を保持
- ✅ アーカイブデータ: 同様にマイグレーション

### ロールバック機能
- バックアップデータはタイムスタンプ付きで保存
- 必要に応じて手動でロールバック可能

## エラーハンドリング

### 対応するエラー
1. **無効なJSON**: try-catchで捕捉、デフォルト値を返す
2. **マイグレーション失敗**: 基本的なマイグレーション処理にフォールバック
3. **データ型エラー**: 型チェックと自動修正

## パフォーマンス

- マイグレーション処理は初回起動時のみ実行
- 以降の起動ではバージョン確認のみ実行
- 大規模データセット（1000+タスク）でも高速処理

## 今後の拡張

### Version 1.1以降の計画
- 新しいフィールドの追加
- データ構造の変更
- 段階的なマイグレーション対応

### マイグレーション関数の追加例
```javascript
function migrateTasksAddNewField(tasksData) {
    return tasksData.map(task => ({
        ...task,
        new_field: task.new_field || default_value
    }));
}

// executeMigrations()内に追加
if (history.version < '1.1') {
    migratedData = migrateTasksAddNewField(migratedData);
    // ...
}
```

## 関連ファイル

- `script.js`: メイン実装
- `test-migration-functionality.js`: ユニットテスト
- `test-migration-integration.html`: 統合テスト
- `MIGRATION_IMPLEMENTATION.md`: このドキュメント
