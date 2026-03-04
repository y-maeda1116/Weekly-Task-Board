# Testing Guide - Weekly Task Board

## Quick Start

### Run All Tests
```bash
node run-tests.js
```

### Run Specific Test Categories
```bash
# Unit tests only
node run-tests.js --unit

# Integration tests only
node run-tests.js --integration

# Performance tests only
node run-tests.js --performance
```

### Verbose Output
```bash
# Show detailed test execution
node run-tests.js --verbose

# Short form
node run-tests.js -v
```

## Test Infrastructure Features

### 18.1 Test Report Functionality

The enhanced test runner provides comprehensive reporting:

#### Overall Results
- **Total Tests**: Count of all tests executed
- **Passed**: Number of successful tests
- **Failed**: Number of failed tests
- **Success Rate**: Percentage of tests that passed
- **Total Duration**: Time taken to run all tests

#### Category Summary
Breakdown of test results by category:
- **Unit Tests**: Individual component tests
- **Integration Tests**: Multi-component workflow tests
- **Performance Tests**: Large dataset and speed tests
- **Quality Checks**: Code structure validation

Each category shows:
- Total tests in category
- Number passed/failed
- Success rate percentage
- Total execution time

#### Failed Test Details
When tests fail, the report includes:
- Test name
- Category
- Execution duration
- Error message
- Stack trace (in verbose mode)

### 18.2 CI/CD Integration

The test runner is designed for CI/CD environments:

#### Exit Codes
- **0**: All tests passed (success)
- **1**: One or more tests failed (failure)

#### Environment Variables
The test runner respects standard Node.js environment variables:
- `NODE_ENV`: Set to 'test' for test environment
- `NODE_OPTIONS`: Pass additional Node.js options

#### CI/CD Examples

**GitHub Actions:**
```yaml
- name: Run Tests
  run: node run-tests.js
```

**GitLab CI:**
```yaml
test:
  script:
    - node run-tests.js
```

**Jenkins:**
```groovy
sh 'node run-tests.js'
```

## Test Output Examples

### Compact Mode (Default)
```
==========================================
Weekly Task Board - Test Suite
==========================================

Unit Tests:
.........................
Integration Tests:
..
Performance Tests: 
..
Quality Checks:
....

==========================================
Test Summary Report
==========================================

Overall Results:
  Total Tests:    33
  Passed:         33
  Failed:         0
  Success Rate:   100%
  Total Duration: 9874ms (9.87s)

Category Summary:
  Unit:
    Total:   25
    Passed:  25
    Failed:  0
    Rate:    100%
    Time:    8430ms
  Integration:
    Total:   2
    Passed:  2
    Failed:  0
    Rate:    100%
    Time:    761ms
  Performance:
    Total:   2
    Passed:  2
    Failed:  0
    Rate:    100%
    Time:    670ms
  Quality:
    Total:   4
    Passed:  4
    Failed:  0
    Rate:    100%
    Time:    7ms

==========================================
✓ All tests passed!
```

### Verbose Mode
```
=== Unit Tests ===
Running: Task Operations Tests
✓ PASSED: Task Operations Tests (290ms)
Running: Time Validation Tests
✓ PASSED: Time Validation Tests (277ms)
...

Detailed Test Report:

1. [✓] Task Operations Tests
   Status:   PASS
   Category: unit
   Duration: 290ms
2. [✓] Time Validation Tests
   Status:   PASS
   Category: unit
   Duration: 277ms
...
```

## Test Categories

### Unit Tests (25 tests)
- Task Operations
- Time Validation
- Time Persistence
- Statistics Engine
- Completion Rate
- Recurrence Engine
- Recurring Persistence
- Template Functionality
- Weekday Functionality
- Category Functionality
- Time Overrun Visual
- Time Comparison
- Export/Import Time
- Export/Import Functionality
- Migration Functionality
- Data Migration
- Comprehensive Unit Tests
- Recurring Tasks
- Data Persistence
- UI Operations
- Edge Cases
- Time Management
- Templates
- Archive
- Weekday Manager

### Integration Tests (2 tests)
- Integration Task 13
- Integration Scenarios

### Performance Tests (2 tests)
- Weekday Performance
- General Performance

### Quality Checks (4 tests)
- HTML Structure Validation
- CSS File Existence
- JavaScript File Existence
- Package.json Existence

## Command Reference

### Basic Commands
```bash
# Run all tests
node run-tests.js

# Run with shell script
./run-tests.sh

# Show help
node run-tests.js --help
```

### Category Filters
```bash
# Unit tests only
node run-tests.js --unit

# Integration tests only
node run-tests.js --integration

# Performance tests only
node run-tests.js --performance
```

### Output Options
```bash
# Verbose output
node run-tests.js --verbose
node run-tests.js -v

# Generate coverage report
node run-tests.js --coverage
```

### Combined Options
```bash
# Unit tests with verbose output
node run-tests.js --unit --verbose

# Integration tests with coverage
node run-tests.js --integration --coverage

# All tests with verbose output
node run-tests.js --verbose
```

## Test Results Interpretation

### Success Indicators
- ✓ symbol indicates passed test
- Green dots (.) in compact mode indicate passed tests
- 100% success rate
- Exit code 0

### Failure Indicators
- ✗ symbol indicates failed test
- F character in compact mode indicates failed test
- Failed test details section appears
- Exit code 1

### Performance Indicators
- Duration shows execution time for each test
- Category summary shows total time per category
- Performance tests verify speed requirements

## Troubleshooting

### All Tests Pass Locally but Fail in CI/CD
1. Check Node.js version matches
2. Verify environment variables are set
3. Check file permissions
4. Review CI/CD logs for specific errors

### Tests Timeout
1. Increase timeout values if needed
2. Check for infinite loops
3. Run performance tests separately
4. Check system resources

### Memory Issues
1. Run tests in smaller batches
2. Increase Node.js heap: `node --max-old-space-size=4096 run-tests.js`
3. Check for memory leaks

### Specific Test Failures
1. Run with `--verbose` flag for details
2. Check test file for implementation
3. Review error message and stack trace
4. Check test data and mocks

## Best Practices

1. **Run Tests Frequently**: After each code change
2. **Use Verbose Mode**: When debugging failures
3. **Monitor Performance**: Check performance test results regularly
4. **Keep Tests Updated**: Update when requirements change
5. **Document Changes**: Add comments for complex test logic
6. **Use Meaningful Names**: Descriptive test names
7. **Isolate Tests**: Tests should not depend on each other
8. **Clean Up**: Reset state after each test

## Performance Benchmarks

The test suite verifies these performance targets:

- 100 tasks rendering: < 1 second
- 500 tasks rendering: < 3 seconds
- 1000 tasks rendering: < 5 seconds
- 1000 tasks statistics: < 1 second
- 1000 tasks filtering: < 500ms
- 100 tasks weekday movement: < 500ms
- Memory usage: < 100MB
- 1000 tasks export: < 3 seconds

## Coverage Goals

- Unit test coverage: > 90% of core functionality
- Integration test coverage: All major workflows
- Performance benchmarks: All operations meet targets
- Error handling: All error conditions covered

## Additional Resources

- See `TEST_DOCUMENTATION.md` for comprehensive documentation
- Check individual test files for implementation details
- Review test utilities in `tests/utils/` directory
- Consult requirements in `.kiro/specs/test-coverage-improvement/`

## Support

For issues or questions:
1. Check this guide first
2. Review test output with `--verbose` flag
3. Check test file implementations
4. Review error messages and stack traces
5. Contact development team with details
