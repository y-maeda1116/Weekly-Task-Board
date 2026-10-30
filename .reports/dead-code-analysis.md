# Dead Code Analysis — Weekly-Task-Board (2026-10-31)

knip(未使用ファイル/エクスポート)+ 手動検証(HTML インラインハンドラ 0件・`window.*` 参照 0件・`run-tests.js` 欠損)。

## 実行する削除(SAFE)

### Batch 1: レガシーテスト一式(〜15,400行)
- `tests/unit/test-*.js` 26ファイル / `tests/integration/*.js` 1 / `tests/performance/*.js` 2 / `tests/utils/test-helpers.js` — 計 15,269行
- 依据: すべて CJS(`require()`)で vitest は実行対象外(実行中は `.test.ts` 6ファイル)。ランナー `run-tests.js` は存在せず `run-tests.sh` は壊滅
- `run-tests.sh` も削除

### Batch 2: `src/utils/dom.ts`(319行)
- 依据: リポジトリ全体で import 0件

### Batch 3: utils/constants/models の未使用エクスポート
- knip 指摘のうち自己完結ユーティリティのみ。1件ずつ grep で全参照ゼロを確認してから削除

## 実行しない(要判断・CAUTION/DANGER)

- **`public/sw.js` / `sw.ts`**: sw.js は実行時登録される本番物。sw.ts はビルド経路が存在しない手動コピーの疑い → 別途方針決定
- **features 内の未使用エクスポート(~100シンボル)**: TaskOperations/ArchiveManager 等の namespace メソッド。動作への影響ゼロだが diff が大きい → 別 PR 推奨
- **未使用 exported types(23件)**: ランタイム影響ゼロ → 別 PR 推奨
- `ts71/` `tsrs/` の knip 指摘: 独自エントリのサンドボックスであり誤検知
