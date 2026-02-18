/**
 * 曜日表示設定機能のパフォーマンステスト
 * Node.js環境で実行可能
 */

// パフォーマンステスト結果を格納
let performanceResults = {
    tests: [],
    summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageTime: 0
    }
};

/**
 * パフォーマンステスト実行関数
 */
function runPerformanceTest(testName, testFunction, maxTime = 1000) {
    console.log(`🔄 実行中: ${testName}`);
    
    const startTime = performance.now();
    let result;
    let error = null;
    
    try {
        result = testFunction();
    } catch (e) {
        error = e;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const testResult = {
        name: testName,
        duration: duration,
        maxTime: maxTime,
        passed: !error && duration <= maxTime,
        error: error ? error.message : null,
        result: result
    };
    
    performanceResults.tests.push(testResult);
    performanceResults.summary.totalTests++;
    
    if (testResult.passed) {
        performanceResults.summary.passedTests++;
        console.log(`✅ ${testName}: ${duration.toFixed(2)}ms (制限: ${maxTime}ms)`);
    } else {
        performanceResults.summary.failedTests++;
        if (error) {
            console.log(`❌ ${testName}: エラー - ${error.message}`);
        } else {
            console.log(`❌ ${testName}: ${duration.toFixed(2)}ms > ${maxTime}ms (制限時間超過)`);
        }
    }
    
    return testResult;
}

/**
 * WeekdayManager クラスのモック実装（パフォーマンステスト用）
 */
class PerformanceWeekdayManager {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        this.weekdaySettings = {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
        };
    }
    
    toggleWeekday(dayName, visible) {
        if (this.dayNames.includes(dayName)) {
            this.weekdaySettings[dayName] = visible;
            return true;
        }
        return false;
    }
    
    getVisibleWeekdays() {
        return this.dayNames.filter(day => this.weekdaySettings[day]);
    }
    
    getHiddenWeekdays() {
        return this.dayNames.filter(day => !this.weekdaySettings[day]);
    }
    
    isWeekdayVisible(dayName) {
        return this.weekdaySettings[dayName] || false;
    }
    
    // 設定の保存をシミュレート
    saveSettings() {
        // LocalStorage操作のシミュレート
        const settingsData = JSON.stringify({
            weekday_visibility: this.weekdaySettings
        });
        // 実際の保存処理の代わりにデータサイズを返す
        return settingsData.length;
    }
    
    // 設定の読み込みをシミュレート
    loadSettings() {
        // LocalStorage読み込みのシミュレート
        const mockData = {
            weekday_visibility: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            }
        };
        
        this.weekdaySettings = { ...mockData.weekday_visibility };
        return mockData;
    }
}

/**
 * TaskBulkMover クラスのモック実装（パフォーマンステスト用）
 */
class PerformanceTaskBulkMover {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        
        // 大量のモックタスクを生成
        this.mockTasks = this.generateMockTasks(1000);
    }
    
    generateMockTasks(count) {
        const tasks = [];
        const categories = ['task', 'meeting', 'review', 'bugfix', 'document', 'research'];
        
        for (let i = 0; i < count; i++) {
            const date = new Date(2024, 0, 15 + (i % 7)); // 1週間分に分散
            tasks.push({
                id: `task-${i}`,
                name: `タスク ${i}`,
                assigned_date: this.formatDate(date),
                completed: Math.random() < 0.2, // 20%の確率で完了
                category: categories[i % categories.length],
                estimated_time: Math.floor(Math.random() * 8) + 1
            });
        }
        
        return tasks;
    }
    
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    getTasksForDate(dateString) {
        return this.mockTasks.filter(task => 
            task.assigned_date === dateString && !task.completed
        );
    }
    
    moveTasksToUnassigned(dateString) {
        let movedCount = 0;
        this.mockTasks.forEach(task => {
            if (task.assigned_date === dateString && !task.completed) {
                task.assigned_date = null;
                movedCount++;
            }
        });
        return movedCount;
    }
    
    // 大量タスクのフィルタリング
    filterTasksByCategory(category) {
        return this.mockTasks.filter(task => task.category === category);
    }
}

/**
 * 曜日切り替えの応答時間テスト
 */
function testWeekdayTogglePerformance() {
    const manager = new PerformanceWeekdayManager();
    const iterations = 100;
    
    // 複数回の切り替えを実行
    for (let i = 0; i < iterations; i++) {
        const dayName = manager.dayNames[i % 7];
        const visible = i % 2 === 0;
        manager.toggleWeekday(dayName, visible);
    }
    
    return `${iterations}回の曜日切り替えを実行`;
}

/**
 * 一括移動処理の時間テスト
 */
function testBulkMovePerformance() {
    const mover = new PerformanceTaskBulkMover();
    const testDate = '2024-01-15';
    
    // 指定日のタスク数を確認
    const tasksCount = mover.getTasksForDate(testDate).length;
    
    // 一括移動を実行
    const movedCount = mover.moveTasksToUnassigned(testDate);
    
    return `${tasksCount}個のタスクのうち${movedCount}個を一括移動`;
}

/**
 * 設定保存の時間テスト
 */
function testSettingsSavePerformance() {
    const manager = new PerformanceWeekdayManager();
    const iterations = 50;
    
    // 複数回の保存を実行
    for (let i = 0; i < iterations; i++) {
        // 設定を変更
        manager.toggleWeekday('saturday', i % 2 === 0);
        manager.toggleWeekday('sunday', i % 3 === 0);
        
        // 保存を実行
        manager.saveSettings();
    }
    
    return `${iterations}回の設定保存を実行`;
}

/**
 * 大量タスクのフィルタリング性能テスト
 */
function testLargeDatasetFiltering() {
    const mover = new PerformanceTaskBulkMover();
    const categories = ['task', 'meeting', 'review', 'bugfix', 'document', 'research'];
    
    let totalFiltered = 0;
    
    // 各カテゴリでフィルタリングを実行
    categories.forEach(category => {
        const filtered = mover.filterTasksByCategory(category);
        totalFiltered += filtered.length;
    });
    
    return `1000個のタスクから${categories.length}カテゴリでフィルタリング、合計${totalFiltered}個を処理`;
}

/**
 * UI更新のシミュレーション性能テスト
 */
function testUIUpdateSimulation() {
    const manager = new PerformanceWeekdayManager();
    const iterations = 20;
    
    // DOM操作のシミュレート
    const mockColumns = manager.dayNames.map(day => ({
        day: day,
        visible: true,
        classList: {
            add: () => {},
            remove: () => {},
            contains: (className) => className === 'hidden' ? !this.visible : false
        }
    }));
    
    // 複数回のUI更新をシミュレート
    for (let i = 0; i < iterations; i++) {
        const dayName = manager.dayNames[i % 7];
        const visible = i % 2 === 0;
        
        // 設定を更新
        manager.toggleWeekday(dayName, visible);
        
        // UI更新をシミュレート
        mockColumns.forEach((column, index) => {
            const columnDayName = manager.dayNames[index];
            const isVisible = manager.isWeekdayVisible(columnDayName);
            
            if (isVisible) {
                column.classList.remove('hidden');
                column.classList.add('showing');
            } else {
                column.classList.add('hiding');
                column.classList.add('hidden');
            }
        });
    }
    
    return `${iterations}回のUI更新シミュレーションを実行`;
}

/**
 * メモリ使用量の測定テスト
 */
function testMemoryUsage() {
    const initialMemory = process.memoryUsage();
    
    // 大量のオブジェクトを作成
    const managers = [];
    const movers = [];
    
    for (let i = 0; i < 10; i++) {
        managers.push(new PerformanceWeekdayManager());
        movers.push(new PerformanceTaskBulkMover());
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // メモリを解放
    managers.length = 0;
    movers.length = 0;
    
    return `メモリ使用量増加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`;
}

/**
 * 全パフォーマンステストを実行
 */
function runAllPerformanceTests() {
    console.log('=== 曜日表示設定機能 パフォーマンステスト開始 ===\n');
    
    // 各テストを実行（制限時間を設定）
    runPerformanceTest('曜日切り替えの応答時間', testWeekdayTogglePerformance, 500);
    runPerformanceTest('一括移動処理の時間', testBulkMovePerformance, 1000);
    runPerformanceTest('設定保存の時間', testSettingsSavePerformance, 100);
    runPerformanceTest('大量データのフィルタリング', testLargeDatasetFiltering, 200);
    runPerformanceTest('UI更新シミュレーション', testUIUpdateSimulation, 300);
    runPerformanceTest('メモリ使用量測定', testMemoryUsage, 1000);
    
    // 結果サマリーを計算
    const totalTime = performanceResults.tests.reduce((sum, test) => sum + test.duration, 0);
    performanceResults.summary.averageTime = totalTime / performanceResults.summary.totalTests;
    
    // 結果を表示
    console.log('\n=== パフォーマンステスト結果サマリー ===');
    console.log(`総テスト数: ${performanceResults.summary.totalTests}`);
    console.log(`成功: ${performanceResults.summary.passedTests}`);
    console.log(`失敗: ${performanceResults.summary.failedTests}`);
    console.log(`平均実行時間: ${performanceResults.summary.averageTime.toFixed(2)}ms`);
    console.log(`成功率: ${((performanceResults.summary.passedTests / performanceResults.summary.totalTests) * 100).toFixed(1)}%`);
    
    if (performanceResults.summary.failedTests === 0) {
        console.log('\n🎉 すべてのパフォーマンステストが成功しました！');
        console.log('曜日表示設定機能は要求されたパフォーマンス基準を満たしています。');
    } else {
        console.log('\n⚠️ 一部のパフォーマンステストが失敗しました。');
        console.log('パフォーマンスの最適化が必要な可能性があります。');
    }
    
    // 詳細結果
    console.log('\n=== 詳細結果 ===');
    performanceResults.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${test.duration.toFixed(2)}ms (制限: ${test.maxTime}ms)`);
        if (test.result) {
            console.log(`   ${test.result}`);
        }
        if (test.error) {
            console.log(`   エラー: ${test.error}`);
        }
    });
    
    return performanceResults;
}

// メイン実行部分
if (require.main === module) {
    runAllPerformanceTests();
}

// エクスポート
module.exports = {
    runAllPerformanceTests,
    performanceResults,
    PerformanceWeekdayManager,
    PerformanceTaskBulkMover
};