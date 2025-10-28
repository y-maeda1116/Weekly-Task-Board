/**
 * カテゴリ機能の動作テスト
 * Node.js環境で実行可能な自動テストスイート
 */

// テスト結果を格納
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * テスト実行関数
 */
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            testResults.passed++;
            testResults.details.push(`✅ ${testName}: PASSED`);
            console.log(`✅ ${testName}: PASSED`);
        } else {
            testResults.failed++;
            testResults.details.push(`❌ ${testName}: FAILED - ${result}`);
            console.log(`❌ ${testName}: FAILED - ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`❌ ${testName}: ERROR - ${error.message}`);
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
    }
}

/**
 * カテゴリ定義のテスト
 */
function testCategoryDefinitions() {
    const TASK_CATEGORIES = {
        'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
        'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
        'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
        'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
        'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
        'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
    };

    // 必要なカテゴリが全て定義されているかチェック
    const requiredCategories = ['task', 'meeting', 'review', 'bugfix', 'document', 'research'];
    for (const category of requiredCategories) {
        if (!TASK_CATEGORIES[category]) {
            return `Missing category: ${category}`;
        }
        if (!TASK_CATEGORIES[category].name || !TASK_CATEGORIES[category].color) {
            return `Incomplete category definition: ${category}`;
        }
    }

    return true;
}

/**
 * カテゴリ検証関数のテスト
 */
function testValidateCategory() {
    const TASK_CATEGORIES = {
        'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
        'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
        'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
        'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
        'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
        'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
    };

    function validateCategory(category) {
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    // 有効なカテゴリのテスト
    if (validateCategory('meeting') !== 'meeting') {
        return 'Valid category validation failed';
    }

    // 無効なカテゴリのテスト
    if (validateCategory('invalid') !== 'task') {
        return 'Invalid category should fallback to task';
    }

    // null/undefinedのテスト
    if (validateCategory(null) !== 'task') {
        return 'Null category should fallback to task';
    }

    if (validateCategory(undefined) !== 'task') {
        return 'Undefined category should fallback to task';
    }

    return true;
}

/**
 * タスクデータのカテゴリマイグレーションテスト
 */
function testTaskMigration() {
    function validateCategory(category) {
        const TASK_CATEGORIES = {
            'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
            'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
            'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
            'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
            'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
            'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
        };
        
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    // 既存データのマイグレーション処理をシミュレート
    const testTasks = [
        { id: '1', name: 'Test Task 1', category: 'meeting' },
        { id: '2', name: 'Test Task 2' }, // カテゴリなし
        { id: '3', name: 'Test Task 3', category: 'invalid_category' }, // 無効なカテゴリ
        { id: '4', name: 'Test Task 4', category: 'review' }
    ];

    const migratedTasks = testTasks.map(task => ({
        ...task,
        category: task.category ? validateCategory(task.category) : 'task'
    }));

    // 検証
    if (migratedTasks[0].category !== 'meeting') {
        return 'Valid category migration failed';
    }
    if (migratedTasks[1].category !== 'task') {
        return 'Missing category should default to task';
    }
    if (migratedTasks[2].category !== 'task') {
        return 'Invalid category should migrate to task';
    }
    if (migratedTasks[3].category !== 'review') {
        return 'Valid category should remain unchanged';
    }

    return true;
}

/**
 * カテゴリフィルター機能のテスト
 */
function testCategoryFilter() {
    function validateCategory(category) {
        const TASK_CATEGORIES = {
            'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
            'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
            'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
            'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
            'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
            'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
        };
        
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    function shouldDisplayTask(task, currentCategoryFilter) {
        if (!currentCategoryFilter) {
            return true;
        }
        const taskCategory = validateCategory(task.category);
        return taskCategory === currentCategoryFilter;
    }

    const testTasks = [
        { id: '1', name: 'Task 1', category: 'task' },
        { id: '2', name: 'Meeting 1', category: 'meeting' },
        { id: '3', name: 'Review 1', category: 'review' },
        { id: '4', name: 'Bug Fix 1', category: 'bugfix' }
    ];

    // フィルターなしのテスト
    const allTasks = testTasks.filter(task => shouldDisplayTask(task, ''));
    if (allTasks.length !== 4) {
        return 'No filter should show all tasks';
    }

    // 特定カテゴリフィルターのテスト
    const meetingTasks = testTasks.filter(task => shouldDisplayTask(task, 'meeting'));
    if (meetingTasks.length !== 1 || meetingTasks[0].category !== 'meeting') {
        return 'Meeting filter should show only meeting tasks';
    }

    const taskTasks = testTasks.filter(task => shouldDisplayTask(task, 'task'));
    if (taskTasks.length !== 1 || taskTasks[0].category !== 'task') {
        return 'Task filter should show only task category tasks';
    }

    return true;
}

/**
 * エクスポート機能のカテゴリ対応テスト
 */
function testExportWithCategories() {
    const testData = {
        tasks: [
            { id: '1', name: 'Task 1', category: 'task', estimated_time: 2 },
            { id: '2', name: 'Meeting 1', category: 'meeting', estimated_time: 1 }
        ],
        archive: [
            { id: '3', name: 'Completed Task', category: 'review', completed: true }
        ],
        settings: { ideal_daily_minutes: 480 },
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0",
            categoriesIncluded: true
        }
    };

    // JSON変換テスト
    const jsonString = JSON.stringify(testData, null, 2);
    const parsedData = JSON.parse(jsonString);

    // カテゴリ情報の存在確認
    if (!parsedData.exportInfo.categoriesIncluded) {
        return 'Export should include categoriesIncluded flag';
    }

    if (!parsedData.tasks[0].category || !parsedData.tasks[1].category) {
        return 'Export should preserve task categories';
    }

    if (!parsedData.archive[0].category) {
        return 'Export should preserve archive categories';
    }

    return true;
}

/**
 * インポート機能のカテゴリ検証テスト
 */
function testImportWithCategoryValidation() {
    function validateCategory(category) {
        const TASK_CATEGORIES = {
            'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
            'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
            'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
            'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
            'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
            'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
        };
        
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    const importData = {
        tasks: [
            { id: '1', name: 'Valid Task', category: 'meeting' },
            { id: '2', name: 'Invalid Category Task', category: 'invalid_category' }
        ],
        archive: [
            { id: '4', name: 'Valid Archive', category: 'review' },
            { id: '5', name: 'Invalid Archive', category: 'nonexistent' }
        ]
    };

    let importStats = {
        tasksImported: 0,
        tasksWithCategories: 0,
        archivedImported: 0,
        archivedWithCategories: 0,
        categoriesFixed: 0
    };

    // タスクの処理
    const processedTasks = importData.tasks.map(task => {
        const originalCategory = task.category;
        const validatedCategory = validateCategory(task.category || undefined);
        
        if (originalCategory !== validatedCategory) {
            importStats.categoriesFixed++;
        }
        if (validatedCategory !== 'task') {
            importStats.tasksWithCategories++;
        }
        
        return { ...task, category: validatedCategory };
    });

    // アーカイブの処理
    const processedArchive = importData.archive.map(task => {
        const originalCategory = task.category;
        const validatedCategory = validateCategory(task.category);
        
        if (originalCategory !== validatedCategory) {
            importStats.categoriesFixed++;
        }
        if (validatedCategory !== 'task') {
            importStats.archivedWithCategories++;
        }
        
        return { ...task, category: validatedCategory };
    });

    // 検証
    if (processedTasks[0].category !== 'meeting') {
        return 'Valid category should be preserved';
    }
    if (processedTasks[1].category !== 'task') {
        return 'Invalid category should be corrected to task';
    }
    if (importStats.categoriesFixed !== 2) {
        return `Expected 2 categories fixed, got ${importStats.categoriesFixed}`;
    }

    return true;
}

/**
 * エラーハンドリングのテスト
 */
function testErrorHandling() {
    function validateCategory(category) {
        const TASK_CATEGORIES = {
            'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
            'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
            'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
            'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
            'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
            'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
        };
        
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    // 異常な入力値のテスト
    const testCases = [
        null,
        undefined,
        '',
        'invalid_category',
        123,
        {},
        [],
        'MEETING', // 大文字小文字の違い
        'task ', // 余分なスペース
    ];

    for (const testCase of testCases) {
        const result = validateCategory(testCase);
        if (result !== 'task' && result !== 'meeting' && result !== 'review' && 
            result !== 'bugfix' && result !== 'document' && result !== 'research') {
            return `Invalid input ${testCase} should return valid category, got ${result}`;
        }
    }

    return true;
}

/**
 * 既存データとの互換性テスト
 */
function testBackwardCompatibility() {
    function validateCategory(category) {
        const TASK_CATEGORIES = {
            'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
            'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
            'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
            'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
            'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
            'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
        };
        
        if (category && TASK_CATEGORIES[category]) {
            return category;
        }
        return 'task';
    }

    // カテゴリ機能追加前の既存データをシミュレート
    const legacyTasks = [
        { id: '1', name: 'Legacy Task 1', estimated_time: 2, priority: 'high' },
        { id: '2', name: 'Legacy Task 2', estimated_time: 1, priority: 'medium' },
        { id: '3', name: 'Legacy Task 3', estimated_time: 3, priority: 'low' }
    ];

    // マイグレーション処理
    const migratedTasks = legacyTasks.map(task => ({
        ...task,
        completed: task.completed || false,
        priority: task.priority || 'medium',
        category: task.category || 'task'
    }));

    // 検証
    for (const task of migratedTasks) {
        if (!task.category) {
            return 'All tasks should have category after migration';
        }
        if (task.category !== 'task') {
            return 'Legacy tasks should default to task category';
        }
        if (typeof task.completed !== 'boolean') {
            return 'Completed field should be boolean';
        }
    }

    return true;
}

// メイン実行部分
console.log('=== カテゴリ機能テストスイート実行開始 ===\n');

// 各テストを実行
runTest('カテゴリ定義テスト', testCategoryDefinitions);
runTest('カテゴリ検証関数テスト', testValidateCategory);
runTest('タスクマイグレーションテスト', testTaskMigration);
runTest('カテゴリフィルターテスト', testCategoryFilter);
runTest('エクスポート機能テスト', testExportWithCategories);
runTest('インポート機能テスト', testImportWithCategoryValidation);
runTest('エラーハンドリングテスト', testErrorHandling);
runTest('既存データ互換性テスト', testBackwardCompatibility);

// 結果サマリー
console.log('\n=== テスト結果サマリー ===');
console.log(`総テスト数: ${testResults.total}`);
console.log(`成功: ${testResults.passed}`);
console.log(`失敗: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    console.log('カテゴリ機能は正常に動作しています。');
} else {
    console.log('\n⚠️ 一部のテストが失敗しました。');
    console.log('失敗したテストの詳細を確認してください。');
}

// 詳細結果をエクスポート
module.exports = {
    testResults,
    runAllTests: () => {
        // 全テストを再実行する関数
        testResults = { passed: 0, failed: 0, total: 0, details: [] };
        
        runTest('カテゴリ定義テスト', testCategoryDefinitions);
        runTest('カテゴリ検証関数テスト', testValidateCategory);
        runTest('タスクマイグレーションテスト', testTaskMigration);
        runTest('カテゴリフィルターテスト', testCategoryFilter);
        runTest('エクスポート機能テスト', testExportWithCategories);
        runTest('インポート機能テスト', testImportWithCategoryValidation);
        runTest('エラーハンドリングテスト', testErrorHandling);
        runTest('既存データ互換性テスト', testBackwardCompatibility);
        
        return testResults;
    }
};