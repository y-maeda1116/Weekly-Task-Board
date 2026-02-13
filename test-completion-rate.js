/**
 * Test Suite for Completion Rate Calculation
 * Tests the statistics engine implementation for task 4.1
 */

// Mock localStorage for testing
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; }
};

// Helper to clear mock storage
function clearMockStorage() {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
}

// Global variables for testing
let tasks = [];
let settings = { ideal_daily_minutes: 480, weekday_visibility: {} };
let currentDate = new Date();

// Helper functions
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonday(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function loadArchivedTasks() {
    const archivedJson = localStorage.getItem('weekly-task-board.archive');
    if (!archivedJson) return [];
    try {
        return JSON.parse(archivedJson);
    } catch (error) {
        return [];
    }
}

// Statistics Engine Functions
function calculateCompletionRate(weekStartDate = null) {
    try {
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);
        
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);
        
        let totalTasks = 0;
        let completedTasks = 0;
        
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                if (task.completed) {
                    completedTasks++;
                }
            }
        });
        
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                completedTasks++;
            }
        });
        
        let completionRate = 0;
        if (totalTasks > 0) {
            completionRate = (completedTasks / totalTasks) * 100;
            completionRate = Math.round(completionRate * 100) / 100;
        }
        
        return {
            week_start: weekStartStr,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            completion_rate: completionRate,
            is_valid: true
        };
    } catch (error) {
        console.error('完了率計算エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            total_tasks: 0,
            completed_tasks: 0,
            completion_rate: 0,
            is_valid: false,
            error: error.message
        };
    }
}

function getCompletionRateForWeek(weeksOffset = 0) {
    const targetDate = new Date(currentDate);
    const monday = getMonday(targetDate);
    monday.setDate(monday.getDate() + (weeksOffset * 7));
    
    return calculateCompletionRate(monday);
}

// Test Suite
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function runTests() {
    console.log('🧪 Running Completion Rate Calculation Tests\n');
    
    tests.forEach(({ name, fn }) => {
        try {
            // Reset state before each test
            tasks = [];
            clearMockStorage();
            currentDate = new Date();
            
            fn();
            console.log(`✅ ${name}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${error.message}`);
            failedTests++;
        }
    });
    
    console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed out of ${tests.length} tests`);
    return failedTests === 0;
}

// Test Cases

test('No tasks - completion rate should be 0', () => {
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 0, 'Total tasks');
    assertEqual(result.completed_tasks, 0, 'Completed tasks');
    assertEqual(result.completion_rate, 0, 'Completion rate');
    assert(result.is_valid, 'Result should be valid');
});

test('All tasks completed - completion rate should be 100', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: mondayStr, completed: true },
        { id: '3', name: 'Task 3', assigned_date: mondayStr, completed: true }
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 3, 'Total tasks');
    assertEqual(result.completed_tasks, 3, 'Completed tasks');
    assertEqual(result.completion_rate, 100, 'Completion rate');
});

test('Half tasks completed - completion rate should be 50', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: mondayStr, completed: false },
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 2, 'Total tasks');
    assertEqual(result.completed_tasks, 1, 'Completed tasks');
    assertEqual(result.completion_rate, 50, 'Completion rate');
});

test('Tasks outside week should not be counted', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    // Add a task from last week
    const lastWeekDate = new Date(monday);
    lastWeekDate.setDate(monday.getDate() - 7);
    const lastWeekStr = formatDate(lastWeekDate);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: lastWeekStr, completed: true }
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 1, 'Total tasks (should only count current week)');
    assertEqual(result.completed_tasks, 1, 'Completed tasks');
    assertEqual(result.completion_rate, 100, 'Completion rate');
});

test('Unassigned tasks should not be counted', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: null, completed: false }
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 1, 'Total tasks (should not count unassigned)');
    assertEqual(result.completed_tasks, 1, 'Completed tasks');
    assertEqual(result.completion_rate, 100, 'Completion rate');
});

test('Archived tasks should be counted as completed', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: false }
    ];
    
    const archivedTasks = [
        { id: '2', name: 'Task 2', assigned_date: mondayStr, completed: true }
    ];
    
    mockStorage['weekly-task-board.archive'] = JSON.stringify(archivedTasks);
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 2, 'Total tasks (should include archived)');
    assertEqual(result.completed_tasks, 1, 'Completed tasks');
    assertEqual(result.completion_rate, 50, 'Completion rate');
});

test('Multiple days in week should be counted', () => {
    const monday = getMonday(new Date());
    const tuesday = new Date(monday);
    tuesday.setDate(monday.getDate() + 1);
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);
    
    const mondayStr = formatDate(monday);
    const tuesdayStr = formatDate(tuesday);
    const wednesdayStr = formatDate(wednesday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: tuesdayStr, completed: true },
        { id: '3', name: 'Task 3', assigned_date: wednesdayStr, completed: false }
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.total_tasks, 3, 'Total tasks');
    assertEqual(result.completed_tasks, 2, 'Completed tasks');
    assertEqual(result.completion_rate, 66.67, 'Completion rate');
});

test('Completion rate should be rounded to 2 decimal places', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true },
        { id: '2', name: 'Task 2', assigned_date: mondayStr, completed: true },
        { id: '3', name: 'Task 3', assigned_date: mondayStr, completed: false }
    ];
    
    const result = calculateCompletionRate();
    assertEqual(result.completion_rate, 66.67, 'Completion rate should be rounded to 2 decimals');
});

test('getCompletionRateForWeek with offset 0 should return current week', () => {
    const monday = getMonday(new Date());
    const mondayStr = formatDate(monday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: mondayStr, completed: true }
    ];
    
    const result = getCompletionRateForWeek(0);
    assertEqual(result.total_tasks, 1, 'Total tasks');
    assertEqual(result.completion_rate, 100, 'Completion rate');
});

test('getCompletionRateForWeek with offset -1 should return last week', () => {
    const monday = getMonday(new Date());
    const lastWeekMonday = new Date(monday);
    lastWeekMonday.setDate(monday.getDate() - 7);
    const lastWeekStr = formatDate(lastWeekMonday);
    
    tasks = [
        { id: '1', name: 'Task 1', assigned_date: lastWeekStr, completed: true }
    ];
    
    const result = getCompletionRateForWeek(-1);
    assertEqual(result.total_tasks, 1, 'Total tasks');
    assertEqual(result.completion_rate, 100, 'Completion rate');
});

test('Result should have correct structure', () => {
    const result = calculateCompletionRate();
    assert(result.hasOwnProperty('week_start'), 'Should have week_start');
    assert(result.hasOwnProperty('total_tasks'), 'Should have total_tasks');
    assert(result.hasOwnProperty('completed_tasks'), 'Should have completed_tasks');
    assert(result.hasOwnProperty('completion_rate'), 'Should have completion_rate');
    assert(result.hasOwnProperty('is_valid'), 'Should have is_valid');
});

test('Error handling - should return valid error result on exception', () => {
    // Simulate an error by making tasks undefined
    const originalTasks = tasks;
    tasks = undefined;
    
    try {
        const result = calculateCompletionRate();
        assert(!result.is_valid, 'Result should be invalid');
        assert(result.hasOwnProperty('error'), 'Should have error property');
    } finally {
        tasks = originalTasks;
    }
});

// Run all tests
const allPassed = runTests();
process.exit(allPassed ? 0 : 1);
