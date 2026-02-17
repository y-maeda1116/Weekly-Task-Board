#!/usr/bin/env node

/**
 * Test Suite Runner for Weekly Task Board
 * すべてのテストを実行し、結果をレポートします
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// テスト結果を記録
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestsList = [];

console.log('==========================================');
console.log('Weekly Task Board - Test Suite');
console.log('==========================================');
console.log('');

/**
 * テスト実行関数
 */
function runTest(testFile, testName) {
    console.log(`Running: ${testName}`);
    totalTests++;
    
    try {
        execSync(`node ${testFile}`, { stdio: 'pipe' });
        console.log(`✓ PASSED: ${testName}`);
        passedTests++;
    } catch (error) {
        console.log(`✗ FAILED: ${testName}`);
        failedTests++;
        failedTestsList.push(testName);
    }
    console.log('');
}

/**
 * ファイル存在確認関数
 */
function checkFileExists(filePath, fileName) {
    console.log(`Checking: ${fileName}`);
    totalTests++;
    
    if (fs.existsSync(filePath)) {
        console.log(`✓ PASSED: ${fileName} exists`);
        passedTests++;
    } else {
        console.log(`✗ FAILED: ${fileName} not found`);
        failedTests++;
        failedTestsList.push(`${fileName} not found`);
    }
    console.log('');
}

/**
 * HTML検証関数
 */
function validateHTML(filePath, fileName) {
    console.log(`Validating: ${fileName}`);
    totalTests++;
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<!DOCTYPE html>')) {
            console.log(`✓ PASSED: ${fileName} is valid HTML`);
            passedTests++;
        } else {
            console.log(`✗ FAILED: ${fileName} is not valid HTML`);
            failedTests++;
            failedTestsList.push(`${fileName} is not valid HTML`);
        }
    } catch (error) {
        console.log(`✗ FAILED: Could not read ${fileName}`);
        failedTests++;
        failedTestsList.push(`Could not read ${fileName}`);
    }
    console.log('');
}

// Unit Tests
console.log('=== Unit Tests ===');
runTest('test-time-validation.js', 'Time Validation Tests');
runTest('test-time-persistence.js', 'Time Persistence Tests');
runTest('test-statistics-engine.js', 'Statistics Engine Tests');
runTest('test-completion-rate.js', 'Completion Rate Tests');
runTest('test-recurrence-engine.js', 'Recurrence Engine Tests');
runTest('test-recurring-persistence.js', 'Recurring Persistence Tests');
runTest('test-template-functionality.js', 'Template Functionality Tests');
runTest('test-weekday-functionality.js', 'Weekday Functionality Tests');
runTest('test-category-functionality.js', 'Category Functionality Tests');
runTest('test-time-overrun-visual.js', 'Time Overrun Visual Tests');
runTest('test-time-comparison.js', 'Time Comparison Tests');
runTest('test-export-import-time.js', 'Export/Import Time Tests');
runTest('test-migration-functionality.js', 'Migration Functionality Tests');
runTest('test-comprehensive-unit.js', 'Comprehensive Unit Tests');
runTest('test-integration-task13.js', 'Integration Tests');

// Performance Tests
console.log('=== Performance Tests ===');
runTest('test-weekday-performance.js', 'Weekday Performance Tests');

// Code Quality Checks
console.log('=== Code Quality Checks ===');
validateHTML('index.html', 'index.html');
checkFileExists('style.css', 'style.css');
checkFileExists('script.js', 'script.js');
checkFileExists('package.json', 'package.json');

// Summary
console.log('==========================================');
console.log('Test Summary');
console.log('==========================================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTestsList.length > 0) {
    console.log('');
    console.log('Failed Tests:');
    failedTestsList.forEach(test => {
        console.log(`  - ${test}`);
    });
}

console.log('==========================================');

// Exit with appropriate code
if (failedTests === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
} else {
    console.log('✗ Some tests failed');
    process.exit(1);
}
