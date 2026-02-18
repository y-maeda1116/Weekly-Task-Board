# Coding Guidelines

このドキュメントは、ウィークリータスクボードプロジェクトのコーディング規約をまとめたものです。

## 1. 絵文字ポリシー

**重要**: このプロジェクトではコード、コメント、ドキュメントに絵文字を使用しません。

### 理由
- コードの可読性と一貫性を保つ
- 異なるシステムやエディタでの表示の問題を回避
- 国際的な開発環境での互換性を確保

### 適用範囲
- ソースコード内のコメント
- ドキュメント（README、ガイドなど）
- コミットメッセージ
- Issue/Pull Requestの説明

### 例

**NG（絵文字を使用）**:
```javascript
// 📝 タスク追加機能
// ✅ 完了状態を管理
// ⚠️ エラーハンドリング
```

**OK（絵文字なし）**:
```javascript
// Task addition feature
// Manage completion status
// Error handling
```

## 2. コメント規約

### 日本語コメント
- 日本語でコメントを記述する場合は、明確で簡潔に
- 複雑なロジックには詳細な説明を付ける

```javascript
// タスクの完了状態を更新
function updateTaskCompletion(taskId, completed) {
  // ...
}

// 週の月曜日を取得する
// 与えられた日付が含まれる週の月曜日のDateオブジェクトを返す
function getMonday(d) {
  // ...
}
```

### 英語コメント
- 国際的な協力が必要な場合は英語を使用
- 簡潔で正確な表現を心がける

```javascript
// Calculate total time for the week
function calculateWeeklyTotal() {
  // ...
}
```

## 3. 命名規約

### 変数・関数名
- camelCase を使用
- 意味のある名前を付ける
- 日本語の変数名は避ける（英語を使用）

```javascript
// OK
const taskList = [];
const estimatedTime = 8;
function calculateCompletionRate() {}

// NG
const タスクリスト = [];
const 見積時間 = 8;
function 完了率を計算する() {}
```

### クラス名
- PascalCase を使用

```javascript
class WeekdayManager {
  // ...
}

class TaskBulkMover {
  // ...
}
```

### 定数
- UPPER_SNAKE_CASE を使用

```javascript
const TASK_CATEGORIES = {
  task: { name: 'Task', color: '#3498db' },
  meeting: { name: 'Meeting', color: '#e74c3c' }
};

const DEFAULT_DAILY_MINUTES = 480;
```

## 4. コード構造

### ファイル構成
- `index.html` - HTML構造
- `style.css` - スタイリング
- `script.js` - ロジック

### 関数の順序
1. グローバル変数・定数
2. 初期化関数
3. UI操作関数
4. ロジック関数
5. ユーティリティ関数
6. イベントリスナー

### 関数の長さ
- 1つの関数は1つの責務を持つ
- 50行を超える場合は分割を検討

## 5. 状態管理

### グローバル変数
- `tasks` - タスク配列
- `settings` - 設定オブジェクト

### 状態変更時の処理
```javascript
// 状態を変更
tasks.push(newTask);

// 必ずローカルストレージに保存
saveTasks();

// UIを更新
renderWeek();
```

## 6. 日付の扱い

### 形式
- `assigned_date`: `YYYY-MM-DD` 形式の文字列
- `due_date`: `YYYY-MM-DDTHH:mm` 形式の文字列

### 日付操作
```javascript
// タイムゾーン問題を避けるため、時刻をリセット
const date = new Date(dateString);
date.setHours(0, 0, 0, 0);

// 日付比較
if (date1.getTime() === date2.getTime()) {
  // 同じ日付
}
```

## 7. テスト規約

### テストファイル命名
- `test-{feature}.js` 形式を使用
- 機能ごとにテストファイルを分割

### テスト構造
```javascript
// テストの説明
console.log('Testing feature X...');

// テストケース
try {
  // テスト実行
  const result = functionToTest();
  
  // アサーション
  if (result === expected) {
    console.log('PASS: Test description');
  } else {
    console.log('FAIL: Test description');
  }
} catch (error) {
  console.log('ERROR: Test description', error);
}
```

### テストカバレッジ
- 新機能には必ずテストを追加
- エッジケースもテストに含める
- 既存機能の変更時は関連テストを更新

## 8. ドキュメント規約

### ファイル名
- 英語を使用
- ハイフンで単語を区切る（kebab-case）
- 例: `coding-guidelines.md`, `time-validation.md`

### 見出し
- 絵文字を使用しない
- 階層構造を明確に
- 日本語でも英語でも統一

```markdown
# Main Title

## Section 1

### Subsection 1.1
```

### コード例
- 実行可能なコードを示す
- 説明とセットで記載

## 9. Git コミット規約

### コミットメッセージ
- 英語を使用（または日本語で統一）
- 簡潔で説明的に
- 絵文字を使用しない

```
Good:
- Add time validation feature
- Fix task completion calculation
- Update documentation

Bad:
- 📝 Add feature
- ✅ Fix bug
- 🚀 Update
```

## 10. パフォーマンス

### 最適化ガイドライン
- 不要なDOM操作を避ける
- `renderWeek()` は必要な時だけ呼び出す
- 大量のタスク処理時はバッチ処理を検討

### メモリ管理
- 不要なオブジェクト参照を削除
- イベントリスナーは適切に削除
- LocalStorage の容量に注意（通常5-10MB）

## 11. アクセシビリティ

### ARIA ラベル
- 重要な要素には `aria-label` を付ける
- スクリーンリーダー対応を考慮

### キーボードナビゲーション
- Tab キーで操作可能にする
- Enter キーで確定できるようにする

### セマンティック HTML
- 適切なタグを使用（`<button>`, `<input>` など）
- 見た目だけでなく意味を重視

## 12. セキュリティ

### XSS 対策
- ユーザー入力は必ずエスケープ
- `innerHTML` の使用を避ける
- `textContent` を優先

```javascript
// NG
element.innerHTML = userInput;

// OK
element.textContent = userInput;
```

### データ保護
- 機密情報は LocalStorage に保存しない
- HTTPS 環境での使用を推奨

## 13. 新機能追加時のチェックリスト

- [ ] 絵文字を使用していない
- [ ] 命名規約に従っている
- [ ] コメントが適切に付いている
- [ ] テストを追加している
- [ ] ドキュメントを更新している
- [ ] パフォーマンスに問題がないか確認
- [ ] アクセシビリティを考慮している
- [ ] セキュリティ上の問題がないか確認

## 14. 参考資料

- [AGENTS.md](AGENTS.md) - 開発者向けガイド
- [SECURITY.md](SECURITY.md) - セキュリティポリシー
- [README.md](README.md) - プロジェクト概要

---

**最終更新**: 2024年2月18日
