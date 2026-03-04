# Weekly Task Board - Test Documentation

## Overview

This document provides comprehensive information about the test infrastructure for the Weekly Task Board application. The test suite includes unit tests, integration tests, and performance tests to ensure code quality and reliability.

## Test Suite Structure

### Directory Organization

```
tests/
├── unit/                          # Unit tests for individual components
│   ├── test-task-operations.js
│   ├── test-recurring-tasks.js
│   ├── test-statistics-engine.js
│   ├── test-data-persistence.js
│   ├── test-ui-operations.js
│   ├── test-edge-cases.js
│   ├── test-time-management.js
│   ├── test-templates.js
│   ├── test-archive.js
│   ├── test-data-migration.js
│   ├── test-weekday-manager.js
│   ├── test-export-import.js
│   └── ... (additional unit tests)
├── integration/                   # Integration tests for workflows
│   └── test-integration-scenarios.js
├── performance/                   # Performance tests
│   ├── test-performance.js
│   └── test-weekday-performance.js
└── utils/                         # Test utilities and helpers
    ├── test-helpers.js
    ├── mock-data-generator.js
    └── assertions.js
```

## Running Tests

### Quick Start

Run all tests with default settings:

```bash
node run-tests.js
```

Or using the shell script:

```bash
./run-tests.sh
```

### Command Line Options

#### Run Specific Test Categories

```bash
# Run only unit tests
node run-tests.js --unit

# Run only integration tests
node run-tests.js --integration

# Run only performance tests
node run-tests.js --performance
```

#### Verbose Output

```bash
# Show detailed output for each test
node run-tests.js --verbose

# Short form
node run-tests.js -v
```

#### Generate Coverage Report

```bash
# Generate test coverage report (optional)
node run-tests.js --coverage
```

#### Help

```bash
# Display help message
node run-tests.js --help
node run-tests.js -h
```

### Combined Options

```bash
# Run unit tests with verbose output
node run-tests.js --unit --verbose

# Run all tests with coverage report
node run-tests.js --coverage

# Run integration tests with verbose output
node run-tests.js --integration -v
```

## Test Report Format

### Summary Report

The test runner generates a comprehensive summary report including:

- **Overall Results**: Total tests, passed, failed, success rate, and total duration
- **Category Summary**: Breakdown by test category (unit, integration, performance, quality)
- **Failed Tests**: List of all failed tests with details
- **Failed Test Details**: Error messages, stack traces, and execution time for each failure

### Example Output

```
==========================================
Test Summary Report
==========================================

Overall Results:
  Total Tests:    50
  Passed:         48
  Failed:         2
  Success Rate:   96%
  Total Duration: 5234ms (5.23s)

Category Summary:
  Unit:
    Total:   40
    Passed:  39
    Failed:  1
    Rate:    97%
    Time:    3500ms
  Integration:
    Total:   6
    Passed:  6
    Failed:  0
    Rate:    100%
    Time:    1200ms
  Performance:
    Total:   2
    Passed:  1
    Failed:  1
    Rate:    50%
    Time:    534ms
  Quality:
    Total:   2
    Passed:  2
    Failed:  0
    Rate:    100%
    Time:    0ms

Failed Tests:
  1. Performance Test - 1000 tasks rendering
  2. Edge Case Test - Invalid date handling

Failed Test Details:

1. Performance Test - 1000 tasks rendering
   Category: performance
   Duration: 6234ms
   Error: Rendering took 6234ms, expected < 5000ms

2. Edge Case Test - Invalid date handling
   Category: unit
   Duration: 45ms
   Error: Expected error to be thrown for invalid date
```

## Test Categories

### Unit Tests

Unit tests verify individual components and functions in isolation.

**Coverage Areas:**
- Task operations (create, read, update, delete)
- Recurring task generation and management
- Statistics calculations
- Data persistence and localStorage
- UI operations and interactions
- Edge cases and error handling
- Time management and tracking
- Template functionality
- Archive operations
- Data migration
- Weekday management
- Export/Import functionality

**Running Unit Tests:**
```bash
node run-tests.js --unit
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Coverage Areas:**
- Task creation → completion → archival workflow
- Template creation → application workflow
- Recurring task creation → week navigation workflow
- Data export → import workflow
- Weekday hiding → task movement workflow
- Category filtering → task editing workflow
- Theme switching workflow
- Week navigation → statistics display workflow

**Running Integration Tests:**
```bash
node run-tests.js --integration
```

### Performance Tests

Performance tests ensure the application maintains acceptable performance with large datasets.

**Coverage Areas:**
- 100 tasks rendering (< 1 second)
- 500 tasks rendering (< 3 seconds)
- 1000 tasks rendering (< 5 seconds)
- 1000 tasks statistics calculation (< 1 second)
- 1000 tasks filtering (< 500ms)
- 100 tasks weekday movement (< 500ms)
- Memory usage (< 100MB)
- 1000 tasks export (< 3 seconds)

**Running Performance Tests:**
```bash
node run-tests.js --performance
```

### Quality Checks

Quality checks verify code structure and file integrity.

**Coverage Areas:**
- HTML structure validation
- CSS file existence
- JavaScript file existence
- Package.json existence

**Running Quality Checks:**
```bash
node run-tests.js
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm install
      - run: node run-tests.js
```

### GitLab CI Example

```yaml
test:
  image: node:14
  script:
    - npm install
    - node run-tests.js
```

### Jenkins Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm install'
                sh 'node run-tests.js'
            }
        }
    }
}
```

## Test Execution Flow

1. **Parse Command Line Arguments**: Determine which tests to run and output format
2. **Initialize Test Environment**: Set up test data and mocks
3. **Run Tests**: Execute tests in the specified categories
4. **Collect Results**: Gather pass/fail status, duration, and error information
5. **Generate Report**: Create comprehensive summary and detailed reports
6. **Exit with Status Code**: Return 0 for success, 1 for failure

## Test Helpers and Utilities

### MockLocalStorage

Provides a mock implementation of localStorage for testing.

```javascript
const { MockLocalStorage } = require('./tests/utils/test-helpers');

const storage = new MockLocalStorage();
storage.setItem('key', 'value');
const value = storage.getItem('key');
storage.removeItem('key');
storage.clear();
```

### TestDataGenerator

Generates test data for various scenarios.

```javascript
const { TestDataGenerator } = require('./tests/utils/test-helpers');

const generator = new TestDataGenerator();
const task = generator.generateTask();
const tasks = generator.generateTasks(10);
const recurringTask = generator.generateRecurringTask('daily');
const template = generator.generateTemplate();
const settings = generator.generateSettings();
```

### Custom Assertions

Provides custom assertion functions for testing.

```javascript
const { assertTaskEquals, assertTimeWithinRange } = require('./tests/utils/assertions');

assertTaskEquals(actualTask, expectedTask);
assertTimeWithinRange(actualTime, expectedTime, tolerance);
```

## Troubleshooting

### Tests Not Running

**Problem**: Tests fail to execute
**Solution**: 
- Ensure Node.js is installed: `node --version`
- Check file paths are correct
- Verify test files exist in the `tests/` directory

### Timeout Errors

**Problem**: Tests timeout during execution
**Solution**:
- Increase timeout values in test configuration
- Check for infinite loops or blocking operations
- Run performance tests separately

### Memory Issues

**Problem**: Out of memory errors during test execution
**Solution**:
- Run tests in smaller batches
- Increase Node.js heap size: `node --max-old-space-size=4096 run-tests.js`
- Check for memory leaks in test code

### CI/CD Failures

**Problem**: Tests pass locally but fail in CI/CD
**Solution**:
- Check environment variables are set correctly
- Verify Node.js version matches
- Check for file system permission issues
- Review CI/CD logs for specific errors

## Best Practices

1. **Run Tests Frequently**: Execute tests after each code change
2. **Use Verbose Mode for Debugging**: Use `--verbose` flag when investigating failures
3. **Monitor Performance**: Regularly check performance test results
4. **Keep Tests Updated**: Update tests when requirements change
5. **Document Test Cases**: Add comments explaining complex test logic
6. **Use Meaningful Names**: Give tests descriptive names that explain what they test
7. **Isolate Tests**: Ensure tests don't depend on each other
8. **Clean Up After Tests**: Reset state and clean up resources after each test

## Coverage Goals

The test suite aims to achieve:

- **Unit Test Coverage**: > 90% of core functionality
- **Integration Test Coverage**: All major user workflows
- **Performance Benchmarks**: All operations meet performance targets
- **Error Handling**: All error conditions properly handled

## Continuous Improvement

The test suite is continuously improved by:

- Adding tests for newly discovered bugs
- Expanding coverage for edge cases
- Optimizing test execution time
- Improving test documentation
- Refactoring test code for maintainability

## Support and Feedback

For issues or suggestions regarding the test suite:

1. Check this documentation first
2. Review test output for specific error messages
3. Run tests with `--verbose` flag for more details
4. Check test files for implementation details
5. Contact the development team with detailed information

## Version History

- **v1.0** (Current): Initial comprehensive test suite with unit, integration, and performance tests
  - 50+ test cases
  - Category-based test organization
  - Detailed reporting and CI/CD support
  - Performance benchmarking
