# Weekly Task Board

## バージョン管理ルール

- **毎回プッシュ時にバージョンを上げる**（キャッシュ問題防止のため）
- バージョン上げ対象ファイル:
  - `src/app/init.ts` — `const APP_VERSION`
  - `public/sw.js` — `const CACHE_NAME`（`weekly-task-board-v1` のバージョン部分）
- パッチバージョン（1.5.5 → 1.5.6）で増やす
- バンドルJS/CSSのキャッシュバスターは Vite のビルドハッシュが自動付与するため、`index.html` の手動 `?v=` は不要

## デプロイ構成

- `main` → `https://weekly-task.maeda.coffee/`（本番）
- `dev` → `https://weekly-task.maeda.coffee/dev/`（開発検証）
- GitHub Actions (`deploy.yml`) + `gh-pages` ブランチでデプロイ
