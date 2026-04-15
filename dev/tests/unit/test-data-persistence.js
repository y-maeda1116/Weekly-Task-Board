/**
 * Data Persistence Tests
 * Tests localStorage save/load functionality for tasks, settings, templates, and archives
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

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

// Helper functions
function saveTasks(tasks) {
    mockStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasksJson = mockStorage.getItem('tasks');
    return tasksJson ? JSON.parse(tasksJson) : [];
}

function saveSettings(settings) {
    mockStorage.setItem('settings', JSON.stringify(settings));
}

function loadSettings() {
    const settingsJson = mockStorage.getItem('settings');
    return settingsJson ? JSON.parse(settingsJson) : null;
}

function saveTemplates(templates) {
    mockStorage.setItem('templates', JSON.stringify(templates));
}

function loadTemplates() {
    const templatesJson = mockStorage.getItem('templates');
    return templatesJson ? JSON.parse(templatesJson) : [];
}

function saveArchivedTasks(archivedTasks) {
    mockStorage.setItem('archived_tasks', JSON.stringify(archivedTasks));
}

function loadArchivedTasks() {
    const archivedJson = mockStorage.getItem('archived_tasks');
    return archivedJson ? JSON.parse(archivedJson) : [];
}

// Test 5.1: Task JSON save/load
function testTaskJsonSave() {
    const task = dataGenerator.generateTask({
        name: 'Test Task',
        estimated_time: 120,
        priority: 'high',
        category: 'work'
    });
    
    saveTasks([task]);
    const loaded = loadTasks();
    
    if (loaded.length !== 1) throw new Error('Task not saved');
    if (loaded[0].name !== 'Test Task') throw new Error('Task name not preserved');
    if (loaded[0].estimated_time !== 120) throw new Error('Estimated time not preserved');
}

function testTaskPropertiesRestored() {
    const task = dataGenerator.generateTask({
        id: 'task-123',
        name: 'Complex Task',
        estimated_time: 240,
        actual_time: 180,
        priority: 'medium',
        category: 'personal',
        assigned_date: '2024-01-15',
        completed: true,
        is_recurring: false,
        details: 'Task details'
    });
    
    saveTasks([task]);
    const loaded = loadTasks()[0];
    
    if (loaded.id !== 'task-123') throw new Error('ID not restored');
    if (loaded.actual_time !== 180) throw new Error('Actual time not restored');
    if (loaded.assigned_date !== '2024-01-15') throw new Error('Assigned date not restored');
    if (loaded.completed !== true) throw new Error('Completed flag not restored');
    if (loaded.details !== 'Task details') throw new Error('Details not restored');
}

function testMultipleTasksSave() {
    const tasks = dataGenerator.generateTasks(5);
    saveTasks(tasks);
    const loaded = loadTasks();
    
    if (loaded.length !== 5) throw new Error('Not all tasks saved');
    for (let i = 0; i < 5; i++) {
        if (loaded[i].id !== tasks[i].id) throw new Error(`Task ${i} ID mismatch`);
    }
}

// Test 5.2: Settings save/load
function testSettingsSave() {
    const settings = dataGenerator.generateSettings({
        ideal_daily_minutes: 480,
        theme: 'dark'
    });
    
    saveSettings(settings);
    const loaded = loadSettings();
    
    if (!loaded) throw new Error('Settings not saved');
    if (loaded.ideal_daily_minutes !== 480) throw new Error('Ideal daily minutes not preserved');
    if (loaded.theme !== 'dark') throw new Error('Theme not preserved');
}

function testWeekdayVisibilitySave() {
    const settings = dataGenerator.generateSettings({
        weekday_visibility: {
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
        }
    });
    
    saveSettings(settings);
    const loaded = loadSettings();
    
    if (loaded.weekday_visibility.tuesday !== false) throw new Error('Weekday visibility not preserved');
    if (loaded.weekday_visibility.monday !== true) throw new Error('Weekday visibility not preserved');
}

// Test 5.3: Template save/load
function testTemplateSave() {
    const template = dataGenerator.generateTemplate({
        name: 'Weekly Template',
        tasks: [
            dataGenerator.generateTask({ name: 'Task 1' }),
            dataGenerator.generateTask({ name: 'Task 2' })
        ],
        usage_count: 3
    });
    
    saveTemplates([template]);
    const loaded = loadTemplates();
    
    if (loaded.length !== 1) throw new Error('Template not saved');
    if (loaded[0].name !== 'Weekly Template') throw new Error('Template name not preserved');
    if (loaded[0].tasks.length !== 2) throw new Error('Template tasks not preserved');
    if (loaded[0].usage_count !== 3) throw new Error('Usage count not preserved');
}

function testMultipleTemplatesSave() {
    const templates = [
        dataGenerator.generateTemplate({ name: 'Template 1' }),
        dataGenerator.generateTemplate({ name: 'Template 2' }),
        dataGenerator.generateTemplate({ name: 'Template 3' })
    ];
    
    saveTemplates(templates);
    const loaded = loadTemplates();
    
    if (loaded.length !== 3) throw new Error('Not all templates saved');
    if (loaded[1].name !== 'Template 2') throw new Error('Template order not preserved');
}

// Test 5.4: Archive save/load
function testArchivedTasksSave() {
    const archivedTasks = [
        dataGenerator.generateTask({ name: 'Archived 1', completed: true }),
        dataGenerator.generateTask({ name: 'Archived 2', completed: true })
    ];
    
    saveArchivedTasks(archivedTasks);
    const loaded = loadArchivedTasks();
    
    if (loaded.length !== 2) throw new Error('Archived tasks not saved');
    if (loaded[0].name !== 'Archived 1') throw new Error('Archived task name not preserved');
}

// Test 5.5: localStorage corruption handling
function testCorruptedJsonHandling() {
    mockStorage.setItem('tasks', 'invalid json {]');
    
    try {
        const loaded = loadTasks();
        throw new Error('Should have thrown error on invalid JSON');
    } catch (error) {
        if (error.message === 'Should have thrown error on invalid JSON') throw error;
        // Expected - JSON parse error
    }
}

function testEmptyStorageInitialization() {
    mockStorage.clear();
    
    const tasks = loadTasks();
    const settings = loadSettings();
    const templates = loadTemplates();
    
    if (!Array.isArray(tasks)) throw new Error('Tasks should be array');
    if (tasks.length !== 0) throw new Error('Tasks should be empty');
    if (settings !== null) throw new Error('Settings should be null');
    if (!Array.isArray(templates)) throw new Error('Templates should be array');
}

// Test 5.6: Large dataset handling
function testLargeDatasetSave() {
    const largeTasks = dataGenerator.generateTasks(150);
    saveTasks(largeTasks);
    const loaded = loadTasks();
    
    if (loaded.length !== 150) throw new Error('Not all large tasks saved');
    if (loaded[149].id !== largeTasks[149].id) throw new Error('Last task not preserved');
}

function testLargeDatasetLoad() {
    const largeTasks = dataGenerator.generateTasks(200);
    saveTasks(largeTasks);
    
    const loaded = loadTasks();
    if (loaded.length !== 200) throw new Error('Large dataset not loaded correctly');
    
    // Verify random samples
    if (loaded[50].id !== largeTasks[50].id) throw new Error('Sample task not preserved');
    if (loaded[150].id !== largeTasks[150].id) throw new Error('Sample task not preserved');
}

// Test 5.7: JSON validation
function testJsonValidation() {
    const task = dataGenerator.generateTask();
    const jsonString = JSON.stringify([task]);
    
    // Verify it's valid JSON
    try {
        JSON.parse(jsonString);
    } catch (error) {
        throw new Error('Generated JSON is invalid');
    }
}

function testComplexDataStructureValidation() {
    const complexData = {
        tasks: dataGenerator.generateTasks(3),
        settings: dataGenerator.generateSettings(),
        templates: [dataGenerator.generateTemplate()],
        archived: dataGenerator.generateTasks(2)
    };
    
    const jsonString = JSON.stringify(complexData);
    const parsed = JSON.parse(jsonString);
    
    if (parsed.tasks.length !== 3) throw new Error('Complex structure not preserved');
    if (!parsed.settings.ideal_daily_minutes) throw new Error('Settings not preserved');
    if (parsed.templates.length !== 1) throw new Error('Templates not preserved');
}

// Test 5.8: Data type preservation
function testDataTypePreservation() {
    const task = dataGenerator.generateTask({
        estimated_time: 120,
        actual_time: 90.5,
        completed: true,
        is_recurring: false
    });
    
    saveTasks([task]);
    const loaded = loadTasks()[0];
    
    if (typeof loaded.estimated_time !== 'number') throw new Error('Number type not preserved');
    if (typeof loaded.completed !== 'boolean') throw new Error('Boolean type not preserved');
    if (loaded.actual_time !== 90.5) throw new Error('Decimal precision not preserved');
}

function testNullValuePreservation() {
    const task = dataGenerator.generateTask({
        actual_time: null,
        assigned_date: null,
        recurrence_pattern: null
    });
    
    saveTasks([task]);
    const loaded = loadTasks()[0];
    
    if (loaded.actual_time !== null) throw new Error('Null value not preserved');
    if (loaded.assigned_date !== null) throw new Error('Null value not preserved');
}

// ===== EDGE CASE TESTS FOR TASK 5.2 =====

// Test 4.5: Archive save test
function testArchiveSaveWithCompletedTasks() {
    const completedTasks = [
        dataGenerator.generateTask({ name: 'Completed 1', completed: true }),
        dataGenerator.generateTask({ name: 'Completed 2', completed: true }),
        dataGenerator.generateTask({ name: 'Completed 3', completed: true })
    ];
    
    saveArchivedTasks(completedTasks);
    const loaded = loadArchivedTasks();
    
    if (loaded.length !== 3) throw new Error('Archive did not save all completed tasks');
    if (loaded[0].name !== 'Completed 1') throw new Error('Archive task name not preserved');
    if (loaded[1].completed !== true) throw new Error('Archive task completed flag not preserved');
}

function testArchiveSavePreservesAllProperties() {
    const archivedTask = dataGenerator.generateTask({
        id: 'archived-123',
        name: 'Archived Task',
        estimated_time: 240,
        actual_time: 300,
        priority: 'high',
        category: 'work',
        assigned_date: '2024-01-10',
        completed: true,
        is_recurring: false,
        details: 'This task was archived'
    });
    
    saveArchivedTasks([archivedTask]);
    const loaded = loadArchivedTasks()[0];
    
    if (loaded.id !== 'archived-123') throw new Error('Archive ID not preserved');
    if (loaded.actual_time !== 300) throw new Error('Archive actual time not preserved');
    if (loaded.priority !== 'high') throw new Error('Archive priority not preserved');
    if (loaded.details !== 'This task was archived') throw new Error('Archive details not preserved');
}

function testArchiveSaveMultipleBatches() {
    const batch1 = dataGenerator.generateTasks(5);
    batch1.forEach(t => t.completed = true);
    saveArchivedTasks(batch1);
    
    let loaded = loadArchivedTasks();
    if (loaded.length !== 5) throw new Error('First batch not saved');
    
    const batch2 = dataGenerator.generateTasks(3);
    batch2.forEach(t => t.completed = true);
    const combined = [...batch1, ...batch2];
    saveArchivedTasks(combined);
    
    loaded = loadArchivedTasks();
    if (loaded.length !== 8) throw new Error('Combined archive not saved correctly');
}

// Test 4.6: localStorage corruption handling and initialization
function testCorruptedStorageInitialization() {
    mockStorage.setItem('tasks', '{invalid json');
    mockStorage.setItem('settings', 'not json at all');
    mockStorage.setItem('templates', '[incomplete');
    
    // System should handle corruption gracefully
    try {
        loadTasks();
        throw new Error('Should have thrown on corrupted tasks');
    } catch (error) {
        if (error.message === 'Should have thrown on corrupted tasks') throw error;
        // Expected - corruption detected
    }
}

function testDefaultInitializationAfterCorruption() {
    mockStorage.clear();
    
    // Simulate system initialization with defaults
    const defaultTasks = [];
    const defaultSettings = {
        ideal_daily_minutes: 480,
        weekday_visibility: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
        },
        theme: 'light'
    };
    
    saveTasks(defaultTasks);
    saveSettings(defaultSettings);
    
    const loadedTasks = loadTasks();
    const loadedSettings = loadSettings();
    
    if (!Array.isArray(loadedTasks)) throw new Error('Default tasks not initialized as array');
    if (loadedTasks.length !== 0) throw new Error('Default tasks should be empty');
    if (loadedSettings.ideal_daily_minutes !== 480) throw new Error('Default settings not initialized');
}

function testPartialCorruptionRecovery() {
    // Valid tasks, corrupted settings
    const validTasks = dataGenerator.generateTasks(3);
    saveTasks(validTasks);
    mockStorage.setItem('settings', '{broken');
    
    const loadedTasks = loadTasks();
    if (loadedTasks.length !== 3) throw new Error('Valid tasks should still load');
    
    try {
        loadSettings();
        throw new Error('Should have thrown on corrupted settings');
    } catch (error) {
        if (error.message === 'Should have thrown on corrupted settings') throw error;
        // Expected - settings corruption detected
    }
}

// Test 4.7: Large dataset save/load (100+ tasks)
function testLargeDatasetSave100Tasks() {
    const largeTasks = dataGenerator.generateTasks(100);
    saveTasks(largeTasks);
    const loaded = loadTasks();
    
    if (loaded.length !== 100) throw new Error('Not all 100 tasks saved');
    if (loaded[0].id !== largeTasks[0].id) throw new Error('First task not preserved');
    if (loaded[99].id !== largeTasks[99].id) throw new Error('Last task not preserved');
}

function testLargeDatasetSave500Tasks() {
    const largeTasks = dataGenerator.generateTasks(500);
    saveTasks(largeTasks);
    const loaded = loadTasks();
    
    if (loaded.length !== 500) throw new Error('Not all 500 tasks saved');
    
    // Verify samples throughout the dataset
    if (loaded[0].id !== largeTasks[0].id) throw new Error('First task not preserved');
    if (loaded[250].id !== largeTasks[250].id) throw new Error('Middle task not preserved');
    if (loaded[499].id !== largeTasks[499].id) throw new Error('Last task not preserved');
}

function testLargeDatasetLoad1000Tasks() {
    const largeTasks = dataGenerator.generateTasks(1000);
    saveTasks(largeTasks);
    
    const loaded = loadTasks();
    if (loaded.length !== 1000) throw new Error('Not all 1000 tasks loaded');
    
    // Verify multiple samples
    const samples = [0, 100, 250, 500, 750, 999];
    for (const idx of samples) {
        if (loaded[idx].id !== largeTasks[idx].id) {
            throw new Error(`Task at index ${idx} not preserved in large dataset`);
        }
    }
}

function testLargeDatasetWithComplexProperties() {
    const largeTasks = [];
    for (let i = 0; i < 150; i++) {
        largeTasks.push(dataGenerator.generateTask({
            name: `Task ${i}`,
            estimated_time: Math.floor(Math.random() * 480),
            actual_time: Math.random() > 0.5 ? Math.floor(Math.random() * 480) : null,
            priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            category: `category-${i % 10}`,
            assigned_date: i % 2 === 0 ? '2024-01-15' : null,
            completed: i % 3 === 0,
            is_recurring: i % 5 === 0,
            details: `Details for task ${i}`
        }));
    }
    
    saveTasks(largeTasks);
    const loaded = loadTasks();
    
    if (loaded.length !== 150) throw new Error('Not all complex tasks saved');
    
    // Verify a few complex tasks
    if (loaded[50].name !== 'Task 50') throw new Error('Complex task name not preserved');
    if (loaded[50].details !== 'Details for task 50') throw new Error('Complex task details not preserved');
    if (loaded[100].is_recurring !== largeTasks[100].is_recurring) throw new Error('Complex task recurring flag not preserved');
}

// Test 4.8: JSON validity validation
function testJsonValidityOnSave() {
    const tasks = dataGenerator.generateTasks(10);
    const jsonString = JSON.stringify(tasks);
    
    // Verify the JSON is valid by parsing it
    try {
        JSON.parse(jsonString);
    } catch (error) {
        throw new Error('Generated JSON is not valid');
    }
}

function testJsonValidityWithSpecialCharacters() {
    const task = dataGenerator.generateTask({
        name: 'Task with "quotes" and \'apostrophes\'',
        details: 'Details with\nnewlines\tand\ttabs'
    });
    
    const jsonString = JSON.stringify([task]);
    
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed[0].name !== task.name) throw new Error('Special characters not preserved');
    } catch (error) {
        throw new Error('JSON with special characters is invalid');
    }
}

function testJsonValidityWithUnicodeCharacters() {
    const task = dataGenerator.generateTask({
        name: 'タスク 日本語 テスト',
        details: '詳細: 中文 한국어 العربية'
    });
    
    const jsonString = JSON.stringify([task]);
    
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed[0].name !== 'タスク 日本語 テスト') throw new Error('Unicode characters not preserved');
    } catch (error) {
        throw new Error('JSON with Unicode characters is invalid');
    }
}

function testJsonValidityWithLargeDataset() {
    const largeTasks = dataGenerator.generateTasks(200);
    const jsonString = JSON.stringify(largeTasks);
    
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.length !== 200) throw new Error('Large dataset JSON not valid');
    } catch (error) {
        throw new Error('Large dataset JSON is invalid');
    }
}

function testJsonValidityPreservesDataTypes() {
    const task = dataGenerator.generateTask({
        estimated_time: 120,
        actual_time: 90.5,
        completed: true,
        is_recurring: false,
        assigned_date: '2024-01-15',
        recurrence_pattern: null
    });
    
    const jsonString = JSON.stringify([task]);
    const parsed = JSON.parse(jsonString);
    const loaded = parsed[0];
    
    if (typeof loaded.estimated_time !== 'number') throw new Error('Number type not preserved in JSON');
    if (typeof loaded.completed !== 'boolean') throw new Error('Boolean type not preserved in JSON');
    if (typeof loaded.assigned_date !== 'string') throw new Error('String type not preserved in JSON');
    if (loaded.recurrence_pattern !== null) throw new Error('Null type not preserved in JSON');
    if (loaded.actual_time !== 90.5) throw new Error('Decimal precision not preserved in JSON');
}

// Run all tests
function runAllTests() {
    console.log('\n=== Data Persistence Tests ===\n');
    
    mockStorage = new MockLocalStorage();
    dataGenerator = new TestDataGenerator();
    
    // Test 5.1: Task save/load
    runTest('Task JSON save', testTaskJsonSave);
    runTest('Task properties restored', testTaskPropertiesRestored);
    runTest('Multiple tasks save', testMultipleTasksSave);
    
    // Test 5.2: Settings save/load
    runTest('Settings save', testSettingsSave);
    runTest('Weekday visibility save', testWeekdayVisibilitySave);
    
    // Test 5.3: Template save/load
    runTest('Template save', testTemplateSave);
    runTest('Multiple templates save', testMultipleTemplatesSave);
    
    // Test 5.4: Archive save/load
    runTest('Archived tasks save', testArchivedTasksSave);
    
    // Test 5.5: Corruption handling
    runTest('Corrupted JSON handling', testCorruptedJsonHandling);
    runTest('Empty storage initialization', testEmptyStorageInitialization);
    
    // Test 5.6: Large datasets
    runTest('Large dataset save (150 tasks)', testLargeDatasetSave);
    runTest('Large dataset load (200 tasks)', testLargeDatasetLoad);
    
    // Test 5.7: JSON validation
    runTest('JSON validation', testJsonValidation);
    runTest('Complex data structure validation', testComplexDataStructureValidation);
    
    // Test 5.8: Data type preservation
    runTest('Data type preservation', testDataTypePreservation);
    runTest('Null value preservation', testNullValuePreservation);
    
    // ===== EDGE CASE TESTS FOR TASK 5.2 =====
    
    // Test 4.5: Archive save tests
    console.log('\n--- Edge Case Tests: Archive Save (Requirement 4.5) ---');
    runTest('Archive save with completed tasks', testArchiveSaveWithCompletedTasks);
    runTest('Archive save preserves all properties', testArchiveSavePreservesAllProperties);
    runTest('Archive save multiple batches', testArchiveSaveMultipleBatches);
    
    // Test 4.6: localStorage corruption handling
    console.log('\n--- Edge Case Tests: localStorage Corruption (Requirement 4.6) ---');
    runTest('Corrupted storage initialization', testCorruptedStorageInitialization);
    runTest('Default initialization after corruption', testDefaultInitializationAfterCorruption);
    runTest('Partial corruption recovery', testPartialCorruptionRecovery);
    
    // Test 4.7: Large dataset handling (100+ tasks)
    console.log('\n--- Edge Case Tests: Large Dataset (Requirement 4.7) ---');
    runTest('Large dataset save 100 tasks', testLargeDatasetSave100Tasks);
    runTest('Large dataset save 500 tasks', testLargeDatasetSave500Tasks);
    runTest('Large dataset load 1000 tasks', testLargeDatasetLoad1000Tasks);
    runTest('Large dataset with complex properties', testLargeDatasetWithComplexProperties);
    
    // Test 4.8: JSON validity validation
    console.log('\n--- Edge Case Tests: JSON Validity (Requirement 4.8) ---');
    runTest('JSON validity on save', testJsonValidityOnSave);
    runTest('JSON validity with special characters', testJsonValidityWithSpecialCharacters);
    runTest('JSON validity with Unicode characters', testJsonValidityWithUnicodeCharacters);
    runTest('JSON validity with large dataset', testJsonValidityWithLargeDataset);
    runTest('JSON validity preserves data types', testJsonValidityPreservesDataTypes);
    
    console.log(`\n=== Results ===`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}\n`);
    
    return testsFailed === 0;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests };
}

// Run if executed directly
if (require.main === module) {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
}
