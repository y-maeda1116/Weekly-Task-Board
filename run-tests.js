#!/usr/bin/env node

/**
 * Test Suite Runner for Weekly Task Board
 * すべてのテストを実行し、結果をレポートします
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// コマンドライン引数の解析
const args = process.argv.slice(2);
const flags = {
    unit: args.includes('--unit'),
    integration: args.includes('--integration'),
    performance: args.includes('--performance'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
};

// ヘルプメッセージ
if (flags.help) {
    console.log('Weekly Task Board - Test Suite Runner');
    console.log('');
    console.log('Usage: node run-tests.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --unit          Run only unit tests');
    console.log('  --integration   Run only integration tests');
    console.log('  --performance   Run only performance tests');
    console.log('  --coverage      Generate coverage report (optional)');
    console.log('  --verbose, -v   Show detailed output');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log('If no options are specified, all tests will be run.');
    process.exit(0);
}

// フラグが指定されていない場合はすべて実行
const runAll = !flags.unit && !flags.integration && !flags.performance;

// テスト結果を記録
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestsList = [];
const testDetails = [];
const categoryStats = {
    unit: { total: 0, passed: 0, failed: 0, duration: 0 },
    integration: { total: 0, passed: 0, failed: 0, duration: 0 },
    performance: { total: 0, passed: 0, failed: 0, duration: 0 },
    quality: { total: 0, passed: 0, failed: 0, duration: 0 }
};
const startTime = Date.now();

console.log('==========================================');
console.log('Weekly Task Board - Test Suite');
console.log('==========================================');
console.log('');

/**
 * テスト実行関数
 */
function runTest(testFile, testName, category = 'unit') {
    if (flags.verbose) {
        console.log(`Running: ${testName}`);
    }
    totalTests++;
    categoryStats[category].total++;
    
    const testStartTime = Date.now();
    
    try {
        const output = execSync(`node ${testFile}`, { stdio: 'pipe', encoding: 'utf8' });
        const duration = Date.now() - testStartTime;
        
        if (!flags.verbose) {
            process.stdout.write('.');
        } else {
            console.log(`✓ PASSED: ${testName} (${duration}ms)`);
        }
        
        passedTests++;
        categoryStats[category].passed++;
        categoryStats[category].duration += duration;
        testDetails.push({
            name: testName,
            status: 'PASS',
            duration: duration,
            category: category,
            output: output
        });
    } catch (error) {
        const duration = Date.now() - testStartTime;
        
        if (!flags.verbose) {
            process.stdout.write('F');
        } else {
            console.log(`✗ FAILED: ${testName} (${duration}ms)`);
        }
        
        failedTests++;
        categoryStats[category].failed++;
        categoryStats[category].duration += duration;
        failedTestsList.push(testName);
        testDetails.push({
            name: testName,
            status: 'FAIL',
            duration: duration,
            category: category,
            error: error.message,
            stderr: error.stderr ? error.stderr.toString() : '',
            stdout: error.stdout ? error.stdout.toString() : ''
        });
    }
}

/**
 * ファイル存在確認関数
 */
function checkFileExists(filePath, fileName, category = 'quality') {
    if (flags.verbose) {
        console.log(`Checking: ${fileName}`);
    }
    totalTests++;
    categoryStats[category].total++;
    
    const testStartTime = Date.now();
    
    if (fs.existsSync(filePath)) {
        const duration = Date.now() - testStartTime;
        if (!flags.verbose) {
            process.stdout.write('.');
        } else {
            console.log(`✓ PASSED: ${fileName} exists (${duration}ms)`);
        }
        passedTests++;
        categoryStats[category].passed++;
        categoryStats[category].duration += duration;
        testDetails.push({
            name: `${fileName} exists`,
            status: 'PASS',
            duration: duration,
            category: category
        });
    } else {
        const duration = Date.now() - testStartTime;
        if (!flags.verbose) {
            process.stdout.write('F');
        } else {
            console.log(`✗ FAILED: ${fileName} not found (${duration}ms)`);
        }
        failedTests++;
        categoryStats[category].failed++;
        categoryStats[category].duration += duration;
        failedTestsList.push(`${fileName} not found`);
        testDetails.push({
            name: `${fileName} not found`,
            status: 'FAIL',
            duration: duration,
            category: category,
            error: `File not found: ${filePath}`
        });
    }
}

/**
 * HTML検証関数
 */
function validateHTML(filePath, fileName, category = 'quality') {
    if (flags.verbose) {
        console.log(`Validating: ${fileName}`);
    }
    totalTests++;
    categoryStats[category].total++;
    
    const testStartTime = Date.now();
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const duration = Date.now() - testStartTime;
        if (content.includes('<!DOCTYPE html>')) {
            if (!flags.verbose) {
                process.stdout.write('.');
            } else {
                console.log(`✓ PASSED: ${fileName} is valid HTML (${duration}ms)`);
            }
            passedTests++;
            categoryStats[category].passed++;
            categoryStats[category].duration += duration;
            testDetails.push({
                name: `${fileName} is valid HTML`,
                status: 'PASS',
                duration: duration,
                category: category
            });
        } else {
            if (!flags.verbose) {
                process.stdout.write('F');
            } else {
                console.log(`✗ FAILED: ${fileName} is not valid HTML (${duration}ms)`);
            }
            failedTests++;
            categoryStats[category].failed++;
            categoryStats[category].duration += duration;
            failedTestsList.push(`${fileName} is not valid HTML`);
            testDetails.push({
                name: `${fileName} is not valid HTML`,
                status: 'FAIL',
                duration: duration,
                category: category,
                error: 'Missing DOCTYPE declaration'
            });
        }
    } catch (error) {
        const duration = Date.now() - testStartTime;
        if (!flags.verbose) {
            process.stdout.write('F');
        } else {
            console.log(`✗ FAILED: Could not read ${fileName} (${duration}ms)`);
        }
        failedTests++;
        categoryStats[category].failed++;
        categoryStats[category].duration += duration;
        failedTestsList.push(`Could not read ${fileName}`);
        testDetails.push({
            name: `Could not read ${fileName}`,
            status: 'FAIL',
            duration: duration,
            category: category,
            error: error.message
        });
    }
}

// Unit Tests
if (runAll || flags.unit) {
    if (!flags.verbose) {
        console.log('Unit Tests: ');
    } else {
        console.log('=== Unit Tests ===');
    }
    runTest('tests/unit/test-task-operations.js', 'Task Operations Tests', 'unit');
    runTest('tests/unit/test-time-validation.js', 'Time Validation Tests', 'unit');
    runTest('tests/unit/test-time-persistence.js', 'Time Persistence Tests', 'unit');
    runTest('tests/unit/test-statistics-engine.js', 'Statistics Engine Tests', 'unit');
    runTest('tests/unit/test-completion-rate.js', 'Completion Rate Tests', 'unit');
    runTest('tests/unit/test-recurrence-engine.js', 'Recurrence Engine Tests', 'unit');
    runTest('tests/unit/test-recurring-persistence.js', 'Recurring Persistence Tests', 'unit');
    runTest('tests/unit/test-template-functionality.js', 'Template Functionality Tests', 'unit');
    runTest('tests/unit/test-weekday-functionality.js', 'Weekday Functionality Tests', 'unit');
    runTest('tests/unit/test-category-functionality.js', 'Category Functionality Tests', 'unit');
    runTest('tests/unit/test-time-overrun-visual.js', 'Time Overrun Visual Tests', 'unit');
    runTest('tests/unit/test-time-comparison.js', 'Time Comparison Tests', 'unit');
    runTest('tests/unit/test-export-import-time.js', 'Export/Import Time Tests', 'unit');
    runTest('tests/unit/test-export-import.js', 'Export/Import Functionality Tests', 'unit');
    runTest('tests/unit/test-migration-functionality.js', 'Migration Functionality Tests', 'unit');
    runTest('tests/unit/test-data-migration.js', 'Data Migration Unit Tests', 'unit');
    runTest('tests/unit/test-comprehensive-unit.js', 'Comprehensive Unit Tests', 'unit');
    runTest('tests/unit/test-recurring-tasks.js', 'Recurring Tasks Tests', 'unit');
    runTest('tests/unit/test-data-persistence.js', 'Data Persistence Tests', 'unit');
    runTest('tests/unit/test-ui-operations.js', 'UI Operations Tests', 'unit');
    runTest('tests/unit/test-edge-cases.js', 'Edge Cases Tests', 'unit');
    runTest('tests/unit/test-time-management.js', 'Time Management Tests', 'unit');
    runTest('tests/unit/test-templates.js', 'Templates Tests', 'unit');
    runTest('tests/unit/test-archive.js', 'Archive Tests', 'unit');
    runTest('tests/unit/test-weekday-manager.js', 'Weekday Manager Tests', 'unit');
    if (!flags.verbose) console.log('');
}

// Integration Tests
if (runAll || flags.integration) {
    if (!flags.verbose) {
        console.log('Integration Tests: ');
    } else {
        console.log('=== Integration Tests ===');
    }
    runTest('tests/unit/test-integration-task13.js', 'Integration Tests', 'integration');
    runTest('tests/integration/test-integration-scenarios.js', 'Integration Scenarios Tests', 'integration');
    if (!flags.verbose) console.log('');
}

// Performance Tests
if (runAll || flags.performance) {
    if (!flags.verbose) {
        console.log('Performance Tests: ');
    } else {
        console.log('=== Performance Tests ===');
    }
    runTest('tests/performance/test-weekday-performance.js', 'Weekday Performance Tests', 'performance');
    runTest('tests/performance/test-performance.js', 'Performance Tests', 'performance');
    if (!flags.verbose) console.log('');
}

// Code Quality Checks (always run)
if (runAll) {
    if (!flags.verbose) {
        console.log('Quality Checks: ');
    } else {
        console.log('=== Code Quality Checks ===');
    }
    validateHTML('index.html', 'index.html', 'quality');
    checkFileExists('style.css', 'style.css', 'quality');
    checkFileExists('script.js', 'script.js', 'quality');
    checkFileExists('package.json', 'package.json', 'quality');
    if (!flags.verbose) console.log('');
}

// Summary
const totalDuration = Date.now() - startTime;

console.log('');
console.log('');
console.log('==========================================');
console.log('Test Summary Report');
console.log('==========================================');
console.log('');
console.log('Overall Results:');
console.log(`  Total Tests:    ${totalTests}`);
console.log(`  Passed:         ${passedTests}`);
console.log(`  Failed:         ${failedTests}`);
console.log(`  Success Rate:   ${Math.round((passedTests / totalTests) * 100)}%`);
console.log(`  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
console.log('');

// Category Summary
console.log('Category Summary:');
Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    if (stats.total > 0) {
        const successRate = Math.round((stats.passed / stats.total) * 100);
        console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}:`);
        console.log(`    Total:   ${stats.total}`);
        console.log(`    Passed:  ${stats.passed}`);
        console.log(`    Failed:  ${stats.failed}`);
        console.log(`    Rate:    ${successRate}%`);
        console.log(`    Time:    ${stats.duration}ms`);
    }
});
console.log('');

// Failed Tests Details
if (failedTestsList.length > 0) {
    console.log('Failed Tests:');
    failedTestsList.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test}`);
    });
    console.log('');
    
    console.log('Failed Test Details:');
    console.log('');
    testDetails.filter(t => t.status === 'FAIL').forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`);
        console.log(`   Category: ${test.category}`);
        console.log(`   Duration: ${test.duration}ms`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
        if (test.stderr && flags.verbose) {
            console.log(`   Stderr: ${test.stderr.substring(0, 200)}`);
        }
        if (test.stdout && flags.verbose) {
            console.log(`   Stdout: ${test.stdout.substring(0, 200)}`);
        }
        console.log('');
    });
}

// Detailed Test Report (verbose mode)
if (flags.verbose && testDetails.length > 0) {
    console.log('Detailed Test Report:');
    console.log('');
    testDetails.forEach((test, index) => {
        const status = test.status === 'PASS' ? '✓' : '✗';
        console.log(`${index + 1}. [${status}] ${test.name}`);
        console.log(`   Status:   ${test.status}`);
        console.log(`   Category: ${test.category}`);
        console.log(`   Duration: ${test.duration}ms`);
        if (test.error) {
            console.log(`   Error:    ${test.error}`);
        }
    });
    console.log('');
}

console.log('==========================================');

// Exit with appropriate code
if (failedTests === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
} else {
    console.log(`✗ ${failedTests} test(s) failed`);
    process.exit(1);
}
