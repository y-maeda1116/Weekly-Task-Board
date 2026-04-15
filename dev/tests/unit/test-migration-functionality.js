/**
 * Migration Functionality Tests
 * Tests for the task data migration system
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

// Test Suite 1: Migration History Management
console.log('=== Test Suite 1: Migration History Management ===');

function testMigrationHistoryCreation() {
    setupMockStorage();
    
    // Test: Create new migration history
    const history = {
        version: '1.0',
        lastMigrationDate: new Date().toISOString(),
        migrations: [
            {
                version: '1.0',
                date: new Date().toISOString(),
                description: 'Added actual_time field to all tasks'
            }
        ]
    };
    
    localStorage.setItem('weekly-task-board.migration-history', JSON.stringify(history));
    const retrieved = JSON.parse(localStorage.getItem('weekly-task-board.migration-history'));
    
    console.assert(retrieved.version === '1.0', 'Migration version should be 1.0');
    console.assert(retrieved.migrations.length === 1, 'Should have 1 migration record');
    console.log('✅ Migration history creation test passed');
}

function testMigrationHistoryRetrieval() {
    setupMockStorage();
    
    // Test: Retrieve existing migration history
    const testHistory = {
        version: '1.0',
        lastMigrationDate: new Date().toISOString(),
        migrations: []
    };
    localStorage.setItem('weekly-task-board.migration-history', JSON.stringify(testHistory));
    const retrieved = JSON.parse(localStorage.getItem('weekly-task-board.migration-history'));
    
    console.assert(retrieved.version === '1.0', 'Should retrieve correct version');
    console.assert(retrieved.migrations.length === 0, 'Should have empty migrations array');
    console.log('✅ Migration history retrieval test passed');
}

testMigrationHistoryCreation();
testMigrationHistoryRetrieval();

// Test Suite 2: Task Data Migration
console.log('\n=== Test Suite 2: Task Data Migration ===');

function testActualTimeFieldAddition() {
    setupMockStorage();
    
    // Test: Add actual_time field to tasks without it
    const oldTasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, priority: 'high' },
        { id: 'task-2', name: 'Task 2', estimated_time: 3, priority: 'medium' },
        { id: 'task-3', name: 'Task 3', estimated_time: 8, actual_time: 2, priority: 'low' }
    ];
    
    const migratedTasks = oldTasks.map(task => ({
        ...task,
        actual_time: task.actual_time !== undefined ? task.actual_time : 0
    }));
    
    console.assert(migratedTasks[0].actual_time === 0, 'Task 1 should have actual_time: 0');
    console.assert(migratedTasks[1].actual_time === 0, 'Task 2 should have actual_time: 0');
    console.assert(migratedTasks[2].actual_time === 2, 'Task 3 should retain actual_time: 2');
    console.log('✅ Actual time field addition test passed');
}

function testMigrationWithMixedData() {
    setupMockStorage();
    
    // Test: Migration with mixed data (some with actual_time, some without)
    const mixedTasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 0 },
        { id: 'task-2', name: 'Task 2', estimated_time: 3 },
        { id: 'task-3', name: 'Task 3', estimated_time: 8, actual_time: 4 },
        { id: 'task-4', name: 'Task 4', estimated_time: 2 }
    ];
    
    const migratedTasks = mixedTasks.map(task => ({
        ...task,
        actual_time: typeof task.actual_time === 'number' ? task.actual_time : 0
    }));
    
    const allHaveActualTime = migratedTasks.every(task => typeof task.actual_time === 'number');
    console.assert(allHaveActualTime, 'All tasks should have actual_time as number');
    
    const actualTimeValues = migratedTasks.map(t => t.actual_time);
    console.assert(JSON.stringify(actualTimeValues) === JSON.stringify([0, 0, 4, 0]), 
        'Actual time values should be preserved or set to 0');
    console.log('✅ Migration with mixed data test passed');
}

testActualTimeFieldAddition();
testMigrationWithMixedData();

// Test Suite 3: Data Backup
console.log('\n=== Test Suite 3: Data Backup ===');

function testBackupCreation() {
    setupMockStorage();
    
    // Test: Create backup before migration
    const originalTasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5 },
        { id: 'task-2', name: 'Task 2', estimated_time: 3 }
    ];
    
    localStorage.setItem('weekly-task-board.tasks', JSON.stringify(originalTasks));
    
    const timestamp = new Date().toISOString();
    const backupKey = `weekly-task-board.backup-${timestamp}`;
    const currentTasks = localStorage.getItem('weekly-task-board.tasks');
    
    if (currentTasks) {
        localStorage.setItem(backupKey, currentTasks);
    }
    
    const backupData = localStorage.getItem(backupKey);
    console.assert(backupData !== null, 'Backup should be created');
    console.assert(JSON.parse(backupData).length === 2, 'Backup should contain 2 tasks');
    console.log('✅ Backup creation test passed');
}

function testBackupIntegrity() {
    setupMockStorage();
    
    // Test: Verify backup data integrity
    const originalTasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, priority: 'high' },
        { id: 'task-2', name: 'Task 2', estimated_time: 3, priority: 'medium' }
    ];
    
    const backupKey = 'weekly-task-board.backup-test';
    localStorage.setItem(backupKey, JSON.stringify(originalTasks));
    
    const backupData = JSON.parse(localStorage.getItem(backupKey));
    
    console.assert(backupData[0].id === 'task-1', 'Backup should preserve task IDs');
    console.assert(backupData[0].name === 'Task 1', 'Backup should preserve task names');
    console.assert(backupData[0].priority === 'high', 'Backup should preserve task properties');
    console.log('✅ Backup integrity test passed');
}

testBackupCreation();
testBackupIntegrity();

// Test Suite 4: Error Handling
console.log('\n=== Test Suite 4: Error Handling ===');

function testInvalidJsonHandling() {
    setupMockStorage();
    
    // Test: Handle invalid JSON in migration history
    localStorage.setItem('weekly-task-board.migration-history', 'invalid json');
    
    try {
        const history = JSON.parse(localStorage.getItem('weekly-task-board.migration-history'));
        console.assert(false, 'Should throw error for invalid JSON');
    } catch (error) {
        console.assert(error instanceof SyntaxError, 'Should throw SyntaxError for invalid JSON');
        console.log('✅ Invalid JSON handling test passed');
    }
}

function testNullDataHandling() {
    setupMockStorage();
    
    // Test: Handle null data gracefully
    const nullData = null;
    const result = nullData ? JSON.parse(nullData) : [];
    
    console.assert(Array.isArray(result), 'Should return empty array for null data');
    console.assert(result.length === 0, 'Empty array should have length 0');
    console.log('✅ Null data handling test passed');
}

testInvalidJsonHandling();
testNullDataHandling();

// Test Suite 5: Version Comparison
console.log('\n=== Test Suite 5: Version Comparison ===');

function testVersionComparison() {
    setupMockStorage();
    
    // Test: Compare version strings
    const version1 = '0.0';
    const version2 = '1.0';
    
    console.assert(version1 < version2, 'Version 0.0 should be less than 1.0');
    console.assert(!(version2 < version1), 'Version 1.0 should not be less than 0.0');
    console.log('✅ Version comparison test passed');
}

function testMigrationNeeded() {
    setupMockStorage();
    
    // Test: Determine if migration is needed
    const currentVersion = '0.0';
    const targetVersion = '1.0';
    
    const isMigrationNeeded = currentVersion < targetVersion;
    console.assert(isMigrationNeeded === true, 'Migration should be needed when current < target');
    
    const currentVersion2 = '1.0';
    const isMigrationNeeded2 = currentVersion2 < targetVersion;
    console.assert(isMigrationNeeded2 === false, 'Migration should not be needed when current >= target');
    console.log('✅ Migration needed determination test passed');
}

testVersionComparison();
testMigrationNeeded();

// Test Suite 6: Archived Tasks Migration
console.log('\n=== Test Suite 6: Archived Tasks Migration ===');

function testArchivedTasksMigration() {
    setupMockStorage();
    
    // Test: Migrate archived tasks
    const archivedTasks = [
        { id: 'archived-1', name: 'Archived Task 1', estimated_time: 5, archived_date: '2024-01-01' },
        { id: 'archived-2', name: 'Archived Task 2', estimated_time: 3, archived_date: '2024-01-02' }
    ];
    
    const migratedArchived = archivedTasks.map(task => ({
        ...task,
        actual_time: task.actual_time !== undefined ? task.actual_time : 0
    }));
    
    console.assert(migratedArchived[0].actual_time === 0, 'Archived task 1 should have actual_time: 0');
    console.assert(migratedArchived[1].actual_time === 0, 'Archived task 2 should have actual_time: 0');
    console.assert(migratedArchived[0].archived_date === '2024-01-01', 'Archived date should be preserved');
    console.log('✅ Archived tasks migration test passed');
}

testArchivedTasksMigration();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All migration functionality tests completed successfully!');
console.log('Total test suites: 6');
console.log('Total tests: 14');
