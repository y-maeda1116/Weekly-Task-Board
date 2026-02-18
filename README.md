# ウィークリータスクボード

効率的なタスク管理のためのシンプルなウィークリータスクボード。ドラッグ＆ドロップによる直感的な操作と、統計・分析機能で生産性を向上させます。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)

## 主な機能

### タスク管理
- **週次表示**: タスクを週単位で表示・管理
- **ドラッグ＆ドロップ**: タスクを直感的に移動
- **タスク編集**: タスク名、見積もり時間、優先度、カテゴリ、期限、詳細メモを管理
- **完了チェック**: タスクの完了状態を管理
- **未割り当てエリア**: 日付未指定のタスクを管理

### 時間管理
- **見積もり時間**: タスクの見積もり時間を記録
- **実績時間**: 実際の作業時間を記録
- **時間比較**: 見積もり vs 実績を比較
- **時間超過表示**: 見積もりを超えたタスクを視覚的に表示
- **日別合計時間**: 各日の合計作業時間を自動計算

### 統計・分析機能
- **完了率**: 週間の完了率を表示
- **カテゴリ別分析**: カテゴリごとの時間分析
- **日別作業時間**: 日別の作業時間を表示
- **見積もり vs 実績**: 全体の見積もりと実績を比較
- **統計ダッシュボード**: モーダル形式で統計情報を表示

### 繰り返しタスク機能
- **自動生成**: 毎日/毎週/毎月のパターンで自動生成
- **終了日設定**: 繰り返しの終了日を指定可能
- **テンプレート保存**: よく使うタスクをテンプレートとして保存
- **テンプレート管理**: テンプレートの検索・ソート・削除

### その他の機能
- **カテゴリフィルター**: 6種類のカテゴリで分類・フィルター
  - タスク、打ち合わせ、レビュー、バグ修正、ドキュメント作成、学習・調査
- **曜日表示設定**: 表示する曜日をカスタマイズ
- **理想稼働時間設定**: 1日の理想稼働時間を設定
- **ダークモード**: ダークテーマに対応
- **データエクスポート/インポート**: JSONファイルでバックアップ・復元
- **アーカイブ機能**: 完了タスクをアーカイブ
- **レスポンシブ対応**: モバイル・タブレット対応

## クイックスタート

### ブラウザで開く

1. リポジトリをクローン:
```bash
git clone https://github.com/y-maeda1116/Weekly-Task-Board.git
cd Weekly-Task-Board
```

2. `index.html`をブラウザで開く:
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

または、ブラウザにドラッグ&ドロップしてください。

### ローカルサーバーで実行（推奨）

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server)
npx http-server
```

その後、ブラウザで `http://localhost:8000` にアクセスしてください。

## 使い方

### タスクの追加
1. ヘッダーの「タスクを追加」ボタンをクリック
2. タスク情報を入力（名前、見積もり時間、優先度、カテゴリ、担当日、期限、詳細メモ）
3. 「登録」ボタンをクリック

### タスクの移動
- タスクカードをドラッグして、別の曜日にドロップ
- 未割り当てのタスクは右側の「未割り当て/持ち越し」エリアにドロップ

### タスクの編集
- タスクカードをクリックして編集モーダルを開く
- 情報を変更して「登録」をクリック

### 週の移動
- 「前週へ」「次週へ」ボタンで週を切り替え
- 日付ピッカーで特定の週にジャンプ

### 統計確認
- ヘッダーの「統計」ボタンをクリック
- 週間統計をモーダルで表示

### テンプレート管理
- ヘッダーの「テンプレート」ボタンをクリック
- テンプレートを検索・ソート・使用・削除

### データ管理
- **エクスポート**: 「エクスポート」ボタンでJSONファイルをダウンロード
- **インポート**: 「インポート」ボタンで以前のデータを復元
- **アーカイブ**: 「アーカイブ」ボタンで完了タスクを確認

## 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: レスポンシブデザイン、ダークモード対応
- **JavaScript (Vanilla)**: フレームワーク不要
- **LocalStorage**: データ永続化
- **PWA対応**: マニフェストファイル、アイコン

## プロジェクト構造

```
Weekly-Task-Board/
├── index.html                 # メインHTML
├── style.css                  # スタイルシート
├── script.js                  # メインロジック
├── manifest.json              # PWAマニフェスト
├── favicon.svg                # ファビコン
├── package.json               # npm設定
├── run-tests.js               # テストランナー
├── run-tests.sh               # テスト実行スクリプト
├── SECURITY.md                # セキュリティポリシー
├── README.md                  # このファイル
├── AGENTS.md                  # 開発者向けガイド
├── CODING_GUIDELINES.md       # コーディングガイドライン
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD
├── .kiro/specs/               # 仕様書
│   ├── advanced-task-management/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── weekday-visibility/
│       └── tasks.md
└── test-*.js                  # テストファイル（16個）
```

## テスト

### ローカルでテスト実行

```bash
# すべてのテストを実行
npm test

# 特定のテストカテゴリを実行
npm run test:unit              # ユニットテスト
npm run test:integration       # 統合テスト
npm run test:time              # 時間管理テスト
npm run test:statistics        # 統計テスト
npm run test:recurrence        # 繰り返しタスクテスト
npm run test:template          # テンプレートテスト
npm run test:weekday           # 曜日機能テスト
npm run test:category          # カテゴリテスト
npm run test:all               # すべてのテスト
npm run verify                 # 実装検証
```

### GitHub Actions CI/CD

- **トリガー**: mainおよびdevelopブランチへのpush、Pull Request
- **実行内容**:
  - Node.js 18.x, 20.xでのテスト実行
  - 全ユニットテストの実行
  - パフォーマンステストの実行
  - コード品質チェック
  - 実装検証

## テストファイル一覧

| ファイル | 説明 |
|---------|------|
| test-time-validation.js | 時間データバリデーション |
| test-time-persistence.js | 時間データ永続化 |
| test-statistics-engine.js | 統計計算エンジン |
| test-completion-rate.js | 完了率計算 |
| test-recurrence-engine.js | 繰り返しタスク生成 |
| test-recurring-persistence.js | 繰り返しタスク永続化 |
| test-template-functionality.js | テンプレート機能 |
| test-weekday-functionality.js | 曜日機能 |
| test-category-functionality.js | カテゴリ機能 |
| test-time-overrun-visual.js | 時間超過表示 |
| test-time-comparison.js | 時間比較 |
| test-export-import-time.js | エクスポート/インポート |
| test-migration-functionality.js | マイグレーション |
| test-comprehensive-unit.js | 包括的ユニットテスト |
| test-integration-task13.js | 統合テスト |
| test-weekday-performance.js | パフォーマンステスト |

## セキュリティ

このアプリケーションはクライアント側で動作し、すべてのデータはローカルストレージに保存されます。

詳細は [SECURITY.md](SECURITY.md) を参照してください。

### セキュリティ脆弱性報告

セキュリティ脆弱性を発見した場合は、以下のリンクから報告してください：

[GitHub Security Advisory - 脆弱性を報告](https://github.com/y-maeda1116/Weekly-Task-Board/security/advisories/new)

## ドキュメント

- [AGENTS.md](AGENTS.md) - 開発者向けガイド
- [CODING_GUIDELINES.md](CODING_GUIDELINES.md) - コーディングガイドライン
- [SECURITY.md](SECURITY.md) - セキュリティポリシー
- [weekday-functionality-guide.md](weekday-functionality-guide.md) - 曜日機能ガイド
- [TIME_VALIDATION_IMPLEMENTATION.md](TIME_VALIDATION_IMPLEMENTATION.md) - 時間管理実装ガイド
- [RECURRENCE_ENGINE_IMPLEMENTATION.md](RECURRENCE_ENGINE_IMPLEMENTATION.md) - 繰り返しタスク実装ガイド
- [TEMPLATE_IMPLEMENTATION.md](TEMPLATE_IMPLEMENTATION.md) - テンプレート実装ガイド
- [INTEGRATION_TASK13_SUMMARY.md](INTEGRATION_TASK13_SUMMARY.md) - 統合実装サマリー

## 貢献

バグ報告や機能提案は、GitHubのIssueで受け付けています。

Pull Requestも歓迎します。大きな変更の場合は、まずIssueを開いて変更内容を議論してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 開発者

- **プロジェクト**: ウィークリータスクボード
- **リポジトリ**: https://github.com/y-maeda1116/Weekly-Task-Board
- **バージョン**: 1.0.0

## 謝辞

このプロジェクトは、効率的なタスク管理を目指すすべてのユーザーのために開発されました。

## サポート

質問や問題がある場合は、GitHubのIssueで報告してください。

---

**最終更新**: 2024年2月18日