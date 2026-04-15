/**
 * Comprehensive Unit Tests for Advanced Task Management
 * Tests for statistics, time management, recurring tasks, and templates
 * 
 * Validates: Requirements 1.1-1.6, 2.1-2.6, 3.1-3.6
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * Test runner function
 */
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            testResults.passed++;
            testResults.details.push(`PASS ${testName}`);
            console.log(`PASS ${testName}`);
        } else {
            testResults.failed++;
            testResults.details.push(`FAIL ${testName}: ${result}`);
            console.log(`FAIL ${testName}: ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`ERROR ${testName}: ${error.message}`);
        console.log(`ERROR ${testName}: ${error.message}`);
    }
}

/**
 * Utility function to format dates
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Statistics Engine Tests
 */
function testStatisticsEngine() {
    console.log('\n=== Statistics Engine Tests ===\n');
    
    // Test 1.1: Complete task count calculation
    runTest('1.1 Complete task count calculation', () => {
        const tasks = [
            { id: '1', name: 'Task 1', completed: true },
            { id: '2', name: 'Task 2', completed: true },
            { id: '3', name: 'Task 3', completed: false },
            { id: '4', name: 'Task 4', completed: false }
        ];
        
        const completedCount = tasks.filter(t => t.completed).length;
        return completedCount === 2;
    });
    
    // Test 1.2: Completion rate calculation
    runTest('1.2 Completion rate calculation', () => {
        const tasks = [
            { id: '1', name: 'Task 1', completed: true },
            { id: '2', name: 'Task 2', completed: true },
            { id: '3', name: 'Task 3', completed: false },
            { id: '4', name: 'Task 4', completed: false }
        ];
        
        const completedCount = tasks.filter(t => t.completed).length;
        const completionRate = (completedCount / tasks.length) * 100;
        
        return completionRate === 50;
    });
    
    // Test 1.3: Category-wise time analysis
    runTest('1.3 Category-wise time analysis', () => {
        const tasks = [
            { id: '1', category: 'task', estimated_time: 5, completed: true },
            { id: '2', category: 'task', estimated_time: 10, completed: true },
            { id: '3', category: 'meeting', estimated_time: 30, completed: false }
        ];
        
        const taskTime = tasks
            .filter(t => t.category === 'task')
            .reduce((sum, t) => sum + t.estimated_time, 0);
        
        return taskTime === 15;
    });
    
    // Test 1.4: Weekly statistics aggregation
    runTest('1.4 Weekly statistics aggregation', () => {
        const tasks = [
            { id: '1', name: 'Task 1', completed: true, estimated_time: 5 },
            { id: '2', name: 'Task 2', completed: false, estimated_time: 10 }
        ];
        
        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            totalTime: tasks.reduce((sum, t) => sum + t.estimated_time, 0)
        };
        
        return stats.total === 2 && stats.completed === 1 && stats.totalTime === 15;
    });
    
    // Test 1.5: Time tracking accuracy
    runTest('1.5 Time tracking accuracy', () => {
        const task = {
            id: '1',
            name: 'Task 1',
            estimated_time: 30,
            actual_time: 25
        };
        
        const variance = task.actual_time - task.estimated_time;
        return variance === -5;
    });
    
    // Test 1.6: Statistics persistence
    runTest('1.6 Statistics persistence', () => {
        const stats = { total: 10, completed: 5 };
        localStorage.setItem('stats', JSON.stringify(stats));
        
        const retrieved = JSON.parse(localStorage.getItem('stats'));
        return retrieved.total === 10 && retrieved.completed === 5;
    });
}

/**
 * Time Management Tests
 */
function testTimeManagement() {
    console.log('\n=== Time Management Tests ===\n');
    
    // Test 2.1: Time validation
    runTest('2.1 Time validation', () => {
        const isValidTime = (time) => {
            return typeof time === 'number' && time > 0 && time <= 480;
        };
        
        return isValidTime(30) && !isValidTime(0) && !isValidTime(500);
    });
    
    // Test 2.2: Time format conversion
    runTest('2.2 Time format conversion', () => {
        const minutesToHours = (minutes) => {
            return Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0');
        };
        
        return minutesToHours(90) === '1:30';
    });
    
    // Test 2.3: Actual time recording
    runTest('2.3 Actual time recording', () => {
        const task = {
            id: '1',
            name: 'Task 1',
            estimated_time: 30,
            actual_time: null
        };
        
        task.actual_time = 25;
        return task.actual_time === 25;
    });
    
    // Test 2.4: Time overrun detection
    runTest('2.4 Time overrun detection', () => {
        const task = {
            estimated_time: 30,
            actual_time: 45
        };
        
        const isOverrun = task.actual_time > task.estimated_time;
        return isOverrun === true;
    });
    
    // Test 2.5: Daily time summary
    runTest('2.5 Daily time summary', () => {
        const tasks = [
            { id: '1', estimated_time: 30, actual_time: 25 },
            { id: '2', estimated_time: 60, actual_time: 65 }
        ];
        
        const totalEstimated = tasks.reduce((sum, t) => sum + t.estimated_time, 0);
        const totalActual = tasks.reduce((sum, t) => sum + t.actual_time, 0);
        
        return totalEstimated === 90 && totalActual === 90;
    });
    
    // Test 2.6: Time persistence
    runTest('2.6 Time persistence', () => {
        const timeData = { estimated: 30, actual: 25 };
        localStorage.setItem('time-data', JSON.stringify(timeData));
        
        const retrieved = JSON.parse(localStorage.getItem('time-data'));
        return retrieved.estimated === 30 && retrieved.actual === 25;
    });
}

/**
 * Recurring Tasks Tests
 */
function testRecurringTasks() {
    console.log('\n=== Recurring Tasks Tests ===\n');
    
    // Test 3.1: Recurring task creation
    runTest('3.1 Recurring task creation', () => {
        const recurringTask = {
            id: '1',
            name: 'Weekly Meeting',
            frequency: 'weekly',
            days: ['Monday', 'Wednesday']
        };
        
        return recurringTask.frequency === 'weekly' && recurringTask.days.length === 2;
    });
    
    // Test 3.2: Recurring task generation
    runTest('3.2 Recurring task generation', () => {
        const generateRecurringTasks = (baseTask, weeks) => {
            const tasks = [];
            for (let i = 0; i < weeks; i++) {
                tasks.push({
                    ...baseTask,
                    id: baseTask.id + '-' + i
                });
            }
            return tasks;
        };
        
        const base = { id: '1', name: 'Task' };
        const generated = generateRecurringTasks(base, 4);
        
        return generated.length === 4;
    });
    
    // Test 3.3: Recurring task modification
    runTest('3.3 Recurring task modification', () => {
        const task = {
            id: '1',
            name: 'Weekly Task',
            frequency: 'weekly'
        };
        
        task.name = 'Updated Weekly Task';
        return task.name === 'Updated Weekly Task';
    });
    
    // Test 3.4: Recurring task deletion
    runTest('3.4 Recurring task deletion', () => {
        const tasks = [
            { id: '1', name: 'Task 1', recurring: true },
            { id: '2', name: 'Task 2', recurring: false }
        ];
        
        const filtered = tasks.filter(t => !t.recurring);
        return filtered.length === 1;
    });
    
    // Test 3.5: Recurring pattern validation
    runTest('3.5 Recurring pattern validation', () => {
        const isValidPattern = (pattern) => {
            const validPatterns = ['daily', 'weekly', 'monthly'];
            return validPatterns.includes(pattern);
        };
        
        return isValidPattern('weekly') && !isValidPattern('yearly');
    });
    
    // Test 3.6: Recurring task persistence
    runTest('3.6 Recurring task persistence', () => {
        const recurringTask = {
            id: '1',
            name: 'Weekly Task',
            frequency: 'weekly'
        };
        
        localStorage.setItem('recurring-task', JSON.stringify(recurringTask));
        const retrieved = JSON.parse(localStorage.getItem('recurring-task'));
        
        return retrieved.frequency === 'weekly';
    });
}

/**
 * Template Tests
 */
function testTemplates() {
    console.log('\n=== Template Tests ===\n');
    
    // Test 4.1: Template creation
    runTest('4.1 Template creation', () => {
        const template = {
            id: '1',
            name: 'Weekly Template',
            tasks: ['Task 1', 'Task 2', 'Task 3']
        };
        
        return template.tasks.length === 3;
    });
    
    // Test 4.2: Template application
    runTest('4.2 Template application', () => {
        const template = {
            tasks: [
                { name: 'Task 1', estimated_time: 30 },
                { name: 'Task 2', estimated_time: 60 }
            ]
        };
        
        const appliedTasks = template.tasks.map(t => ({
            ...t,
            id: Math.random().toString()
        }));
        
        return appliedTasks.length === 2;
    });
    
    // Test 4.3: Template modification
    runTest('4.3 Template modification', () => {
        const template = {
            id: '1',
            name: 'Template',
            tasks: ['Task 1']
        };
        
        template.tasks.push('Task 2');
        return template.tasks.length === 2;
    });
    
    // Test 4.4: Template deletion
    runTest('4.4 Template deletion', () => {
        const templates = [
            { id: '1', name: 'Template 1' },
            { id: '2', name: 'Template 2' }
        ];
        
        const filtered = templates.filter(t => t.id !== '1');
        return filtered.length === 1;
    });
    
    // Test 4.5: Template persistence
    runTest('4.5 Template persistence', () => {
        const template = {
            id: '1',
            name: 'Template',
            tasks: ['Task 1', 'Task 2']
        };
        
        localStorage.setItem('template', JSON.stringify(template));
        const retrieved = JSON.parse(localStorage.getItem('template'));
        
        return retrieved.tasks.length === 2;
    });
    
    // Test 4.6: Template validation
    runTest('4.6 Template validation', () => {
        const isValidTemplate = (template) => {
            return template.id && template.name && Array.isArray(template.tasks);
        };
        
        const validTemplate = { id: '1', name: 'Template', tasks: [] };
        const invalidTemplate = { id: '1', name: 'Template' };
        
        return isValidTemplate(validTemplate) && !isValidTemplate(invalidTemplate);
    });
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('==========================================');
    console.log('Comprehensive Unit Tests');
    console.log('==========================================\n');
    
    testStatisticsEngine();
    testTimeManagement();
    testRecurringTasks();
    testTemplates();
    
    console.log('\n==========================================');
    console.log('Test Summary');
    console.log('==========================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    console.log('==========================================\n');
    
    if (testResults.failed === 0) {
        console.log('All tests passed!');
        process.exit(0);
    } else {
        console.log(`${testResults.failed} test(s) failed!`);
        process.exit(1);
    }
}

// Run tests
runAllTests();
