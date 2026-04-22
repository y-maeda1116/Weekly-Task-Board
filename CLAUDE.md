# Weekly Task Board

## バージョン管理ルール

- **毎回プッシュ時にバージョンを上げる**（キャッシュ問題防止のため）
- バージョン上げ対象ファイル:
  - `index.html` — `?v=X.X.X` のキャッシュバスター、`window.APP_VERSION`
  - `script.js` — `const APP_VERSION`
  - `sw.js` — `const CACHE_NAME`
- パッチバージョン（1.5.5 → 1.5.6）で増やす

## デプロイ構成

- `main` → `https://weekly-task.maeda.coffee/`（本番）
- `dev` → `https://weekly-task.maeda.coffee/dev/`（開発検証）
- GitHub Actions (`deploy.yml`) + `gh-pages` ブランチでデプロイ
