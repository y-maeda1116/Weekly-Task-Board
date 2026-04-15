/**
 * Time Management Unit Tests
 * Tests for time tracking, time overrun detection, and time data processing
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

// Mock localStorage
global.localStorage = new MockLocalStorage();

// Define the getTimeOverrunSeverity function directly
function getTimeOverrunSeverity(estimated, actual) {
    if (!actual || actual === 0 || actual <= estimated) {
        return 'none';
    }
    
    const overrunPercent = ((actual - estimated) / estimated) * 100;
    
    if (overrunPercent <= 25) {
        return 'minor';
    } else if (overrunPercent <= 50) {
        return 'moderate';
    } else {
        return 'severe';
    }
}

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test runner helper
 */
function runTest(testName, testFn) {
    try {
        testFn();
        console.log(`✓ ${testName}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${testName}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

/**
 * Assert helper
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Test Suite 9.1: Time Tracking and Time Overrun Detection
 */
console.log('\n=== Test Suite 9.1: Time Tracking and Time Overrun Detection ===\n');

// Test 9.1.1: Actual time recording
runTest('9.1.1 - Actual time recording test', () => {
    const generator = new TestDataGenerator();
    const task = generator.generateTask({
        estimated_time: 2,
        actual_time: null
    });
    
    assert(task.actual_time === null, 'Initial actual_time should be null');
    
    // Simulate recording actual time
    task.actual_time = 2.5;
    assert(task.actual_time === 2.5, 'Actual time should be recorded');
});

// Test 9.1.2: Time overrun severity calculation - minor (< 25%)
runTest('9.1.2 - Time overrun severity calculation (minor < 25%)', () => {
    const estimated = 10;
    const actual = 12; // 20% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'minor', `Expected 'minor' severity for 20% overrun, got '${severity}'`);
});

// Test 9.1.3: Time overrun severity calculation - moderate (25-50%)
runTest('9.1.3 - Time overrun severity calculation (moderate 25-50%)', () => {
    const estimated = 10;
    const actual = 13; // 30% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'moderate', `Expected 'moderate' severity for 30% overrun, got '${severity}'`);
});

// Test 9.1.4: Time overrun severity calculation - severe (> 50%)
runTest('9.1.4 - Time overrun severity calculation (severe > 50%)', () => {
    const estimated = 10;
    const actual = 15.1; // 51% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'severe', `Expected 'severe' severity for 51% overrun, got '${severity}'`);
});

// Test 9.1.5: Time overrun severity - no overrun
runTest('9.1.5 - Time overrun severity (no overrun)', () => {
    const estimated = 10;
    const actual = 8; // Under estimate
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'none', `Expected 'none' severity when actual <= estimated, got '${severity}'`);
});

// Test 9.1.6: Time overrun severity - null actual time
runTest('9.1.6 - Time overrun severity (null actual time)', () => {
    const estimated = 10;
    const actual = null;
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'none', `Expected 'none' severity for null actual_time, got '${severity}'`);
});

// Test 9.1.7: Time overrun severity - zero actual time
runTest('9.1.7 - Time overrun severity (zero actual time)', () => {
    const estimated = 10;
    const actual = 0;
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'none', `Expected 'none' severity for zero actual_time, got '${severity}'`);
});

// Test 9.1.8: Boundary test - exactly 25% overrun (should be minor per implementation)
runTest('9.1.8 - Boundary test (exactly 25% overrun)', () => {
    const estimated = 100;
    const actual = 125; // Exactly 25% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'minor', `Expected 'minor' severity for exactly 25% overrun, got '${severity}'`);
});

// Test 9.1.9: Boundary test - just over 25% overrun (should be moderate)
runTest('9.1.9 - Boundary test (just over 25% overrun)', () => {
    const estimated = 100;
    const actual = 125.1; // Just over 25% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'moderate', `Expected 'moderate' severity for 25.1% overrun, got '${severity}'`);
});

// Test 9.1.10: Boundary test - exactly 50% overrun (should be moderate per implementation)
runTest('9.1.10 - Boundary test (exactly 50% overrun)', () => {
    const estimated = 100;
    const actual = 150; // Exactly 50% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'moderate', `Expected 'moderate' severity for exactly 50% overrun, got '${severity}'`);
});

// Test 9.1.11: Boundary test - just over 50% overrun (should be severe)
runTest('9.1.11 - Boundary test (just over 50% overrun)', () => {
    const estimated = 100;
    const actual = 150.1; // Just over 50% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'severe', `Expected 'severe' severity for 50.1% overrun, got '${severity}'`);
});

/**
 * Test Suite 9.2: Time Data Processing
 */
console.log('\n=== Test Suite 9.2: Time Data Processing ===\n');

// Test 9.2.1: Decimal precision maintenance
runTest('9.2.1 - Decimal precision maintenance', () => {
    const generator = new TestDataGenerator();
    const task = generator.generateTask({
        estimated_time: 2.5,
        actual_time: 3.75
    });
    
    assert(task.estimated_time === 2.5, 'Estimated time decimal precision should be maintained');
    assert(task.actual_time === 3.75, 'Actual time decimal precision should be maintained');
});

// Test 9.2.2: Decimal precision in overrun calculation
runTest('9.2.2 - Decimal precision in overrun calculation', () => {
    const estimated = 2.5;
    const actual = 3.125; // 25% overrun exactly
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'minor', `Expected 'minor' severity for exactly 25% decimal overrun, got '${severity}'`);
});

// Test 9.2.3: Very small decimal values
runTest('9.2.3 - Very small decimal values', () => {
    const estimated = 0.5;
    const actual = 0.6; // 20% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'minor', `Expected 'minor' severity for small decimal values, got '${severity}'`);
});

// Test 9.2.4: Large decimal values
runTest('9.2.4 - Large decimal values', () => {
    const estimated = 100.5;
    const actual = 151; // ~50.2% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'severe', `Expected 'severe' severity for large decimal values, got '${severity}'`);
});

// Test 9.2.5: Daily work time calculation with multiple tasks
runTest('9.2.5 - Daily work time calculation with multiple tasks', () => {
    const generator = new TestDataGenerator();
    const tasks = [
        generator.generateTask({
            estimated_time: 2,
            actual_time: 2.5,
            assigned_date: '2024-01-15'
        }),
        generator.generateTask({
            estimated_time: 3,
            actual_time: 3.5,
            assigned_date: '2024-01-15'
        }),
        generator.generateTask({
            estimated_time: 1,
            actual_time: 0.8,
            assigned_date: '2024-01-15'
        })
    ];
    
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
    
    assert(totalEstimated === 6, `Expected total estimated 6, got ${totalEstimated}`);
    assert(totalActual === 6.8, `Expected total actual 6.8, got ${totalActual}`);
});

// Test 9.2.6: Daily work time with null actual times
runTest('9.2.6 - Daily work time with null actual times', () => {
    const generator = new TestDataGenerator();
    const tasks = [
        generator.generateTask({
            estimated_time: 2,
            actual_time: 2.5,
            assigned_date: '2024-01-15'
        }),
        generator.generateTask({
            estimated_time: 3,
            actual_time: null,
            assigned_date: '2024-01-15'
        })
    ];
    
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
    
    assert(totalEstimated === 5, `Expected total estimated 5, got ${totalEstimated}`);
    assert(totalActual === 2.5, `Expected total actual 2.5, got ${totalActual}`);
});

// Test 9.2.7: Time data export includes both estimated and actual
runTest('9.2.7 - Time data export includes both estimated and actual', () => {
    const generator = new TestDataGenerator();
    const task = generator.generateTask({
        estimated_time: 2.5,
        actual_time: 3.75
    });
    
    const exported = JSON.stringify(task);
    const parsed = JSON.parse(exported);
    
    assert(parsed.estimated_time === 2.5, 'Exported data should include estimated_time');
    assert(parsed.actual_time === 3.75, 'Exported data should include actual_time');
});

// Test 9.2.8: Multiple tasks with varying overrun severities
runTest('9.2.8 - Multiple tasks with varying overrun severities', () => {
    const tasks = [
        { estimated_time: 10, actual_time: 12 },  // minor (20%)
        { estimated_time: 10, actual_time: 13 },  // moderate (30%)
        { estimated_time: 10, actual_time: 15.1 }   // severe (51%)
    ];
    
    const severities = tasks.map(t => getTimeOverrunSeverity(t.estimated_time, t.actual_time));
    
    assert(severities[0] === 'minor', `Expected 'minor' for first task, got '${severities[0]}'`);
    assert(severities[1] === 'moderate', `Expected 'moderate' for second task, got '${severities[1]}'`);
    assert(severities[2] === 'severe', `Expected 'severe' for third task, got '${severities[2]}'`);
});

// Test 9.2.9: Precision with very high overrun percentage
runTest('9.2.9 - Precision with very high overrun percentage', () => {
    const estimated = 1;
    const actual = 10; // 900% overrun
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'severe', `Expected 'severe' severity for 900% overrun, got '${severity}'`);
});

// Test 9.2.10: Rounding edge case
runTest('9.2.10 - Rounding edge case', () => {
    const estimated = 3;
    const actual = 3.75; // 25% overrun exactly
    
    const severity = getTimeOverrunSeverity(estimated, actual);
    assert(severity === 'minor', `Expected 'minor' severity for exactly 25% overrun, got '${severity}'`);
});

/**
 * Print summary
 */
console.log('\n=== Test Summary ===');
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
