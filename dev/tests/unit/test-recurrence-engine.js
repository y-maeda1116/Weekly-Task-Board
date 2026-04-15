/**
 * 繰り返しタスク生成エンジンのテストスイート
 * Node.js環境で実行可能
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
 * ユーティリティ関数
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * RecurrenceEngineクラスのテスト
 */
function testRecurrenceEngine() {
    // RecurrenceEngineクラスの実装
    class RecurrenceEngine {
        constructor() {
            this.RECURRENCE_PATTERNS = {
                'daily': { name: '毎日', interval: 1 },
                'weekly': { name: '毎週', interval: 7 },
                'monthly': { name: '毎月', interval: 30 }
            };
        }
        
        generateTaskFromRecurrence(recurringTask, targetDate) {
            if (!recurringTask.is_recurring || !recurringTask.recurrence_pattern) {
                return null;
            }
            
            if (recurringTask.recurrence_end_date) {
                const endDate = new Date(recurringTask.recurrence_end_date);
                endDate.setHours(0, 0, 0, 0);
                targetDate.setHours(0, 0, 0, 0);
                
                if (targetDate > endDate) {
                    return null;
                }
            }
            
            const newTask = {
                id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: recurringTask.name,
                estimated_time: recurringTask.estimated_time,
                actual_time: 0,
                priority: recurringTask.priority,
                category: recurringTask.category,
                assigned_date: formatDate(targetDate),
                due_date: null,
                details: recurringTask.details,
                completed: false,
                is_recurring: false,
                recurrence_pattern: null,
                recurrence_end_date: null
            };
            
            return newTask;
        }
        
        generateDailyTasks(recurringTask, startDate, endDate) {
            const generatedTasks = [];
            const currentDate = new Date(startDate);
            currentDate.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            
            while (currentDate <= end) {
                const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
                if (newTask) {
                    generatedTasks.push(newTask);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return generatedTasks;
        }
        
        generateWeeklyTasks(recurringTask, startDate, endDate) {
            const generatedTasks = [];
            const currentDate = new Date(startDate);
            currentDate.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            
            while (currentDate <= end) {
                const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
                if (newTask) {
                    generatedTasks.push(newTask);
                }
                currentDate.setDate(currentDate.getDate() + 7);
            }
            
            return generatedTasks;
        }
        
        generateMonthlyTasks(recurringTask, startDate, endDate) {
            const generatedTasks = [];
            const currentDate = new Date(startDate);
            currentDate.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            
            const startDay = currentDate.getDate();
            
            while (currentDate <= end) {
                const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
                if (newTask) {
                    generatedTasks.push(newTask);
                }
                
                // 月を進める（日付をリセットしてから月を進める）
                currentDate.setDate(1);
                currentDate.setMonth(currentDate.getMonth() + 1);
                
                // 月末の日付調整（例：1月31日 -> 2月28日）
                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                if (startDay > lastDayOfMonth) {
                    currentDate.setDate(lastDayOfMonth);
                } else {
                    currentDate.setDate(startDay);
                }
            }
            
            return generatedTasks;
        }
        
        updateRecurrenceEndDate(recurringTask, newEndDate) {
            if (!recurringTask.is_recurring) {
                console.warn('This task is not a recurring task');
                return false;
            }
            
            if (newEndDate) {
                const endDate = new Date(newEndDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (endDate < today) {
                    console.warn('End date cannot be in the past');
                    return false;
                }
            }
            
            recurringTask.recurrence_end_date = newEndDate || null;
            return true;
        }
        
        isRecurrenceActive(recurringTask) {
            if (!recurringTask.is_recurring) {
                return false;
            }
            
            if (recurringTask.recurrence_end_date) {
                const endDate = new Date(recurringTask.recurrence_end_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                return today <= endDate;
            }
            
            return true;
        }
        
        generateAllRecurringTasks(recurringTasks, startDate, endDate) {
            const allGeneratedTasks = [];
            
            recurringTasks.forEach(recurringTask => {
                if (!this.isRecurrenceActive(recurringTask)) {
                    return;
                }
                
                let generatedTasks = [];
                
                switch (recurringTask.recurrence_pattern) {
                    case 'daily':
                        generatedTasks = this.generateDailyTasks(recurringTask, startDate, endDate);
                        break;
                    case 'weekly':
                        generatedTasks = this.generateWeeklyTasks(recurringTask, startDate, endDate);
                        break;
                    case 'monthly':
                        generatedTasks = this.generateMonthlyTasks(recurringTask, startDate, endDate);
                        break;
                    default:
                        console.warn(`Unknown recurrence pattern: ${recurringTask.recurrence_pattern}`);
                }
                
                allGeneratedTasks.push(...generatedTasks);
            });
            
            return allGeneratedTasks;
        }
    }
    
    // テスト実行
    const engine = new RecurrenceEngine();
    
    // テスト1: 毎日パターンの生成 (8.1)
    runTest('8.1 毎日パターンの生成 - 3日間のタスク生成', () => {
        const recurringTask = {
            id: 'task-1',
            name: '毎日のレビュー',
            estimated_time: 1,
            priority: 'medium',
            category: 'review',
            details: '日次レビュー',
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_end_date: null
        };
        
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-03');
        
        const tasks = engine.generateDailyTasks(recurringTask, startDate, endDate);
        
        return tasks.length === 3 && 
               tasks[0].assigned_date === '2024-01-01' &&
               tasks[1].assigned_date === '2024-01-02' &&
               tasks[2].assigned_date === '2024-01-03';
    });
    
    // テスト2: 毎週パターンの生成 (8.2)
    runTest('8.2 毎週パターンの生成 - 4週間のタスク生成', () => {
        const recurringTask = {
            id: 'task-2',
            name: '週次ミーティング',
            estimated_time: 2,
            priority: 'high',
            category: 'meeting',
            details: '週次ミーティング',
            is_recurring: true,
            recurrence_pattern: 'weekly',
            recurrence_end_date: null
        };
        
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-29');
        
        const tasks = engine.generateWeeklyTasks(recurringTask, startDate, endDate);
        
        return tasks.length === 5 && 
               tasks[0].assigned_date === '2024-01-01' &&
               tasks[1].assigned_date === '2024-01-08' &&
               tasks[2].assigned_date === '2024-01-15';
    });
    
    // テスト3: 毎月パターンの生成 (8.3)
    runTest('8.3 毎月パターンの生成 - 3ヶ月のタスク生成', () => {
        const recurringTask = {
            id: 'task-3',
            name: '月次レポート',
            estimated_time: 4,
            priority: 'high',
            category: 'document',
            details: '月次レポート作成',
            is_recurring: true,
            recurrence_pattern: 'monthly',
            recurrence_end_date: null
        };
        
        const startDate = new Date('2024-01-15');
        const endDate = new Date('2024-03-15');
        
        const tasks = engine.generateMonthlyTasks(recurringTask, startDate, endDate);
        
        return tasks.length === 3 && 
               tasks[0].assigned_date === '2024-01-15' &&
               tasks[1].assigned_date === '2024-02-15' &&
               tasks[2].assigned_date === '2024-03-15';
    });
    
    // テスト4: 終了日の処理 (8.4) - 終了日内のタスク生成
    runTest('8.4 終了日の処理 - 終了日内のタスク生成', () => {
        const recurringTask = {
            id: 'task-4',
            name: '期間限定タスク',
            estimated_time: 1,
            priority: 'medium',
            category: 'task',
            details: '期間限定',
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_end_date: '2024-01-05'
        };
        
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-10');
        
        const tasks = engine.generateDailyTasks(recurringTask, startDate, endDate);
        
        return tasks.length === 5 && 
               tasks[tasks.length - 1].assigned_date === '2024-01-05';
    });
    
    // テスト5: 終了日の処理 - 終了日の更新
    runTest('8.4 終了日の処理 - 終了日の更新', () => {
        const recurringTask = {
            id: 'task-5',
            name: 'テストタスク',
            estimated_time: 1,
            priority: 'medium',
            category: 'task',
            details: 'テスト',
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_end_date: '2024-01-10'
        };
        
        // 未来の日付を使用
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureDateStr = formatDate(futureDate);
        
        const result = engine.updateRecurrenceEndDate(recurringTask, futureDateStr);
        
        return result === true && recurringTask.recurrence_end_date === futureDateStr;
    });
    
    // テスト6: 繰り返しタスクの有効性チェック
    runTest('繰り返しタスクの有効性チェック - 有効な繰り返しタスク', () => {
        const recurringTask = {
            id: 'task-6',
            name: 'アクティブなタスク',
            estimated_time: 1,
            priority: 'medium',
            category: 'task',
            details: 'テスト',
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_end_date: null
        };
        
        return engine.isRecurrenceActive(recurringTask) === true;
    });
    
    // テスト7: 複数の繰り返しタスクの一括生成
    runTest('複数の繰り返しタスクの一括生成', () => {
        const recurringTasks = [
            {
                id: 'task-7a',
                name: '毎日のタスク',
                estimated_time: 1,
                priority: 'medium',
                category: 'task',
                details: 'テスト',
                is_recurring: true,
                recurrence_pattern: 'daily',
                recurrence_end_date: null
            },
            {
                id: 'task-7b',
                name: '毎週のタスク',
                estimated_time: 2,
                priority: 'high',
                category: 'meeting',
                details: 'テスト',
                is_recurring: true,
                recurrence_pattern: 'weekly',
                recurrence_end_date: null
            }
        ];
        
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-14');
        
        const tasks = engine.generateAllRecurringTasks(recurringTasks, startDate, endDate);
        
        // 毎日: 14日間、毎週: 2回 = 16タスク
        return tasks.length === 16;
    });
    
    // テスト8: 月末の日付調整（1月31日 -> 2月29日）
    runTest('8.3 毎月パターンの生成 - 月末の日付調整', () => {
        const recurringTask = {
            id: 'task-8',
            name: '月末タスク',
            estimated_time: 1,
            priority: 'medium',
            category: 'task',
            details: 'テスト',
            is_recurring: true,
            recurrence_pattern: 'monthly',
            recurrence_end_date: null
        };
        
        const startDate = new Date('2024-01-31');
        const endDate = new Date('2024-03-31');
        
        const tasks = engine.generateMonthlyTasks(recurringTask, startDate, endDate);
        
        // 1月31日、2月29日（2024年はうるう年）、3月31日
        // ただし、月末調整のロジックを確認する必要がある
        return tasks.length === 3 && 
               tasks[0].assigned_date === '2024-01-31' &&
               tasks[1].assigned_date === '2024-02-29' &&
               tasks[2].assigned_date === '2024-03-31';
    });
}

// テスト実行
console.log('=== 繰り返しタスク生成エンジンのテスト開始 ===\n');
testRecurrenceEngine();

// テスト結果の表示
console.log('\n=== テスト結果 ===');
console.log(`合計: ${testResults.total}`);
console.log(`成功: ${testResults.passed}`);
console.log(`失敗: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed > 0) {
    console.log('\n=== 失敗したテスト ===');
    testResults.details.filter(d => d.includes('❌')).forEach(d => console.log(d));
    process.exit(1);
} else {
    console.log('\n✅ すべてのテストが成功しました！');
    process.exit(0);
}
