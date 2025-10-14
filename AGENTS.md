# AGENTS.md - 開発者向けガイド

このドキュメントは、`ウィークリータスクボード`の技術的な詳細と開発上の規約をまとめたものです。

## 1. コード構造

-   **`index.html`**: アプリケーションの基本的なHTML構造を定義します。タスクボードのレイアウト、モーダルウィンドウ、各種ボタンなどが含まれます。
-   **`style.css`**: アプリケーションのスタイリングを担当します。タスク、カラム、モーダルなどの見た目を定義しています。
-   **`script.js`**: アプリケーションのすべてのロジックを格納する、バニラJavaScriptファイルです。

## 2. 状態管理

アプリケーションの状態は、2つのグローバル変数とローカルストレージによって管理されます。

-   **`tasks`**: `Array<Object>`
    -   すべてのタスクを格納する配列です。
    -   各タスクオブジェクトは以下のキーを持ちます:
        -   `id`: `string` - ユニークなID
        -   `name`: `string` - タスク名
        -   `estimated_time`: `number` - 見積もり時間（時間単位）
        -   `assigned_date`: `string` (`YYYY-MM-DD`) or `null` - 割り当てられた日付。`null`の場合は未割り当て。
        -   `due_date`: `string` (`YYYY-MM-DDTHH:mm`) or `null` - 期限
        -   `details`: `string` - 詳細メモ
        -   `completed`: `boolean` - 完了状態
    -   この状態は、`localStorage`の`weekly-task-board.tasks`キーにJSON形式で保存されます。
    -   `saveTasks()`関数で保存し、`loadTasks()`関数で読み込みます。

-   **`settings`**: `Object`
    -   アプリケーションの設定を格納するオブジェクトです。
    -   現在のところ、以下のキーを持ちます:
        -   `ideal_daily_minutes`: `number` - 1日の理想稼働時間（分単位）。
    -   この状態は、`localStorage`の`weekly-task-board.settings`キーにJSON形式で保存されます。
    -   `saveSettings()`関数で保存し、`loadSettings()`関数で読み込みます。

## 3. 主要な関数とロジック

-   **`renderWeek()`**:
    -   アプリケーションの心臓部となる関数です。
    -   現在の週のタスクボード全体を再描画します。
    -   `tasks`配列を元に、各曜日のカラムと未割り当てリストにタスク要素を配置します。
    -   日々の合計作業時間を計算し、表示を更新します。
    -   タスクの追加、編集、移動、削除の後は、必ずこの関数を呼び出してUIを最新の状態に保ちます。

-   **`getMonday(d)`**:
    -   与えられた日付`d`が含まれる週の月曜日の`Date`オブジェクトを返します。
    -   週の基点となる日付を計算するために不可欠です。

-   **ドラッグ＆ドロップ (D&D) の処理**:
    -   `handleDragStart`, `handleDragEnd`, `handleDragOver`, `handleDragLeave`, `handleDrop`の各関数で実装されています。
    -   `handleDrop`が呼ばれると、タスクの`assigned_date`が更新され、`saveTasks()`が呼ばれた後、`renderWeek()`によってUIが更新されます。

-   **データのエクスポート/インポート**:
    -   `exportData()`: `tasks`と`settings`をJSONファイルとしてダウンロードします。
    -   `importData()`: ユーザーが選択したJSONファイルを読み込み、現在の状態を上書きします。

## 4. 開発時の注意点

-   **状態の変更**: `tasks`や`settings`オブジェクトを直接変更した後は、必ず対応する`saveTasks()`や`saveSettings()`を呼び出してローカルストレージに永続化してください。
-   **UIの更新**: 状態を変更してUIに反映させる必要がある場合は、`renderWeek()`を呼び出してください。
-   **日付の扱い**:
    -   タスクの`assigned_date`は`YYYY-MM-DD`形式の文字列で管理されています。
    -   日付の比較や計算を行う際は、`new Date()`で`Date`オブジェクトに変換して行い、タイムゾーンの問題を避けるために`setHours(0, 0, 0, 0)`で時刻をリセットすることが推奨されます。
-   **新規機能の追加**: 新しい機能を追加する際は、既存の関数や状態管理の仕組みを再利用することを検討してください。特に、UIの更新は`renderWeek()`に集約させることが望ましいです。