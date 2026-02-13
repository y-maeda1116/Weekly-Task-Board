# タスク1.3: 時間データのバリデーション実装ドキュメント

## 概要

タスク1.3では、タスクの時間データ（`estimated_time`と`actual_time`）を検証し、無効なデータを自動的に修正するバリデーション機能を実装しました。

## 実装内容

### 1. 単一タスクのバリデーション

#### `validateTaskTimeData(task)`

**機能:**
- タスクの時間データを検証
- 無効なデータを自動修正
- エラーと警告を記録

**検証項目:**

1. **estimated_time の検証**
   - 存在確認（undefined/null チェック）
   - 型チェック（number 型であることを確認）
   - 負の値チェック（0以上であることを確認）
   - 有限値チェック（Infinity/NaN でないことを確認）

2. **actual_time の検証**
   - 存在確認（undefined/null チェック）
   - 型チェック（number 型であることを確認）
   - 負の値チェック（0以上であることを確認）
   - 有限値チェック（Infinity/NaN でないことを確認）

3. **時間関係の検証**
   - actual_time が estimated_time の 1.5 倍を超える場合は警告

4. **精度調整**
   - 小数点以下2桁に丸める

**返却値:**
```javascript
{
  isValid: boolean,           // エラーがないかどうか
  errors: string[],           // エラーメッセージ配列
  warnings: string[],         // 警告メッセージ配列
  task: object                // 修正されたタスクオブジェクト
}
```

**使用例:**
```javascript
const task = {
  id: 'task-1',
  name: 'Task 1',
  estimated_time: -5,
  actual_time: 'invalid'
};

const result = validateTaskTimeData(task);
// result.isValid === false
// task.estimated_time === 0
// task.actual_time === 0
```

### 2. 複数タスクのバリデーション

#### `validateAllTasksTimeData(tasksData)`

**機能:**
- 複数のタスクを一括検証
- 検証結果の集計
- サマリー情報の生成

**返却値:**
```javascript
{
  isValid: boolean,           // すべてのタスクが有効かどうか
  totalErrors: number,        // 総エラー数
  totalWarnings: number,      // 総警告数
  validationResults: [        // 各タスクの検証結果
    {
      taskIndex: number,
      taskId: string,
      taskName: string,
      isValid: boolean,
      errors: string[],
      warnings: string[],
      task: object
    }
  ],
  summary: {
    totalTasks: number,       // 総タスク数
    validTasks: number,       // 有効なタスク数
    invalidTasks: number,     // 無効なタスク数
    tasksWithWarnings: number // 警告があるタスク数
  }
}
```

**使用例:**
```javascript
const tasks = [
  { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 },
  { id: 'task-2', name: 'Task 2', estimated_time: -3, actual_time: 4 },
  { id: 'task-3', name: 'Task 3', estimated_time: 8 }
];

const result = validateAllTasksTimeData(tasks);
// result.isValid === false
// result.summary.validTasks === 1
// result.summary.invalidTasks === 2
```

### 3. データ修復機能

#### `repairTasksTimeData(tasksData)`

**機能:**
- 無効な時間データを自動修正
- 修復結果の詳細記録
- 修復統計の生成

**返却値:**
```javascript
{
  repairedCount: number,      // 修復されたタスク数
  repairResults: [            // 各修復タスクの詳細
    {
      taskIndex: number,
      taskId: string,
      taskName: string,
      originalEstimatedTime: number,
      originalActualTime: number,
      repairedEstimatedTime: number,
      repairedActualTime: number,
      errors: string[]
    }
  ],
  summary: {
    totalTasks: number,       // 総タスク数
    repairedTasks: number,    // 修復されたタスク数
    successRate: string       // 成功率（パーセンテージ）
  }
}
```

**使用例:**
```javascript
const tasks = [
  { id: 'task-1', name: 'Task 1', estimated_time: -5, actual_time: 'invalid' },
  { id: 'task-2', name: 'Task 2', estimated_time: 5, actual_time: 3 }
];

const result = repairTasksTimeData(tasks);
// result.repairedCount === 1
// tasks[0].estimated_time === 0
// tasks[0].actual_time === 0
```

### 4. 統合検証機能

#### 改善された `verifyMigrationData()`

**新機能:**
- 時間データのバリデーション実行
- 無効なデータの自動修復
- 修復結果のログ出力

**処理フロー:**
```
1. タスクデータの時間バリデーション実行
2. エラーがある場合は修復処理を実行
3. アーカイブデータの時間バリデーション実行
4. エラーがある場合は修復処理を実行
5. 修復結果をLocalStorageに保存
```

### 5. 初期化処理への統合

#### `loadTasks()` 関数の改善

**新機能:**
- 最終的なデータ検証と正規化時に時間バリデーション実行
- 無効なデータを自動修正

**処理フロー:**
```
1. LocalStorageからタスク読み込み
2. マイグレーション実行
3. 基本的なデータ正規化
4. 時間データのバリデーション実行
5. 修復されたタスクを返却
```

## バリデーション規則

### estimated_time の規則
- ✅ 0以上の数値
- ✅ 有限値（Infinity/NaN でない）
- ❌ 負の値
- ❌ 文字列や他の型
- ❌ undefined/null

### actual_time の規則
- ✅ 0以上の数値
- ✅ 有限値（Infinity/NaN でない）
- ❌ 負の値
- ❌ 文字列や他の型
- ❌ undefined/null

### 警告条件
- ⚠️ actual_time > estimated_time × 1.5

## エラーハンドリング

### 対応するエラー

1. **missing フィールド**
   - 修正: デフォルト値 0 を設定

2. **型エラー**
   - 修正: デフォルト値 0 を設定

3. **負の値**
   - 修正: 0 に設定

4. **無限値/NaN**
   - 修正: 0 に設定

## テスト

### ユニットテスト (`test-time-validation.js`)

**テストスイート:**
1. Valid Time Data (2テスト)
2. Invalid Time Data (5テスト)
3. Time Warnings (2テスト)
4. Batch Validation (2テスト)
5. Data Repair (2テスト)
6. Decimal Precision (1テスト)

**テスト結果:** ✅ 14/14 テスト成功

### 統合テスト (`test-time-validation-integration.html`)

**テストスイート:**
1. Valid Time Data Persistence
2. Invalid Time Data Correction
3. Time Warning Detection
4. Batch Time Validation
5. Decimal Precision
6. Zero Time Values
7. Missing Time Fields
8. Time Data Type Validation

## パフォーマンス

- 単一タスク検証: O(1)
- 複数タスク検証: O(n)
- 大規模データセット（1000+タスク）でも高速処理

## 互換性

### 既存データとの互換性
- ✅ 無効な時間データ: 自動修正
- ✅ 欠落フィールド: デフォルト値を設定
- ✅ 型エラー: 自動修正

## 今後の拡張

### Version 1.1以降の計画
- 時間単位の柔軟性（分、秒など）
- 時間範囲の検証
- カスタム検証ルール

## 関連ファイル

- `script.js`: メイン実装
- `test-time-validation.js`: ユニットテスト
- `test-time-validation-integration.html`: 統合テスト
- `TIME_VALIDATION_IMPLEMENTATION.md`: このドキュメント

## 使用例

### 基本的な使用方法

```javascript
// 単一タスクの検証
const task = {
  id: 'task-1',
  name: 'Task 1',
  estimated_time: 5,
  actual_time: 3
};

const result = validateTaskTimeData(task);
if (result.isValid) {
  console.log('タスクは有効です');
} else {
  console.log('エラー:', result.errors);
}

// 複数タスクの検証
const tasks = [...];
const batchResult = validateAllTasksTimeData(tasks);
console.log(`有効なタスク: ${batchResult.summary.validTasks}`);
console.log(`無効なタスク: ${batchResult.summary.invalidTasks}`);

// データ修復
const repairResult = repairTasksTimeData(tasks);
console.log(`修復されたタスク: ${repairResult.repairedCount}`);
```

## ログ出力例

```
Time data validation found 2 errors
Repaired 2 tasks with invalid time data
Migration data verification completed - tasks updated.
```
