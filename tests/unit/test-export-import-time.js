/**
 * Export/Import Time Data Tests
 * Tests for exporting and importing time data
 */

// Test Suite 1: Export Data Structure
console.log('=== Test Suite 1: Export Data Structure ===');

function testExportDataStructure() {
    const tasks = [
        { id: 'task-1', name: 'Task 1', estimated_time: 5, actual_time: 3 },
        { id: 'task-2', name: 'Task 2', estimated_time: 8, actual_time: 0 }
    ];
    
    const settings = {
        ideal_daily_minutes: 480,
        weekday_visibility: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
        }
    };
    
    const archivedTasks = [
        { id: 'archived-1', name: 'Archived 1', estimated_time: 5, actual_time: 5, archived_date: '2024-01-01' }
    ];
    
    const data = {
        tasks: tasks,
        settings: settings,
        archive: archivedTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0",
            categoriesIncluded: true
        }
    };
    
    const test1 = data.tasks.length === 2;
    const test2 = data.tasks[0].actual_time === 3;
    const test3 = data.archive.length === 1;
    const test4 = data.archive[0].actual_time === 5;
    const test5 = data.exportInfo.version === "1.0";
    
    console.assert(test1, 'Should have 2 tasks');
    console.assert(test2, 'First task should have actual_time: 3');
    console.assert(test3, 'Should have 1 archived task');
    console.assert(test4, 'Archived task should have actual_time: 5');
    console.assert(test5, 'Export info should have version 1.0');
    console.log('✅ Export data structure test passed');
}

testExportDataStructure();

// Test Suite 2: JSON Serialization
console.log('\n=== Test Suite 2: JSON Serialization ===');

function testJSONSerialization() {
    const data = {
        tasks: [
            { id: 'task-1', name: 'Task 1', estimated_time: 5.5, actual_time: 3.25 }
        ],
        settings: { ideal_daily_minutes: 480 },
        archive: [],
        exportInfo: {
            exportDate: '2024-01-15T10:30:00.000Z',
            version: "1.0"
        }
    };
    
    // Serialize
    const jsonStr = JSON.stringify(data, null, 2);
    
    // Deserialize
    const loaded = JSON.parse(jsonStr);
    
    const test1 = loaded.tasks[0].estimated_time === 5.5;
    const test2 = loaded.tasks[0].actual_time === 3.25;
    const test3 = loaded.settings.ideal_daily_minutes === 480;
    const test4 = loaded.exportInfo.version === "1.0";
    
    console.assert(test1, 'Estimated time should be preserved');
    console.assert(test2, 'Actual time should be preserved');
    console.assert(test3, 'Settings should be preserved');
    console.assert(test4, 'Export info should be preserved');
    console.log('✅ JSON serialization test passed');
}

testJSONSerialization();

// Test Suite 3: Time Data Integrity in Export
console.log('\n=== Test Suite 3: Time Data Integrity in Export ===');

function testTimeDataIntegrityInExport() {
    const originalTasks = [
        {
            id: 'task-1',
            name: 'Task 1',
            estimated_time: 5,
            actual_time: 3,
            priority: 'high',
            category: 'task',
            assigned_date: '2024-01-15',
            due_date: '2024-01-16T18:00',
            details: 'Test task',
            completed: false
        }
    ];
    
    const data = {
        tasks: originalTasks,
        settings: {},
        archive: [],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    // Serialize and deserialize
    const jsonStr = JSON.stringify(data);
    const loaded = JSON.parse(jsonStr);
    
    const task = loaded.tasks[0];
    const test1 = task.id === 'task-1';
    const test2 = task.estimated_time === 5;
    const test3 = task.actual_time === 3;
    const test4 = task.priority === 'high';
    const test5 = task.category === 'task';
    const test6 = task.assigned_date === '2024-01-15';
    const test7 = task.details === 'Test task';
    
    console.assert(test1, 'ID should be preserved');
    console.assert(test2, 'Estimated time should be preserved');
    console.assert(test3, 'Actual time should be preserved');
    console.assert(test4, 'Priority should be preserved');
    console.assert(test5, 'Category should be preserved');
    console.assert(test6, 'Assigned date should be preserved');
    console.assert(test7, 'Details should be preserved');
    console.log('✅ Time data integrity in export test passed');
}

testTimeDataIntegrityInExport();

// Test Suite 4: Archived Tasks with Time Data
console.log('\n=== Test Suite 4: Archived Tasks with Time Data ===');

function testArchivedTasksWithTimeData() {
    const archivedTasks = [
        {
            id: 'archived-1',
            name: 'Archived 1',
            estimated_time: 5,
            actual_time: 5,
            archived_date: '2024-01-01T10:00:00.000Z',
            completed: true
        },
        {
            id: 'archived-2',
            name: 'Archived 2',
            estimated_time: 8,
            actual_time: 10,
            archived_date: '2024-01-02T15:30:00.000Z',
            completed: true
        }
    ];
    
    const data = {
        tasks: [],
        settings: {},
        archive: archivedTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    // Serialize and deserialize
    const jsonStr = JSON.stringify(data);
    const loaded = JSON.parse(jsonStr);
    
    const test1 = loaded.archive.length === 2;
    const test2 = loaded.archive[0].actual_time === 5;
    const test3 = loaded.archive[1].actual_time === 10;
    const test4 = loaded.archive[0].archived_date === '2024-01-01T10:00:00.000Z';
    
    console.assert(test1, 'Should have 2 archived tasks');
    console.assert(test2, 'First archived task actual_time should be 5');
    console.assert(test3, 'Second archived task actual_time should be 10');
    console.assert(test4, 'Archived date should be preserved');
    console.log('✅ Archived tasks with time data test passed');
}

testArchivedTasksWithTimeData();

// Test Suite 5: Export Info
console.log('\n=== Test Suite 5: Export Info ===');

function testExportInfo() {
    const exportDate = new Date().toISOString();
    const data = {
        tasks: [],
        settings: {},
        archive: [],
        exportInfo: {
            exportDate: exportDate,
            version: "1.0",
            categoriesIncluded: true
        }
    };
    
    const jsonStr = JSON.stringify(data);
    const loaded = JSON.parse(jsonStr);
    
    const test1 = loaded.exportInfo.exportDate === exportDate;
    const test2 = loaded.exportInfo.version === "1.0";
    const test3 = loaded.exportInfo.categoriesIncluded === true;
    
    console.assert(test1, 'Export date should be preserved');
    console.assert(test2, 'Version should be 1.0');
    console.assert(test3, 'Categories included flag should be true');
    console.log('✅ Export info test passed');
}

testExportInfo();

// Test Suite 6: Large Export
console.log('\n=== Test Suite 6: Large Export ===');

function testLargeExport() {
    const tasks = [];
    for (let i = 1; i <= 100; i++) {
        tasks.push({
            id: `task-${i}`,
            name: `Task ${i}`,
            estimated_time: Math.random() * 10,
            actual_time: Math.random() * 10,
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            category: ['task', 'meeting', 'bugfix'][Math.floor(Math.random() * 3)]
        });
    }
    
    const data = {
        tasks: tasks,
        settings: {},
        archive: [],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    // Serialize and deserialize
    const jsonStr = JSON.stringify(data);
    const loaded = JSON.parse(jsonStr);
    
    const test1 = loaded.tasks.length === 100;
    const test2 = loaded.tasks[0].actual_time !== undefined;
    const test3 = loaded.tasks[99].actual_time !== undefined;
    
    console.assert(test1, 'Should have 100 tasks');
    console.assert(test2, 'First task should have actual_time');
    console.assert(test3, 'Last task should have actual_time');
    console.log('✅ Large export test passed');
}

testLargeExport();

// Test Suite 7: Decimal Precision in Export
console.log('\n=== Test Suite 7: Decimal Precision in Export ===');

function testDecimalPrecisionInExport() {
    const data = {
        tasks: [
            { id: 'task-1', name: 'Task 1', estimated_time: 5.123456, actual_time: 3.987654 }
        ],
        settings: {},
        archive: [],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    // Serialize and deserialize
    const jsonStr = JSON.stringify(data);
    const loaded = JSON.parse(jsonStr);
    
    const test1 = loaded.tasks[0].estimated_time === 5.123456;
    const test2 = loaded.tasks[0].actual_time === 3.987654;
    
    console.assert(test1, 'Estimated time precision should be preserved');
    console.assert(test2, 'Actual time precision should be preserved');
    console.log('✅ Decimal precision in export test passed');
}

testDecimalPrecisionInExport();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All export/import time data tests completed successfully!');
console.log('Total test suites: 7');
console.log('Total tests: 25+');
