# タスクカテゴリ機能 設計書

## 概要

ウィークリータスクボードにカテゴリ機能を追加し、タスクを種類別に色分けして視覚的に管理しやすくする機能の設計。

## アーキテクチャ

### データ層
- 既存のタスクオブジェクトに`category`フィールドを追加
- カテゴリ定義をアプリケーション内で管理
- LocalStorageでの永続化対応

### 表示層
- タスクカードにカテゴリ色のバーを追加
- モーダルフォームにカテゴリ選択フィールドを追加
- カテゴリフィルター機能をヘッダーに追加

### ロジック層
- カテゴリ管理機能
- フィルタリング機能
- 色管理機能

## コンポーネントと インターフェース

### 1. カテゴリ定義

```javascript
const TASK_CATEGORIES = {
    'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
    'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
    'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
    'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
    'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
    'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
};
```

### 2. タスクデータ構造の拡張

```javascript
// 既存のタスクオブジェクトに追加
{
    id: string,
    name: string,
    estimated_time: number,
    priority: string,
    assigned_date: string|null,
    due_date: string|null,
    details: string,
    completed: boolean,
    category: string // 新規追加（デフォルト: 'task'）
}
```

### 3. UI コンポーネント

#### カテゴリ選択フィールド
```html
<label for="task-category">カテゴリ:</label>
<select id="task-category" required>
    <option value="task">タスク</option>
    <option value="meeting">打ち合わせ</option>
    <option value="review">レビュー</option>
    <option value="bugfix">バグ修正</option>
    <option value="document">ドキュメント作成</option>
    <option value="research">学習・調査</option>
</select>
```

#### カテゴリフィルター
```html
<div id="category-filter">
    <label for="filter-category">カテゴリフィルター:</label>
    <select id="filter-category">
        <option value="">すべて表示</option>
        <option value="task">タスク</option>
        <option value="meeting">打ち合わせ</option>
        <option value="review">レビュー</option>
        <option value="bugfix">バグ修正</option>
        <option value="document">ドキュメント作成</option>
        <option value="research">学習・調査</option>
    </select>
</div>
```

#### タスクカードの拡張
```html
<div class="task" data-category="meeting">
    <div class="category-bar" style="background-color: #27ae60;"></div>
    <div class="task-header">
        <!-- 既存の内容 -->
    </div>
</div>
```

## データモデル

### カテゴリ管理
- カテゴリ定義は定数として管理
- 将来的にはユーザーカスタマイズ可能にする拡張性を考慮

### タスクデータの後方互換性
- 既存タスクにはデフォルトカテゴリ「task」を自動設定
- `loadTasks()`関数でマイグレーション処理を実装

## エラーハンドリング

### 不正なカテゴリ値の処理
- 存在しないカテゴリが設定されている場合はデフォルト「task」にフォールバック
- エラーログを出力して開発者に通知

### データ整合性
- カテゴリ定義の変更時の既存データ保護
- インポート時の不正データ検証

## テスト戦略

### 単体テスト対象
- カテゴリ取得関数
- フィルタリング関数
- データマイグレーション関数

### 統合テスト対象
- タスク作成・編集時のカテゴリ設定
- フィルタリング機能の動作
- データの永続化・復元

### 手動テスト項目
- 色分け表示の視覚的確認
- UI操作の使いやすさ
- 既存データとの互換性

## パフォーマンス考慮事項

### レンダリング最適化
- カテゴリフィルター時の効率的な再描画
- 大量タスク時のパフォーマンス維持

### メモリ使用量
- カテゴリ定義の効率的な管理
- 不要なDOM操作の削減

## セキュリティ

### データ検証
- カテゴリ値のサニタイゼーション
- XSS攻撃対策（カテゴリ名の適切なエスケープ）

## 将来の拡張性

### カスタムカテゴリ
- ユーザー定義カテゴリの追加機能
- カテゴリの編集・削除機能

### 高度なフィルタリング
- 複数カテゴリの同時フィルタリング
- カテゴリ別の統計表示

### 視覚的改善
- カテゴリアイコンの追加
- より豊富な色パレット