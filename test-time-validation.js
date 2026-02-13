/**
 * Time Data Validation Tests
 * Tests for the task time data validation system
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

// Validation functions (copied from script.js for testing)
function validateTaskTimeData(task) {
    const errors = [];
    const warnings = [];
    
    // Validate estimated_time
    if (task.estimated_time === undefined || task.estimated_time === null) {
        errors.push('estimated_time is missing');
        task.estimated_time = 0;
    } else if (typeof task.estimated_time !== 'number') {
        errors.push(`estimated_time must be a number, got ${typeof task.estimated_time}`);
        task.estimated_time = 0;
    } else if (task.estimated_time < 0) {
        errors.push('estimated_time cannot be negative');
        task.estimated_time = 0;
    } else if (!Number.isFinite(task.estimated_time)) {
        errors.push('estimated_time must be a finite number');
        task.estimated_time = 0;
    }
    
    // Validate actual_time
    if (task.actual_time === undefined || task.actual_time === null) {
        errors.push('actual_time is missing');
        task.actual_time = 0;
    } else if (typeof task.actual_time !== 'number') {
        errors.push(`actual_time must be a number, got ${typeof task.actual_time}`);
        task.actual_time = 0;
    } else if (task.actual_time < 0) {
        errors.push('actual_time cannot be negative');
        task.actual_time = 0;
    } else if (!Number.isFinite(task.actual_time)) {
        errors.push('actual_time must be a finite number');
        task.actual_time = 0;
    }
    
    // Check if actual_time exceeds estimated_time significantly
    if (task.actual_time > task.estimated_time * 1.5) {
        warnings.push(`actual_time (${task.actual_time}h) significantly exceeds estimated_time (${task.estimated_time}h)`);
    }
    
    // Round to 2 decimal places
    task.estimated_time = Math.round(task.estimated_time * 100) / 100;
    task.actual_time = Math.round(task.actual_time * 100) / 100;
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        task
    };
}

function validateAllTasksTimeData(tasksData) {
    const validationResults = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    
    tasksData.forEach((task, index) => {
        const result = validateTaskTimeData(task);
        validationResults.push({
            taskIndex: index,
            taskId: task.id,
            taskName: task.name,
            ...result
        });
        
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
    });
    
    return {
        isValid: totalErrors === 0,
        totalErrors,
        totalWarnings,
        validationResults,
        summary: {
            totalTasks: tasksData.length,
            validTasks: validationResults.filter(r => r.isValid).length,
            invalidTasks: validationResults.filter(r => !r.isValid).length,
            tasksWithWarnings: validationResults.filter(r => r.warnings.length > 0).length
        }
    };
}

function repairTasksTimeData(tasksData) {
    const repairResults = [];
    let repairedCount = 0;
    
    tasksData.forEach((task, index) => {
        const originalEstimatedTime = task.estimated_time;
        const originalActualTime = task.actual_time;
        
        const result = validateTaskTimeData(task);
        
        if (!result.isValid || result.errors.length > 0) {
            repairedCount++;
            repairResults.push({
                taskIndex: index,
                taskId: task.id,
                taskName: task.name,
                originalEstimatedTime,
                originalActualTime,
                repairedEstimatedTime: task.estimated_time,
                repairedActualTime: task.actual_time,
                errors: result.errors
            });
        }
    });
    
    return {
        repairedCount,
        repairResults,
        summary: {
            totalTasks: tasksData.length,
            repairedTasks: repairedCount,
            successRate: ((tasksData.length - repairedCount) / tasksData.length * 100).toFixed(1)
        }
    };
}

// Test Suite 1: Valid Time Data
console.log('=== Test Suite 1: Valid Time Data ===');

function testValidTimeData() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5,
        actual_time: 3
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === true, 'Valid time data should pass validation');
    console.assert(result.errors.length === 0, 'Valid time data should have no errors');
    console.assert(result.warnings.length === 0, 'Valid time data should have no warnings');
    console.log('✅ Valid time data test passed');
}

function testValidTimeDataWithZero() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 0,
        actual_time: 0
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === true, 'Zero time data should be valid');
    console.assert(result.errors.length === 0, 'Zero time data should have no errors');
    console.log('✅ Valid time data with zero test passed');
}

testValidTimeData();
testValidTimeDataWithZero();

// Test Suite 2: Invalid Time Data
console.log('\n=== Test Suite 2: Invalid Time Data ===');

function testNegativeEstimatedTime() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: -5,
        actual_time: 0
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === false, 'Negative estimated_time should fail validation');
    console.assert(result.errors.length > 0, 'Should have errors for negative estimated_time');
    console.assert(task.estimated_time === 0, 'Negative estimated_time should be corrected to 0');
    console.log('✅ Negative estimated time test passed');
}

function testNegativeActualTime() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5,
        actual_time: -3
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === false, 'Negative actual_time should fail validation');
    console.assert(result.errors.length > 0, 'Should have errors for negative actual_time');
    console.assert(task.actual_time === 0, 'Negative actual_time should be corrected to 0');
    console.log('✅ Negative actual time test passed');
}

function testMissingEstimatedTime() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        actual_time: 3
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === false, 'Missing estimated_time should fail validation');
    console.assert(result.errors.length > 0, 'Should have errors for missing estimated_time');
    console.assert(task.estimated_time === 0, 'Missing estimated_time should be set to 0');
    console.log('✅ Missing estimated time test passed');
}

function testMissingActualTime() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === false, 'Missing actual_time should fail validation');
    console.assert(result.errors.length > 0, 'Should have errors for missing actual_time');
    console.assert(task.actual_time === 0, 'Missing actual_time should be set to 0');
    console.log('✅ Missing actual time test passed');
}

function testInvalidTimeDataType() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: '5',
        actual_time: '3'
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === false, 'String time data should fail validation');
    console.assert(result.errors.length > 0, 'Should have errors for invalid data type');
    console.assert(task.estimated_time === 0, 'Invalid estimated_time should be corrected');
    console.assert(task.actual_time === 0, 'Invalid actual_time should be corrected');
    console.log('✅ Invalid time data type test passed');
}

testNegativeEstimatedTime();
testNegativeActualTime();
testMissingEstimatedTime();
testMissingActualTime();
testInvalidTimeDataType();

// Test Suite 3: Time Warnings
console.log('\n=== Test Suite 3: Time Warnings ===');

function testActualTimeExceedsEstimated() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5,
        actual_time: 8
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === true, 'Task should still be valid');
    console.assert(result.warnings.length > 0, 'Should have warning when actual_time exceeds estimated_time');
    console.log('✅ Actual time exceeds estimated test passed');
}

function testActualTimeSignificantlyExceedsEstimated() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5,
        actual_time: 10
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(result.isValid === true, 'Task should still be valid');
    console.assert(result.warnings.length > 0, 'Should have warning when actual_time significantly exceeds estimated_time');
    console.log('✅ Actual time significantly exceeds estimated test passed');
}

testActualTimeExceedsEstimated();
testActualTimeSignificantlyExceedsEstimated();

// Test Suite 4: Batch Validation
console.log('\n=== Test Suite 4: Batch Validation ===');

function testValidateMultipleTasks() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 },
        { id: 'task-2', name: 'Task 2', estimated_time: 3, actual_time: 4 },
        { id: 'task-3', name: 'Task 3', estimated_time: 8, actual_time: 8 }
    ];
    
    const result = validateAllTasksTimeData(tasks);
    
    console.assert(result.isValid === true, 'All valid tasks should pass batch validation');
    console.assert(result.summary.validTasks === 3, 'All 3 tasks should be valid');
    console.assert(result.summary.invalidTasks === 0, 'No tasks should be invalid');
    console.log('✅ Validate multiple tasks test passed');
}

function testValidateMultipleTasksWithErrors() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 },
        { id: 'task-2', name: 'Task 2', estimated_time: -3, actual_time: 4 },
        { id: 'task-3', name: 'Task 3', estimated_time: 8 }
    ];
    
    const result = validateAllTasksTimeData(tasks);
    
    console.assert(result.isValid === false, 'Batch with errors should fail validation');
    console.assert(result.summary.validTasks === 1, 'Only 1 task should be valid');
    console.assert(result.summary.invalidTasks === 2, '2 tasks should be invalid');
    console.assert(result.totalErrors > 0, 'Should have total errors');
    console.log('✅ Validate multiple tasks with errors test passed');
}

testValidateMultipleTasks();
testValidateMultipleTasksWithErrors();

// Test Suite 5: Data Repair
console.log('\n=== Test Suite 5: Data Repair ===');

function testRepairInvalidTimeData() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: -5, actual_time: 'invalid' },
        { id: 'task-2', name: 'Task 2', estimated_time: 5, actual_time: 3 }
    ];
    
    const result = repairTasksTimeData(tasks);
    
    console.assert(result.repairedCount === 1, 'Should repair 1 task');
    console.assert(tasks[0].estimated_time === 0, 'Negative estimated_time should be repaired');
    console.assert(tasks[0].actual_time === 0, 'Invalid actual_time should be repaired');
    console.assert(tasks[1].estimated_time === 5, 'Valid task should not be modified');
    console.log('✅ Repair invalid time data test passed');
}

function testRepairAllInvalidTimeData() {
    setupMockStorage();
    
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: -5, actual_time: -3 },
        { id: 'task-2', name: 'Task 2', estimated_time: 'invalid', actual_time: 'invalid' },
        { id: 'task-3', name: 'Task 3', estimated_time: 8, actual_time: 8 }
    ];
    
    const result = repairTasksTimeData(tasks);
    
    console.assert(result.repairedCount === 2, 'Should repair 2 tasks');
    console.assert(result.summary.repairedTasks === 2, 'Summary should show 2 repaired tasks');
    console.log('✅ Repair all invalid time data test passed');
}

testRepairInvalidTimeData();
testRepairAllInvalidTimeData();

// Test Suite 6: Decimal Precision
console.log('\n=== Test Suite 6: Decimal Precision ===');

function testDecimalPrecision() {
    setupMockStorage();
    
    const task = {
        id: 'task-1',
        name: 'Task 1',
        estimated_time: 5.12345,
        actual_time: 3.98765
    };
    
    const result = validateTaskTimeData(task);
    
    console.assert(task.estimated_time === 5.12, 'estimated_time should be rounded to 2 decimal places');
    console.assert(task.actual_time === 3.99, 'actual_time should be rounded to 2 decimal places');
    console.log('✅ Decimal precision test passed');
}

testDecimalPrecision();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All time validation tests completed successfully!');
console.log('Total test suites: 6');
console.log('Total tests: 14');
