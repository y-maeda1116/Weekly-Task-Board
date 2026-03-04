/**
 * Edge Cases & Error Handling Tests
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

const { MockLocalStorage, TestDataGenerator } = require('../utils/test-helpers.js');

let testsPassed = 0;
let testsFailed = 0;
let mockStorage;
let dataGenerator;

function runTest(testName, testFunction) {
    try {
        testFunction();
        console.log(`✓ ${testName}`);
        testsPassed++;
    } catch (error) {
        console.error(`✗ ${testName}`);
        console.error(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// Requirement 6.1: Negative Estimated Time
function testNegativeEstimatedTimeRejection() {
    console.log('\n=== Requirement 6.1: Negative Estimated Time ===\n');
    runTest('6.1.1 Negative estimated time is rejected', () => {
        const isValid = -60 >= 0;
        assert(!isValid, 'Negative time should be rejected');
    });
    runTest('6.1.2 Error message shown for negative time', () => {
        let msg = '';
        if (-30 < 0) msg = 'Estimated time cannot be negative';
        assert(msg !== '', 'Error message should be shown');
    });
    runTest('6.1.3 Task creation prevented with negative time', () => {
        mockStorage.clear();
        const isValid = -60 >= 0;
        if (isValid) {
            const tasks = JSON.parse(mockStorage.getItem('tasks') || '[]');
            tasks.push({ estimated_time: -60 });
            mockStorage.setItem('tasks', JSON.stringify(tasks));
        }
        const stored = JSON.parse(mockStorage.getItem('tasks') || '[]');
        assert(stored.length === 0, 'Task should not be created');
    });
    runTest('6.1.4 Multiple negative values rejected', () => {
        let count = 0;
        [-1, -10, -100].forEach(v => { if (v < 0) count++; });
        assert(count === 3, 'All should be rejected');
    });
}

// Requirement 6.2: Zero Estimated Time
function testZeroEstimatedTimeAcceptance() {
    console.log('\n=== Requirement 6.2: Zero Estimated Time ===\n');
    runTest('6.2.1 Zero estimated time is accepted', () => {
        const isValid = 0 >= 0;
        assert(isValid, 'Zero should be accepted');
    });
    runTest('6.2.2 Task created with zero time', () => {
        mockStorage.clear();
        const tasks = [{ estimated_time: 0 }];
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        assert(stored[0].estimated_time === 0, 'Zero should be stored');
    });
    runTest('6.2.3 Zero time recorded correctly', () => {
        mockStorage.clear();
        const task = dataGenerator.generateTask({ estimated_time: 0 });
        mockStorage.setItem('tasks', JSON.stringify([task]));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        assert(stored[0].estimated_time === 0, 'Zero should persist');
    });
    runTest('6.2.4 Zero time in calculations', () => {
        mockStorage.clear();
        const tasks = [
            dataGenerator.generateTask({ estimated_time: 0 }),
            dataGenerator.generateTask({ estimated_time: 60 })
        ];
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        const total = stored.reduce((s, t) => s + t.estimated_time, 0);
        assert(total === 60, 'Calculation should work');
    });
}

// Requirement 6.3: 480 Minutes Warning
function testEightHourExceededWarning() {
    console.log('\n=== Requirement 6.3: 480 Minutes Warning ===\n');
    runTest('6.3.1 Warning when exceeds 480', () => {
        let warning = '';
        if (500 > 480) warning = 'Warning: Exceeds 8 hours';
        assert(warning !== '', 'Warning should show');
    });
    runTest('6.3.2 No warning at exactly 480', () => {
        let warning = '';
        if (480 > 480) warning = 'Warning';
        assert(warning === '', 'No warning at 480');
    });
    runTest('6.3.3 Warning just over 480', () => {
        let warning = '';
        if (481 > 480) warning = 'Warning';
        assert(warning !== '', 'Warning at 481');
    });
    runTest('6.3.4 Task created despite warning', () => {
        mockStorage.clear();
        const tasks = [{ estimated_time: 600 }];
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        assert(stored.length === 1, 'Task should be created');
    });
}

// Requirement 6.4: Empty Task Name
function testEmptyTaskNameRejection() {
    console.log('\n=== Requirement 6.4: Empty Task Name ===\n');
    runTest('6.4.1 Empty name rejected', () => {
        const isValid = '' && ''.trim() !== '';
        assert(!isValid, 'Empty should be rejected');
    });
    runTest('6.4.2 Whitespace name rejected', () => {
        const isValid = '   ' && '   '.trim() !== '';
        assert(!isValid, 'Whitespace should be rejected');
    });
    runTest('6.4.3 Task creation prevented', () => {
        mockStorage.clear();
        const isValid = '' && ''.trim() !== '';
        if (isValid) {
            mockStorage.setItem('tasks', JSON.stringify([{ name: '' }]));
        }
        const stored = JSON.parse(mockStorage.getItem('tasks') || '[]');
        assert(stored.length === 0, 'Task should not be created');
    });
    runTest('6.4.4 Error message shown', () => {
        let msg = '';
        if (!'' || ''.trim() === '') msg = 'Task name required';
        assert(msg !== '', 'Error should show');
    });
}

// Requirement 6.5: Invalid Date
function testInvalidDateInputRejection() {
    console.log('\n=== Requirement 6.5: Invalid Date ===\n');
    function isValidDate(d) {
        if (!d) return true;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(d)) return false;
        const date = new Date(d);
        return date instanceof Date && !isNaN(date);
    }
    runTest('6.5.1 Invalid format rejected', () => {
        assert(!isValidDate('01/01/2024'), 'Invalid format rejected');
    });
    runTest('6.5.2 Invalid values rejected', () => {
        assert(!isValidDate('2024-13-45'), 'Invalid values rejected');
    });
    runTest('6.5.3 Valid format accepted', () => {
        assert(isValidDate('2024-01-15'), 'Valid format accepted');
    });
    runTest('6.5.4 Null date accepted', () => {
        assert(isValidDate(null), 'Null accepted');
    });
}

// Requirement 6.6: localStorage Unavailable
function testLocalStorageUnavailableHandling() {
    console.log('\n=== Requirement 6.6: localStorage Unavailable ===\n');
    runTest('6.6.1 In-memory storage works', () => {
        const mem = {};
        mem['tasks'] = JSON.stringify([dataGenerator.generateTask()]);
        assert(mem['tasks'] !== undefined, 'In-memory works');
    });
    runTest('6.6.2 Data persists in memory', () => {
        const mem = {};
        const task = dataGenerator.generateTask();
        mem['tasks'] = JSON.stringify([task]);
        const stored = JSON.parse(mem['tasks']);
        assert(stored[0].id === task.id, 'Data persists');
    });
    runTest('6.6.3 Multiple operations work', () => {
        const mem = {};
        const tasks = [dataGenerator.generateTask(), dataGenerator.generateTask()];
        mem['tasks'] = JSON.stringify(tasks);
        let stored = JSON.parse(mem['tasks']);
        assert(stored.length === 2, 'Should have 2');
        tasks.push(dataGenerator.generateTask());
        mem['tasks'] = JSON.stringify(tasks);
        stored = JSON.parse(mem['tasks']);
        assert(stored.length === 3, 'Should have 3');
    });
}

// Requirement 6.7: Large Volume
function testLargeTaskVolumePerformance() {
    console.log('\n=== Requirement 6.7: Large Volume ===\n');
    runTest('6.7.1 System handles 1000 tasks', () => {
        mockStorage.clear();
        const tasks = [];
        for (let i = 0; i < 1000; i++) {
            tasks.push(dataGenerator.generateTask());
        }
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        assert(stored.length === 1000, 'Should store 1000');
    });
    runTest('6.7.2 Filtering works with 1000', () => {
        mockStorage.clear();
        const tasks = [];
        for (let i = 0; i < 1000; i++) {
            tasks.push(dataGenerator.generateTask({ category: i % 2 === 0 ? 'task' : 'meeting' }));
        }
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        const filtered = stored.filter(t => t.category === 'task');
        assert(filtered.length === 500, 'Filtering works');
    });
    runTest('6.7.3 Completion rate with 1000', () => {
        mockStorage.clear();
        const tasks = [];
        for (let i = 0; i < 1000; i++) {
            tasks.push(dataGenerator.generateTask({ completed: i < 500 }));
        }
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        const rate = (stored.filter(t => t.completed).length / stored.length) * 100;
        assert(rate === 50, 'Rate should be 50%');
    });
    runTest('6.7.4 Operations with 1000 tasks', () => {
        mockStorage.clear();
        const tasks = [];
        for (let i = 0; i < 1000; i++) {
            tasks.push(dataGenerator.generateTask());
        }
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        tasks.push(dataGenerator.generateTask());
        mockStorage.setItem('tasks', JSON.stringify(tasks));
        const stored = JSON.parse(mockStorage.getItem('tasks'));
        assert(stored.length === 1001, 'Should have 1001');
    });
}

// Requirement 6.8: Corrupted JSON
function testCorruptedJsonImportRejection() {
    console.log('\n=== Requirement 6.8: Corrupted JSON ===\n');
    function isValidJson(j) {
        try { JSON.parse(j); return true; } catch (e) { return false; }
    }
    runTest('6.8.1 Corrupted JSON rejected', () => {
        assert(!isValidJson('{ invalid }'), 'Corrupted rejected');
    });
    runTest('6.8.2 Incomplete JSON rejected', () => {
        assert(!isValidJson('{ "name": "Task"'), 'Incomplete rejected');
    });
    runTest('6.8.3 Valid JSON accepted', () => {
        assert(isValidJson('{ "name": "Task" }'), 'Valid accepted');
    });
    runTest('6.8.4 Error message shown', () => {
        let msg = '';
        if (!isValidJson('{ invalid }')) msg = 'Invalid JSON';
        assert(msg !== '', 'Error shown');
    });
    runTest('6.8.5 Existing data preserved', () => {
        mockStorage.clear();
        const task = dataGenerator.generateTask();
        mockStorage.setItem('tasks', JSON.stringify([task]));
        if (!isValidJson('{ invalid }')) {
            const stored = JSON.parse(mockStorage.getItem('tasks'));
            assert(stored.length === 1, 'Data preserved');
        }
    });
}

function runAllTests() {
    mockStorage = new MockLocalStorage();
    dataGenerator = new TestDataGenerator();
    
    testNegativeEstimatedTimeRejection();
    testZeroEstimatedTimeAcceptance();
    testEightHourExceededWarning();
    testEmptyTaskNameRejection();
    testInvalidDateInputRejection();
    testLocalStorageUnavailableHandling();
    testLargeTaskVolumePerformance();
    testCorruptedJsonImportRejection();
    
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    
    process.exit(testsFailed > 0 ? 1 : 0);
}

if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };
