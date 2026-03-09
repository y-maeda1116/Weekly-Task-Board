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
│
├── integration/                   # Integration tests for workflows
│   ├── test-integration-scenarios.js
│   ├── outlook-calendar-sync.integration.test.ts
│   ├── outlook-calendar-sync-workflows.integration.test.ts
│   └── outlook-calendar-sync-advanced.integration.test.ts
│
├── performance/                   # Performance tests
│   ├── test-performance.js
│   └── test-weekday-performance.js
│
├── unit/ (TypeScript)             # TypeScript unit tests
│   ├── calendar-importer.unit.test.ts
│   ├── calendar-importer.pbt.test.ts
│   ├── calendar-sync-ui.unit.test.ts
│   ├── calendar-sync-ui.pbt.test.ts
│   ├── event-parser.unit.test.ts
│   ├── event-parser.pbt.test.ts
│   ├── event-serializer.unit.test.ts
│   ├── event-serializer.pbt.test.ts
│   ├── event-printer.unit.test.ts
│   ├── event-printer.pbt.test.ts
│   ├── error-handling.pbt.test.ts
│   ├── interfaces.test.ts
│   └── logger.test.ts
│
└── utils/                         # Test utilities and helpers
    ├── test-helpers.js
    ├── mock-data-generator.js
    └── assertions.js
```

## Running Tests

### Quick Start

Run all JavaScript tests with default settings:

```bash
node run-tests.js
```

Or using the shell script:

```bash
./run-tests.sh
```

### TypeScript/Outlook Tests

Run Outlook Calendar Sync tests:

```bash
# Run all Outlook tests
npm run test:outlook

# Watch mode for development
npm run test:outlook:watch

# Generate coverage report
npm run test:outlook:coverage
```

### TypeScript Build

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run build:watch
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

#### JavaScript Unit Tests

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

#### TypeScript Unit Tests (Outlook Calendar Sync)

**Coverage Areas:**
- Calendar Importer - Date range management, event fetching, import execution
- Calendar Sync UI - Authentication UI, date range picker, event list display
- Event Parser - Raw API response parsing, Event object creation
- Event Serializer - Event to Task conversion, Task to Event conversion
- Event Printer - Human-readable event formatting
- Error Handling - PBT with random inputs for robustness
- Interfaces - Type definitions and contracts
- Logger - Logging functionality

**Test Types:**
- **Unit Tests**: Standard component testing
- **PBT (Property-Based Testing)**: Property-based testing with random generated inputs

**Running TypeScript Tests:**
```bash
npm run test:outlook
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

#### Outlook Calendar Sync Integration Tests

**Coverage Areas:**
- OAuth authentication flow
- Event retrieval and parsing
- Event-to-Task conversion workflow
- Duplicate detection and handling
- Date range synchronization
- Error recovery and retry logic
- UI state management during sync
- Transaction rollback on errors

**Running Integration Tests:**
```bash
# JavaScript integration tests
node run-tests.js --integration

# TypeScript integration tests (included in test:outlook)
npm run test:outlook
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

### GitHub Actions Example (.github/workflows/ci.yml)

```yaml
name: CI - Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x, 22.x, 24.x, 25.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Run Unit Tests
      run: |
        node tests/unit/test-time-validation.js
        node tests/unit/test-time-persistence.js
        # ... (all unit tests)

    - name: Run Performance Tests
      run: |
        node tests/performance/test-weekday-performance.js

    - name: Verify Implementation
      run: |
        node verify-implementation.js

    - name: Check Code Quality
      run: |
        # HTML file validation
        grep -q "<!DOCTYPE html>" index.html
        # CSS/JS file existence checks
```

### GitLab CI Example

```yaml
test:
  image: node:20
  script:
    - node run-tests.js
    - npm run test:outlook
```

### Jenkins Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'node run-tests.js'
                sh 'npm run test:outlook'
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

### Property-Based Testing (PBT)

Property-Based Testing generates random inputs to test properties that should always hold true, rather than testing specific examples.

**PBT Test Files:**
- `calendar-importer.pbt.test.ts` - Import functionality with random date ranges
- `calendar-sync-ui.pbt.test.ts` - UI state management with random events
- `event-parser.pbt.test.ts` - Parser robustness with random API responses
- `event-serializer.pbt.test.ts` - Serialization round-trip properties
- `event-printer.pbt.test.ts` - Formatting with random event data
- `error-handling.pbt.test.ts` - Error scenarios with random inputs

**Benefits of PBT:**
- Finds edge cases that manual testing might miss
- Tests invariants and properties rather than specific examples
- Increases confidence in code robustness
- Documents expected behavior through properties

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
- Ensure Node.js is installed (v18.0.0+ required): `node --version`
- Check file paths are correct
- Verify test files exist in the `tests/` directory
- For TypeScript tests, ensure dependencies are installed: `npm install`

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
- Verify Node.js version (v20.x, v22.x, v24.x, v25.x supported)
- Check for file system permission issues
- Review CI/CD logs for specific errors
- Ensure TypeScript tests are included: `npm run test:outlook`

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

- **v2.0** (Current): Enhanced test suite with Outlook Calendar Sync
  - TypeScript test infrastructure (Vitest/Jest)
  - Property-Based Testing (PBT) for robustness
  - Outlook Calendar Sync tests (unit, integration, PBT)
  - Multi-version Node.js support (v20.x - v25.x)
  - Updated CI/CD workflows

- **v1.0**: Initial comprehensive test suite with unit, integration, and performance tests
  - 50+ JavaScript test cases
  - Category-based test organization
  - Detailed reporting and CI/CD support
  - Performance benchmarking
