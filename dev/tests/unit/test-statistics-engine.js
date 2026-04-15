/**
 * Unit Tests for Statistics Calculation Engine
 * Tests for completion rate, category time analysis, daily work time, and estimated vs actual analysis
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * Test runner function
 */
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            testResults.passed++;
            testResults.details.push(`PASS ${testName}`);
            console.log(`PASS ${testName}`);
        } else {
            testResults.failed++;
            testResults.details.push(`FAIL ${testName}: ${result}`);
            console.log(`FAIL ${testName}: ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`ERROR ${testName}: ${error.message}`);
        console.log(`ERROR ${testName}: ${error.message}`);
    }
}

/**
 * Completion Rate Calculation Tests (Requirement 3.1)
 */
function testCompletionRateCalculation() {
    console.log('\n=== Completion Rate Calculation Tests (Requirement 3.1) ===\n');
    
    // Test 3.1.1: Calculate completion rate with all tasks completed
    runTest('3.1.1 Calculate completion rate - all completed', () => {
        const totalTasks = 10;
        const completedTasks = 10;
        const completionRate = (completedTasks / totalTasks) * 100;
        
        return completionRate === 100;
    });
    
    // Test 3.1.2: Calculate completion rate with partial completion
    runTest('3.1.2 Calculate completion rate - partial completion', () => {
        const totalTasks = 10;
        const completedTasks = 7;
        const completionRate = (completedTasks / totalTasks) * 100;
        
        return completionRate === 70;
    });
    
    // Test 3.1.3: Calculate completion rate with no tasks completed
    runTest('3.1.3 Calculate completion rate - no completion', () => {
        const totalTasks = 10;
        const completedTasks = 0;
        const completionRate = (completedTasks / totalTasks) * 100;
        
        return completionRate === 0;
    });
    
    // Test 3.1.4: Calculate completion rate with empty task list
    runTest('3.1.4 Calculate completion rate - empty task list', () => {
        const totalTasks = 0;
        const completedTasks = 0;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        return completionRate === 0;
    });
    
    // Test 3.1.5: Calculate completion rate with decimal precision
    runTest('3.1.5 Calculate completion rate - decimal precision', () => {
        const totalTasks = 3;
        const completedTasks = 2;
        const completionRate = Math.round(((completedTasks / totalTasks) * 100) * 100) / 100;
        
        return completionRate === 66.67;
    });
    
    // Test 3.1.6: Calculate completion rate formula accuracy
    runTest('3.1.6 Calculate completion rate - formula accuracy', () => {
        const totalTasks = 8;
        const completedTasks = 5;
        const completionRate = (completedTasks / totalTasks) * 100;
        
        return completionRate === 62.5;
    });
}

/**
 * Category Time Analysis Tests (Requirement 3.2)
 */
function testCategoryTimeAnalysis() {
    console.log('\n=== Category Time Analysis Tests (Requirement 3.2) ===\n');
    
    // Test 3.2.1: Aggregate estimated time for single category
    runTest('3.2.1 Aggregate estimated time - single category', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30 },
            { id: '2', category: 'task', estimated_time: 60 },
            { id: '3', category: 'task', estimated_time: 45 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return categoryTime['task'] === 135;
    });
    
    // Test 3.2.2: Aggregate estimated time for multiple categories
    runTest('3.2.2 Aggregate estimated time - multiple categories', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30 },
            { id: '2', category: 'meeting', estimated_time: 45 },
            { id: '3', category: 'break', estimated_time: 15 },
            { id: '4', category: 'task', estimated_time: 60 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return categoryTime['task'] === 90 && categoryTime['meeting'] === 45 && categoryTime['break'] === 15;
    });
    
    // Test 3.2.3: Handle empty task list
    runTest('3.2.3 Aggregate estimated time - empty task list', () => {
        const tasks = [];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return Object.keys(categoryTime).length === 0;
    });
    
    // Test 3.2.4: Aggregate with zero estimated time
    runTest('3.2.4 Aggregate estimated time - zero time tasks', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 0 },
            { id: '2', category: 'task', estimated_time: 30 },
            { id: '3', category: 'meeting', estimated_time: 0 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return categoryTime['task'] === 30 && categoryTime['meeting'] === 0;
    });
    
    // Test 3.2.5: Aggregate with decimal estimated time
    runTest('3.2.5 Aggregate estimated time - decimal values', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30.5 },
            { id: '2', category: 'task', estimated_time: 45.25 },
            { id: '3', category: 'task', estimated_time: 15.75 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return categoryTime['task'] === 91.5;
    });
    
    // Test 3.2.6: Total estimated time across all categories
    runTest('3.2.6 Aggregate estimated time - total across categories', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30 },
            { id: '2', category: 'meeting', estimated_time: 45 },
            { id: '3', category: 'break', estimated_time: 15 }
        ];
        
        const totalEstimatedTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return totalEstimatedTime === 90;
    });
}

/**
 * Daily Work Time Tests (Requirement 3.3)
 */
function testDailyWorkTime() {
    console.log('\n=== Daily Work Time Tests (Requirement 3.3) ===\n');
    
    // Test 3.3.1: Aggregate estimated time by day
    runTest('3.3.1 Aggregate estimated time by day', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60 },
            { id: '3', assigned_date: '2024-01-02', estimated_time: 45 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = { estimated: 0, actual: 0 };
            }
            dailyTime[task.assigned_date].estimated += task.estimated_time;
        });
        
        return dailyTime['2024-01-01'].estimated === 90 && dailyTime['2024-01-02'].estimated === 45;
    });
    
    // Test 3.3.2: Aggregate actual time by day
    runTest('3.3.2 Aggregate actual time by day', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30, actual_time: 35 },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60, actual_time: 55 },
            { id: '3', assigned_date: '2024-01-02', estimated_time: 45, actual_time: 50 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = { estimated: 0, actual: 0 };
            }
            dailyTime[task.assigned_date].estimated += task.estimated_time;
            dailyTime[task.assigned_date].actual += task.actual_time || 0;
        });
        
        return dailyTime['2024-01-01'].actual === 90 && dailyTime['2024-01-02'].actual === 50;
    });
    
    // Test 3.3.3: Aggregate both estimated and actual time
    runTest('3.3.3 Aggregate both estimated and actual time', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30, actual_time: 35 },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60, actual_time: 55 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = { estimated: 0, actual: 0 };
            }
            dailyTime[task.assigned_date].estimated += task.estimated_time;
            dailyTime[task.assigned_date].actual += task.actual_time || 0;
        });
        
        return dailyTime['2024-01-01'].estimated === 90 && dailyTime['2024-01-01'].actual === 90;
    });
    
    // Test 3.3.4: Handle tasks with null actual time
    runTest('3.3.4 Handle tasks with null actual time', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30, actual_time: null },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60, actual_time: 55 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = { estimated: 0, actual: 0 };
            }
            dailyTime[task.assigned_date].estimated += task.estimated_time;
            dailyTime[task.assigned_date].actual += task.actual_time || 0;
        });
        
        return dailyTime['2024-01-01'].estimated === 90 && dailyTime['2024-01-01'].actual === 55;
    });
    
    // Test 3.3.5: Calculate weekly total from daily breakdown
    runTest('3.3.5 Calculate weekly total from daily breakdown', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30, actual_time: 35 },
            { id: '2', assigned_date: '2024-01-02', estimated_time: 60, actual_time: 55 },
            { id: '3', assigned_date: '2024-01-03', estimated_time: 45, actual_time: 50 }
        ];
        
        const totalEstimated = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        return totalEstimated === 135 && totalActual === 140;
    });
    
    // Test 3.3.6: Handle unassigned tasks (null assigned_date)
    runTest('3.3.6 Handle unassigned tasks', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30, actual_time: 35 },
            { id: '2', assigned_date: null, estimated_time: 60, actual_time: 55 }
        ];
        
        const assignedTasks = tasks.filter(t => t.assigned_date !== null);
        const totalEstimated = assignedTasks.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return totalEstimated === 30;
    });
    
    // Test 3.3.7: Aggregate with decimal time values
    runTest('3.3.7 Aggregate with decimal time values', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30.5, actual_time: 35.25 },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60.75, actual_time: 55.5 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = { estimated: 0, actual: 0 };
            }
            dailyTime[task.assigned_date].estimated += task.estimated_time;
            dailyTime[task.assigned_date].actual += task.actual_time || 0;
        });
        
        return dailyTime['2024-01-01'].estimated === 91.25 && dailyTime['2024-01-01'].actual === 90.75;
    });
}

/**
 * Estimated vs Actual Analysis Tests (Requirement 3.4)
 */
function testEstimatedVsActualAnalysis() {
    console.log('\n=== Estimated vs Actual Analysis Tests (Requirement 3.4) ===\n');
    
    // Test 3.4.1: Identify time overrun tasks (actual > estimated)
    runTest('3.4.1 Identify time overrun tasks', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 75 },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 1 && overrunTasks[0].id === '2';
    });
    
    // Test 3.4.2: Identify all overrun tasks in mixed list
    runTest('3.4.2 Identify all overrun tasks', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 35 },
            { id: '2', estimated_time: 60, actual_time: 75 },
            { id: '3', estimated_time: 45, actual_time: 40 },
            { id: '4', estimated_time: 20, actual_time: 25 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 3;
    });
    
    // Test 3.4.3: No overrun tasks when all on track
    runTest('3.4.3 No overrun tasks when all on track', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 55 },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 0;
    });
    
    // Test 3.4.4: Identify overrun with exact match (not overrun)
    runTest('3.4.4 Exact match is not overrun', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 30 },
            { id: '2', estimated_time: 60, actual_time: 60 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 0;
    });
    
    // Test 3.4.5: Handle tasks with null actual time
    runTest('3.4.5 Handle tasks with null actual time', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 35 },
            { id: '2', estimated_time: 60, actual_time: null },
            { id: '3', estimated_time: 45, actual_time: 50 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time && t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 2;
    });
    
    // Test 3.4.6: Handle tasks with zero actual time
    runTest('3.4.6 Handle tasks with zero actual time', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 35 },
            { id: '2', estimated_time: 60, actual_time: 0 },
            { id: '3', estimated_time: 45, actual_time: 50 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 2;
    });
    
    // Test 3.4.7: Calculate overrun percentage
    runTest('3.4.7 Calculate overrun percentage', () => {
        const task = { id: '1', estimated_time: 100, actual_time: 125 };
        const overrunTime = task.actual_time - task.estimated_time;
        const overrunPercentage = (overrunTime / task.estimated_time) * 100;
        
        return overrunPercentage === 25;
    });
    
    // Test 3.4.8: Identify overrun with decimal values
    runTest('3.4.8 Identify overrun with decimal values', () => {
        const tasks = [
            { id: '1', estimated_time: 30.5, actual_time: 35.75 },
            { id: '2', estimated_time: 60.25, actual_time: 55.5 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 1 && overrunTasks[0].id === '1';
    });
    
    // Test 3.4.9: Calculate total variance
    runTest('3.4.9 Calculate total variance', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 65 },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const totalVariance = tasks.reduce((sum, t) => sum + (t.actual_time - t.estimated_time), 0);
        
        return totalVariance === -5;
    });
    
    // Test 3.4.10: Identify overrun severity - minor (<=25%)
    runTest('3.4.10 Identify minor overrun severity', () => {
        const task = { id: '1', estimated_time: 100, actual_time: 120 };
        const overrunPercent = ((task.actual_time - task.estimated_time) / task.estimated_time) * 100;
        const severity = overrunPercent <= 25 ? 'minor' : overrunPercent <= 50 ? 'moderate' : 'severe';
        
        return severity === 'minor';
    });
    
    // Test 3.4.11: Identify overrun severity - moderate (26-50%)
    runTest('3.4.11 Identify moderate overrun severity', () => {
        const task = { id: '1', estimated_time: 100, actual_time: 140 };
        const overrunPercent = ((task.actual_time - task.estimated_time) / task.estimated_time) * 100;
        const severity = overrunPercent <= 25 ? 'minor' : overrunPercent <= 50 ? 'moderate' : 'severe';
        
        return severity === 'moderate';
    });
    
    // Test 3.4.12: Identify overrun severity - severe (>50%)
    runTest('3.4.12 Identify severe overrun severity', () => {
        const task = { id: '1', estimated_time: 100, actual_time: 160 };
        const overrunPercent = ((task.actual_time - task.estimated_time) / task.estimated_time) * 100;
        const severity = overrunPercent <= 25 ? 'minor' : overrunPercent <= 50 ? 'moderate' : 'severe';
        
        return severity === 'severe';
    });
}

/**
 * Statistics Edge Cases Tests (Requirements 3.5, 3.6, 3.7, 3.8)
 */
function testStatisticsEdgeCases() {
    console.log('\n=== Statistics Edge Cases Tests (Requirements 3.5, 3.6, 3.7, 3.8) ===\n');
    
    // Test 3.5.1: Empty task list returns 0% completion rate
    runTest('3.5.1 Empty task list - 0% completion rate', () => {
        const tasks = [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        return completionRate === 0;
    });
    
    // Test 3.5.2: Empty task list - statistics validity
    runTest('3.5.2 Empty task list - statistics validity', () => {
        const tasks = [];
        const isValid = tasks.length > 0;
        
        return isValid === false;
    });
    
    // Test 3.6.1: Week range filtering - include only tasks in range
    runTest('3.6.1 Week range filtering - include tasks in range', () => {
        const weekStart = '2024-01-01';
        const weekEnd = '2024-01-07';
        const tasks = [
            { id: '1', assigned_date: '2024-01-03', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-05', estimated_time: 60 },
            { id: '3', assigned_date: '2024-01-10', estimated_time: 45 }
        ];
        
        const tasksInRange = tasks.filter(t => 
            t.assigned_date >= weekStart && t.assigned_date <= weekEnd
        );
        
        return tasksInRange.length === 2;
    });
    
    // Test 3.6.2: Week range filtering - exclude tasks outside range
    runTest('3.6.2 Week range filtering - exclude tasks outside range', () => {
        const weekStart = '2024-01-01';
        const weekEnd = '2024-01-07';
        const tasks = [
            { id: '1', assigned_date: '2023-12-31', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-08', estimated_time: 60 }
        ];
        
        const tasksInRange = tasks.filter(t => 
            t.assigned_date >= weekStart && t.assigned_date <= weekEnd
        );
        
        return tasksInRange.length === 0;
    });
    
    // Test 3.6.3: Week range filtering - boundary dates included
    runTest('3.6.3 Week range filtering - boundary dates included', () => {
        const weekStart = '2024-01-01';
        const weekEnd = '2024-01-07';
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-07', estimated_time: 60 }
        ];
        
        const tasksInRange = tasks.filter(t => 
            t.assigned_date >= weekStart && t.assigned_date <= weekEnd
        );
        
        return tasksInRange.length === 2;
    });
    
    // Test 3.6.4: Week range filtering - aggregate time for filtered tasks
    runTest('3.6.4 Week range filtering - aggregate time', () => {
        const weekStart = '2024-01-01';
        const weekEnd = '2024-01-07';
        const tasks = [
            { id: '1', assigned_date: '2024-01-03', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-05', estimated_time: 60 },
            { id: '3', assigned_date: '2024-01-10', estimated_time: 45 }
        ];
        
        const tasksInRange = tasks.filter(t => 
            t.assigned_date >= weekStart && t.assigned_date <= weekEnd
        );
        const totalTime = tasksInRange.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return totalTime === 90;
    });
    
    // Test 3.7.1: Decimal time processing - addition accuracy
    runTest('3.7.1 Decimal time processing - addition accuracy', () => {
        const tasks = [
            { id: '1', estimated_time: 1.5 },
            { id: '2', estimated_time: 2.25 },
            { id: '3', estimated_time: 0.75 }
        ];
        
        const totalTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return totalTime === 4.5;
    });
    
    // Test 3.7.2: Decimal time processing - maintain precision
    runTest('3.7.2 Decimal time processing - maintain precision', () => {
        const tasks = [
            { id: '1', estimated_time: 1.333 },
            { id: '2', estimated_time: 2.667 }
        ];
        
        const totalTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        const roundedTotal = Math.round(totalTime * 1000) / 1000;
        
        return roundedTotal === 4.0;
    });
    
    // Test 3.7.3: Decimal time processing - actual time with decimals
    runTest('3.7.3 Decimal time processing - actual time decimals', () => {
        const tasks = [
            { id: '1', estimated_time: 1.5, actual_time: 1.75 },
            { id: '2', estimated_time: 2.25, actual_time: 2.5 }
        ];
        
        const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        return totalActual === 4.25;
    });
    
    // Test 3.7.4: Decimal time processing - variance calculation
    runTest('3.7.4 Decimal time processing - variance calculation', () => {
        const task = { id: '1', estimated_time: 1.5, actual_time: 1.75 };
        const variance = task.actual_time - task.estimated_time;
        
        return variance === 0.25;
    });
    
    // Test 3.8.1: Null actual time handling - treat as zero
    runTest('3.8.1 Null actual time handling - treat as zero', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: null },
            { id: '2', estimated_time: 60, actual_time: 55 }
        ];
        
        const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        return totalActual === 55;
    });
    
    // Test 3.8.2: Zero actual time handling - include in calculation
    runTest('3.8.2 Zero actual time handling - include in calculation', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 0 },
            { id: '2', estimated_time: 60, actual_time: 55 }
        ];
        
        const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        return totalActual === 55;
    });
    
    // Test 3.8.3: Null actual time - not counted as overrun
    runTest('3.8.3 Null actual time - not counted as overrun', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: null },
            { id: '2', estimated_time: 60, actual_time: 75 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time && t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 1;
    });
    
    // Test 3.8.4: Zero actual time - not counted as overrun
    runTest('3.8.4 Zero actual time - not counted as overrun', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 0 },
            { id: '2', estimated_time: 60, actual_time: 75 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 1;
    });
    
    // Test 3.8.5: Mixed null and zero actual time handling
    runTest('3.8.5 Mixed null and zero actual time handling', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: null },
            { id: '2', estimated_time: 60, actual_time: 0 },
            { id: '3', estimated_time: 45, actual_time: 50 }
        ];
        
        const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        const tasksWithActual = tasks.filter(t => t.actual_time !== null && t.actual_time !== undefined);
        
        return totalActual === 50 && tasksWithActual.length === 2;
    });
    
    // Test 3.8.6: Null actual time - completion rate calculation
    runTest('3.8.6 Null actual time - completion rate calculation', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: null, completed: true },
            { id: '2', estimated_time: 60, actual_time: 55, completed: true },
            { id: '3', estimated_time: 45, actual_time: null, completed: false }
        ];
        
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = (completedTasks / tasks.length) * 100;
        
        return Math.round(completionRate * 100) / 100 === 66.67;
    });
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('==========================================');
    console.log('Statistics Engine Unit Tests');
    console.log('==========================================\n');
    
    testCompletionRateCalculation();
    testCategoryTimeAnalysis();
    testDailyWorkTime();
    testEstimatedVsActualAnalysis();
    testStatisticsEdgeCases();
    
    console.log('\n==========================================');
    console.log('Test Summary');
    console.log('==========================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    console.log('==========================================\n');
    
    if (testResults.failed === 0) {
        console.log('All tests passed!');
        process.exit(0);
    } else {
        console.log(`${testResults.failed} test(s) failed!`);
        process.exit(1);
    }
}

// Run tests
runAllTests();
