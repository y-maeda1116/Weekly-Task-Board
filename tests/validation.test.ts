/**
 * Validation tests for Weekly Task Board
 * Tests data validation and type safety
 */

import {
  validateCategory,
  validateTaskTimeData,
  validateAllTasksTimeData,
  repairTasksTimeData,
  getTimeOverrunSeverity,
  isValidTask,
  isValidTaskId,
  isValidDateString,
  isValidPriority
} from '../src/utils/validation';

import type { Task, TaskCategory, TaskPriority } from '../src/types';

/**
 * Test suite runner
 */
class TestRunner {
  private tests: Array<{ name: string; fn: () => boolean }> = [];
  private passed = 0;
  private failed = 0;

  /**
   * Add a test
   */
  test(name: string, fn: () => boolean): void {
    this.tests.push({ name, fn });
  }

  /**
   * Run all tests
   */
  run(): void {
    console.log('Running validation tests...\n');

    this.tests.forEach(({ name, fn }) => {
      try {
        const result = fn();
        if (result) {
          console.log(`✓ ${name}`);
          this.passed++;
        } else {
          console.log(`✗ ${name}`);
          this.failed++;
        }
      } catch (error) {
        console.log(`✗ ${name} - Error: ${error}`);
        this.failed++;
      }
    });

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
  }
}

const runner = new TestRunner();

// Test 1: validateCategory returns valid category
runner.test('validateCategory returns valid category', () => {
  const result = validateCategory('task');
  return result === 'task';
});

// Test 2: validateCategory returns default for invalid category
runner.test('validateCategory returns default for invalid category', () => {
  const result = validateCategory('invalid');
  return result === 'task';
});

// Test 3: validateTaskTimeData validates estimated_time
runner.test('validateTaskTimeData validates estimated_time', () => {
  const task: Task = {
    id: 'test',
    name: 'Test',
    estimated_time: -1,
    actual_time: 0,
    completed: false,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    assigned_date: '2025-03-11',
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };

  const result = validateTaskTimeData(task);
  return result.isValid && result.task.estimated_time === 0;
});

// Test 4: validateTaskTimeData validates actual_time
runner.test('validateTaskTimeData validates actual_time', () => {
  const task: Task = {
    id: 'test',
    name: 'Test',
    estimated_time: 2,
    actual_time: -1,
    completed: false,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    assigned_date: '2025-03-11',
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };

  const result = validateTaskTimeData(task);
  return result.isValid && result.task.actual_time === 0;
});

// Test 5: getTimeOverrunSeverity returns correct severity
runner.test('getTimeOverrunSeverity returns correct severity', () => {
  return (
    getTimeOverrunSeverity(10, 8) === 'none' &&
    getTimeOverrunSeverity(10, 12) === 'minor' &&
    getTimeOverrunSeverity(10, 15) === 'moderate' &&
    getTimeOverrunSeverity(10, 20) === 'severe'
  );
});

// Test 6: validateAllTasksTimeData returns correct summary
runner.test('validateAllTasksTimeData returns correct summary', () => {
  const tasks: Task[] = [
    {
      id: 'test1',
      name: 'Test 1',
      estimated_time: 2,
      actual_time: 2,
      completed: true,
      priority: TaskPriority.MEDIUM,
      category: TaskCategory.TASK,
      date: '2025-03-11',
      assigned_date: '2025-03-11',
      due_date: null,
      due_time_period: null,
      due_hour: null,
      details: '',
      is_recurring: false,
      recurrence_pattern: null,
      recurrence_end_date: null
    }
  ];

  const result = validateAllTasksTimeData(tasks);
  return (
    result.isValid &&
    result.summary.totalTasks === 1 &&
    result.summary.validTasks === 1 &&
    result.summary.invalidTasks === 0
  );
});

// Test 7: isValidTask validates task structure
runner.test('isValidTask validates task structure', () => {
  const validTask: Task = {
    id: 'test',
    name: 'Test',
    estimated_time: 2,
    actual_time: 2,
    completed: false,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    assigned_date: '2025-03-11',
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };

  return isValidTask(validTask) && !isValidTask({} as Task);
});

// Test 8: isValidTaskId validates ID format
runner.test('isValidTaskId validates ID format', () => {
  return (
    isValidTaskId('task-12345') &&
    !isValidTaskId('invalid') &&
    !isValidTaskId('')
  );
});

// Test 9: isValidDateString validates date format
runner.test('isValidDateString validates date format', () => {
  return (
    isValidDateString('2025-03-11') &&
    isValidDateString('2025-12-31') &&
    !isValidDateString('2025/03/11') &&
    !isValidDateString('invalid') &&
    !isValidDateString('')
  );
});

// Test 10: isValidPriority validates priority values
runner.test('isValidPriority validates priority values', () => {
  return (
    isValidPriority('low') &&
    isValidPriority('medium') &&
    isValidPriority('high') &&
    isValidPriority('urgent') &&
    !isValidPriority('invalid')
  );
});

// Test 11: repairTasksTimeData repairs invalid tasks
runner.test('repairTasksTimeData repairs invalid tasks', () => {
  const tasks: Task[] = [
    {
      id: 'test',
      name: 'Test',
      estimated_time: -1,
      actual_time: -1,
      completed: false,
      priority: TaskPriority.MEDIUM,
      category: TaskCategory.TASK,
      date: '2025-03-11',
      assigned_date: '2025-03-11',
      due_date: null,
      due_time_period: null,
      due_hour: null,
      details: '',
      is_recurring: false,
      recurrence_pattern: null,
      recurrence_end_date: null
    }
  ];

  const result = repairTasksTimeData(tasks);
  return result.repairedCount === 1;
});

// Test 12: validateTaskTimeData rounds time values
runner.test('validateTaskTimeData rounds time values', () => {
  const task: Task = {
    id: 'test',
    name: 'Test',
    estimated_time: 2.3456,
    actual_time: 1.7891,
    completed: false,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    assigned_date: '2025-03-11',
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: '',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };

  const result = validateTaskTimeData(task);
  return (
    result.task.estimated_time === 2.35 &&
    result.task.actual_time === 1.79
  );
});

/**
 * Run all validation tests
 */
export function runValidationTests(): void {
  runner.run();
}

// Run tests if executed directly
if (require.main === module) {
  runValidationTests();
}
