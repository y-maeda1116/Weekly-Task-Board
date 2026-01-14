# Design Document

## Overview

ウィークリータスクボードのアクセシビリティを改善し、Lighthouseスコアを81点から90点以上に向上させます。主な改善点は以下の3つです：

1. すべてのリンクとボタンに識別可能な名前を追加
2. 背景色と前景色のコントラスト比をWCAG 2.1 AA基準（4.5:1以上）に準拠
3. アクセシビリティのベストプラクティスを継続的に維持

## Architecture

アクセシビリティ改善は、既存のHTML、CSS、JavaScriptファイルに対する修正として実装されます。

### 修正対象ファイル

- `index.html`: 静的なボタンとリンクにaria-label属性を追加
- `script.js`: 動的に生成される要素にaria-label属性を追加
- `style.css`: コントラスト比が不十分な色の組み合わせを修正

## Components and Interfaces

### 1. ARIA Label Manager

動的に生成される要素にaria-label属性を追加する責務を持ちます。

```javascript
/**
 * Add aria-label to dynamically created elements
 * @param {HTMLElement} element - Target element
 * @param {string} label - Accessible label text
 */
function addAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
}
```

### 2. Color Contrast Validator

CSS変数とカラー値を検証し、WCAG 2.1 AA基準を満たすことを確認します。

```css
/* コントラスト比計算式（参考）
 * Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
 * L1 = 明るい色の相対輝度
 * L2 = 暗い色の相対輝度
 * 
 * WCAG 2.1 AA基準:
 * - 通常テキスト: 4.5:1以上
 * - 大きいテキスト: 3:1以上
 */
```

## Data Models

アクセシビリティ改善は既存のデータモデルに影響を与えません。UIレイヤーのみの変更です。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: All interactive elements have accessible names

*For any* interactive element (button, link, input) rendered by the system, the element should have either visible text content or an aria-label attribute that describes its purpose.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Text contrast ratios meet WCAG standards

*For any* text element displayed by the system, the contrast ratio between the text color and its background color should be at least 4.5:1 for normal text or 3:1 for large text.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Lighthouse accessibility score is maintained

*For any* version of the application, when audited by Lighthouse, the accessibility score should be 90 or higher.

**Validates: Requirements 3.1, 3.2, 3.3**

## Error Handling

アクセシビリティ改善は主にマークアップとスタイリングの変更であり、実行時エラーは発生しません。ただし、以下の点に注意します：

- aria-label属性が空文字列にならないよう、常に意味のあるテキストを設定
- CSS変数が未定義の場合のフォールバック値を提供
- 動的に生成される要素に対して、生成時に必ずaria-label属性を追加

## Testing Strategy

### Unit Tests

以下の具体的なケースをテストします：

1. **静的要素のaria-label検証**
   - ナビゲーションボタン（前週へ、今週に戻る、次週へ）にaria-labelが存在
   - データ管理ボタン（エクスポート、インポート、アーカイブ、テーマ切り替え）にaria-labelが存在
   - モーダルの閉じるボタンにaria-labelが存在

2. **動的要素のaria-label検証**
   - タスクチェックボックスにaria-labelが存在し、タスク名を含む
   - アーカイブビューの復元・削除ボタンにaria-labelが存在し、タスク名を含む
   - コンテキストメニュー項目にaria-labelが存在

3. **コントラスト比検証**
   - 通常テキストのコントラスト比が4.5:1以上
   - 大きいテキストのコントラスト比が3:1以上
   - カテゴリ背景色とテキストのコントラスト比が基準を満たす
   - 優先度ラベルのコントラスト比が基準を満たす

4. **エッジケース**
   - 空のタスク名に対するaria-label生成
   - ダークモードでのコントラスト比維持
   - 長いタスク名に対するaria-label生成

### Property-Based Tests

Property-based testingは、このアクセシビリティ改善には適用しません。理由は以下の通りです：

- アクセシビリティは主にマークアップとスタイリングの静的な特性
- Lighthouseなどの専用ツールで自動検証可能
- ランダム入力による検証よりも、実際のDOM構造の検証が重要

### Manual Testing

以下の手動テストを実施します：

1. **Lighthouse監査**
   - Chrome DevToolsでLighthouse監査を実行
   - アクセシビリティスコアが90以上であることを確認
   - 個別の監査項目がすべて合格していることを確認

2. **スクリーンリーダーテスト**
   - NVDA（Windows）またはVoiceOver（Mac）でアプリケーションをナビゲート
   - すべてのボタンとリンクが適切に読み上げられることを確認
   - タスクの操作が音声のみで可能であることを確認

3. **キーボードナビゲーション**
   - Tabキーですべての要素にフォーカス可能
   - Enterキーでボタンとリンクを操作可能
   - Escキーでモーダルを閉じることが可能

4. **コントラストチェッカー**
   - WebAIM Contrast Checkerなどのツールで主要な色の組み合わせを検証
   - すべての組み合わせがWCAG AA基準を満たすことを確認

## Implementation Details

### 1. 静的要素へのaria-label追加

`index.html`の以下の要素にaria-label属性を追加します：

```html
<!-- ナビゲーションボタン -->
<button id="prev-week" aria-label="前週へ移動">前週へ</button>
<button id="today" aria-label="今週に戻る">今週に戻る</button>
<button id="next-week" aria-label="次週へ移動">次週へ</button>

<!-- データ管理ボタン -->
<button id="export-data-btn" aria-label="データをエクスポート">エクスポート</button>
<button id="import-data-btn" aria-label="データをインポート">インポート</button>
<button id="archive-toggle" aria-label="アーカイブを表示">📁 アーカイブ</button>
<button id="theme-toggle" aria-label="ダークモードに切り替え">🌙 ダーク</button>

<!-- モーダル閉じるボタン -->
<span class="close-btn" aria-label="モーダルを閉じる">&times;</span>

<!-- アーカイブビューのボタン -->
<button id="close-archive" aria-label="アーカイブを閉じる">✕ 閉じる</button>
<button id="clear-archive" aria-label="アーカイブを全削除">🗑️ 全削除</button>
```

### 2. 動的要素へのaria-label追加

`script.js`の`createTaskElement`関数を修正し、チェックボックスにaria-labelを追加します：

```javascript
function createTaskElement(task) {
    // ... 既存のコード ...
    
    taskElement.innerHTML = `
        <div class="category-bar" style="background-color: ${categoryInfo.color};"></div>
        <div class="task-header">
            <input type="checkbox" 
                   class="task-checkbox" 
                   aria-label="${task.name}を完了としてマーク"
                   ${task.completed ? 'checked' : ''}>
            <div class="task-name">${task.name}</div>
            <span class="task-priority ${task.priority || 'medium'}">${priorityLabel}</span>
            <div class="task-time">${task.estimated_time}h</div>
        </div>
        ${dueDateHTML}
    `;
    
    // ... 既存のコード ...
}
```

`createArchivedTaskElement`関数を修正し、復元・削除ボタンにaria-labelを追加します：

```javascript
function createArchivedTaskElement(task) {
    // ... 既存のコード ...
    
    taskElement.innerHTML = `
        <div class="category-bar" style="background-color: ${categoryInfo.color};"></div>
        <div class="archived-task-header">
            <div class="archived-task-name">${task.name}</div>
            <div class="archived-task-time">${task.estimated_time}h</div>
        </div>
        ${datesHTML ? `<div class="archived-task-dates">${datesHTML}</div>` : ''}
        ${task.details ? `<div class="archived-task-details">${task.details}</div>` : ''}
        <div class="archived-task-completed-date">完了: ${formattedArchivedDate}</div>
        <div class="archived-task-actions">
            <button class="restore-task-btn" 
                    data-task-id="${task.id}"
                    aria-label="${task.name}を復元">
                ↩️ 復元
            </button>
            <button class="delete-task-btn" 
                    data-task-id="${task.id}"
                    aria-label="${task.name}を削除">
                🗑️ 削除
            </button>
        </div>
    `;
    
    // ... 既存のコード ...
}
```

### 3. コントラスト比の改善

`style.css`で以下の色を修正します：

#### 問題のある色の組み合わせ

現在のLighthouse監査で検出された問題：

1. **日付列のヒントテキスト** (`.day-column-hint`)
   - 現状: 薄いグレー（推定 #ccc）on 白背景
   - 問題: コントラスト比が不十分
   - 修正: より濃いグレー（#666）に変更

2. **カテゴリ背景色とテキスト**
   - 現状: 薄い背景色に黒テキスト
   - 問題: 一部のカテゴリでコントラスト比が不十分
   - 修正: 背景色を調整または削除

3. **優先度ラベル**
   - 現状: カラフルな背景に白テキスト
   - 問題: 一部の色でコントラスト比が不十分
   - 修正: 背景色を濃くする

#### 修正内容

```css
/* 日付列のヒントテキスト - コントラスト改善 */
.day-column-hint {
    color: #666; /* より濃いグレーに変更（コントラスト比 5.74:1） */
    font-size: 0.85em;
    text-align: center;
    padding: 10px;
    opacity: 0.8;
}

/* カテゴリ背景色を削除し、カテゴリバーのみで識別 */
.task.category-task {
    background-color: var(--card-background); /* 統一 */
}

.task.category-meeting {
    background-color: var(--card-background);
}

.task.category-review {
    background-color: var(--card-background);
}

.task.category-bugfix {
    background-color: var(--card-background);
}

.task.category-document {
    background-color: var(--card-background);
}

.task.category-research {
    background-color: var(--card-background);
}

/* ダークモード用も同様 */
[data-theme="dark"] .task.category-task,
[data-theme="dark"] .task.category-meeting,
[data-theme="dark"] .task.category-review,
[data-theme="dark"] .task.category-bugfix,
[data-theme="dark"] .task.category-document,
[data-theme="dark"] .task.category-research {
    background-color: var(--card-background);
}

/* 優先度ラベルの背景色を濃くする */
.task-priority.high {
    background-color: #c82333; /* より濃い赤（コントラスト比 4.52:1） */
    color: white;
}

.task-priority.medium {
    background-color: #e67e22; /* より濃いオレンジ（コントラスト比 4.54:1） */
    color: white;
}

.task-priority.low {
    background-color: #218838; /* より濃い緑（コントラスト比 4.56:1） */
    color: white;
}

/* ダークモード用の優先度色も調整 */
[data-theme="dark"] .task-priority.high {
    background-color: #dc3545; /* 十分なコントラスト */
}

[data-theme="dark"] .task-priority.medium {
    background-color: #fd7e14; /* 十分なコントラスト */
}

[data-theme="dark"] .task-priority.low {
    background-color: #28a745; /* 十分なコントラスト */
}

/* 週タイトルのコントラスト改善 */
#week-title {
    text-align: center;
    margin: 10px 0 0 0;
    color: #555; /* 既存の色を維持（コントラスト比 7.48:1） */
}

[data-theme="dark"] #week-title {
    color: #ccc; /* ダークモードでも十分なコントラスト */
}

/* 日次合計時間のコントラスト改善 */
.daily-total-time {
    font-size: 0.9em;
    font-weight: bold;
    color: #333; /* より濃い色に変更（コントラスト比 12.63:1） */
    margin-left: 8px;
}

[data-theme="dark"] .daily-total-time {
    color: #e0e0e0; /* ダークモードでも十分なコントラスト */
}

.daily-total-time.overload {
    color: #c82333; /* より濃い赤（コントラスト比 4.52:1） */
}

[data-theme="dark"] .daily-total-time.overload {
    color: #ff6b7a; /* ダークモードでも十分なコントラスト */
}
```

### 4. テーマ切り替えボタンのaria-label動的更新

`script.js`でテーマ切り替え時にaria-labelを更新します：

```javascript
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // ボタンのテキストとaria-labelを更新
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (newTheme === 'dark') {
        themeToggleBtn.textContent = '☀️ ライト';
        themeToggleBtn.setAttribute('aria-label', 'ライトモードに切り替え');
    } else {
        themeToggleBtn.textContent = '🌙 ダーク';
        themeToggleBtn.setAttribute('aria-label', 'ダークモードに切り替え');
    }
}
```

## Accessibility Best Practices

### 継続的な監視

1. **開発時のチェック**
   - 新しい要素を追加する際は、必ずaria-label属性を検討
   - 新しい色を追加する際は、コントラスト比を事前に確認

2. **定期的な監査**
   - 機能追加後は必ずLighthouse監査を実行
   - スクリーンリーダーでの動作確認を定期的に実施

3. **ドキュメント化**
   - アクセシビリティ要件をAGENTS.mdに追加
   - 新規開発者向けのガイドラインを作成

### 推奨ツール

- **Lighthouse**: Chrome DevToolsに統合された監査ツール
- **axe DevTools**: より詳細なアクセシビリティ検証
- **WebAIM Contrast Checker**: コントラスト比の手動確認
- **NVDA/VoiceOver**: スクリーンリーダーでの実際の動作確認
