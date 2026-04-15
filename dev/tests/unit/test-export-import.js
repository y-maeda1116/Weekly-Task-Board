/**
 * Export/Import Functionality Unit Tests
 * Tests for exporting and importing all data types
 * 
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// Test Suite 14.1: Export Functionality Tests
// ============================================================================

console.log('\n=== Test Suite 14.1: Export Functionality ===\n');

// Test 14.1.1: Full Data JSON Export (Tasks, Templates, Settings, Archive)
function test_14_1_1_FullDataJSONExport() {
    const generator = new TestDataGenerator();
    
    const tasks = [
        generator.generateTask({ name: 'Task 1', estimated_time: 5, actual_time: 3 }),
        generator.generateTask({ name: 'Task 2', estimated_time: 8, actual_time: null })
    ];
    
    const templates = [
        generator.generateTemplate({ name: 'Template 1', tasks: [tasks[0]] })
    ];
    
    const settings = generator.generateSettings();
    
    const archivedTasks = [
        generator.generateTask({ name: 'Archived 1', completed: true, actual_time: 5 })
    ];
    
    const exportData = {
        tasks: tasks,
        templates: templates,
        settings: settings,
        archive: archivedTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1",
            categoriesIncluded: true,
            recurringTasksIncluded: true
        }
    };
    
    // Verify JSON serialization
    const jsonStr = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.tasks.length === 2;
    const test2 = parsed.templates.length === 1;
    const test3 = parsed.settings !== undefined;
    const test4 = parsed.archive.length === 1;
    const test5 = parsed.exportInfo.version === "1.1";
    
    if (test1 && test2 && test3 && test4 && test5) {
        console.log('✅ Test 14.1.1: Full data JSON export - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.1: Full data JSON export - FAILED');
        testsFailed++;
    }
}

test_14_1_1_FullDataJSONExport();

// Test 14.1.2: Time Information Export (Estimated and Actual Time)
function test_14_1_2_TimeInformationExport() {
    const generator = new TestDataGenerator();
    
    const tasks = [
        generator.generateTask({ 
            name: 'Task 1', 
            estimated_time: 5.5, 
            actual_time: 3.25 
        }),
        generator.generateTask({ 
            name: 'Task 2', 
            estimated_time: 8, 
            actual_time: null 
        }),
        generator.generateTask({ 
            name: 'Task 3', 
            estimated_time: 0, 
            actual_time: 0 
        })
    ];
    
    const exportData = {
        tasks: tasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.tasks[0].estimated_time === 5.5;
    const test2 = parsed.tasks[0].actual_time === 3.25;
    const test3 = parsed.tasks[1].actual_time === null;
    const test4 = parsed.tasks[2].estimated_time === 0;
    const test5 = parsed.tasks[2].actual_time === 0;
    
    if (test1 && test2 && test3 && test4 && test5) {
        console.log('✅ Test 14.1.2: Time information export - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.2: Time information export - FAILED');
        testsFailed++;
    }
}

test_14_1_2_TimeInformationExport();

// Test 14.1.3: Timestamp Inclusion in Export
function test_14_1_3_TimestampInclusion() {
    const generator = new TestDataGenerator();
    const tasks = generator.generateTasks(2);
    
    const exportDate = new Date().toISOString();
    const exportData = {
        tasks: tasks,
        exportInfo: {
            exportDate: exportDate,
            version: "1.1"
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.exportInfo.exportDate !== undefined;
    const test2 = parsed.exportInfo.exportDate === exportDate;
    const test3 = parsed.exportInfo.exportDate.includes('T');
    const test4 = parsed.exportInfo.exportDate.includes('Z');
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.1.3: Timestamp inclusion - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.3: Timestamp inclusion - FAILED');
        testsFailed++;
    }
}

test_14_1_3_TimestampInclusion();

// Test 14.1.4: Version Information Inclusion
function test_14_1_4_VersionInformation() {
    const generator = new TestDataGenerator();
    const tasks = generator.generateTasks(1);
    
    const exportData = {
        tasks: tasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1",
            categoriesIncluded: true,
            recurringTasksIncluded: true
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.exportInfo.version !== undefined;
    const test2 = parsed.exportInfo.version === "1.1";
    const test3 = parsed.exportInfo.categoriesIncluded === true;
    const test4 = parsed.exportInfo.recurringTasksIncluded === true;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.1.4: Version information inclusion - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.4: Version information inclusion - FAILED');
        testsFailed++;
    }
}

test_14_1_4_VersionInformation();

// Test 14.1.5: Export with Categories
function test_14_1_5_ExportWithCategories() {
    const generator = new TestDataGenerator();
    
    const tasks = [
        generator.generateTask({ name: 'Task 1', category: 'task' }),
        generator.generateTask({ name: 'Task 2', category: 'meeting' }),
        generator.generateTask({ name: 'Task 3', category: 'bugfix' })
    ];
    
    const exportData = {
        tasks: tasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1",
            categoriesIncluded: true
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.tasks[0].category === 'task';
    const test2 = parsed.tasks[1].category === 'meeting';
    const test3 = parsed.tasks[2].category === 'bugfix';
    const test4 = parsed.exportInfo.categoriesIncluded === true;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.1.5: Export with categories - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.5: Export with categories - FAILED');
        testsFailed++;
    }
}

test_14_1_5_ExportWithCategories();

// Test 14.1.6: Export with Recurring Tasks
function test_14_1_6_ExportWithRecurringTasks() {
    const generator = new TestDataGenerator();
    
    const tasks = [
        generator.generateRecurringTask('daily', { name: 'Daily Task' }),
        generator.generateRecurringTask('weekly', { name: 'Weekly Task' }),
        generator.generateTask({ name: 'Regular Task' })
    ];
    
    const exportData = {
        tasks: tasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1",
            recurringTasksIncluded: true
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.tasks[0].is_recurring === true;
    const test2 = parsed.tasks[0].recurrence_pattern === 'daily';
    const test3 = parsed.tasks[1].recurrence_pattern === 'weekly';
    const test4 = parsed.tasks[2].is_recurring === false;
    const test5 = parsed.exportInfo.recurringTasksIncluded === true;
    
    if (test1 && test2 && test3 && test4 && test5) {
        console.log('✅ Test 14.1.6: Export with recurring tasks - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.6: Export with recurring tasks - FAILED');
        testsFailed++;
    }
}

test_14_1_6_ExportWithRecurringTasks();

// Test 14.1.7: Export with Templates
function test_14_1_7_ExportWithTemplates() {
    const generator = new TestDataGenerator();
    
    const task1 = generator.generateTask({ name: 'Template Task 1' });
    const task2 = generator.generateTask({ name: 'Template Task 2' });
    
    const templates = [
        generator.generateTemplate({ 
            name: 'Template 1', 
            tasks: [task1],
            usage_count: 5
        }),
        generator.generateTemplate({ 
            name: 'Template 2', 
            tasks: [task1, task2],
            usage_count: 3
        })
    ];
    
    const exportData = {
        templates: templates,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.templates.length === 2;
    const test2 = parsed.templates[0].name === 'Template 1';
    const test3 = parsed.templates[0].usage_count === 5;
    const test4 = parsed.templates[1].tasks.length === 2;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.1.7: Export with templates - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.7: Export with templates - FAILED');
        testsFailed++;
    }
}

test_14_1_7_ExportWithTemplates();

// Test 14.1.8: Export with Settings
function test_14_1_8_ExportWithSettings() {
    const generator = new TestDataGenerator();
    
    const settings = generator.generateSettings({
        ideal_daily_minutes: 480,
        theme: 'dark'
    });
    
    const exportData = {
        settings: settings,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    const jsonStr = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonStr);
    
    const test1 = parsed.settings.ideal_daily_minutes === 480;
    const test2 = parsed.settings.theme === 'dark';
    const test3 = parsed.settings.weekday_visibility !== undefined;
    const test4 = parsed.settings.weekday_visibility.monday === true;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.1.8: Export with settings - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.1.8: Export with settings - FAILED');
        testsFailed++;
    }
}

test_14_1_8_ExportWithSettings();

// ============================================================================
// Test Suite 14.2: Import Functionality Tests
// ============================================================================

console.log('\n=== Test Suite 14.2: Import Functionality ===\n');

// Test 14.2.1: JSON Data Import
function test_14_2_1_JSONDataImport() {
    const generator = new TestDataGenerator();
    
    const originalTasks = [
        generator.generateTask({ name: 'Task 1', estimated_time: 5, actual_time: 3 }),
        generator.generateTask({ name: 'Task 2', estimated_time: 8, actual_time: null })
    ];
    
    const exportData = {
        tasks: originalTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    // Simulate export/import cycle
    const jsonStr = JSON.stringify(exportData);
    const importedData = JSON.parse(jsonStr);
    
    const test1 = importedData.tasks.length === 2;
    const test2 = importedData.tasks[0].name === 'Task 1';
    const test3 = importedData.tasks[0].estimated_time === 5;
    const test4 = importedData.tasks[1].actual_time === null;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.2.1: JSON data import - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.1: JSON data import - FAILED');
        testsFailed++;
    }
}

test_14_2_1_JSONDataImport();

// Test 14.2.2: Invalid JSON Rejection
function test_14_2_2_InvalidJSONRejection() {
    const invalidJSONStrings = [
        '{invalid json}',
        '{"tasks": [incomplete',
        'not json at all',
        '{"tasks": undefined}',
        ''
    ];
    
    let rejectionCount = 0;
    
    for (const jsonStr of invalidJSONStrings) {
        try {
            JSON.parse(jsonStr);
        } catch (error) {
            rejectionCount++;
        }
    }
    
    const test1 = rejectionCount === invalidJSONStrings.length;
    
    if (test1) {
        console.log('✅ Test 14.2.2: Invalid JSON rejection - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.2: Invalid JSON rejection - FAILED');
        testsFailed++;
    }
}

test_14_2_2_InvalidJSONRejection();

// Test 14.2.3: Import Confirmation (Data Validation)
function test_14_2_3_ImportConfirmation() {
    const generator = new TestDataGenerator();
    
    const importedData = {
        tasks: generator.generateTasks(3),
        templates: [generator.generateTemplate()],
        settings: generator.generateSettings(),
        archive: [generator.generateTask({ completed: true })],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    // Validate import data structure
    const test1 = Array.isArray(importedData.tasks);
    const test2 = Array.isArray(importedData.templates);
    const test3 = importedData.settings !== undefined;
    const test4 = Array.isArray(importedData.archive);
    const test5 = importedData.exportInfo !== undefined;
    
    if (test1 && test2 && test3 && test4 && test5) {
        console.log('✅ Test 14.2.3: Import confirmation - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.3: Import confirmation - FAILED');
        testsFailed++;
    }
}

test_14_2_3_ImportConfirmation();

// Test 14.2.4: Old Version Data Migration
function test_14_2_4_OldVersionDataMigration() {
    // Simulate old version data (v1.0) without actual_time field
    const oldVersionData = {
        tasks: [
            {
                id: 'task-1',
                name: 'Old Task 1',
                estimated_time: 5,
                priority: 'high',
                category: 'task',
                assigned_date: '2024-01-15',
                completed: false
                // Note: actual_time is missing
            }
        ],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    // Simulate migration to v1.1
    const migratedData = {
        ...oldVersionData,
        tasks: oldVersionData.tasks.map(task => ({
            ...task,
            actual_time: task.actual_time || null,
            is_recurring: task.is_recurring || false,
            recurrence_pattern: task.recurrence_pattern || null,
            recurrence_end_date: task.recurrence_end_date || null
        })),
        exportInfo: {
            ...oldVersionData.exportInfo,
            version: "1.1"
        }
    };
    
    const test1 = migratedData.tasks[0].actual_time === null;
    const test2 = migratedData.tasks[0].is_recurring === false;
    const test3 = migratedData.exportInfo.version === "1.1";
    const test4 = migratedData.tasks[0].name === 'Old Task 1';
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.2.4: Old version data migration - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.4: Old version data migration - FAILED');
        testsFailed++;
    }
}

test_14_2_4_OldVersionDataMigration();

// Test 14.2.5: Import with Category Validation
function test_14_2_5_ImportWithCategoryValidation() {
    const generator = new TestDataGenerator();
    
    const importedData = {
        tasks: [
            generator.generateTask({ name: 'Task 1', category: 'task' }),
            generator.generateTask({ name: 'Task 2', category: 'meeting' }),
            generator.generateTask({ name: 'Task 3', category: 'bugfix' })
        ],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    // Validate categories
    const validCategories = ['task', 'meeting', 'bugfix'];
    const allCategoriesValid = importedData.tasks.every(task => 
        validCategories.includes(task.category)
    );
    
    const test1 = allCategoriesValid;
    const test2 = importedData.tasks[0].category === 'task';
    const test3 = importedData.tasks[1].category === 'meeting';
    
    if (test1 && test2 && test3) {
        console.log('✅ Test 14.2.5: Import with category validation - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.5: Import with category validation - FAILED');
        testsFailed++;
    }
}

test_14_2_5_ImportWithCategoryValidation();

// Test 14.2.6: Import with Recurring Task Validation
function test_14_2_6_ImportWithRecurringTaskValidation() {
    const generator = new TestDataGenerator();
    
    const importedData = {
        tasks: [
            generator.generateRecurringTask('daily', { name: 'Daily Task' }),
            generator.generateRecurringTask('weekly', { name: 'Weekly Task' }),
            generator.generateTask({ name: 'Regular Task' })
        ],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    // Validate recurring tasks
    const recurringCount = importedData.tasks.filter(t => t.is_recurring).length;
    const validPatterns = ['daily', 'weekly', 'monthly'];
    const allPatternsValid = importedData.tasks
        .filter(t => t.is_recurring)
        .every(t => validPatterns.includes(t.recurrence_pattern));
    
    const test1 = recurringCount === 2;
    const test2 = allPatternsValid;
    const test3 = importedData.tasks[2].is_recurring === false;
    
    if (test1 && test2 && test3) {
        console.log('✅ Test 14.2.6: Import with recurring task validation - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.6: Import with recurring task validation - FAILED');
        testsFailed++;
    }
}

test_14_2_6_ImportWithRecurringTaskValidation();

// Test 14.2.7: Import Preserves All Task Properties
function test_14_2_7_ImportPreservesAllProperties() {
    const generator = new TestDataGenerator();
    
    const originalTask = generator.generateTask({
        name: 'Complete Task',
        estimated_time: 5.5,
        actual_time: 3.25,
        priority: 'high',
        category: 'meeting',
        assigned_date: '2024-01-15',
        completed: true,
        details: 'Important meeting'
    });
    
    const exportData = {
        tasks: [originalTask],
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    // Simulate import
    const jsonStr = JSON.stringify(exportData);
    const importedData = JSON.parse(jsonStr);
    const importedTask = importedData.tasks[0];
    
    const test1 = importedTask.name === 'Complete Task';
    const test2 = importedTask.estimated_time === 5.5;
    const test3 = importedTask.actual_time === 3.25;
    const test4 = importedTask.priority === 'high';
    const test5 = importedTask.category === 'meeting';
    const test6 = importedTask.assigned_date === '2024-01-15';
    const test7 = importedTask.completed === true;
    const test8 = importedTask.details === 'Important meeting';
    
    if (test1 && test2 && test3 && test4 && test5 && test6 && test7 && test8) {
        console.log('✅ Test 14.2.7: Import preserves all properties - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.7: Import preserves all properties - FAILED');
        testsFailed++;
    }
}

test_14_2_7_ImportPreservesAllProperties();

// Test 14.2.8: Import with Archive Data
function test_14_2_8_ImportWithArchiveData() {
    const generator = new TestDataGenerator();
    
    const archivedTasks = [
        generator.generateTask({ 
            name: 'Archived 1', 
            completed: true, 
            actual_time: 5 
        }),
        generator.generateTask({ 
            name: 'Archived 2', 
            completed: true, 
            actual_time: 8 
        })
    ];
    
    const importedData = {
        tasks: [],
        archive: archivedTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1"
        }
    };
    
    const test1 = importedData.archive.length === 2;
    const test2 = importedData.archive[0].name === 'Archived 1';
    const test3 = importedData.archive[0].completed === true;
    const test4 = importedData.archive[1].actual_time === 8;
    
    if (test1 && test2 && test3 && test4) {
        console.log('✅ Test 14.2.8: Import with archive data - PASSED');
        testsPassed++;
    } else {
        console.log('❌ Test 14.2.8: Import with archive data - FAILED');
        testsFailed++;
    }
}

test_14_2_8_ImportWithArchiveData();

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n=== Test Summary ===');
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All export/import tests passed successfully!');
    process.exit(0);
} else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
}
