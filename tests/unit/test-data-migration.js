/**
 * Data Migration Unit Tests
 * Tests for data migration functionality: actual_time field, recurring fields, history tracking, and safety
 * 
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

// Test configuration
const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const ARCHIVE_STORAGE_KEY = 'weekly-task-board.archive';
const MIGRATION_HISTORY_KEY = 'weekly-task-board.migration-history';
const CURRENT_MIGRATION_VERSION = '1.1';

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
 * Get migration history from mock storage
 */
function getMigrationHistory() {
    const historyJson = mockStorage.getItem(MIGRATION_HISTORY_KEY);
    if (!historyJson) {
        return {
            version: '0.0',
            lastMigrationDate: null,
            migrations: []
        };
    }
    try {
        return JSON.parse(historyJson);
    } catch (error) {
        return {
            version: '0.0',
            lastMigrationDate: null,
            migrations: []
        };
    }
}

/**
 * Save migration history to mock storage
 */
function saveMigrationHistory(history) {
    mockStorage.setItem(MIGRATION_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Backup tasks before migration
 */
function backupTasksBeforeMigration() {
    const timestamp = new Date().toISOString();
    const backupKey = `weekly-task-board.backup-${timestamp}`;
    const currentTasks = mockStorage.getItem(TASKS_STORAGE_KEY);
    if (currentTasks) {
        mockStorage.setItem(backupKey, currentTasks);
    }
    return backupKey;
}

/**
 * Migrate tasks to add actual_time field
 */
function migrateTasksAddActualTime(tasksData) {
    return tasksData.map(task => {
        if (task.actual_time === undefined) {
            return {
                ...task,
                actual_time: 0
            };
        }
        return task;
    });
}

/**
 * Migrate tasks to add recurring task fields
 */
function migrateTasksAddRecurringFields(tasksData) {
    return tasksData.map(task => {
        const updatedTask = { ...task };
        
        if (updatedTask.is_recurring === undefined) {
            updatedTask.is_recurring = false;
        }
        if (updatedTask.recurrence_pattern === undefined) {
            updatedTask.recurrence_pattern = null;
        }
        if (updatedTask.recurrence_end_date === undefined) {
            updatedTask.recurrence_end_date = null;
        }
        
        return updatedTask;
    });
}

/**
 * Execute all pending migrations
 */
function executeMigrations(tasksData) {
    const history = getMigrationHistory();
    let migratedData = tasksData;
    
    // Version 0.0 -> 1.0: Add actual_time field
    if (history.version < '1.0') {
        migratedData = migrateTasksAddActualTime(migratedData);
        
        history.migrations.push({
            version: '1.0',
            date: new Date().toISOString(),
            description: 'Added actual_time field to all tasks'
        });
        history.version = '1.0';
        history.lastMigrationDate = new Date().toISOString();
        saveMigrationHistory(history);
    }
    
    // Version 1.0 -> 1.1: Add recurring task fields
    if (history.version < '1.1') {
        migratedData = migrateTasksAddRecurringFields(migratedData);
        
        history.migrations.push({
            version: '1.1',
            date: new Date().toISOString(),
            description: 'Added is_recurring, recurrence_pattern, and recurrence_end_date fields to all tasks'
        });
        history.version = '1.1';
        history.lastMigrationDate = new Date().toISOString();
        saveMigrationHistory(history);
    }
    
    return migratedData;
}

/**
 * Migrate archived tasks to add actual_time field
 */
function migrateArchivedTasksAddActualTime(archivedTasks) {
    return archivedTasks.map(task => {
        if (task.actual_time === undefined) {
            return {
                ...task,
                actual_time: 0
            };
        }
        return task;
    });
}

/**
 * Migrate archived tasks to add recurring fields
 */
function migrateArchivedTasksAddRecurringFields(archivedTasks) {
    return archivedTasks.map(task => {
        const updatedTask = { ...task };
        
        if (updatedTask.is_recurring === undefined) {
            updatedTask.is_recurring = false;
        }
        if (updatedTask.recurrence_pattern === undefined) {
            updatedTask.recurrence_pattern = null;
        }
        if (updatedTask.recurrence_end_date === undefined) {
            updatedTask.recurrence_end_date = null;
        }
        
        return updatedTask;
    });
}

/**
 * Load tasks from mock storage
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
 * Save tasks to mock storage
 */
function saveTasks(tasks) {
    mockStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Load archived tasks from mock storage
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
 * Save archived tasks to mock storage
 */
function saveArchivedTasks(archivedTasks) {
    mockStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedTasks));
}

/**
 * Restore tasks from backup
 */
function restoreFromBackup(backupKey) {
    const backupData = mockStorage.getItem(backupKey);
    if (backupData) {
        mockStorage.setItem(TASKS_STORAGE_KEY, backupData);
        return true;
    }
    return false;
}

/**
 * Validate data integrity after migration
 */
function validateDataIntegrity(tasks) {
    const errors = [];
    
    tasks.forEach((task, index) => {
        // Check required fields
        if (!task.id) errors.push(`Task ${index}: missing id`);
        if (!task.name) errors.push(`Task ${index}: missing name`);
        if (task.estimated_time === undefined) errors.push(`Task ${index}: missing estimated_time`);
        if (task.actual_time === undefined) errors.push(`Task ${index}: missing actual_time`);
        if (task.is_recurring === undefined) errors.push(`Task ${index}: missing is_recurring`);
        if (task.recurrence_pattern === undefined) errors.push(`Task ${index}: missing recurrence_pattern`);
        if (task.recurrence_end_date === undefined) errors.push(`Task ${index}: missing recurrence_end_date`);
        
        // Check field types
        if (typeof task.actual_time !== 'number') errors.push(`Task ${index}: actual_time must be number`);
        if (typeof task.is_recurring !== 'boolean') errors.push(`Task ${index}: is_recurring must be boolean`);
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================================
// Test Suite 12.1: Migration Execution Logic
// ============================================================================

console.log('\n=== Test Suite 12.1: Migration Execution Logic ===');

/**
 * Test 12.1.1: actual_time field migration
 * Validates: Requirement 11.1
 */
runTest('12.1.1: actual_time field migration', () => {
    // Create old tasks without actual_time field
    const oldTasks = [
        testGenerator.generateTask({ id: 'task-1', name: 'Task 1', estimated_time: 5 }),
        testGenerator.generateTask({ id: 'task-2', name: 'Task 2', estimated_time: 3 })
    ];
    
    // Remove actual_time field to simulate old data
    oldTasks.forEach(task => delete task.actual_time);
    
    // Save old tasks
    saveTasks(oldTasks);
    
    // Execute migration
    let tasks = loadTasks();
    tasks = executeMigrations(tasks);
    saveTasks(tasks);
    
    // Verify migration
    tasks = loadTasks();
    assertArrayLength(tasks, 2, 'Should have 2 tasks');
    assert(tasks[0].actual_time === 0, 'Task 1 should have actual_time: 0');
    assert(tasks[1].actual_time === 0, 'Task 2 should have actual_time: 0');
});

/**
 * Test 12.1.2: recurring fields migration
 * Validates: Requirement 11.2
 */
runTest('12.1.2: recurring fields migration', () => {
    // Create old tasks without recurring fields
    const oldTasks = [
        testGenerator.generateTask({ id: 'task-1', name: 'Task 1' }),
        testGenerator.generateTask({ id: 'task-2', name: 'Task 2' })
    ];
    
    // Remove recurring fields to simulate old data
    oldTasks.forEach(task => {
        delete task.is_recurring;
        delete task.recurrence_pattern;
        delete task.recurrence_end_date;
    });
    
    // Save old tasks
    saveTasks(oldTasks);
    
    // Execute migration
    let tasks = loadTasks();
    tasks = executeMigrations(tasks);
    saveTasks(tasks);
    
    // Verify migration
    tasks = loadTasks();
    assertArrayLength(tasks, 2, 'Should have 2 tasks');
    assert(tasks[0].is_recurring === false, 'Task 1 should have is_recurring: false');
    assert(tasks[0].recurrence_pattern === null, 'Task 1 should have recurrence_pattern: null');
    assert(tasks[0].recurrence_end_date === null, 'Task 1 should have recurrence_end_date: null');
    assert(tasks[1].is_recurring === false, 'Task 2 should have is_recurring: false');
});

/**
 * Test 12.1.3: migration history recording
 * Validates: Requirement 11.3
 */
runTest('12.1.3: migration history recording', () => {
    // Create old tasks
    const oldTasks = [testGenerator.generateTask({ id: 'task-1', name: 'Task 1' })];
    delete oldTasks[0].actual_time;
    
    saveTasks(oldTasks);
    
    // Execute migration
    let tasks = loadTasks();
    tasks = executeMigrations(tasks);
    saveTasks(tasks);
    
    // Verify migration history
    const history = getMigrationHistory();
    assert(history.version === '1.1', 'Migration version should be 1.1');
    assert(history.migrations.length >= 1, 'Should have at least 1 migration record');
    assert(history.lastMigrationDate !== null, 'Should have lastMigrationDate');
    
    // Check for actual_time migration
    const actualTimeMigration = history.migrations.find(m => m.version === '1.0');
    assert(actualTimeMigration !== undefined, 'Should have actual_time migration record');
    
    // Check for recurring fields migration
    const recurringMigration = history.migrations.find(m => m.version === '1.1');
    assert(recurringMigration !== undefined, 'Should have recurring fields migration record');
});

/**
 * Test 12.1.4: duplicate migration prevention
 * Validates: Requirement 11.4
 */
runTest('12.1.4: duplicate migration prevention', () => {
    // Create tasks with all fields already present
    const tasks = [
        testGenerator.generateTask({
            id: 'task-1',
            name: 'Task 1',
            actual_time: 2,
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null
        })
    ];
    
    saveTasks(tasks);
    
    // Set migration history to current version
    const history = {
        version: '1.1',
        lastMigrationDate: new Date().toISOString(),
        migrations: [
            { version: '1.0', date: new Date().toISOString(), description: 'Added actual_time' },
            { version: '1.1', date: new Date().toISOString(), description: 'Added recurring fields' }
        ]
    };
    saveMigrationHistory(history);
    
    // Load and execute migrations
    let loadedTasks = loadTasks();
    const originalLength = loadedTasks[0].actual_time;
    loadedTasks = executeMigrations(loadedTasks);
    
    // Verify no duplicate migration occurred
    assert(loadedTasks[0].actual_time === originalLength, 'actual_time should not be modified');
    
    const updatedHistory = getMigrationHistory();
    assert(updatedHistory.version === '1.1', 'Version should remain 1.1');
    assert(updatedHistory.migrations.length === 2, 'Should have exactly 2 migration records');
});

// ============================================================================
// Test Suite 12.2: Migration Safety
// ============================================================================

console.log('\n=== Test Suite 12.2: Migration Safety ===');

/**
 * Test 12.2.1: data backup creation
 * Validates: Requirement 11.5
 */
runTest('12.2.1: data backup creation', () => {
    // Create tasks
    const tasks = [
        testGenerator.generateTask({ id: 'task-1', name: 'Task 1', estimated_time: 5 }),
        testGenerator.generateTask({ id: 'task-2', name: 'Task 2', estimated_time: 3 })
    ];
    
    saveTasks(tasks);
    
    // Create backup
    const backupKey = backupTasksBeforeMigration();
    
    // Verify backup exists
    const backupData = mockStorage.getItem(backupKey);
    assert(backupData !== null, 'Backup should be created');
    
    const backupTasks = JSON.parse(backupData);
    assertArrayLength(backupTasks, 2, 'Backup should contain 2 tasks');
    assert(backupTasks[0].id === 'task-1', 'Backup should contain task-1');
    assert(backupTasks[1].id === 'task-2', 'Backup should contain task-2');
});

/**
 * Test 12.2.2: migration failure recovery
 * Validates: Requirement 11.6
 */
runTest('12.2.2: migration failure recovery', () => {
    // Create original tasks
    const originalTasks = [
        testGenerator.generateTask({ id: 'task-1', name: 'Task 1', estimated_time: 5 })
    ];
    
    saveTasks(originalTasks);
    
    // Create backup
    const backupKey = backupTasksBeforeMigration();
    
    // Simulate migration failure by corrupting data
    mockStorage.setItem(TASKS_STORAGE_KEY, 'corrupted data');
    
    // Restore from backup
    const restored = restoreFromBackup(backupKey);
    assert(restored === true, 'Restore should succeed');
    
    // Verify restored data
    const restoredTasks = loadTasks();
    assertArrayLength(restoredTasks, 1, 'Should have 1 task after restore');
    assert(restoredTasks[0].id === 'task-1', 'Restored task should be task-1');
});

/**
 * Test 12.2.3: data integrity validation
 * Validates: Requirement 11.7
 */
runTest('12.2.3: data integrity validation', () => {
    // Create tasks with all required fields
    const tasks = [
        testGenerator.generateTask({
            id: 'task-1',
            name: 'Task 1',
            actual_time: 2,
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null
        })
    ];
    
    // Validate integrity
    const validation = validateDataIntegrity(tasks);
    assert(validation.isValid === true, 'Data should be valid');
    assertArrayLength(validation.errors, 0, 'Should have no errors');
});

/**
 * Test 12.2.4: archived task migration
 * Validates: Requirement 11.8
 */
runTest('12.2.4: archived task migration', () => {
    // Create archived tasks without actual_time and recurring fields
    const archivedTasks = [
        {
            id: 'archived-1',
            name: 'Archived Task 1',
            estimated_time: 5,
            priority: 'high',
            category: 'task',
            assigned_date: '2024-01-01',
            completed: true
        }
    ];
    
    saveArchivedTasks(archivedTasks);
    
    // Migrate archived tasks
    let archived = loadArchivedTasks();
    archived = migrateArchivedTasksAddActualTime(archived);
    archived = migrateArchivedTasksAddRecurringFields(archived);
    saveArchivedTasks(archived);
    
    // Verify migration
    archived = loadArchivedTasks();
    assertArrayLength(archived, 1, 'Should have 1 archived task');
    assert(archived[0].actual_time === 0, 'Archived task should have actual_time: 0');
    assert(archived[0].is_recurring === false, 'Archived task should have is_recurring: false');
    assert(archived[0].recurrence_pattern === null, 'Archived task should have recurrence_pattern: null');
    assert(archived[0].recurrence_end_date === null, 'Archived task should have recurrence_end_date: null');
});

// ============================================================================
// Print Test Summary
// ============================================================================

console.log('\n=== Test Summary ===');
const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
const total = testResults.length;
const successRate = ((passed / total) * 100).toFixed(1);

console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}, Success Rate: ${successRate}%`);

if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
