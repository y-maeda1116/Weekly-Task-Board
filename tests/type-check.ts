/**
 * Type checking tests for Weekly Task Board
 * Validates that all TypeScript types are properly defined
 */

import type {
  Task,
  TaskCategory,
  TaskPriority,
  RecurrencePattern,
  AppState,
  Settings,
  TaskTemplate,
  ArchivedTask
} from '../src/types';

import {
  createTaskManager,
  type TaskCreationOptions,
  type TaskFilterOptions
} from '../src/core/TaskManager';

import {
  createStateManager
} from '../src/core/StateManager';

/**
 * Test 1: Task type has all required properties
 */
function testTaskType() {
  const task: Task = {
    id: 'test-task-id',
    name: 'Test Task',
    estimated_time: 2,
    actual_time: 1.5,
    completed: false,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    assigned_date: '2025-03-11',
    due_date: null,
    due_time_period: null,
    due_hour: null,
    details: 'Test details',
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null
  };

  console.log('✓ Task type is valid');
}

/**
 * Test 2: AppState type has all required properties
 */
function testAppStateType() {
  const appState: AppState = {
    tasks: [],
    settings: {
      ideal_daily_minutes: 480,
      weekday_visibility: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      }
    },
    currentDate: new Date(),
    categoryFilter: '',
    selectedTaskId: null,
    isEditMode: false,
    isDarkTheme: false,
    dashboardVisible: false,
    templatePanelVisible: false,
    archiveVisible: false
  };

  console.log('✓ AppState type is valid');
}

/**
 * Test 3: TaskCreationOptions type works correctly
 */
function testTaskCreationOptions() {
  const options: TaskCreationOptions = {
    name: 'New Task',
    estimated_time: 1,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    details: ''
  };

  console.log('✓ TaskCreationOptions type is valid');
}

/**
 * Test 4: TaskFilterOptions type works correctly
 */
function testTaskFilterOptions() {
  const options: TaskFilterOptions = {
    completed: false,
    category: TaskCategory.TASK,
    search: 'test'
  };

  console.log('✓ TaskFilterOptions type is valid');
}

/**
 * Test 5: TaskCategory enum values
 */
function testTaskCategoryEnum() {
  const categories: TaskCategory[] = [
    TaskCategory.TASK,
    TaskCategory.MEETING,
    TaskCategory.REVIEW,
    TaskCategory.BUGFIX,
    TaskCategory.DOCUMENT,
    TaskCategory.RESEARCH
  ];

  console.log('✓ TaskCategory enum has all values');
}

/**
 * Test 6: TaskPriority enum values
 */
function testTaskPriorityEnum() {
  const priorities: TaskPriority[] = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT
  ];

  console.log('✓ TaskPriority enum has all values');
}

/**
 * Test 7: RecurrencePattern type works correctly
 */
function testRecurrencePatternType() {
  const patterns: RecurrencePattern[] = [
    'daily',
    'weekly',
    'monthly',
    null
  ];

  console.log('✓ RecurrencePattern type is valid');
}

/**
 * Test 8: Settings type has all required properties
 */
function testSettingsType() {
  const settings: Settings = {
    ideal_daily_minutes: 480,
    weekday_visibility: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  };

  console.log('✓ Settings type is valid');
}

/**
 * Test 9: TaskTemplate type works correctly
 */
function testTaskTemplateType() {
  const template: TaskTemplate = {
    id: 'template-1',
    name: 'Template Task',
    estimated_time: 2,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    details: '',
    created_at: '2025-03-11T00:00:00.000Z',
    usage_count: 0,
    last_used_at: null
  };

  console.log('✓ TaskTemplate type is valid');
}

/**
 * Test 10: ArchivedTask type extends Task correctly
 */
function testArchivedTaskType() {
  const archived: ArchivedTask = {
    id: 'archived-1',
    name: 'Archived Task',
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
    recurrence_end_date: null,
    archivedAt: '2025-03-11T12:00:00.000Z',
    completedAt: '2025-03-11T12:00:00.000Z'
  };

  console.log('✓ ArchivedTask type is valid');
}

/**
 * Test 11: TaskManager functions have correct signatures
 */
function testTaskManagerFunctions() {
  const manager = createTaskManager();

  // These should compile without type errors
  const task = manager.createTask({
    name: 'Test',
    estimated_time: 1,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.TASK,
    date: '2025-03-11',
    details: ''
  });

  const filtered = manager.filterTasks([], { completed: false });

  const sorted = manager.sortByDate([]);

  console.log('✓ TaskManager functions have correct signatures');
}

/**
 * Test 12: StateManager functions have correct signatures
 */
function testStateManagerFunctions() {
  const manager = createStateManager();

  // These should compile without type errors
  const state = manager.getState();
  const tasks = manager.getTasks();
  const task = manager.getTaskById('test-id');

  manager.setTasks([]);
  manager.addTask(task as Task);
  manager.updateTask('test-id', { name: 'Updated' });
  manager.deleteTask('test-id');

  manager.on('tasks', (newState, oldState) => {
    console.log('Tasks changed', newState, oldState);
  });

  console.log('✓ StateManager functions have correct signatures');
}

/**
 * Run all type checking tests
 */
export function runTypeCheckingTests(): void {
  console.log('Running TypeScript type checking tests...\n');

  testTaskType();
  testAppStateType();
  testTaskCreationOptions();
  testTaskFilterOptions();
  testTaskCategoryEnum();
  testTaskPriorityEnum();
  testRecurrencePatternType();
  testSettingsType();
  testTaskTemplateType();
  testArchivedTaskType();
  testTaskManagerFunctions();
  testStateManagerFunctions();

  console.log('\n✓ All type checking tests passed!');
}

// Run tests if executed directly
if (require.main === module) {
  runTypeCheckingTests();
}
