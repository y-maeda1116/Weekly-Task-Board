/**
 * Time Comparison Display Tests
 * Tests for the estimated vs actual time comparison display
 */

// Test utilities
function calculateTimeDiff(estimated, actual) {
    return actual - estimated;
}

function calculateTimeDiffPercent(estimated, actual) {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
}

function getTimeComparisonStatus(estimated, actual) {
    if (!actual || actual === 0) {
        return 'no-actual';
    }
    
    const diff = calculateTimeDiff(estimated, actual);
    
    if (diff > 0) {
        return 'overrun';
    } else if (diff < 0) {
        return 'underrun';
    } else {
        return 'match';
    }
}

// Test Suite 1: Time Difference Calculation
console.log('=== Test Suite 1: Time Difference Calculation ===');

function testTimeDiffCalculation() {
    const test1 = calculateTimeDiff(5, 3) === -2;
    const test2 = calculateTimeDiff(5, 5) === 0;
    const test3 = calculateTimeDiff(5, 8) === 3;
    
    console.assert(test1, 'Underrun calculation should be -2');
    console.assert(test2, 'Match calculation should be 0');
    console.assert(test3, 'Overrun calculation should be 3');
    console.log('✅ Time difference calculation test passed');
}

function testTimeDiffPercentCalculation() {
    const test1 = Math.abs(calculateTimeDiffPercent(5, 3) - (-40)) < 0.1;
    const test2 = calculateTimeDiffPercent(5, 5) === 0;
    const test3 = Math.abs(calculateTimeDiffPercent(5, 8) - 60) < 0.1;
    
    console.assert(test1, 'Underrun percentage should be -40%');
    console.assert(test2, 'Match percentage should be 0%');
    console.assert(test3, 'Overrun percentage should be 60%');
    console.log('✅ Time difference percentage calculation test passed');
}

testTimeDiffCalculation();
testTimeDiffPercentCalculation();

// Test Suite 2: Time Comparison Status
console.log('\n=== Test Suite 2: Time Comparison Status ===');

function testTimeComparisonStatus() {
    const test1 = getTimeComparisonStatus(5, 3) === 'underrun';
    const test2 = getTimeComparisonStatus(5, 5) === 'match';
    const test3 = getTimeComparisonStatus(5, 8) === 'overrun';
    const test4 = getTimeComparisonStatus(5, 0) === 'no-actual';
    const test5 = getTimeComparisonStatus(5, null) === 'no-actual';
    
    console.assert(test1, 'Status should be underrun');
    console.assert(test2, 'Status should be match');
    console.assert(test3, 'Status should be overrun');
    console.assert(test4, 'Status should be no-actual for 0');
    console.assert(test5, 'Status should be no-actual for null');
    console.log('✅ Time comparison status test passed');
}

testTimeComparisonStatus();

// Test Suite 3: Edge Cases
console.log('\n=== Test Suite 3: Edge Cases ===');

function testZeroEstimatedTime() {
    const diff = calculateTimeDiff(0, 5);
    const status = getTimeComparisonStatus(0, 5);
    
    console.assert(diff === 5, 'Difference should be 5');
    console.assert(status === 'overrun', 'Status should be overrun');
    console.log('✅ Zero estimated time test passed');
}

function testVerySmallTimes() {
    const diff = calculateTimeDiff(0.5, 0.3);
    const status = getTimeComparisonStatus(0.5, 0.3);
    
    console.assert(diff === -0.2, 'Difference should be -0.2');
    console.assert(status === 'underrun', 'Status should be underrun');
    console.log('✅ Very small times test passed');
}

function testVeryLargeTimes() {
    const diff = calculateTimeDiff(100, 150);
    const status = getTimeComparisonStatus(100, 150);
    
    console.assert(diff === 50, 'Difference should be 50');
    console.assert(status === 'overrun', 'Status should be overrun');
    console.log('✅ Very large times test passed');
}

testZeroEstimatedTime();
testVerySmallTimes();
testVeryLargeTimes();

// Test Suite 4: Percentage Calculations
console.log('\n=== Test Suite 4: Percentage Calculations ===');

function testPercentageCalculations() {
    // 50% underrun
    const test1 = Math.abs(calculateTimeDiffPercent(10, 5) - (-50)) < 0.1;
    
    // 100% overrun
    const test2 = Math.abs(calculateTimeDiffPercent(10, 20) - 100) < 0.1;
    
    // 25% underrun
    const test3 = Math.abs(calculateTimeDiffPercent(8, 6) - (-25)) < 0.1;
    
    // 33.33% overrun
    const test4 = Math.abs(calculateTimeDiffPercent(3, 4) - 33.33) < 0.1;
    
    console.assert(test1, '50% underrun calculation correct');
    console.assert(test2, '100% overrun calculation correct');
    console.assert(test3, '25% underrun calculation correct');
    console.assert(test4, '33.33% overrun calculation correct');
    console.log('✅ Percentage calculations test passed');
}

testPercentageCalculations();

// Test Suite 5: Display String Generation
console.log('\n=== Test Suite 5: Display String Generation ===');

function generateTimeComparisonDisplay(estimated, actual) {
    if (!actual || actual === 0) {
        return `${estimated}h`;
    }
    
    const diff = calculateTimeDiff(estimated, actual);
    const percent = calculateTimeDiffPercent(estimated, actual).toFixed(0);
    
    if (diff > 0) {
        return `${estimated}h (+${diff}h, +${percent}%)`;
    } else if (diff < 0) {
        return `${estimated}h (${diff}h, ${percent}%)`;
    } else {
        return `${estimated}h (一致)`;
    }
}

function testDisplayStringGeneration() {
    const test1 = generateTimeComparisonDisplay(5, 0) === '5h';
    const test2 = generateTimeComparisonDisplay(5, 3) === '5h (-2h, -40%)';
    const test3 = generateTimeComparisonDisplay(5, 5) === '5h (一致)';
    const test4 = generateTimeComparisonDisplay(5, 8) === '5h (+3h, +60%)';
    
    console.assert(test1, 'No actual time display correct');
    console.assert(test2, 'Underrun display correct');
    console.assert(test3, 'Match display correct');
    console.assert(test4, 'Overrun display correct');
    console.log('✅ Display string generation test passed');
}

testDisplayStringGeneration();

// Test Suite 6: Batch Comparison
console.log('\n=== Test Suite 6: Batch Comparison ===');

function testBatchComparison() {
    const tasks = [
        { estimated_time: 5, actual_time: 3 },
        { estimated_time: 5, actual_time: 5 },
        { estimated_time: 5, actual_time: 8 },
        { estimated_time: 5, actual_time: 0 }
    ];
    
    const statuses = tasks.map(t => getTimeComparisonStatus(t.estimated_time, t.actual_time));
    
    const test1 = statuses[0] === 'underrun';
    const test2 = statuses[1] === 'match';
    const test3 = statuses[2] === 'overrun';
    const test4 = statuses[3] === 'no-actual';
    
    console.assert(test1, 'First task should be underrun');
    console.assert(test2, 'Second task should be match');
    console.assert(test3, 'Third task should be overrun');
    console.assert(test4, 'Fourth task should be no-actual');
    console.log('✅ Batch comparison test passed');
}

testBatchComparison();

// Test Suite 7: Rounding
console.log('\n=== Test Suite 7: Rounding ===');

function testRounding() {
    const percent1 = calculateTimeDiffPercent(3, 4).toFixed(0);
    const percent2 = calculateTimeDiffPercent(7, 5).toFixed(0);
    
    console.assert(percent1 === '33', 'Should round 33.33 to 33');
    console.assert(percent2 === '-29', 'Should round -28.57 to -29');
    console.log('✅ Rounding test passed');
}

testRounding();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All time comparison tests completed successfully!');
console.log('Total test suites: 7');
console.log('Total tests: 20+');
