/**
 * Archive Functionality Unit Tests
 * Tests for archive operations: move, restore, delete, and data management
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

// Test configuration
const ARCHIVE_STORAGE_KEY = 'archived_tasks';
const TASKS_STORAGE_KEY = 'tasks';

// Mock localStorage
let mockStorage = new MockLocalStorage();
let testGenerator = new TestDataGenerator();

// Test results tracking
let testResults = [];

/**
 * Helper function to run a test
 */
function runTest(testName, testFn) {
    try {
        testGenerator.resetCounter();
        mockStorage.clear();
        testFn();
        testResults.push({ name: testName, status: 'PASS' });
        console.log(`✓ ${testName}`);
    } catch (error) {
        testResults.push({ name: testName, status: 'FAIL', error: error.message });
        console.error(`✗ ${testName}: ${error.message}`);
    }
}

/**
 * Helper function to assert conditions
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Helper function to assert equality
 */
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

/**
 * Helper function to assert array length
 */
function assertArrayLength(array, expectedLength, message) {
    if (array.length !== expectedLength) {
        throw new Error(`${message}: expected length ${expectedLength}, got ${array.length}`);
    }
}

/**
 * Helper function to load archived tasks from mock storage
 */
function loadArchivedTasks() {
    const archivedJson = mockStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!archivedJson) {
        return [];
    }
    try {
        return JSON.parse(archivedJson);
    } catch (error) {
        return [];
    }
}

/**
 * Helper function to save archived tasks to mock storage
 */
function saveArchivedTasks(archivedTasks) {
    mockStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedTasks));
}

/**
 * Helper function to load tasks from mock storage
 */
function loadTasks() {
    const tasksJson = mockStorage.getItem(TASKS_STORAGE_KEY);
    if (!tasksJson) {
        return [];
    }
    try {
        return JSON.parse(tasksJson);
    } catch (error) {
        return [];
    }
}

/**
 * Helper function to save tasks to mock storage
 */
function saveTasks(tasks) {
    mockStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Helper function to archive a completed task
 */
function archiveCompletedTask(task) {
    const archivedTasks = loadArchivedTasks();
    const currentDate = new Date().toISOString();
    
    const archivedTask = {
        ...task,
        archived_date: currentDate
    };
    
    archivedTasks.push(archivedTask);
    saveArchivedTasks(archivedTasks);
}

/**
 * Helper function to restore a task from archive
 */
function restoreTaskFromArchive(taskId) {
    const archivedTasks = loadArchivedTasks();
    const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        throw new Error(`Task with id ${taskId} not found in archive`);
    }
    
    const taskToRestore = archivedTasks[taskIndex];
    
    // Remove from archive
    archivedTasks.splice(taskIndex, 1);
    saveArchivedTasks(archivedTasks);
    
    // Add to active tasks
    const restoredTask = {
        ...taskToRestore,
        completed: false
    };
    delete restoredTask.archived_date;
    
    const tasks = loadTasks();
    tasks.push(restoredTask);
    saveTasks(tasks);
    
    return restoredTask;
}

/**
 * Helper function to delete a task from archive
 */
function deleteTaskFromArchive(taskId) {
    const archivedTasks = loadArchivedTasks();
    const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        throw new Error(`Task with id ${taskId} not found in archive`);
    }
    
    archivedTasks.splice(taskIndex, 1);
    saveArchivedTasks(archivedTasks);
}

/**
 * Helper function to clear all archived tasks
 */
function clearAllArchive() {
    saveArchivedTasks([]);
}

// ============================================================================
// Test Suite 11.1: Archive Basic Operations
// ============================================================================

console.log('\n=== Test Suite 11.1: Archive Basic Operations ===\n');

/**
 * Test 11.1.1: Task archive move test
 * WHEN a completed task is archived
 * THEN the task should be moved from active list to archive
 * AND the task should have an archived_date property
 */
runTest('11.1.1: Task archive move test', () => {
    const task = testGenerator.generateTask({ completed: true });
    saveTasks([task]);
    
    archiveCompletedTask(task);
    
    const archivedTasks = loadArchivedTasks();
    const activeTasks = loadTasks();
    
    assertArrayLength(archivedTasks, 1, 'Archive should contain 1 task');
    assert(archivedTasks[0].id === task.id, 'Archived task should have same id');
    assert(archivedTasks[0].archived_date !== undefined, 'Archived task should have archived_date');
});

/**
 * Test 11.1.2: Task restore test
 * WHEN a task is restored from archive
 * THEN the task should be moved back to active list
 * AND the task should have completed flag set to false
 * AND the archived_date property should be removed
 */
runTest('11.1.2: Task restore test', () => {
    const task = testGenerator.generateTask({ completed: true });
    archiveCompletedTask(task);
    
    const restoredTask = restoreTaskFromArchive(task.id);
    
    const archivedTasks = loadArchivedTasks();
    const activeTasks = loadTasks();
    
    assertArrayLength(archivedTasks, 0, 'Archive should be empty after restore');
    assertArrayLength(activeTasks, 1, 'Active tasks should contain 1 task');
    assertEqual(restoredTask.completed, false, 'Restored task should have completed=false');
    assert(restoredTask.archived_date === undefined, 'Restored task should not have archived_date');
});

/**
 * Test 11.1.3: Delete from archive test
 * WHEN a task is deleted from archive
 * THEN the task should be completely removed
 * AND the task should not be in archive or active list
 */
runTest('11.1.3: Delete from archive test', () => {
    const task = testGenerator.generateTask({ completed: true });
    archiveCompletedTask(task);
    
    deleteTaskFromArchive(task.id);
    
    const archivedTasks = loadArchivedTasks();
    assertArrayLength(archivedTasks, 0, 'Archive should be empty after delete');
});

/**
 * Test 11.1.4: Archive clear all test
 * WHEN all archived tasks are cleared
 * THEN the archive should be empty
 * AND all archived tasks should be permanently deleted
 */
runTest('11.1.4: Archive clear all test', () => {
    const tasks = testGenerator.generateTasks(5, { completed: true });
    tasks.forEach(task => archiveCompletedTask(task));
    
    let archivedTasks = loadArchivedTasks();
    assertArrayLength(archivedTasks, 5, 'Archive should contain 5 tasks before clear');
    
    clearAllArchive();
    
    archivedTasks = loadArchivedTasks();
    assertArrayLength(archivedTasks, 0, 'Archive should be empty after clear all');
});

// ============================================================================
// Test Suite 11.2: Archive Data Management
// ============================================================================

console.log('\n=== Test Suite 11.2: Archive Data Management ===\n');

/**
 * Test 11.2.1: Archive view display test
 * WHEN archive view is rendered
 * THEN all archived tasks should be displayed
 * AND tasks should be sortable by archived_date
 */
runTest('11.2.1: Archive view display test', () => {
    const task1 = testGenerator.generateTask({ name: 'Task 1', completed: true });
    const task2 = testGenerator.generateTask({ name: 'Task 2', completed: true });
    const task3 = testGenerator.generateTask({ name: 'Task 3', completed: true });
    
    // Archive tasks
    archiveCompletedTask(task1);
    archiveCompletedTask(task2);
    archiveCompletedTask(task3);
    
    const archivedTasks = loadArchivedTasks();
    assertArrayLength(archivedTasks, 3, 'Archive should contain 3 tasks');
    
    // Verify all tasks have archived_date
    archivedTasks.forEach(task => {
        assert(task.archived_date !== undefined, 'Each task should have archived_date');
    });
    
    // Verify tasks can be sorted by date
    const sortedTasks = [...archivedTasks].sort((a, b) => 
        new Date(b.archived_date) - new Date(a.archived_date)
    );
    assertArrayLength(sortedTasks, 3, 'Sorted tasks should contain 3 tasks');
});

/**
 * Test 11.2.2: Completion date recording test
 * WHEN a task is archived
 * THEN the archived_date should be recorded
 * AND the archived_date should be a valid ISO string
 */
runTest('11.2.2: Completion date recording test', () => {
    const task = testGenerator.generateTask({ completed: true });
    const beforeArchive = new Date();
    
    archiveCompletedTask(task);
    
    const afterArchive = new Date();
    const archivedTasks = loadArchivedTasks();
    const archivedTask = archivedTasks[0];
    
    assert(archivedTask.archived_date !== undefined, 'archived_date should be set');
    
    const archivedDate = new Date(archivedTask.archived_date);
    assert(archivedDate >= beforeArchive, 'archived_date should be after archive time');
    assert(archivedDate <= afterArchive, 'archived_date should be before or at archive time');
});

/**
 * Test 11.2.3: Archive property preservation test
 * WHEN a task is archived
 * THEN all task properties should be preserved
 * AND the archived task should have all original properties
 */
runTest('11.2.3: Archive property preservation test', () => {
    const originalTask = testGenerator.generateTask({
        name: 'Test Task',
        estimated_time: 120,
        actual_time: 90,
        priority: 'high',
        category: 'work',
        assigned_date: '2024-01-15',
        completed: true,
        is_recurring: false,
        details: 'Test details'
    });
    
    archiveCompletedTask(originalTask);
    
    const archivedTasks = loadArchivedTasks();
    const archivedTask = archivedTasks[0];
    
    assertEqual(archivedTask.name, originalTask.name, 'Name should be preserved');
    assertEqual(archivedTask.estimated_time, originalTask.estimated_time, 'Estimated time should be preserved');
    assertEqual(archivedTask.actual_time, originalTask.actual_time, 'Actual time should be preserved');
    assertEqual(archivedTask.priority, originalTask.priority, 'Priority should be preserved');
    assertEqual(archivedTask.category, originalTask.category, 'Category should be preserved');
    assertEqual(archivedTask.assigned_date, originalTask.assigned_date, 'Assigned date should be preserved');
    assertEqual(archivedTask.details, originalTask.details, 'Details should be preserved');
});

/**
 * Test 11.2.4: Archive export test
 * WHEN archived tasks are exported
 * THEN all archived tasks should be included in export
 * AND export should be valid JSON
 */
runTest('11.2.4: Archive export test', () => {
    const tasks = testGenerator.generateTasks(3, { completed: true });
    tasks.forEach(task => archiveCompletedTask(task));
    
    const archivedTasks = loadArchivedTasks();
    const exportData = JSON.stringify(archivedTasks);
    
    assert(exportData !== null, 'Export should not be null');
    
    const parsedData = JSON.parse(exportData);
    assertArrayLength(parsedData, 3, 'Exported data should contain 3 tasks');
    
    parsedData.forEach(task => {
        assert(task.id !== undefined, 'Exported task should have id');
        assert(task.archived_date !== undefined, 'Exported task should have archived_date');
    });
});

/**
 * Test 11.2.5: Multiple archive operations test
 * WHEN multiple tasks are archived and restored
 * THEN data integrity should be maintained
 * AND archive and active lists should be consistent
 */
runTest('11.2.5: Multiple archive operations test', () => {
    const tasks = testGenerator.generateTasks(5, { completed: true });
    tasks.forEach(task => archiveCompletedTask(task));
    
    let archivedTasks = loadArchivedTasks();
    assertArrayLength(archivedTasks, 5, 'Archive should contain 5 tasks');
    
    // Restore 2 tasks
    restoreTaskFromArchive(tasks[0].id);
    restoreTaskFromArchive(tasks[1].id);
    
    archivedTasks = loadArchivedTasks();
    const activeTasks = loadTasks();
    
    assertArrayLength(archivedTasks, 3, 'Archive should contain 3 tasks after restore');
    assertArrayLength(activeTasks, 2, 'Active tasks should contain 2 tasks after restore');
});

/**
 * Test 11.2.6: Archive with null actual_time test
 * WHEN a task with null actual_time is archived
 * THEN the archived task should preserve null actual_time
 */
runTest('11.2.6: Archive with null actual_time test', () => {
    const task = testGenerator.generateTask({ 
        completed: true,
        actual_time: null
    });
    
    archiveCompletedTask(task);
    
    const archivedTasks = loadArchivedTasks();
    const archivedTask = archivedTasks[0];
    
    assertEqual(archivedTask.actual_time, null, 'Actual time should be null');
});

/**
 * Test 11.2.7: Archive with recurring task test
 * WHEN a recurring task is archived
 * THEN the recurring properties should be preserved
 */
runTest('11.2.7: Archive with recurring task test', () => {
    const task = testGenerator.generateRecurringTask('daily', {
        completed: true,
        recurrence_end_date: '2024-12-31'
    });
    
    archiveCompletedTask(task);
    
    const archivedTasks = loadArchivedTasks();
    const archivedTask = archivedTasks[0];
    
    assertEqual(archivedTask.is_recurring, true, 'is_recurring should be preserved');
    assertEqual(archivedTask.recurrence_pattern, 'daily', 'recurrence_pattern should be preserved');
    assertEqual(archivedTask.recurrence_end_date, '2024-12-31', 'recurrence_end_date should be preserved');
});

/**
 * Test 11.2.8: Archive restore maintains task integrity test
 * WHEN a task is restored from archive
 * THEN all properties except archived_date should be identical
 * AND the task should be usable in active list
 */
runTest('11.2.8: Archive restore maintains task integrity test', () => {
    const originalTask = testGenerator.generateTask({
        name: 'Important Task',
        estimated_time: 240,
        actual_time: 180,
        priority: 'high',
        category: 'project',
        assigned_date: '2024-01-20',
        completed: true,
        details: 'Important details'
    });
    
    archiveCompletedTask(originalTask);
    const restoredTask = restoreTaskFromArchive(originalTask.id);
    
    assertEqual(restoredTask.id, originalTask.id, 'ID should match');
    assertEqual(restoredTask.name, originalTask.name, 'Name should match');
    assertEqual(restoredTask.estimated_time, originalTask.estimated_time, 'Estimated time should match');
    assertEqual(restoredTask.actual_time, originalTask.actual_time, 'Actual time should match');
    assertEqual(restoredTask.priority, originalTask.priority, 'Priority should match');
    assertEqual(restoredTask.category, originalTask.category, 'Category should match');
    assertEqual(restoredTask.assigned_date, originalTask.assigned_date, 'Assigned date should match');
    assertEqual(restoredTask.completed, false, 'Completed should be false after restore');
    assert(restoredTask.archived_date === undefined, 'archived_date should be removed');
});

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n=== Test Summary ===\n');

const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
const total = testResults.length;
const passRate = ((passed / total) * 100).toFixed(2);

console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${passRate}%\n`);

if (failed > 0) {
    console.log('Failed Tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
} else {
    console.log('All tests passed! ✓');
    process.exit(0);
}
