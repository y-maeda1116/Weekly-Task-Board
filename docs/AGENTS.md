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
        -   `priority`: `string` - 優先度（high, medium, low）
        -   `category`: `string` - カテゴリ（task, meeting, review, bugfix, document, research）
        -   `assigned_date`: `string` (`YYYY-MM-DD`) or `null` - 割り当てられた日付。`null`の場合は未割り当て。
        -   `due_date`: `string` (`YYYY-MM-DDTHH:mm`) or `null` - 期限
        -   `details`: `string` - 詳細メモ
        -   `completed`: `boolean` - 完了状態
    -   この状態は、`localStorage`の`weekly-task-board.tasks`キーにJSON形式で保存されます。
    -   `saveTasks()`関数で保存し、`loadTasks()`関数で読み込みます。

-   **`settings`**: `Object`
    -   アプリケーションの設定を格納するオブジェクトです。
    -   現在のところ、以下のキーを持ちます:
        -   `ideal_daily_minutes`: `number` - 1日の理想稼働時間（分単位）
        -   `weekday_visibility`: `Object` - 曜日表示設定
            -   `monday`: `boolean` - 月曜日の表示状態
            -   `tuesday`: `boolean` - 火曜日の表示状態
            -   `wednesday`: `boolean` - 水曜日の表示状態
            -   `thursday`: `boolean` - 木曜日の表示状態
            -   `friday`: `boolean` - 金曜日の表示状態
            -   `saturday`: `boolean` - 土曜日の表示状態
            -   `sunday`: `boolean` - 日曜日の表示状態
    -   この状態は、`localStorage`の`weekly-task-board.settings`キーにJSON形式で保存されます。
    -   `saveSettings()`関数で保存し、`loadSettings()`関数で読み込みます。

## 3. 主要な関数とロジック

-   **`renderWeek()`**:
    -   アプリケーションの心臓部となる関数です。
    -   現在の週のタスクボード全体を再描画します。
    -   `tasks`配列を元に、各曜日のカラムと未割り当てリストにタスク要素を配置します。
    -   日々の合計作業時間を計算し、表示を更新します。
    -   曜日表示設定を考慮して、非表示の曜日は描画をスキップします。
    -   タスクの追加、編集、移動、削除の後は、必ずこの関数を呼び出してUIを最新の状態に保ちます。

-   **`getMonday(d)`**:
    -   与えられた日付`d`が含まれる週の月曜日の`Date`オブジェクトを返します。
    -   週の基点となる日付を計算するために不可欠です。

-   **ドラッグ＆ドロップ (D&D) の処理**:
    -   `handleDragStart`, `handleDragEnd`, `handleDragOver`, `handleDragLeave`, `handleDrop`の各関数で実装されています。
    -   `handleDrop`が呼ばれると、タスクの`assigned_date`が更新され、`saveTasks()`が呼ばれた後、`renderWeek()`によってUIが更新されます。
    -   非表示の曜日列へのドロップは防止されます。

-   **曜日表示設定機能**:
    -   `WeekdayManager`クラス: 曜日の表示/非表示状態を管理
    -   `TaskBulkMover`クラス: 特定の日のタスクを一括で移動
    -   `updateWeekdayVisibility()`: 曜日列の表示/非表示をアニメーション付きで切り替え
    -   `initializeContextMenu()`: 右クリックメニューでの一括操作を提供

-   **カテゴリ機能**:
    -   `TASK_CATEGORIES`: カテゴリ定義（名前、色、背景色）
    -   `getCategoryInfo()`: カテゴリ情報を取得
    -   `validateCategory()`: カテゴリ値の検証とフォールバック
    -   `shouldDisplayTask()`: カテゴリフィルターに基づくタスク表示判定

-   **データのエクスポート/インポート**:
    -   `exportData()`: `tasks`と`settings`をJSONファイルとしてダウンロードします。
    -   `importData()`: ユーザーが選択したJSONファイルを読み込み、現在の状態を上書きします。

## 4. 開発時の注意点

-   **状態の変更**: `tasks`や`settings`オブジェクトを直接変更した後は、必ず対応する`saveTasks()`や`saveSettings()`を呼び出してローカルストレージに永続化してください。
-   **UIの更新**: 状態を変更してUIに反映させる必要がある場合は、`renderWeek()`を呼び出してください。
-   **日付の扱い**:
    -   タスクの`assigned_date`は`YYYY-MM-DD`形式の文字列で管理されています。
    -   日付の比較や計算を行う際は、`new Date()`で`Date`オブジェクトに変換して行い、タイムゾーンの問題を避けるために`setHours(0, 0, 0, 0)`で時刻をリセットすることが推奨されます。
-   **曜日表示設定**: 
    -   曜日を非表示にすると、その曜日のタスクは自動的に未割り当てエリアに移動します。
    -   `weekdayManager`インスタンスを通じて曜日設定を管理してください。
-   **カテゴリ管理**:
    -   新しいタスクには必ずカテゴリを設定してください（デフォルト: 'task'）。
    -   不正なカテゴリ値は自動的にデフォルトにフォールバックされます。
-   **新規機能の追加**: 新しい機能を追加する際は、既存の関数や状態管理の仕組みを再利用することを検討してください。特に、UIの更新は`renderWeek()`に集約させることが望ましいです。

## 5. テスト

-   **単体テスト**: `test-weekday-functionality.js` - WeekdayManagerとTaskBulkMoverクラスのテスト
-   **統合テスト**: `test-weekday-integration.html` - UI操作と機能の統合テスト
-   **パフォーマンステスト**: `test-weekday-performance.js` - 応答時間とメモリ使用量のテスト
-   **カテゴリ機能テスト**: `test-category-functionality.js` - カテゴリ機能の動作テスト

## 6. アクセシビリティ

-   スクリーンリーダー対応のARIAラベル
-   キーボードナビゲーション対応
-   フォーカス管理
-   適切なセマンティックHTML構造