# ウィークリータスクボード

効率的なタスク管理のためのシンプルなウィークリータスクボード。ドラッグ＆ドロップによる直感的な操作と、統計・分析機能で生産性を向上させます。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)

## 目次

- [主な機能](#主な機能)
- [クイックスタート](#クイックスタート)
- [使い方](#使い方)
- [カレンダー同期設定](#カレンダー同期設定)
  - [Outlook カレンダー同期](#outlook-カレンダー同期)
  - [Google Calendar 同期](#google-calendar-同期)
- [技術スタック](#技術スタック)
- [プロジェクト構造](#プロジェクト構造)
- [テスト](#テスト)
- [セキュリティ](#セキュリティ)
- [ドキュメント](#ドキュメント)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

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
- **週ごとの統計表示**: 統計パネルで前週・次週の統計を確認可能

### 繰り返しタスク機能
- **自動生成**: 毎日/毎週/毎月のパターンで自動生成
- **終了日設定**: 繰り返しの終了日を指定可能
- **テンプレート保存**: よく使うタスクをテンプレートとして保存
- **テンプレート管理**: テンプレートの検索・ソート・削除

### カレンダー同期機能
**Outlook カレンダー** / **Google Calendar** から予定をインポート
- **OAuth 2.0 認証**: 各カレンダーサービスでの安全な認証
- **イベント取得**: カレンダーから予定を取得
- **イベント選択**: 複数の予定を選択してインポート
- **自動変換**: カレンダーイベントをタスクに自動変換
- **重複検出**: 既にインポート済みの予定を検出
- **プロパティベーステスト**: 20個の正確性プロパティで検証

> **注**: カレンダー同期機能を使用するには、各サービスの認証情報設定が必要です。[カレンダー同期設定](#カレンダー同期設定)を参照してください。

### インタースティシャルジャーナリング
- **ジャーナル記録**: タスク開始時にメモを記録、完了時に Next Step を入力
- **実行ログ**: 日単位のタイムラインで作業記録を振り返り
- **空白時間検出**: 15分以上の隙間を自動検出して休憩/割り込みを可視化

### バレットジャーナル要素
- **Signifiers（記号）**: タスク名の横にクリックで切り替え可能なアイコン
  - ・ (タスク)、－ (メモ)、！ (重要)、？ (検討)、☁ (アイデア)
- **マイグレーション（タスク移行）**: 未完了タスクを次週/翌日/未割り当てに一括移動
  - 移行元タスクに `>` マークを付与して履歴を残し、移行先にコピーを作成

### 週次レビュー（レトロスペクティブ）
- **統計パネル**: 完了率、合計時間、カテゴリ別内訳をダッシュボード表示
- **ジャーナル作業時間**: JournalEntry から実際の作業時間を自動算出
- **トップ3実績**: 完了タスクからベスト3を選択してハイライト
- **Markdown エクスポート**: 週報を Markdown 形式でクリップボードにコピー

### モーニングページ（思考デトックス）
- **全画面エディタ**: 起動時に自由に思考を書き出すシンプルなエディタ
- **TODO 自動抽出**: `[ ]` や `TODO:` を含む行を自動検出
- **一括タスク登録**: 抽出した項目を Inbox または指定日に一括登録

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

### ジャーナル記録
- タスクの「▶ 開始」ボタンをクリックしてジャーナルを開始
- 完了時に Next Step を入力して次のタスクに申し送り
- ヘッダーの「📝」ボタンで実行ログタイムラインを確認

### バレットジャーナル
- タスク名の横の記号をクリックして切り替え（・ － ！ ？ ☁）
- ヘッダーの「➡️」ボタンで未完了タスクを次週/翌日に移行

### 週次レビュー
- ヘッダーの「📋」ボタンで週次レビューパネルを開く
- 完了タスクからトップ3を選択してハイライト
- 「Markdownでコピー」で週報をクリップボードにコピー

### モーニングページ
- ヘッダーの「🌅」ボタンで全画面エディタを開く
- 思考を書き出した後、「TODOを抽出してタスク登録」で `[ ]` や `TODO:` 行をタスク化

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
├── DOMInitialization.js       # DOM初期化モジュール
├── WeekNavigation.js          # 週ナビゲーション
├── TaskOperations.js          # タスクCRUD操作
├── TaskModal.js               # タスクモーダル
├── TaskFiltering.js           # タスクフィルタリング
├── TaskRendering.js           # タスクレンダリング
├── JournalManager.js          # ジャーナル管理
├── JournalUI.js               # ジャーナルUI
├── SignifierManager.js        # バレットジャーナル記号管理
├── TaskMigration.js           # タスク移行（マイグレーション）
├── WeeklyReview.js            # 週次レビュー統計
├── WeeklyReviewUI.js          # 週次レビューUI
├── MorningPages.js            # モーニングページデータ管理
├── MorningPagesUI.js          # モーニングページUI
├── manifest.json              # PWAマニフェスト
├── favicon.svg                # ファビコン
├── package.json               # npm設定
├── run-tests.js               # テストランナー
├── run-tests.sh               # テスト実行スクリプト
├── verify-implementation.js   # 実装検証スクリプト
├── SECURITY.md                # セキュリティポリシー
├── README.md                  # このファイル
├── AGENTS.md                  # 開発者向けガイド
├── CODING_GUIDELINES.md       # コーディングガイドライン
├── TEST_DOCUMENTATION.md      # テスト詳細ドキュメント
├── TESTING_GUIDE.md           # テスト実行ガイド
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD
├── .kiro/specs/               # 仕様書
│   ├── advanced-task-management/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── weekday-visibility/
│   │   └── tasks.md
│   ├── task-categories/
│   │   └── tasks.md
│   └── test-coverage-improvement/
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       └── IMPLEMENTATION_SUMMARY.md
├── tests/
│   ├── unit/                  # ユニットテスト（25個）
│   │   ├── test-task-operations.js
│   │   ├── test-recurring-tasks.js
│   │   ├── test-statistics-engine.js
│   │   ├── test-data-persistence.js
│   │   ├── test-ui-operations.js
│   │   ├── test-edge-cases.js
│   │   ├── test-time-management.js
│   │   ├── test-template-functionality.js
│   │   ├── test-archive.js
│   │   ├── test-data-migration.js
│   │   ├── test-weekday-manager.js
│   │   ├── test-export-import.js
│   │   ├── test-time-validation.js
│   │   ├── test-completion-rate.js
│   │   ├── test-recurrence-engine.js
│   │   ├── test-recurring-persistence.js
│   │   ├── test-time-persistence.js
│   │   ├── test-time-comparison.js
│   │   ├── test-time-overrun-visual.js
│   │   ├── test-export-import-time.js
│   │   ├── test-migration-functionality.js
│   │   ├── test-category-functionality.js
│   │   ├── test-weekday-functionality.js
│   │   ├── test-comprehensive-unit.js
│   │   └── test-integration-task13.js
│   ├── integration/           # 統合テスト（2個）
│   │   ├── test-integration-scenarios.js
│   │   └── test-category-integration.js
│   ├── performance/           # パフォーマンステスト（2個）
│   │   ├── test-performance.js
│   │   └── test-weekday-performance.js
│   └── utils/
│       └── test-helpers.js    # テストインフラストラクチャ
└── docs/
    ├── AGENTS.md
    ├── CODING_GUIDELINES.md
    ├── SECURITY.md
    ├── weekday-functionality-guide.md
    ├── TIME_VALIDATION_IMPLEMENTATION.md
    ├── RECURRENCE_ENGINE_IMPLEMENTATION.md
    ├── TEMPLATE_IMPLEMENTATION.md
    ├── TEMPLATE_MANAGEMENT_UI_IMPLEMENTATION.md
    ├── RECURRING_PERSISTENCE_IMPLEMENTATION.md
    ├── MIGRATION_IMPLEMENTATION.md
    └── INTEGRATION_TASK13_SUMMARY.md
```

## テスト

### テスト概要

包括的なテストスイートで、ユニット、統合、パフォーマンステストをカバーしています。

- **総テスト数**: 33個
- **成功率**: 100%
- **実行時間**: 約10秒

### ローカルでテスト実行

```bash
# すべてのテストを実行
npm test

# 特定のテストカテゴリを実行
npm run test:unit              # ユニットテスト（25個）
npm run test:integration       # 統合テスト（2個）
npm run test:performance       # パフォーマンステスト（2個）
npm run test:quality           # 品質チェック（4個）

# 詳細レポート付きで実行
node run-tests.js --report

# 特定のテストファイルを実行
node run-tests.js tests/unit/test-task-operations.js
```

### GitHub Actions CI/CD

- **トリガー**: mainおよびdevelopブランチへのpush、Pull Request
- **実行内容**:
  - Node.js 20.x, 22.x, 24.x, 25.xでのテスト実行
  - 全ユニットテストの実行
  - パフォーマンステストの実行
  - コード品質チェック
  - 実装検証

### テストファイル一覧

#### ユニットテスト（25個）

| ファイル | 説明 |
|---------|------|
| test-task-operations.js | タスク操作（作成、編集、削除） |
| test-recurring-tasks.js | 繰り返しタスク機能 |
| test-statistics-engine.js | 統計計算エンジン |
| test-data-persistence.js | データ永続化 |
| test-ui-operations.js | UI操作 |
| test-edge-cases.js | エッジケース処理 |
| test-time-management.js | 時間管理 |
| test-template-functionality.js | テンプレート機能 |
| test-archive.js | アーカイブ機能 |
| test-data-migration.js | データマイグレーション |
| test-weekday-manager.js | 曜日管理 |
| test-export-import.js | エクスポート/インポート |
| test-time-validation.js | 時間バリデーション |
| test-completion-rate.js | 完了率計算 |
| test-recurrence-engine.js | 繰り返しエンジン |
| test-recurring-persistence.js | 繰り返しタスク永続化 |
| test-time-persistence.js | 時間データ永続化 |
| test-time-comparison.js | 時間比較 |
| test-time-overrun-visual.js | 時間超過表示 |
| test-export-import-time.js | 時間データエクスポート/インポート |
| test-migration-functionality.js | マイグレーション機能 |
| test-category-functionality.js | カテゴリ機能 |
| test-weekday-functionality.js | 曜日機能 |
| test-comprehensive-unit.js | 包括的ユニットテスト |
| test-integration-task13.js | 統合テスト |

#### 統合テスト（2個）

| ファイル | 説明 |
|---------|------|
| test-integration-scenarios.js | 8つの実際のワークフローシナリオ |
| test-category-integration.js | カテゴリ統合テスト |

#### パフォーマンステスト（2個）

| ファイル | 説明 |
|---------|------|
| test-performance.js | 8つのパフォーマンスベンチマーク |
| test-weekday-performance.js | 曜日機能パフォーマンス |

#### 品質チェック（4個）

- コード構造検証
- エラーハンドリング検証
- データ整合性検証
- パフォーマンス基準検証

### テストインフラストラクチャ

#### テストヘルパー（tests/utils/test-helpers.js）

- **MockLocalStorage**: LocalStorage のモック実装
- **TestDataGenerator**: テストデータ生成ユーティリティ
- **CustomAssertions**: カスタムアサーション関数

#### テストランナー（run-tests.js）

- カテゴリ別テスト実行
- 詳細レポート生成
- CI/CD 統合対応
- パフォーマンス測定

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
- **バージョン**: 1.5.0

## 謝辞

このプロジェクトは、効率的なタスク管理を目指すすべてのユーザーのために開発されました。

## サポート

質問や問題がある場合は、GitHubのIssueで報告してください。

---

**最終更新**: 2026年4月14日


## カレンダー同期設定

カレンダー同期機能を使用するには、各サービスの認証情報を設定する必要があります。認証情報は `config.js` ファイルで管理します。

### 設定ファイルの作成

1. プロジェクトルートに `.env.example` をコピーして `config.js` を作成:

```bash
# .env.example を参考に config.js を作成
cp .env.example config.js
```

2. `config.js` を編集して、各サービスの認証情報を入力します。

### Outlook カレンダー同期

Outlook カレンダー同期機能を使用するには、Azure AD アプリケーション登録が必要です。

#### 前提条件

- Microsoft Azure アカウント
- Azure Portal へのアクセス権限
- 会社アカウントの場合は IT 管理者の承認

#### 有効化手順

##### ステップ 1: Azure Portal でアプリケーション登録

1. [Azure Portal](https://portal.azure.com) にアクセス
2. **Azure AD** → **アプリの登録** → **新規登録** をクリック
3. アプリケーション情報を入力:
   - **名前**: `Weekly Task Board` (任意)
   - **サポートされているアカウントの種類**:
     - 個人用アカウント: `任意の組織のディレクトリ内のアカウントと個人の Microsoft アカウント`
     - 会社アカウント: `この組織のディレクトリ内のアカウントのみ`
   - **リダイレクト URI**: `http://localhost:3000/outlook-callback`
4. **登録** をクリック

##### ステップ 2: Client ID を設定

1. 登録したアプリケーションを開く
2. **概要** ページから **アプリケーション (クライアント) ID** をコピー
3. `config.js` の `OUTLOOK_CONFIG.CLIENT_ID` に貼り付け

##### ステップ 3: 機能を有効化

`index.html` で Outlook 同期パネルのコメントを外します:

```html
<!-- コメントを外す -->
<button id="outlook-sync-btn" title="Outlook同期">📅</button>
```

`script.js` の末尾にある Outlook 同期マネージャーの初期化コードのコメントを外します:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded イベント発火');
    outlookSyncManager = new OutlookSyncManager();
    outlookSyncManager.initializePanel();
    console.log('✅ Outlook同期マネージャーが初期化されました');
});
```

---

### Google Calendar 同期

Google Calendar 同期機能を使用するには、Google Cloud Console で OAuth 2.0 クライアントを作成する必要があります。

#### 前提条件

- Google アカウント
- [Google Cloud Console](https://console.cloud.google.com/) へのアクセス

#### 有効化手順

詳細な手順は [`docs/GOOGLE_CALENDAR_SETUP.md`](docs/GOOGLE_CALENDAR_SETUP.md) を参照してください。

##### ステップ 1: Google Cloud Console でプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: "Weekly Task Board"）
3. **APIs & Services** > **Library** から **Google Calendar API** を有効化

##### ステップ 2: OAuth 2.0 クライアントを作成

1. **APIs & Services** > **Credentials** に移動
2. **Create Credentials** > **OAuth client ID** をクリック
3. **Web application** を選択
4. 以下の情報を入力:
   - **Name**: Weekly Task Board Client
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/google-callback`
5. **Create** をクリック
6. **Client ID** と **Client Secret** をコピー

##### ステップ 3: 認証情報を設定

`config.js` の `GOOGLE_CONFIG` にコピーした認証情報を貼り付けます:

```javascript
const GOOGLE_CONFIG = {
  CLIENT_ID: 'your-client-id.apps.googleusercontent.com', // ← 貼り付け
  CLIENT_SECRET: 'your-client-secret', // ← 貼り付け
  // ...
};
```

##### ステップ 4: 機能を有効化

`index.html` で Google 同期パネルのコメントを外します:

```html
<!-- コメントを外す -->
<button id="google-sync-btn" title="Google同期">📆</button>

<!-- Google同期パネルのコメントを外す -->
<div id="google-sync-panel" class="google-sync-panel">
    <!-- パネル内容 -->
</div>
```

`script.js` の末尾にある Google 同期マネージャーの初期化コードのコメントを外します:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Google同期マネージャーを初期化中...');
    googleSyncManager = new GoogleSyncManager();
    googleSyncManager.initializePanel();
    console.log('✅ Google同期マネージャーが初期化されました');
});
```

---

### セキュリティ上の注意

- **絶対に `config.js` を Git にコミットしないでください**
- `.gitignore` に `config.js` が含まれていることを確認してください
- 本番環境では環境固有のリダイレクト URI を設定してください

---

### トラブルシューティング

### 前提条件

- Microsoft Azure アカウント
- Azure Portal へのアクセス権限
- 会社アカウントの場合は IT 管理者の承認

### 有効化手順

#### ステップ 1: Azure Portal でアプリケーション登録

1. [Azure Portal](https://portal.azure.com) にアクセス
2. **Azure AD** → **アプリの登録** → **新規登録** をクリック
3. アプリケーション情報を入力：
   - **名前**: `Weekly Task Board` (任意)
   - **サポートされているアカウントの種類**:
     - 個人用アカウント: `任意の組織のディレクトリ内のアカウントと個人の Microsoft アカウント`
     - 会社アカウント: `この組織のディレクトリ内のアカウントのみ`
   - **リダイレクト URI**: `http://localhost:3000/auth-callback`
4. **登録** をクリック

#### ステップ 2: Client ID を取得

1. 登録したアプリケーションを開く
2. **概要** ページから **アプリケーション (クライアント) ID** をコピー

#### ステップ 3: API パーミッション を設定

1. **API のアクセス許可** をクリック
2. **アクセス許可の追加** → **Microsoft Graph** をクリック
3. 以下のパーミッションを追加：
   - `Calendars.Read` - カレンダー読み取り
   - `offline_access` - オフライン アクセス
4. **管理者の同意を与える** をクリック（会社アカウントの場合は IT 管理者に依頼）

#### ステップ 4: script.js を更新

`script.js` の `OutlookSyncManager` クラスのコンストラクタを編集：

```javascript
this.clientId = 'YOUR_CLIENT_ID'; // ← ここに取得した Client ID を設定
```

例：
```javascript
this.clientId = '12345678-1234-1234-1234-123456789012';
```

#### ステップ 5: UI を有効化

**index.html** で以下の部分のコメントを外す：

1. ヘッダーの Outlook ボタン（約 74 行目）:
```html
<!-- <button id="outlook-sync-btn" title="Outlook同期">📅</button> -->
```
↓
```html
<button id="outlook-sync-btn" title="Outlook同期">📅</button>
```

2. Outlook 同期パネル（約 300 行目）:
```html
<!-- <div id="outlook-sync-panel" class="outlook-sync-panel" style="display: none;"> -->
```
↓
```html
<div id="outlook-sync-panel" class="outlook-sync-panel" style="display: none;">
```

**script.js** で以下の部分のコメントを外す（ファイルの最後）:
```javascript
/*
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded イベント発火');
    outlookSyncManager = new OutlookSyncManager();
    outlookSyncManager.initializePanel();
    console.log('✅ Outlook同期マネージャーが初期化されました');
});
*/
```
↓
```javascript
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded イベント発火');
    outlookSyncManager = new OutlookSyncManager();
    outlookSyncManager.initializePanel();
    console.log('✅ Outlook同期マネージャーが初期化されました');
});
```

#### ステップ 6: ブラウザをリロード

ブラウザをリロードすると、ヘッダーに 📅 ボタンが表示されます。

### 使用方法

1. ヘッダーの 📅 ボタンをクリック
2. 「Outlook に接続」をクリック
3. Microsoft ログイン画面で認証
4. 日付範囲を選択して「予定を取得」
5. 予定を選択して「インポート」

### トラブルシューティング

#### エラー: AADSTS700016

**原因**: Client ID が設定されていない、または無効

**解決方法**:
1. Azure Portal で Client ID を確認
2. `script.js` の `clientId` を正しく設定
3. ブラウザキャッシュをクリア

#### エラー: ポップアップがブロックされている

**原因**: ブラウザのポップアップブロック

**解決方法**:
1. ブラウザの設定でポップアップを許可
2. または、ブラウザの通知バーから許可

#### 会社アカウントで認証できない

**原因**: IT 管理者の承認が必要

**解決方法**:
1. IT 管理者に Azure AD アプリケーションの承認を依頼
2. テナント管理者の同意を取得

### 実装詳細

- **認証**: OAuth 2.0 フロー
- **API**: Outlook Graph API
- **テスト**: 20個のプロパティベーステスト
- **セキュリティ**: トークン暗号化、CSRF 保護

詳細は `.kiro/specs/outlook-calendar-sync/` を参照してください。
