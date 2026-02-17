#!/bin/bash

# Test Suite Runner for Weekly Task Board
# このスクリプトはすべてのテストを実行します

echo "=========================================="
echo "Weekly Task Board - Test Suite"
echo "=========================================="
echo ""

# テスト結果を記録
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# テスト実行関数
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo "Running: $test_name"
    if node "$test_file" > /dev/null 2>&1; then
        echo "✓ PASSED: $test_name"
        ((PASSED_TESTS++))
    else
        echo "✗ FAILED: $test_name"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    echo ""
}

# Unit Tests
echo "=== Unit Tests ==="
run_test "test-time-validation.js" "Time Validation Tests"
run_test "test-time-persistence.js" "Time Persistence Tests"
run_test "test-statistics-engine.js" "Statistics Engine Tests"
run_test "test-completion-rate.js" "Completion Rate Tests"
run_test "test-recurrence-engine.js" "Recurrence Engine Tests"
run_test "test-recurring-persistence.js" "Recurring Persistence Tests"
run_test "test-template-functionality.js" "Template Functionality Tests"
run_test "test-weekday-functionality.js" "Weekday Functionality Tests"
run_test "test-category-functionality.js" "Category Functionality Tests"
run_test "test-time-overrun-visual.js" "Time Overrun Visual Tests"
run_test "test-time-comparison.js" "Time Comparison Tests"
run_test "test-export-import-time.js" "Export/Import Time Tests"
run_test "test-migration-functionality.js" "Migration Functionality Tests"
run_test "test-comprehensive-unit.js" "Comprehensive Unit Tests"
run_test "test-integration-task13.js" "Integration Tests"

# Performance Tests
echo "=== Performance Tests ==="
run_test "test-weekday-performance.js" "Weekday Performance Tests"

# Code Quality Checks
echo "=== Code Quality Checks ==="
echo "Checking HTML structure..."
if grep -q "<!DOCTYPE html>" index.html; then
    echo "✓ PASSED: HTML structure is valid"
    ((PASSED_TESTS++))
else
    echo "✗ FAILED: HTML structure is invalid"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

echo "Checking CSS file..."
if [ -f "style.css" ]; then
    echo "✓ PASSED: CSS file exists"
    ((PASSED_TESTS++))
else
    echo "✗ FAILED: CSS file not found"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

echo "Checking JavaScript file..."
if [ -f "script.js" ]; then
    echo "✓ PASSED: JavaScript file exists"
    ((PASSED_TESTS++))
else
    echo "✗ FAILED: JavaScript file not found"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo "=========================================="

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
