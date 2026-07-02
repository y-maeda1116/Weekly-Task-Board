# ウィークリータスクボード

効率的なタスク管理のためのウィークリータスクボード。TypeScript + Vite で構築されたモダンな PWA アプリケーション。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0%20Beta-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)

## 目次

- [主な機能](#主な機能)
- [クイックスタート](#クイックスタート)
- [技術スタック](#技術スタック)
- [プロジェクト構造](#プロジェクト構造)
- [開発](#開発)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [カレンダー同期設定](#カレンダー同期設定)
- [セキュリティ](#セキュリティ)
- [ライセンス](#ライセンス)

## 主な機能

### タスク管理
- **週次表示**: タスクを週単位で表示・管理
- **ドラッグ＆ドロップ**: タスクを直感的に移動
- **タスク編集**: 名前、見積もり時間、優先度、カテゴリ、期限、詳細メモ
- **完了チェック**: タスクの完了状態を管理
- **未割り当てエリア**: 日付未指定のタスクを管理

### 時間管理
- **見積もり/実績時間**: タスクの時間を記録・比較
- **時間超過表示**: 見積もりを超えたタスクを視覚的に表示
- **日別合計時間**: 各日の合計作業時間を自動計算

### 統計・分析
- **完了率**: 週間完了率、カテゴリ別分析、日別作業時間
- **週次レビュー**: トップ3実績の選択、Markdown週報エクスポート

### インタースティシャルジャーナリング
- **ジャーナル記録**: タスク開始時にメモ、完了時に Next Step を入力
- **実行ログ**: 日単位のタイムライン、空白時間自動検出

### バレットジャーナル要素
- **Signifiers**: タスク、メモ、重要、検討、アイデアの5種
- **マイグレーション**: 未完了タスクを次週/翌日/未割り当てに一括移動

### モーニングページ
- **全画面エディタ**: 思考の書き出し、TODO自動抽出→一括タスク登録

### その他
- **繰り返しタスク**: 毎日/毎週/毎月パターン
- **テンプレート管理**: よく使うタスクを保存・再利用
- **カレンダー同期**: Outlook / Google Calendar から予定インポート
- **カテゴリフィルター**: 6種類のカテゴリで分類
- **ダークモード**: テーマ切替対応
- **データエクスポート/インポート**: JSON でバックアップ・復元
- **PWA 対応**: オフライン動作、ホーム画面追加
- **レスポンシブ**: モバイル・タブレット対応

## クイックスタート

```bash
# クローン
git clone https://github.com/y-maeda1116/Weekly-Task-Board.git
cd Weekly-Task-Board

# 依存インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス。

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **TypeScript** | 7.0 Beta (tsgo) | 型安全な開発 |
| **Vite** | 8.x | ビルドツール・開発サーバー |
| **Vitest** | 0.34.x | ユニットテスト |
| **Playwright** | 1.59.x | E2E テスト |
| **LocalStorage** | - | データ永続化 |
| **Service Worker** | - | PWA オフライン対応 |

## プロジェクト構造

```
Weekly-Task-Board/
├── index.html                  # エントリHTML
├── style.css                   # スタイルシート
├── vite.config.ts              # Vite 設定
├── tsconfig.json               # TypeScript 設定
├── vitest.config.ts            # Vitest 設定
├── playwright.config.js        # Playwright 設定
├── manifest.json               # PWA マニフェスト
├── package.json                # プロジェクト設定
├── public/
│   ├── sw.js                   # Service Worker
│   ├── favicon.svg             # ファビコン
│   └── icons/                  # PWA アイコン
├── src/
│   ├── app.ts                  # Vite エントリポイント
│   ├── app/                    # アプリケーション層
│   │   ├── AppContext.ts        # グローバル状態管理
│   │   ├── init.ts             # 初期化ロジック
│   │   ├── RenderWeek.ts       # 週レンダリング
│   │   ├── TaskRenderer.ts     # タスクDOM構築
│   │   ├── DragDrop.ts         # ドラッグ＆ドロップ
│   │   ├── storage.ts          # ストレージ操作
│   │   └── ...
│   ├── features/               # 機能モジュール（25個）
│   │   ├── TaskModal.ts        # タスクモーダル
│   │   ├── TaskOperations.ts   # タスクCRUD
│   │   ├── JournalManager.ts   # ジャーナル管理
│   │   ├── ThemeManager.ts     # テーマ管理
│   │   ├── PWASetup.ts         # PWA設定
│   │   └── ...
│   ├── core/                   # コアクラス
│   │   ├── StateManager.ts     # 状態管理
│   │   ├── TaskManager.ts      # タスク操作
│   │   └── DOMManager.ts       # DOM操作
│   ├── types/                  # 型定義
│   ├── constants/              # 定数
│   ├── utils/                  # ユーティリティ
│   └── components/             # UIコンポーネント
├── e2e/                        # Playwright E2E テスト
├── tests/                      # Vitest テスト
│   ├── unit/                   # ユニットテスト
│   └── integration/            # 統合テスト
└── docs/                       # ドキュメント
```

## 開発

```bash
# 開発サーバー（HMR付き）
npm run dev

# 型チェック（tsgo）
npm run type-check

# 型チェック（tsc フォールバック）
npm run type-check:tsc

# プロダクションビルド
npm run build:vite

# ビルドプレビュー
npm run preview
```

## テスト

```bash
# ユニットテスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage

# E2E テスト
npm run test:e2e

# E2E（ヘッド付き）
npm run test:e2e:headed
```

## デプロイ

GitHub Actions で自動デプロイ:

| ブランチ | URL | Vite Base |
|----------|-----|-----------|
| `main` | `https://weekly-task.maeda.coffee/` | `/` |
| `dev` | `https://weekly-task.maeda.coffee/dev/` | `/dev/` |

```bash
# main にマージするだけで本番デプロイ
git checkout main
git merge dev
git push origin main
```

## カレンダー同期設定

カレンダー同期を使用するには `config.js` を作成:

```bash
cp config.example.js config.js
# config.js に認証情報を設定
```

### Outlook カレンダー
1. [Azure Portal](https://portal.azure.com) でアプリ登録
2. Client ID を取得して `config.js` に設定
3. `Calendars.Read` パーミッションを追加

### Google Calendar
1. [Google Cloud Console](https://console.cloud.google.com/) で OAuth 2.0 クライアント作成
2. Google Calendar API を有効化
3. Client ID / Secret を `config.js` に設定

> **注意**: `config.js` は `.gitignore` に含まれています。絶対にコミットしないでください。

## セキュリティ

クライアント側で動作し、すべてのデータは LocalStorage に保存されます。
詳細は [SECURITY.md](SECURITY.md) を参照。

脆弱性報告: [GitHub Security Advisory](https://github.com/y-maeda1116/Weekly-Task-Board/security/advisories/new)

## ライセンス

MIT License. 詳細は [LICENSE](LICENSE) ファイルを参照。
