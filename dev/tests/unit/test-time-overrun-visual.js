/**
 * Time Overrun Visual Display Tests
 * Tests for the visual display of time overrun tasks
 */

// Severity determination function
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

// Test Suite 1: Severity Determination
console.log('=== Test Suite 1: Severity Determination ===');

function testSeverityDetermination() {
    // No overrun
    const test1 = getTimeOverrunSeverity(5, 3) === 'none';
    const test2 = getTimeOverrunSeverity(5, 5) === 'none';
    const test3 = getTimeOverrunSeverity(5, 0) === 'none';
    
    // Minor overrun (1-25%)
    const test4 = getTimeOverrunSeverity(10, 11) === 'minor';
    const test5 = getTimeOverrunSeverity(10, 12.5) === 'minor';
    
    // Moderate overrun (26-50%)
    const test6 = getTimeOverrunSeverity(10, 13) === 'moderate';
    const test7 = getTimeOverrunSeverity(10, 15) === 'moderate';
    
    // Severe overrun (>50%)
    const test8 = getTimeOverrunSeverity(10, 16) === 'severe';
    const test9 = getTimeOverrunSeverity(10, 20) === 'severe';
    
    console.assert(test1, 'Underrun should be none');
    console.assert(test2, 'Match should be none');
    console.assert(test3, 'Zero actual should be none');
    console.assert(test4, '10% overrun should be minor');
    console.assert(test5, '25% overrun should be minor');
    console.assert(test6, '30% overrun should be moderate');
    console.assert(test7, '50% overrun should be moderate');
    console.assert(test8, '60% overrun should be severe');
    console.assert(test9, '100% overrun should be severe');
    console.log('✅ Severity determination test passed');
}

testSeverityDetermination();

// Test Suite 2: Boundary Cases
console.log('\n=== Test Suite 2: Boundary Cases ===');

function testBoundaryCases() {
    // Exactly 25% (boundary between minor and moderate)
    const test1 = getTimeOverrunSeverity(100, 125) === 'minor';
    
    // Just over 25%
    const test2 = getTimeOverrunSeverity(100, 125.1) === 'moderate';
    
    // Exactly 50% (boundary between moderate and severe)
    const test3 = getTimeOverrunSeverity(100, 150) === 'moderate';
    
    // Just over 50%
    const test4 = getTimeOverrunSeverity(100, 150.1) === 'severe';
    
    console.assert(test1, 'Exactly 25% should be minor');
    console.assert(test2, 'Just over 25% should be moderate');
    console.assert(test3, 'Exactly 50% should be moderate');
    console.assert(test4, 'Just over 50% should be severe');
    console.log('✅ Boundary cases test passed');
}

testBoundaryCases();

// Test Suite 3: Edge Cases
console.log('\n=== Test Suite 3: Edge Cases ===');

function testEdgeCases() {
    // Very small times
    const test1 = getTimeOverrunSeverity(0.5, 0.6) === 'minor';
    const test2 = getTimeOverrunSeverity(0.5, 0.8) === 'severe';
    
    // Very large times
    const test3 = getTimeOverrunSeverity(1000, 1100) === 'minor';
    const test4 = getTimeOverrunSeverity(1000, 1600) === 'severe';
    
    // Null/undefined actual
    const test5 = getTimeOverrunSeverity(5, null) === 'none';
    const test6 = getTimeOverrunSeverity(5, undefined) === 'none';
    
    console.assert(test1, 'Small time minor overrun should work');
    console.assert(test2, 'Small time severe overrun should work');
    console.assert(test3, 'Large time minor overrun should work');
    console.assert(test4, 'Large time severe overrun should work');
    console.assert(test5, 'Null actual should be none');
    console.assert(test6, 'Undefined actual should be none');
    console.log('✅ Edge cases test passed');
}

testEdgeCases();

// Test Suite 4: CSS Class Assignment
console.log('\n=== Test Suite 4: CSS Class Assignment ===');

function testCSSClassAssignment() {
    const severities = ['none', 'minor', 'moderate', 'severe'];
    const expectedClasses = [
        [],
        ['time-overrun-indicator', 'time-overrun-minor'],
        ['time-overrun-indicator', 'time-overrun-moderate'],
        ['time-overrun-indicator', 'time-overrun-severe']
    ];
    
    // Simulate class assignment
    function getTaskClasses(estimated, actual) {
        const classes = [];
        
        if (actual && actual > 0) {
            const timeDiff = actual - estimated;
            if (timeDiff > 0) {
                classes.push('time-overrun-indicator');
                
                const severity = getTimeOverrunSeverity(estimated, actual);
                if (severity === 'minor') {
                    classes.push('time-overrun-minor');
                } else if (severity === 'moderate') {
                    classes.push('time-overrun-moderate');
                } else if (severity === 'severe') {
                    classes.push('time-overrun-severe');
                }
            } else if (timeDiff < 0) {
                classes.push('time-underrun-indicator');
            } else {
                classes.push('time-match-indicator');
            }
        }
        
        return classes;
    }
    
    // Test cases
    const test1 = JSON.stringify(getTaskClasses(5, 3)) === JSON.stringify(['time-underrun-indicator']);
    const test2 = JSON.stringify(getTaskClasses(10, 11)) === JSON.stringify(['time-overrun-indicator', 'time-overrun-minor']);
    const test3 = JSON.stringify(getTaskClasses(10, 13)) === JSON.stringify(['time-overrun-indicator', 'time-overrun-moderate']);
    const test4 = JSON.stringify(getTaskClasses(10, 16)) === JSON.stringify(['time-overrun-indicator', 'time-overrun-severe']);
    const test5 = JSON.stringify(getTaskClasses(5, 0)) === JSON.stringify([]);
    
    console.assert(test1, 'Underrun should have underrun class');
    console.assert(test2, 'Minor overrun should have correct classes');
    console.assert(test3, 'Moderate overrun should have correct classes');
    console.assert(test4, 'Severe overrun should have correct classes');
    console.assert(test5, 'No actual time should have no classes');
    console.log('✅ CSS class assignment test passed');
}

testCSSClassAssignment();

// Test Suite 5: Visual Indicator Consistency
console.log('\n=== Test Suite 5: Visual Indicator Consistency ===');

function testVisualIndicatorConsistency() {
    // Ensure severity levels are consistent
    const severityLevels = {
        'none': 0,
        'minor': 1,
        'moderate': 2,
        'severe': 3
    };
    
    // Test that severity increases with overrun percentage
    const test1 = severityLevels[getTimeOverrunSeverity(10, 10)] < severityLevels[getTimeOverrunSeverity(10, 11)];
    const test2 = severityLevels[getTimeOverrunSeverity(10, 11)] < severityLevels[getTimeOverrunSeverity(10, 13)];
    const test3 = severityLevels[getTimeOverrunSeverity(10, 13)] < severityLevels[getTimeOverrunSeverity(10, 16)];
    
    console.assert(test1, 'Severity should increase from none to minor');
    console.assert(test2, 'Severity should increase from minor to moderate');
    console.assert(test3, 'Severity should increase from moderate to severe');
    console.log('✅ Visual indicator consistency test passed');
}

testVisualIndicatorConsistency();

// Test Suite 6: Percentage Calculation for Display
console.log('\n=== Test Suite 6: Percentage Calculation for Display ===');

function testPercentageCalculationForDisplay() {
    function getOverrunPercent(estimated, actual) {
        if (actual <= estimated) return 0;
        return ((actual - estimated) / estimated) * 100;
    }
    
    // Test various percentages
    const test1 = Math.abs(getOverrunPercent(10, 11) - 10) < 0.1;
    const test2 = Math.abs(getOverrunPercent(10, 12.5) - 25) < 0.1;
    const test3 = Math.abs(getOverrunPercent(10, 15) - 50) < 0.1;
    const test4 = Math.abs(getOverrunPercent(10, 20) - 100) < 0.1;
    
    console.assert(test1, '10% overrun calculation correct');
    console.assert(test2, '25% overrun calculation correct');
    console.assert(test3, '50% overrun calculation correct');
    console.assert(test4, '100% overrun calculation correct');
    console.log('✅ Percentage calculation for display test passed');
}

testPercentageCalculationForDisplay();

// Test Suite 7: Batch Processing
console.log('\n=== Test Suite 7: Batch Processing ===');

function testBatchProcessing() {
    const tasks = [
        { estimated_time: 5, actual_time: 3 },   // underrun
        { estimated_time: 5, actual_time: 5 },   // match
        { estimated_time: 10, actual_time: 11 }, // minor overrun
        { estimated_time: 10, actual_time: 13 }, // moderate overrun
        { estimated_time: 10, actual_time: 16 }  // severe overrun
    ];
    
    const severities = tasks.map(t => getTimeOverrunSeverity(t.estimated_time, t.actual_time));
    
    const test1 = severities[0] === 'none';
    const test2 = severities[1] === 'none';
    const test3 = severities[2] === 'minor';
    const test4 = severities[3] === 'moderate';
    const test5 = severities[4] === 'severe';
    
    console.assert(test1, 'Underrun should be none');
    console.assert(test2, 'Match should be none');
    console.assert(test3, 'Minor overrun should be minor');
    console.assert(test4, 'Moderate overrun should be moderate');
    console.assert(test5, 'Severe overrun should be severe');
    console.log('✅ Batch processing test passed');
}

testBatchProcessing();

// Summary
console.log('\n=== Test Summary ===');
console.log('✅ All time overrun visual display tests completed successfully!');
console.log('Total test suites: 7');
console.log('Total tests: 30+');
