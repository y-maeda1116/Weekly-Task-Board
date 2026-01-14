# Implementation Plan: Accessibility Improvements

## Overview

Lighthouseのアクセシビリティスコアを81点から90点以上に向上させるため、以下の改善を実施します：

1. すべてのボタンとリンクにaria-label属性を追加 ✅ 完了
2. テキストと背景のコントラスト比をWCAG 2.1 AA基準に準拠 ← 現在のフォーカス
3. 動的に生成される要素のアクセシビリティを確保 ✅ 完了

## Tasks

### Phase 1: ARIA Labels ✅ 完了済み

- [x] 1. 静的HTML要素にaria-label属性を追加
  - index.htmlのナビゲーションボタン（前週へ、今週に戻る、次週へ）にaria-label属性を追加
  - データ管理ボタン（エクスポート、インポート、アーカイブ、テーマ切り替え）にaria-label属性を追加
  - モーダルの閉じるボタンにaria-label属性を追加
  - アーカイブビューのボタン（閉じる、全削除）にaria-label属性を追加
  - _Requirements: 1.1, 1.2_

- [ ] 2. 動的に生成される要素にaria-label属性を追加
  - [x] 2.1 createTaskElement関数を修正してチェックボックスにaria-labelを追加
    - タスク名を含む説明的なaria-labelを生成（例: "タスク名を完了としてマーク"）
    - チェックボックス要素に`aria-label="${task.name}を完了としてマーク"`を追加
    - _Requirements: 1.3, 1.4_

  - [x] 2.2 createArchivedTaskElement関数を修正してボタンにaria-labelを追加
    - 復元ボタンに`aria-label="${task.name}を復元"`を追加
    - 削除ボタンに`aria-label="${task.name}を削除"`を追加
    - _Requirements: 1.3, 1.4_

  - [x] 2.3 updateThemeButton関数を修正してaria-labelを動的に更新
    - ライトモード時: `aria-label="ダークモードに切り替え"`
    - ダークモード時: `aria-label="ライトモードに切り替え"`
    - toggleTheme関数内でupdateThemeButton呼び出し時にaria-labelも更新
    - _Requirements: 1.4_

### Phase 2: Contrast Ratio Improvements 🔄 実装中

- [ ] 3. CSSのコントラスト比を改善
  - [ ] 3.1 日付列のヒントテキストの色を濃くする
    - style.cssの`.day-column-hint`（1380行目付近）を修正
    - `color`プロパティを`#999`から`#666`に変更
    - コントラスト比が4.5:1以上になることを確認
    - _Requirements: 2.1, 2.3_

  - [ ] 3.2 カテゴリ背景色を削除してコントラストを改善
    - style.cssの`.task.category-*`（1281-1304行目付近）を修正
    - すべてのカテゴリタスクの`background-color`を`var(--card-background)`に統一
    - ダークモード用の`[data-theme="dark"] .task.category-*`（1306-1328行目）も同様に修正
    - カテゴリバー（`.category-bar`）のみで視覚的な識別を維持
    - _Requirements: 2.3, 2.5_

  - [ ] 3.3 優先度ラベルの背景色を濃くする
    - style.cssの`.task-priority`を検索して修正
    - `.task-priority.high`の背景色を`#dc3545`から`#c82333`に変更
    - `.task-priority.medium`の背景色を`#f39c12`から`#e67e22`に変更
    - `.task-priority.low`の背景色を`#28a745`から`#218838`に変更
    - ダークモード用の色は十分なコントラストがあるため変更不要
    - _Requirements: 2.3, 2.5_

  - [ ] 3.4 日次合計時間の色を濃くする
    - style.cssの`.daily-total-time`を検索して修正
    - `.daily-total-time .total-time`の`color`を`var(--font-color)`から`#333`に変更（ライトモード）
    - `.daily-total-time.overload .total-time`の`color`を`#e74c3c`から`#c82333`に変更
    - ダークモード用の`.daily-total-time .total-time`の`color`を`#e0e0e0`に変更（新規追加）
    - _Requirements: 2.4_

- [ ] 4. Checkpoint - コントラスト改善の確認
  - ブラウザで変更を確認し、テキストが読みやすくなっていることを確認
  - WebAIM Contrast Checkerで主要な色の組み合わせを手動確認
  - ダークモードでもコントラスト比が維持されていることを確認

### Phase 3: Final Validation and Documentation

- [ ] 5. Lighthouse監査の実行と最終確認
  - Chrome DevToolsでLighthouse監査を実行
  - アクセシビリティスコアが90以上であることを確認
  - すべての監査項目が合格していることを確認
  - 不合格項目がある場合は追加修正を実施
  - _Requirements: 3.1_

- [ ] 6. ドキュメントの更新
  - AGENTS.mdにアクセシビリティのベストプラクティスセクションを追加
  - 新しい要素を追加する際のaria-label追加ガイドラインを記載
  - 新しい色を追加する際のコントラスト比確認手順を記載（WCAG 2.1 AA基準: 4.5:1以上）
  - _Requirements: 3.2, 3.3_

- [ ] 7. Final Checkpoint - すべての改善の確認
  - Lighthouseアクセシビリティスコアが90以上であることを最終確認
  - すべてのaria-label属性が適切に設定されていることを確認
  - すべてのコントラスト比がWCAG 2.1 AA基準を満たすことを確認
  - ドキュメントが更新されていることを確認

## Notes

- 各タスクは要件（Requirements）にトレーサビリティを持ち、どの要件を満たすかが明確です
- Checkpointタスクで段階的に進捗を確認し、問題があれば早期に修正します
- Lighthouse監査は実装の各段階で実行し、スコアの変化を追跡することを推奨します

## 実装状況サマリー

### ✅ 完了済み (Phase 1)
- **Task 1-2**: すべてのaria-label属性の実装が完了
  - 静的要素（ナビゲーション、データ管理、モーダル、アーカイブボタン）
  - 動的要素（タスクチェックボックス、アーカイブボタン、テーマ切り替え）
  - 実装確認: index.html、script.js（createTaskElement、createArchivedTaskElement、updateThemeButton関数）

### 🔄 次のステップ (Phase 2)
- **Task 3**: CSSコントラスト比の改善（4つのサブタスク）
  - 3.1: 日付列ヒントテキスト（`.day-column-hint`）の色を`#999`から`#666`に変更
  - 3.2: カテゴリ背景色（`.task.category-*`）を削除し、`var(--card-background)`に統一
  - 3.3: 優先度ラベル（`.task-priority`）の背景色を濃くする
    - high: `#dc3545` → `#c82333`
    - medium: `#f39c12` → `#e67e22`
    - low: `#28a745` → `#218838`
  - 3.4: 日次合計時間（`.daily-total-time`）の色を濃くする
    - 通常: `var(--font-color)` → `#333`
    - overload: `#e74c3c` → `#c82333`
    - ダークモード: 新規追加 `#e0e0e0`

### 📋 残作業 (Phase 3)
- **Task 5-7**: 最終確認とドキュメント更新
  - Lighthouse監査の実行（アクセシビリティスコア90以上を確認）
  - AGENTS.mdへのアクセシビリティガイドライン追加
  - 最終チェックポイント
