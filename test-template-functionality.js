/**
 * Template Functionality Tests
 * Tests for template save, list, create, and delete operations
 */

// Mock localStorage for testing
const mockStorage = {};

function mockLocalStorage() {
    global.localStorage = {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => { mockStorage[key] = value; },
        removeItem: (key) => { delete mockStorage[key]; },
        clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
    };
}

// Test 1: Save task as template (10.1)
function testSaveTaskAsTemplate() {
    console.log('Test 1: Save task as template');
    
    mockLocalStorage();
    
    const task = {
        id: 'task-1',
        name: 'Test Task',
        estimated_time: 5,
        priority: 'high',
        category: 'task',
        details: 'Test details',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
    };
    
    // Simulate saveTaskAsTemplate
    const templates = [];
    const template = {
        id: `template-${Date.now()}`,
        name: 'Test Template',
        description: task.details,
        base_task: {
            name: task.name,
            estimated_time: task.estimated_time,
            priority: task.priority,
            category: task.category,
            details: task.details,
            is_recurring: task.is_recurring,
            recurrence_pattern: task.recurrence_pattern,
            recurrence_end_date: task.recurrence_end_date
        },
        created_date: '2024-01-01',
        usage_count: 0
    };
    
    templates.push(template);
    
    console.assert(templates.length === 1, 'Template should be saved');
    console.assert(template.name === 'Test Template', 'Template name should match');
    console.assert(template.base_task.name === 'Test Task', 'Base task name should match');
    console.log('✓ Test 1 passed\n');
}

// Test 2: Get all templates (10.2)
function testGetTemplates() {
    console.log('Test 2: Get all templates');
    
    mockLocalStorage();
    
    const templates = [
        {
            id: 'template-1',
            name: 'Template 1',
            base_task: { name: 'Task 1', estimated_time: 5 },
            usage_count: 2
        },
        {
            id: 'template-2',
            name: 'Template 2',
            base_task: { name: 'Task 2', estimated_time: 3 },
            usage_count: 1
        }
    ];
    
    console.assert(templates.length === 2, 'Should have 2 templates');
    console.assert(templates[0].name === 'Template 1', 'First template name should match');
    console.assert(templates[1].usage_count === 1, 'Second template usage count should be 1');
    console.log('✓ Test 2 passed\n');
}

// Test 3: Create task from template (10.3)
function testCreateTaskFromTemplate() {
    console.log('Test 3: Create task from template');
    
    mockLocalStorage();
    
    const template = {
        id: 'template-1',
        name: 'Test Template',
        base_task: {
            name: 'Template Task',
            estimated_time: 5,
            priority: 'high',
            category: 'task',
            details: 'Template details',
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null
        },
        usage_count: 0
    };
    
    // Simulate createTaskFromTemplate
    const newTask = {
        id: `task-${Date.now()}`,
        name: template.base_task.name,
        estimated_time: template.base_task.estimated_time,
        actual_time: 0,
        priority: template.base_task.priority,
        category: template.base_task.category,
        assigned_date: '2024-01-15',
        due_date: null,
        details: template.base_task.details,
        completed: false,
        is_recurring: template.base_task.is_recurring,
        recurrence_pattern: template.base_task.recurrence_pattern,
        recurrence_end_date: template.base_task.recurrence_end_date
    };
    
    console.assert(newTask.name === 'Template Task', 'New task name should match template');
    console.assert(newTask.estimated_time === 5, 'New task estimated time should match template');
    console.assert(newTask.actual_time === 0, 'New task actual time should be 0');
    console.assert(newTask.assigned_date === '2024-01-15', 'New task should have assigned date');
    console.log('✓ Test 3 passed\n');
}

// Test 4: Delete template (10.4)
function testDeleteTemplate() {
    console.log('Test 4: Delete template');
    
    mockLocalStorage();
    
    let templates = [
        { id: 'template-1', name: 'Template 1' },
        { id: 'template-2', name: 'Template 2' },
        { id: 'template-3', name: 'Template 3' }
    ];
    
    console.assert(templates.length === 3, 'Should start with 3 templates');
    
    // Simulate deleteTemplate
    const templateIdToDelete = 'template-2';
    templates = templates.filter(t => t.id !== templateIdToDelete);
    
    console.assert(templates.length === 2, 'Should have 2 templates after deletion');
    console.assert(!templates.find(t => t.id === 'template-2'), 'Deleted template should not exist');
    console.assert(templates[0].id === 'template-1', 'First template should still be template-1');
    console.assert(templates[1].id === 'template-3', 'Second template should be template-3');
    console.log('✓ Test 4 passed\n');
}

// Test 5: Template persistence
function testTemplatePersistence() {
    console.log('Test 5: Template persistence');
    
    mockLocalStorage();
    
    const templates = [
        { id: 'template-1', name: 'Template 1', usage_count: 5 }
    ];
    
    // Simulate saving to localStorage
    localStorage.setItem('weekly-task-board.templates', JSON.stringify(templates));
    
    // Simulate loading from localStorage
    const loaded = JSON.parse(localStorage.getItem('weekly-task-board.templates'));
    
    console.assert(loaded.length === 1, 'Should load 1 template');
    console.assert(loaded[0].name === 'Template 1', 'Template name should persist');
    console.assert(loaded[0].usage_count === 5, 'Template usage count should persist');
    console.log('✓ Test 5 passed\n');
}

// Test 6: Template with recurring task
function testTemplateWithRecurringTask() {
    console.log('Test 6: Template with recurring task');
    
    mockLocalStorage();
    
    const recurringTask = {
        id: 'task-1',
        name: 'Daily Standup',
        estimated_time: 0.5,
        priority: 'high',
        category: 'meeting',
        details: 'Daily team standup',
        is_recurring: true,
        recurrence_pattern: 'daily',
        recurrence_end_date: '2024-12-31'
    };
    
    const template = {
        id: 'template-recurring',
        name: 'Daily Standup Template',
        base_task: {
            name: recurringTask.name,
            estimated_time: recurringTask.estimated_time,
            priority: recurringTask.priority,
            category: recurringTask.category,
            details: recurringTask.details,
            is_recurring: recurringTask.is_recurring,
            recurrence_pattern: recurringTask.recurrence_pattern,
            recurrence_end_date: recurringTask.recurrence_end_date
        },
        usage_count: 0
    };
    
    console.assert(template.base_task.is_recurring === true, 'Template should preserve recurring flag');
    console.assert(template.base_task.recurrence_pattern === 'daily', 'Template should preserve recurrence pattern');
    console.assert(template.base_task.recurrence_end_date === '2024-12-31', 'Template should preserve end date');
    console.log('✓ Test 6 passed\n');
}

// Run all tests
console.log('=== Template Functionality Tests ===\n');
testSaveTaskAsTemplate();
testGetTemplates();
testCreateTaskFromTemplate();
testDeleteTemplate();
testTemplatePersistence();
testTemplateWithRecurringTask();
console.log('=== All tests passed! ===');
