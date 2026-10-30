# TypeScript ロードマップ (7.1 / tsrs)

最終更新: 2026-10-30

## 現行(変更不可・green 基準)

| スクリプト | コンパイラ | 役割 |
|---|---|---|
| `type-check` | tsgo 7.0.0-dev.20260421.2(native-preview ピン留め) | **CI 必須・デフォルト**。現行環境の green 基準 |
| `type-check:tsc` | typescript 5.9.3(direct-path) | tsc フォールバック。`compile-hybrid*.sh` が依存 |
| `type-check:7.1` | typescript 7.1.0-beta(`typescript-next` エイリアス) | 観測モード(CI continue-on-error) |
| `type-check:tsrs` | tsrs 0.20.1-ts7.1.0-beta(exact ピン留め) | 見学モード(CI continue-on-error) |

## Phase A: TS 7.1 への昇格

**発動条件:** `npm view typescript dist-tags.latest` が 7.1.x(stable)になったら

1. `typescript-next` エイリアスを削除し、`typescript` を `^7.1.0` に更新
2. `type-check` を 7.1 tsc へ切替、CI の `continue-on-error` を外す
3. `@typescript/native-preview` を devDependencies から削除
4. `typescript@5.9.3` は `compile-hybrid*.sh` が生存する限り維持(削除は別タスク)

## Phase B: tsrs への切替(検討)

**発動条件(すべて満たすこと):**

1. tsrs の dist-tag latest が `-beta` なしの stable(TS 7.1 GA 対応)になった
2. `npm run type-check:tsrs` が 30 日以上 CI で連続成功(観測 step で差分ゼロ)
3. Phase A 完了後(type-check の基準が 7.1 tsc であること)

**切替手順:** `type-check` を `tsrs --noEmit` に変更 → 7.1 tsc は `type-check:tsc` として退避 → CI 必須化 → 2 週間運用してから後戻り用スクリプト削除

## 観測データ(2026-10-30)

| コンパイラ | 壁時間 | 診断 |
|---|---|---|
| tsgo 7.0 | 0.22s | exit 0・エラー 0 件 |
| 7.1 beta tsc | 0.19s | exit 0・エラー 0 件(差分ゼロ) |
| tsrs 0.20.1 beta | 0.93s | exit 0・エラー 0 件(差分ゼロ) |

補足: 本リポジトリは小規模(型チェック対象が数百ファイル規模未満)のため tsrs の並列型チェックの恩恵が小さく、起動オーバーヘッドが支配的。tsrs の速度優位は大規模コードベースで発現する。切替判断は速度ではなく「ツールチェーンの将来性・メモリ効率・安定性」で行うこと
