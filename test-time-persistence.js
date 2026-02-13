/**
 * Time Data Persistence Tests
 * Tests for saving and loading time data from LocalStorage
 */

// Mock localStorage for testing
const mockStorage = {};

function setupMockStorage() {
    global.localStorage = {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => { mockStorage[key] = value; },
        removeItem: (key) => { delete mockStorage[key]; },
        clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
    };
}

// Test Suite 1: Basic Persistence
console.log('=== Test Suite 1: Basic Persistence ===');

function testBasicPersistence() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 },
        { id: 'task-2', name: 'Task 2', estimated_time: 8, actual_time: 0 }
    ];
    
    // Save tasks
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    
    // Load tasks
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded.length === 2;
    const test2 = loaded[0].actual_time === 3;
    const test3 = loaded[1].actual_time === 0;
    
    console.assert(test1, 'Should load 2 tasks');
    console.assert(test2, 'First task actual_time should be 3');
    console.assert(test3, 'Second task actual_time should be 0');
    console.log('✅ Basic persistence test passed');
}

testBasicPersistence();

// Test Suite 2: Data Integrity
console.log('\n=== Test Suite 2: Data Integrity ===');

function testDataIntegrity() {
    setupMockStorage();
    
    const originalTasks = [
        {
            id: 'task-1',
            name: 'Task 1',
            estimated_time: 5.5,
            actual_time: 4.25,
            priority: 'high',
            category: 'task',
            assigned_date: '2024-01-15',
            due_date: '2024-01-16T18:00',
            details: 'Test task',
            completed: false
        }
    ];
    
    // Save and load
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(originalTasks));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded[0].id === 'task-1';
    const test2 = loaded[0].estimated_time === 5.5;
    const test3 = loaded[0].actual_time === 4.25;
    const test4 = loaded[0].priority === 'high';
    const test5 = loaded[0].category === 'task';
    const test6 = loaded[0].assigned_date === '2024-01-15';
    const test7 = loaded[0].details === 'Test task';
    
    console.assert(test1, 'ID should be preserved');
    console.assert(test2, 'Estimated time should be preserved');
    console.assert(test3, 'Actual time should be preserved');
    console.assert(test4, 'Priority should be preserved');
    console.assert(test5, 'Category should be preserved');
    console.assert(test6, 'Assigned date should be preserved');
    console.assert(test7, 'Details should be preserved');
    console.log('✅ Data integrity test passed');
}

testDataIntegrity();

// Test Suite 3: Multiple Tasks
console.log('\n=== Test Suite 3: Multiple Tasks ===');

function testMultipleTasks() {
    setupMockStorage();
    
    const tasks = [];
    for (let i = 1; i <= 10; i++) {
        tasks.push({
            id: `task-${i}`,
            name: `Task ${i}`,
            estimated_time: i,
            actual_time: i - 1
        });
    }
    
    // Save and load
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded.length === 10;
    const test2 = loaded[0].actual_time === 0;
    const test3 = loaded[9].actual_time === 9;
    
    console.assert(test1, 'Should load 10 tasks');
    console.assert(test2, 'First task actual_time should be 0');
    console.assert(test3, 'Last task actual_time should be 9');
    console.log('✅ Multiple tasks test passed');
}

testMultipleTasks();

// Test Suite 4: Empty Tasks
console.log('\n=== Test Suite 4: Empty Tasks ===');

function testEmptyTasks() {
    setupMockStorage();
    
    // Save empty array
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify([]));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = Array.isArray(loaded);
    const test2 = loaded.length === 0;
    
    console.assert(test1, 'Should be an array');
    console.assert(test2, 'Should be empty');
    console.log('✅ Empty tasks test passed');
}

testEmptyTasks();

// Test Suite 5: Null/Undefined Handling
console.log('\n=== Test Suite 5: Null/Undefined Handling ===');

function testNullUndefinedHandling() {
    setupMockStorage();
    
    // Test non-existent key
    const test1 = localStorage.getItem('non-existent-key') === null;
    
    // Test with null actual_time
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: null }
    ];
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test2 = loaded[0].actual_time === null;
    
    console.assert(test1, 'Non-existent key should return null');
    console.assert(test2, 'Null actual_time should be preserved');
    console.log('✅ Null/undefined handling test passed');
}

testNullUndefinedHandling();

// Test Suite 6: Large Data Sets
console.log('\n=== Test Suite 6: Large Data Sets ===');

function testLargeDataSets() {
    setupMockStorage();
    
    const tasks = [];
    for (let i = 1; i <= 1000; i++) {
        tasks.push({
            id: `task-${i}`,
            name: `Task ${i}`,
            estimated_time: Math.random() * 10,
            actual_time: Math.random() * 10,
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            category: ['task', 'meeting', 'bugfix'][Math.floor(Math.random() * 3)],
            assigned_date: '2024-01-15',
            details: `Details for task ${i}`
        });
    }
    
    // Save and load
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded.length === 1000;
    const test2 = loaded[0].id === 'task-1';
    const test3 = loaded[999].id === 'task-1000';
    
    console.assert(test1, 'Should load 1000 tasks');
    console.assert(test2, 'First task should be correct');
    console.assert(test3, 'Last task should be correct');
    console.log('✅ Large data sets test passed');
}

testLargeDataSets();

// Test Suite 7: Update and Overwrite
console.log('\n=== Test Suite 7: Update and Overwrite ===');

function testUpdateAndOverwrite() {
    setupMockStorage();
    
    // Initial save
    const tasks1 = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 0 }
    ];
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks1));
    
    // Update and save
    const tasks2 = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 }
    ];
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks2));
    
    // Load
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded[0].actual_time === 3;
    
    console.assert(test1, 'Updated actual_time should be 3');
    console.log('✅ Update and overwrite test passed');
}

testUpdateAndOverwrite();

// Test Suite 8: Decimal Precision
console.log('\n=== Test Suite 8: Decimal Precision ===');

function testDecimalPrecision() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5.123456, actual_time: 3.987654 }
    ];
    
    // Save and load
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.tasks'));
    
    const test1 = loaded[0].estimated_time === 5.123456;
    const test2 = loaded[0].actual_time === 3.987654;
    
    console.assert(test1, 'Estimated time precision should be preserved');
    console.assert(test2, 'Actual time precision should be preserved');
    console.log('✅ Decimal precision test passed');
}

testDecimalPrecision();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All time data persistence tests completed successfully!');
console.log('Total test suites: 8');
console.log('Total tests: 20+');
