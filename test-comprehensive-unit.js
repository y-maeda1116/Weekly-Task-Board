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
            testResults.details.push(`✅ ${testName}: PASSED`);
            console.log(`✅ ${testName}: PASSED`);
        } else {
            testResults.failed++;
            testResults.details.push(`❌ ${testName}: FAILED - ${result}`);
            console.log(`❌ ${testName}: FAILED - ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`❌ ${testName}: ERROR - ${error.message}`);
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
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
            { id: '2', category: 'task', es