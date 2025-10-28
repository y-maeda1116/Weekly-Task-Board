/**
 * カテゴリ機能実装検証スクリプト
 * ブラウザ環境で実際のscript.jsの実装をテストします
 */

// 検証結果を格納
let validationResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: [],
    errors: []
};

/**
 * 検証実行関数
 */
function runValidation(validationName, validationFunction) {
    validationResults.total++;
    try {
        const result = validationFunction();
        if (result === true) {
            validationResults.passed++;
            validationResults.details.push(`✅ ${validationName}: 検証成功`);
            console.log(`✅ ${validationName}: 検証成功`);
            return true;
        } else {
            validationResults.failed++;
            validationResults.details.push(`❌ ${validationName}: ${result}`);
            console.log(`❌ ${validationName}: ${result}`);
            return false;
        }
    } catch (error) {
        validationResults.failed++;
        validationResults.errors.push(`${validationName}: ${error.message}`);
        validationResults.details.push(`❌ ${validationName}: エラー - ${error.message}`);
        console.error(`❌ ${validationName}: エラー - ${error.message}`);
        return false;
    }
}

/**
 * 1. カテゴリ定数の存在確認
 */
function validateCategoryConstants() {
    if (typeof TASK_CATEGORIES === 'undefined') {
        return 'TASK_CATEGORIES定数が定義されていません';
    }

    const requiredCategories = ['task', 'meeting', 'review', 'bugfix', 'document', 'research'];
    for (const category of requiredCategories) {
        if (!TASK_CATEGORIES[category]) {
            return `必要なカテゴリ '${category}' が定義されていません`;
        }
        
        const categoryDef = TASK_CATEGORIES[category];
        if (!categoryDef.name || !categoryDef.color || !categoryDef.bgColor) {
            return `カテゴリ '${category}' の定義が不完全です (name, color, bgColor が必要)`;
        }
    }

    return true;
}

/**
 * 2. カテゴリ関連関数の存在確認
 */
function validateCategoryFunctions() {
    const requiredFunctions = [
        'validateCategory',
        'getCategoryInfo',
        'shouldDisplayTask',
        'verifyCategoryData'
    ];

    for (const funcName of requiredFunctions) {
        if (typeof window[funcName] !== 'function') {
            return `必要な関数 '${funcName}' が定義されていません`;
        }
    }

    return true;
}

/**
 * 3. validateCategory関数の動作確認
 */
function validateCategoryFunction() {
    if (typeof validateCategory !== 'function') {
        return 'validateCategory関数が存在しません';
    }

    // 有効なカテゴリのテスト
    if (validateCategory('meeting') !== 'meeting') {
        return '有効なカテゴリ "meeting" の検証に失敗';
    }

    // 無効なカテゴリのテスト
    if (validateCategory('invalid_category') !== 'task') {
        return '無効なカテゴリのフォールバックに失敗';
    }

    // null/undefinedのテスト
    if (validateCategory(null) !== 'task') {
        return 'nullカテゴリのフォールバックに失敗';
    }

    if (validateCategory(undefined) !== 'task') {
        return 'undefinedカテゴリのフォールバックに失敗';
    }

    return true;
}

/**
 * 4. getCategoryInfo関数の動作確認
 */
function validateGetCategoryInfo() {
    if (typeof getCategoryInfo !== 'function') {
        return 'getCategoryInfo関数が存在しません';
    }

    // 有効なカテゴリの情報取得
    const meetingInfo = getCategoryInfo('meeting');
    if (!meetingInfo || !meetingInfo.name || !meetingInfo.color) {
        return 'カテゴリ情報の取得に失敗';
    }

    if (meetingInfo.name !== '打ち合わせ') {
        return 'カテゴリ名が正しくありません';
    }

    // 無効なカテゴリの情報取得（デフォルトにフォールバック）
    const invalidInfo = getCategoryInfo('invalid_category');
    if (!invalidInfo || invalidInfo.name !== 'タスク') {
        return '無効なカテゴリのデフォルト情報取得に失敗';
    }

    return true;
}

/**
 * 5. shouldDisplayTask関数の動作確認
 */
function validateShouldDisplayTask() {
    if (typeof shouldDisplayTask !== 'function') {
        return 'shouldDisplayTask関数が存在しません';
    }

    const testTask = { id: '1', name: 'Test Task', category: 'meeting' };

    // フィルターなしの場合
    if (!shouldDisplayTask(testTask)) {
        return 'フィルターなしでタスクが表示されない';
    }

    // 一致するフィルターの場合
    if (!shouldDisplayTask(testTask, 'meeting')) {
        return '一致するカテゴリフィルターでタスクが表示されない';
    }

    // 一致しないフィルターの場合
    if (shouldDisplayTask(testTask, 'review')) {
        return '一致しないカテゴリフィルターでタスクが表示される';
    }

    return true;
}

/**
 * 6. LocalStorageのカテゴリ情報保存確認
 */
function validateLocalStorageIntegration() {
    // テストデータを作成
    const testTasks = [
        { id: 'test-1', name: 'Test Task 1', category: 'meeting', estimated_time: 2 },
        { id: 'test-2', name: 'Test Task 2', category: 'review', estimated_time: 1 },
        { id: 'test-3', name: 'Test Task 3', category: 'invalid_category', estimated_time: 3 }
    ];

    // saveTasks関数が存在するかチェック
    if (typeof saveTasks !== 'function') {
        return 'saveTasks関数が存在しません';
    }

    // loadTasks関数が存在するかチェック
    if (typeof loadTasks !== 'function') {
        return 'loadTasks関数が存在しません';
    }

    // 元のタスクデータをバックアップ
    const originalTasks = typeof tasks !== 'undefined' ? [...tasks] : [];

    try {
        // テストデータを設定
        if (typeof tasks !== 'undefined') {
            tasks.length = 0;
            tasks.push(...testTasks);
        }

        // 保存実行
        saveTasks();

        // 読み込み実行
        const loadedTasks = loadTasks();

        // カテゴリ情報が保持されているかチェック
        const meetingTask = loadedTasks.find(task => task.name === 'Test Task 1');
        if (!meetingTask || meetingTask.category !== 'meeting') {
            return 'カテゴリ情報の保存・読み込みに失敗';
        }

        // 無効なカテゴリが修正されているかチェック
        const invalidTask = loadedTasks.find(task => task.name === 'Test Task 3');
        if (!invalidTask || invalidTask.category !== 'task') {
            return '無効なカテゴリの自動修正に失敗';
        }

        return true;

    } finally {
        // 元のデータを復元
        if (typeof tasks !== 'undefined') {
            tasks.length = 0;
            tasks.push(...originalTasks);
            saveTasks();
        }
    }
}

/**
 * 7. エクスポート機能のカテゴリ対応確認
 */
function validateExportFunctionality() {
    if (typeof exportData !== 'function') {
        return 'exportData関数が存在しません';
    }

    // エクスポート関数の実装を文字列として取得
    const exportFuncStr = exportData.toString();

    // カテゴリ情報が含まれているかチェック
    if (!exportFuncStr.includes('categoriesIncluded')) {
        return 'エクスポート機能にcategoriesIncludedフラグが含まれていません';
    }

    return true;
}

/**
 * 8. インポート機能のカテゴリ検証確認
 */
function validateImportFunctionality() {
    if (typeof importData !== 'function') {
        return 'importData関数が存在しません';
    }

    // インポート関数の実装を文字列として取得
    const importFuncStr = importData.toString();

    // カテゴリ検証が含まれているかチェック
    if (!importFuncStr.includes('validateCategory')) {
        return 'インポート機能にカテゴリ検証が含まれていません';
    }

    return true;
}

/**
 * 9. UI要素の存在確認
 */
function validateUIElements() {
    // カテゴリ選択フィールドの存在確認
    const categorySelect = document.getElementById('task-category');
    if (!categorySelect) {
        return 'タスクカテゴリ選択フィールドが存在しません';
    }

    // カテゴリフィルターの存在確認
    const filterSelect = document.getElementById('filter-category');
    if (!filterSelect) {
        return 'カテゴリフィルター選択フィールドが存在しません';
    }

    // カテゴリオプションの確認
    const categoryOptions = categorySelect.querySelectorAll('option');
    if (categoryOptions.length < 6) {
        return 'カテゴリ選択肢が不足しています';
    }

    // フィルターオプションの確認
    const filterOptions = filterSelect.querySelectorAll('option');
    if (filterOptions.length < 7) { // 「すべて表示」+ 6カテゴリ
        return 'カテゴリフィルター選択肢が不足しています';
    }

    return true;
}

/**
 * 10. カテゴリデータ検証機能の確認
 */
function validateDataVerification() {
    if (typeof verifyCategoryData !== 'function') {
        return 'verifyCategoryData関数が存在しません';
    }

    // 関数の実装を文字列として取得
    const verifyFuncStr = verifyCategoryData.toString();

    // 必要な処理が含まれているかチェック
    if (!verifyFuncStr.includes('validateCategory')) {
        return 'データ検証機能にvalidateCategory呼び出しが含まれていません';
    }

    if (!verifyFuncStr.includes('saveTasks') || !verifyFuncStr.includes('saveArchivedTasks')) {
        return 'データ検証機能に保存処理が含まれていません';
    }

    return true;
}

/**
 * メイン検証実行
 */
function runAllValidations() {
    console.log('=== カテゴリ機能実装検証開始 ===\n');

    // 各検証を実行
    runValidation('カテゴリ定数の存在確認', validateCategoryConstants);
    runValidation('カテゴリ関数の存在確認', validateCategoryFunctions);
    runValidation('validateCategory関数の動作確認', validateCategoryFunction);
    runValidation('getCategoryInfo関数の動作確認', validateGetCategoryInfo);
    runValidation('shouldDisplayTask関数の動作確認', validateShouldDisplayTask);
    runValidation('LocalStorage統合の確認', validateLocalStorageIntegration);
    runValidation('エクスポート機能の確認', validateExportFunctionality);
    runValidation('インポート機能の確認', validateImportFunctionality);
    runValidation('UI要素の存在確認', validateUIElements);
    runValidation('データ検証機能の確認', validateDataVerification);

    // 結果サマリー
    console.log('\n=== 検証結果サマリー ===');
    console.log(`総検証数: ${validationResults.total}`);
    console.log(`成功: ${validationResults.passed}`);
    console.log(`失敗: ${validationResults.failed}`);
    console.log(`成功率: ${((validationResults.passed / validationResults.total) * 100).toFixed(1)}%`);

    if (validationResults.failed === 0) {
        console.log('\n🎉 すべての検証が成功しました！');
        console.log('カテゴリ機能は正常に実装されています。');
    } else {
        console.log('\n⚠️ 一部の検証が失敗しました。');
        console.log('失敗した検証項目:');
        validationResults.details.filter(detail => detail.includes('❌')).forEach(detail => {
            console.log(`  ${detail}`);
        });
    }

    if (validationResults.errors.length > 0) {
        console.log('\n🚨 エラーが発生した検証項目:');
        validationResults.errors.forEach(error => {
            console.log(`  ${error}`);
        });
    }

    return validationResults;
}

/**
 * ページ読み込み後に自動実行
 */
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // 少し遅延させてscript.jsの初期化を待つ
        setTimeout(() => {
            runAllValidations();
        }, 1000);
    });
}

// Node.js環境での実行サポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllValidations,
        validationResults
    };
}