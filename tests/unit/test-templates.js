/**
 * Template Functionality Unit Tests
 * Tests for template creation, application, editing, deletion, search, sorting, and duplication
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

// Mock localStorage
let mockStorage = new MockLocalStorage();
const TEMPLATES_STORAGE_KEY = 'templates';

// Test data generator
const generator = new TestDataGenerator();

/**
 * Helper function to set up test environment
 */
function setupTest() {
    mockStorage = new MockLocalStorage();
    generator.resetCounter();
    templateIdCounter = 0;
}

/**
 * Helper function to save templates to mock storage
 */
function saveTemplates(templates) {
    mockStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Helper function to load templates from mock storage
 */
function loadTemplates() {
    const templatesJson = mockStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!templatesJson) {
        return [];
    }
    try {
        return JSON.parse(templatesJson);
    } catch (error) {
        return [];
    }
}

// Counter for unique template IDs
let templateIdCounter = 0;

/**
 * Create a template object
 */
function createTemplate(name, baseTask, overrides = {}) {
    const template = {
        id: `template-${Date.now()}-${templateIdCounter++}`,
        name: name,
        description: baseTask.details || '',
        base_task: {
            name: baseTask.name,
            estimated_time: baseTask.estimated_time,
            priority: baseTask.priority,
            category: baseTask.category,
            details: baseTask.details,
            is_recurring: baseTask.is_recurring,
            recurrence_pattern: baseTask.recurrence_pattern,
            recurrence_end_date: baseTask.recurrence_end_date
        },
        created_date: new Date().toISOString().split('T')[0],
        usage_count: 0,
        ...overrides
    };
    return template;
}

/**
 * Create a task from template
 */
function createTaskFromTemplate(template, assignedDate = null) {
    const newTask = {
        id: `task-${Date.now()}`,
        name: template.base_task.name,
        estimated_time: template.base_task.estimated_time,
        actual_time: 0,
        priority: template.base_task.priority,
        category: template.base_task.category,
        assigned_date: assignedDate || null,
        due_date: null,
        details: template.base_task.details,
        completed: false,
        is_recurring: template.base_task.is_recurring,
        recurrence_pattern: template.base_task.recurrence_pattern,
        recurrence_end_date: template.base_task.recurrence_end_date
    };
    
    // Update template usage count
    const templates = loadTemplates();
    const templateIndex = templates.findIndex(t => t.id === template.id);
    if (templateIndex > -1) {
        templates[templateIndex].usage_count++;
        saveTemplates(templates);
    }
    
    return newTask;
}

/**
 * Delete a template
 */
function deleteTemplate(templateId) {
    const templates = loadTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    
    if (filteredTemplates.length < templates.length) {
        saveTemplates(filteredTemplates);
        return true;
    }
    
    return false;
}

/**
 * Search templates by name
 */
function searchTemplates(searchTerm) {
    const templates = loadTemplates();
    if (!searchTerm) return templates;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(lowerSearchTerm));
}

/**
 * Sort templates
 */
function sortTemplates(sortBy = 'recent') {
    const templates = loadTemplates();
    const sorted = [...templates];
    
    switch (sortBy) {
        case 'recent':
            sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'usage':
            sorted.sort((a, b) => b.usage_count - a.usage_count);
            break;
    }
    
    return sorted;
}

/**
 * Duplicate a template
 */
function duplicateTemplate(template) {
    const templates = loadTemplates();
    
    const newTemplate = {
        id: `template-${Date.now()}-${templateIdCounter++}`,
        name: `${template.name} (コピー)`,
        description: template.description,
        base_task: { ...template.base_task },
        created_date: new Date().toISOString().split('T')[0],
        usage_count: 0
    };
    
    templates.push(newTemplate);
    saveTemplates(templates);
    
    return newTemplate;
}

// ============================================================================
// TEST SUITE: Template Basic Operations (10.1)
// ============================================================================

console.log('\n=== Template Basic Operations Tests ===\n');

// Test 10.1.1: Template creation with unique ID assignment
console.log('Test 10.1.1: Template creation with unique ID assignment');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Weekly Report',
        estimated_time: 120,
        priority: 'high',
        category: 'work'
    });
    
    const template1 = createTemplate('Weekly Report Template', baseTask);
    const template2 = createTemplate('Weekly Report Template', baseTask);
    
    if (template1.id !== template2.id && template1.id.startsWith('template-') && template2.id.startsWith('template-')) {
        console.log('✓ PASS: Templates have unique IDs\n');
    } else {
        console.log('✗ FAIL: Templates do not have unique IDs\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.1.2: Template application and task generation
console.log('Test 10.1.2: Template application and task generation');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Daily Standup',
        estimated_time: 30,
        priority: 'medium',
        category: 'meeting',
        details: 'Team standup meeting'
    });
    
    const template = createTemplate('Daily Standup Template', baseTask);
    saveTemplates([template]);
    
    const assignedDate = '2024-01-15';
    const newTask = createTaskFromTemplate(template, assignedDate);
    
    if (newTask.name === template.base_task.name &&
        newTask.estimated_time === template.base_task.estimated_time &&
        newTask.priority === template.base_task.priority &&
        newTask.category === template.base_task.category &&
        newTask.assigned_date === assignedDate &&
        newTask.completed === false) {
        console.log('✓ PASS: Task created from template with all properties copied\n');
    } else {
        console.log('✗ FAIL: Task properties do not match template\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.1.3: Template editing and localStorage persistence
console.log('Test 10.1.3: Template editing and localStorage persistence');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Code Review',
        estimated_time: 60,
        priority: 'high',
        category: 'development'
    });
    
    const template = createTemplate('Code Review Template', baseTask);
    saveTemplates([template]);
    
    // Edit template
    const templates = loadTemplates();
    templates[0].name = 'Updated Code Review Template';
    templates[0].base_task.estimated_time = 90;
    saveTemplates(templates);
    
    // Verify persistence
    const loadedTemplates = loadTemplates();
    if (loadedTemplates[0].name === 'Updated Code Review Template' &&
        loadedTemplates[0].base_task.estimated_time === 90) {
        console.log('✓ PASS: Template edits persisted to localStorage\n');
    } else {
        console.log('✗ FAIL: Template edits not persisted\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.1.4: Template deletion
console.log('Test 10.1.4: Template deletion');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Test Task',
        estimated_time: 45,
        priority: 'low',
        category: 'task'
    });
    
    const template = createTemplate('Test Template', baseTask);
    saveTemplates([template]);
    
    // Verify template exists
    let templates = loadTemplates();
    if (templates.length !== 1) {
        throw new Error('Template not saved');
    }
    
    // Delete template
    const deleted = deleteTemplate(template.id);
    
    // Verify deletion
    templates = loadTemplates();
    if (deleted && templates.length === 0) {
        console.log('✓ PASS: Template deleted successfully\n');
    } else {
        console.log('✗ FAIL: Template not deleted\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// ============================================================================
// TEST SUITE: Template Management Features (10.2)
// ============================================================================

console.log('\n=== Template Management Features Tests ===\n');

// Test 10.2.1: Template search
console.log('Test 10.2.1: Template search');
try {
    setupTest();
    
    const task1 = generator.generateTask({ name: 'Weekly Report' });
    const task2 = generator.generateTask({ name: 'Daily Standup' });
    const task3 = generator.generateTask({ name: 'Weekly Planning' });
    
    const template1 = createTemplate('Weekly Report Template', task1);
    const template2 = createTemplate('Daily Standup Template', task2);
    const template3 = createTemplate('Weekly Planning Template', task3);
    
    saveTemplates([template1, template2, template3]);
    
    // Search for "Weekly"
    const results = searchTemplates('Weekly');
    
    if (results.length === 2 && 
        results.some(t => t.name === 'Weekly Report Template') &&
        results.some(t => t.name === 'Weekly Planning Template')) {
        console.log('✓ PASS: Template search filters by name correctly\n');
    } else {
        console.log('✗ FAIL: Template search did not return expected results\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.2.2: Template sorting (recent, name, usage)
console.log('Test 10.2.2: Template sorting (recent, name, usage)');
try {
    setupTest();
    
    const task1 = generator.generateTask({ name: 'Task A' });
    const task2 = generator.generateTask({ name: 'Task B' });
    const task3 = generator.generateTask({ name: 'Task C' });
    
    const template1 = createTemplate('Template A', task1, { created_date: '2024-01-10', usage_count: 5 });
    const template2 = createTemplate('Template B', task2, { created_date: '2024-01-15', usage_count: 2 });
    const template3 = createTemplate('Template C', task3, { created_date: '2024-01-12', usage_count: 8 });
    
    saveTemplates([template1, template2, template3]);
    
    // Test recent sort
    const recentSort = sortTemplates('recent');
    if (recentSort[0].name === 'Template B' && recentSort[1].name === 'Template C' && recentSort[2].name === 'Template A') {
        console.log('✓ PASS: Recent sort works correctly');
    } else {
        console.log('✗ FAIL: Recent sort failed');
    }
    
    // Test name sort
    const nameSort = sortTemplates('name');
    if (nameSort[0].name === 'Template A' && nameSort[1].name === 'Template B' && nameSort[2].name === 'Template C') {
        console.log('✓ PASS: Name sort works correctly');
    } else {
        console.log('✗ FAIL: Name sort failed');
    }
    
    // Test usage sort
    const usageSort = sortTemplates('usage');
    if (usageSort[0].name === 'Template C' && usageSort[1].name === 'Template A' && usageSort[2].name === 'Template B') {
        console.log('✓ PASS: Usage sort works correctly\n');
    } else {
        console.log('✗ FAIL: Usage sort failed\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.2.3: Template usage count tracking
console.log('Test 10.2.3: Template usage count tracking');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Meeting',
        estimated_time: 60,
        priority: 'medium',
        category: 'meeting'
    });
    
    const template = createTemplate('Meeting Template', baseTask);
    saveTemplates([template]);
    
    // Use template multiple times
    createTaskFromTemplate(template);
    createTaskFromTemplate(template);
    createTaskFromTemplate(template);
    
    // Verify usage count
    const templates = loadTemplates();
    if (templates[0].usage_count === 3) {
        console.log('✓ PASS: Template usage count tracked correctly\n');
    } else {
        console.log(`✗ FAIL: Expected usage_count 3, got ${templates[0].usage_count}\n`);
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

// Test 10.2.4: Template duplication
console.log('Test 10.2.4: Template duplication');
try {
    setupTest();
    
    const baseTask = generator.generateTask({
        name: 'Project Task',
        estimated_time: 120,
        priority: 'high',
        category: 'project',
        details: 'Important project task'
    });
    
    const template = createTemplate('Project Template', baseTask);
    saveTemplates([template]);
    
    // Duplicate template
    const duplicated = duplicateTemplate(template);
    
    // Verify duplication
    const templates = loadTemplates();
    if (templates.length === 2 &&
        duplicated.id !== template.id &&
        duplicated.name === `${template.name} (コピー)` &&
        duplicated.base_task.name === template.base_task.name &&
        duplicated.base_task.estimated_time === template.base_task.estimated_time &&
        duplicated.usage_count === 0) {
        console.log('✓ PASS: Template duplicated with new ID and reset usage count\n');
    } else {
        console.log('✗ FAIL: Template duplication failed\n');
    }
} catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
}

console.log('=== Template Tests Complete ===\n');

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupTest,
        saveTemplates,
        loadTemplates,
        createTemplate,
        createTaskFromTemplate,
        deleteTemplate,
        searchTemplates,
        sortTemplates,
        duplicateTemplate
    };
}
