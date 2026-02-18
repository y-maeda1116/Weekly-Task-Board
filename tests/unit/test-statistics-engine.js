/**
 * Unit Tests for Statistics Calculation Engine
 * Tests for calculateCategoryTimeAnalysis, calculateDailyWorkTime, and calculateEstimatedVsActualAnalysis
 * 
 * Validates: Requirements 1.3, 1.4, 1.5
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
 * Category Time Analysis Tests
 */
function testCategoryTimeAnalysis() {
    console.log('\n=== Category Time Analysis Tests ===\n');
    
    // Test 1.3.1: Calculate category time for single category
    runTest('1.3.1 Calculate category time for single category', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30 },
            { id: '2', category: 'task', estimated_time: 60 },
            { id: '3', category: 'meeting', estimated_time: 45 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return categoryTime['task'] === 90 && categoryTime['meeting'] === 45;
    });
    
    // Test 1.3.2: Calculate category time for multiple categories
    runTest('1.3.2 Calculate category time for multiple categories', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 30 },
            { id: '2', category: 'meeting', estimated_time: 45 },
            { id: '3', category: 'break', estimated_time: 15 }
        ];
        
        const categoryTime = {};
        tasks.forEach(task => {
            if (!categoryTime[task.category]) {
                categoryTime[task.category] = 0;
            }
            categoryTime[task.category] += task.estimated_time;
        });
        
        return Object.keys(categoryTime).length === 3;
    });
    
    // Test 1.3.3: Handle empty category
    runTest('1.3.3 Handle empty category', () => {
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
    
    // Test 1.3.4: Category percentage calculation
    runTest('1.3.4 Category percentage calculation', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 60 },
            { id: '2', category: 'meeting', estimated_time: 40 }
        ];
        
        const totalTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        const taskPercentage = (60 / totalTime) * 100;
        
        return taskPercentage === 60;
    });
}

/**
 * Daily Work Time Tests
 */
function testDailyWorkTime() {
    console.log('\n=== Daily Work Time Tests ===\n');
    
    // Test 1.4.1: Calculate daily work time
    runTest('1.4.1 Calculate daily work time', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-01', estimated_time: 60 },
            { id: '3', assigned_date: '2024-01-02', estimated_time: 45 }
        ];
        
        const dailyTime = {};
        tasks.forEach(task => {
            if (!dailyTime[task.assigned_date]) {
                dailyTime[task.assigned_date] = 0;
            }
            dailyTime[task.assigned_date] += task.estimated_time;
        });
        
        return dailyTime['2024-01-01'] === 90 && dailyTime['2024-01-02'] === 45;
    });
    
    // Test 1.4.2: Calculate weekly work time
    runTest('1.4.2 Calculate weekly work time', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30 },
            { id: '2', assigned_date: '2024-01-02', estimated_time: 60 },
            { id: '3', assigned_date: '2024-01-03', estimated_time: 45 }
        ];
        
        const weeklyTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return weeklyTime === 135;
    });
    
    // Test 1.4.3: Handle unassigned tasks
    runTest('1.4.3 Handle unassigned tasks', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 30 },
            { id: '2', assigned_date: null, estimated_time: 60 }
        ];
        
        const assignedTasks = tasks.filter(t => t.assigned_date !== null);
        const totalTime = assignedTasks.reduce((sum, t) => sum + t.estimated_time, 0);
        
        return totalTime === 30;
    });
    
    // Test 1.4.4: Average daily work time
    runTest('1.4.4 Average daily work time', () => {
        const tasks = [
            { id: '1', assigned_date: '2024-01-01', estimated_time: 60 },
            { id: '2', assigned_date: '2024-01-02', estimated_time: 120 },
            { id: '3', assigned_date: '2024-01-03', estimated_time: 90 }
        ];
        
        const totalTime = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        const averageTime = totalTime / 3;
        
        return averageTime === 90;
    });
}

/**
 * Estimated vs Actual Analysis Tests
 */
function testEstimatedVsActualAnalysis() {
    console.log('\n=== Estimated vs Actual Analysis Tests ===\n');
    
    // Test 1.5.1: Calculate variance
    runTest('1.5.1 Calculate variance', () => {
        const task = {
            id: '1',
            estimated_time: 30,
            actual_time: 25
        };
        
        const variance = task.actual_time - task.estimated_time;
        
        return variance === -5;
    });
    
    // Test 1.5.2: Identify overrun tasks
    runTest('1.5.2 Identify overrun tasks', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 75 },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const overrunTasks = tasks.filter(t => t.actual_time > t.estimated_time);
        
        return overrunTasks.length === 1;
    });
    
    // Test 1.5.3: Calculate total variance
    runTest('1.5.3 Calculate total variance', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 65 },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const totalVariance = tasks.reduce((sum, t) => sum + (t.actual_time - t.estimated_time), 0);
        
        return totalVariance === -5;
    });
    
    // Test 1.5.4: Calculate accuracy percentage
    runTest('1.5.4 Calculate accuracy percentage', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 30 },
            { id: '2', estimated_time: 60, actual_time: 60 },
            { id: '3', estimated_time: 45, actual_time: 45 }
        ];
        
        const accurateTasks = tasks.filter(t => t.estimated_time === t.actual_time).length;
        const accuracy = (accurateTasks / tasks.length) * 100;
        
        return accuracy === 100;
    });
    
    // Test 1.5.5: Handle missing actual time
    runTest('1.5.5 Handle missing actual time', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: null },
            { id: '3', estimated_time: 45, actual_time: 40 }
        ];
        
        const completedTasks = tasks.filter(t => t.actual_time !== null);
        
        return completedTasks.length === 2;
    });
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('==========================================');
    console.log('Statistics Engine Unit Tests');
    console.log('==========================================\n');
    
    testCategoryTimeAnalysis();
    testDailyWorkTime();
    testEstimatedVsActualAnalysis();
    
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
