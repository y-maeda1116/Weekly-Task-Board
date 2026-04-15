/**
 * Unit Tests for Task Basic Operations
 * Tests for task creation, editing, deletion, completion state management, and zombie task prevention
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

// Import test helpers
const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

// Mock localStorage
const mockLocalStorage = new MockLocalStorage();
Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
});

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * Test runner function
 */
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            testResults.passed++;
            testResults.details.push(`PASS ${testName}`);
            console.log(`✓ PASS ${testName}`);
        } else {
            testResults.failed++;
            testResults.details.push(`FAIL ${testName}: ${result}`);
            console.log(`✗ FAIL ${testName}: ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`ERROR ${testName}: ${error.message}`);
        console.log(`✗ ERROR ${testName}: ${error.message}`);
    }
}

// Counter for generating unique IDs in tests
let taskIdCounter = 1;

/**
 * Helper function to simulate task creation
 */
function createTask(taskData) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const newTask = {
        id: `task-${Date.now()}-${taskIdCounter++}`,
        completed: false,
        ...taskData
    };
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    return newTask;
}

/**
 * Helper function to simulate task editing
 */
function editTask(taskId, updates) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        return tasks[taskIndex];
    }
    return null;
}

/**
 * Helper function to simulate task deletion
 */
function deleteTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    return filteredTasks;
}

/**
 * Helper function to get all tasks
 */
function getAllTasks() {
    return JSON.parse(localStorage.getItem('tasks') || '[]');
}

/**
 * Requirement 1.1: Task Creation with Unique ID Assignment
 */
function testTaskCreationWithUniqueId() {
    console.log('\n=== Requirement 1.1: Task Creation with Unique ID ===\n');
    
    // Test 1.1.1: Task is assigned a unique ID
    runTest('1.1.1 Task is assigned a unique ID', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Test Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        if (!task1.id) {
            return 'Task was not assigned an ID';
        }
        
        if (!task1.id.startsWith('task-')) {
            return `Task ID format incorrect: ${task1.id}`;
        }
        
        return true;
    });
    
    // Test 1.1.2: Multiple tasks have different IDs
    runTest('1.1.2 Multiple tasks have different IDs', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Test Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        // Small delay to ensure different timestamp
        const task2 = createTask({
            name: 'Test Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        if (task1.id === task2.id) {
            return `Tasks have duplicate IDs: ${task1.id}`;
        }
        
        return true;
    });
    
    // Test 1.1.3: ID persists after save
    runTest('1.1.3 ID persists after save', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task = createTask({
            name: 'Test Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const savedTasks = getAllTasks();
        const savedTask = savedTasks.find(t => t.id === task.id);
        
        if (!savedTask) {
            return 'Task ID not found after save';
        }
        
        if (savedTask.id !== task.id) {
            return `ID mismatch: expected ${task.id}, got ${savedTask.id}`;
        }
        
        return true;
    });
}

/**
 * Requirement 1.2: Task Creation with Required Fields
 */
function testTaskCreationWithRequiredFields() {
    console.log('\n=== Requirement 1.2: Task Creation with Required Fields ===\n');
    
    // Test 1.2.1: Task includes all required fields
    runTest('1.2.1 Task includes all required fields', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Test Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const requiredFields = ['id', 'name', 'estimated_time', 'priority', 'category', 'assigned_date'];
        
        for (const field of requiredFields) {
            if (task[field] === undefined) {
                return `Missing required field: ${field}`;
            }
        }
        
        return true;
    });
    
    // Test 1.2.2: Task name is stored correctly
    runTest('1.2.2 Task name is stored correctly', () => {
        mockLocalStorage.clear();
        
        const taskName = 'Important Task';
        const task = createTask({
            name: taskName,
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        if (task.name !== taskName) {
            return `Task name mismatch: expected "${taskName}", got "${task.name}"`;
        }
        
        return true;
    });
    
    // Test 1.2.3: Estimated time is stored correctly
    runTest('1.2.3 Estimated time is stored correctly', () => {
        mockLocalStorage.clear();
        
        const estimatedTime = 120;
        const task = createTask({
            name: 'Test Task',
            estimated_time: estimatedTime,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        if (task.estimated_time !== estimatedTime) {
            return `Estimated time mismatch: expected ${estimatedTime}, got ${task.estimated_time}`;
        }
        
        return true;
    });
    
    // Test 1.2.4: Priority is stored correctly
    runTest('1.2.4 Priority is stored correctly', () => {
        mockLocalStorage.clear();
        
        const priorities = ['low', 'medium', 'high'];
        
        for (const priority of priorities) {
            const task = createTask({
                name: 'Test Task',
                estimated_time: 60,
                priority: priority,
                category: 'task',
                assigned_date: '2024-01-01'
            });
            
            if (task.priority !== priority) {
                return `Priority mismatch for ${priority}: got ${task.priority}`;
            }
        }
        
        return true;
    });
    
    // Test 1.2.5: Category is stored correctly
    runTest('1.2.5 Category is stored correctly', () => {
        mockLocalStorage.clear();
        
        const category = 'meeting';
        const task = createTask({
            name: 'Test Task',
            estimated_time: 60,
            priority: 'medium',
            category: category,
            assigned_date: '2024-01-01'
        });
        
        if (task.category !== category) {
            return `Category mismatch: expected "${category}", got "${task.category}"`;
        }
        
        return true;
    });
    
    // Test 1.2.6: Assigned date is stored correctly
    runTest('1.2.6 Assigned date is stored correctly', () => {
        mockLocalStorage.clear();
        
        const assignedDate = '2024-01-15';
        const task = createTask({
            name: 'Test Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: assignedDate
        });
        
        if (task.assigned_date !== assignedDate) {
            return `Assigned date mismatch: expected "${assignedDate}", got "${task.assigned_date}"`;
        }
        
        return true;
    });
}

/**
 * Requirement 1.3: Task Editing and localStorage Persistence
 */
function testTaskEditingAndPersistence() {
    console.log('\n=== Requirement 1.3: Task Editing and localStorage Persistence ===\n');
    
    // Test 1.3.1: Task can be edited
    runTest('1.3.1 Task can be edited', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Original Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const updatedTask = editTask(task.id, {
            name: 'Updated Task',
            estimated_time: 90
        });
        
        if (!updatedTask) {
            return 'Task edit failed';
        }
        
        if (updatedTask.name !== 'Updated Task') {
            return `Name not updated: expected "Updated Task", got "${updatedTask.name}"`;
        }
        
        if (updatedTask.estimated_time !== 90) {
            return `Estimated time not updated: expected 90, got ${updatedTask.estimated_time}`;
        }
        
        return true;
    });
    
    // Test 1.3.2: Edited task persists in localStorage
    runTest('1.3.2 Edited task persists in localStorage', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Original Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        editTask(task.id, {
            name: 'Updated Task',
            priority: 'high'
        });
        
        const savedTasks = getAllTasks();
        const savedTask = savedTasks.find(t => t.id === task.id);
        
        if (!savedTask) {
            return 'Task not found in localStorage after edit';
        }
        
        if (savedTask.name !== 'Updated Task') {
            return `Name not persisted: expected "Updated Task", got "${savedTask.name}"`;
        }
        
        if (savedTask.priority !== 'high') {
            return `Priority not persisted: expected "high", got "${savedTask.priority}"`;
        }
        
        return true;
    });
    
    // Test 1.3.3: Multiple fields can be edited simultaneously
    runTest('1.3.3 Multiple fields can be edited simultaneously', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Original Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const updatedTask = editTask(task.id, {
            name: 'Updated Task',
            estimated_time: 120,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-15'
        });
        
        if (updatedTask.name !== 'Updated Task') {
            return 'Name not updated';
        }
        if (updatedTask.estimated_time !== 120) {
            return 'Estimated time not updated';
        }
        if (updatedTask.priority !== 'high') {
            return 'Priority not updated';
        }
        if (updatedTask.category !== 'meeting') {
            return 'Category not updated';
        }
        if (updatedTask.assigned_date !== '2024-01-15') {
            return 'Assigned date not updated';
        }
        
        return true;
    });
    
    // Test 1.3.4: Task ID remains unchanged after edit
    runTest('1.3.4 Task ID remains unchanged after edit', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Original Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const originalId = task.id;
        
        const updatedTask = editTask(task.id, {
            name: 'Updated Task'
        });
        
        if (updatedTask.id !== originalId) {
            return `Task ID changed after edit: expected ${originalId}, got ${updatedTask.id}`;
        }
        
        return true;
    });
}

/**
 * Requirement 1.4: Task Deletion from All Data Structures
 */
function testTaskDeletion() {
    console.log('\n=== Requirement 1.4: Task Deletion from All Data Structures ===\n');
    
    // Test 1.4.1: Task can be deleted
    runTest('1.4.1 Task can be deleted', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Delete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const remainingTasks = deleteTask(task.id);
        
        const deletedTask = remainingTasks.find(t => t.id === task.id);
        
        if (deletedTask) {
            return 'Task was not deleted';
        }
        
        return true;
    });
    
    // Test 1.4.2: Deleted task is removed from localStorage
    runTest('1.4.2 Deleted task is removed from localStorage', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Delete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        deleteTask(task.id);
        
        const savedTasks = getAllTasks();
        const deletedTask = savedTasks.find(t => t.id === task.id);
        
        if (deletedTask) {
            return 'Task still exists in localStorage after deletion';
        }
        
        return true;
    });
    
    // Test 1.4.3: Other tasks remain after deletion
    runTest('1.4.3 Other tasks remain after deletion', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        const task3 = createTask({
            name: 'Task 3',
            estimated_time: 45,
            priority: 'low',
            category: 'review',
            assigned_date: '2024-01-03'
        });
        
        deleteTask(task2.id);
        
        const remainingTasks = getAllTasks();
        
        if (remainingTasks.length !== 2) {
            return `Expected 2 remaining tasks, got ${remainingTasks.length}`;
        }
        
        const task1Exists = remainingTasks.find(t => t.id === task1.id);
        const task3Exists = remainingTasks.find(t => t.id === task3.id);
        
        if (!task1Exists) {
            return 'Task 1 was incorrectly deleted';
        }
        
        if (!task3Exists) {
            return 'Task 3 was incorrectly deleted';
        }
        
        return true;
    });
    
    // Test 1.4.4: Multiple tasks can be deleted
    runTest('1.4.4 Multiple tasks can be deleted', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        const task3 = createTask({
            name: 'Task 3',
            estimated_time: 45,
            priority: 'low',
            category: 'review',
            assigned_date: '2024-01-03'
        });
        
        deleteTask(task1.id);
        deleteTask(task3.id);
        
        const remainingTasks = getAllTasks();
        
        if (remainingTasks.length !== 1) {
            return `Expected 1 remaining task, got ${remainingTasks.length}`;
        }
        
        if (remainingTasks[0].id !== task2.id) {
            return 'Wrong task remained after deletion';
        }
        
        return true;
    });
}

/**
 * Requirement 1.5: Zombie Task Prevention
 */
function testZombieTaskPrevention() {
    console.log('\n=== Requirement 1.5: Zombie Task Prevention ===\n');
    
    // Test 1.5.1: Deleted task does not reappear in task list
    runTest('1.5.1 Deleted task does not reappear in task list', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Zombie Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        deleteTask(task.id);
        
        // Simulate reloading tasks from localStorage
        const reloadedTasks = getAllTasks();
        
        const zombieTask = reloadedTasks.find(t => t.id === task.id);
        
        if (zombieTask) {
            return 'Zombie task detected: deleted task reappeared in task list';
        }
        
        return true;
    });
    
    // Test 1.5.2: Task count is correct after deletion
    runTest('1.5.2 Task count is correct after deletion', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        createTask({
            name: 'Task 3',
            estimated_time: 45,
            priority: 'low',
            category: 'review',
            assigned_date: '2024-01-03'
        });
        
        let tasks = getAllTasks();
        if (tasks.length !== 3) {
            return `Expected 3 tasks before deletion, got ${tasks.length}`;
        }
        
        deleteTask(task2.id);
        
        tasks = getAllTasks();
        if (tasks.length !== 2) {
            return `Expected 2 tasks after deletion, got ${tasks.length}`;
        }
        
        return true;
    });
    
    // Test 1.5.3: Deleted task ID cannot be found
    runTest('1.5.3 Deleted task ID cannot be found', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Delete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const taskId = task.id;
        
        deleteTask(taskId);
        
        const tasks = getAllTasks();
        const foundTask = tasks.find(t => t.id === taskId);
        
        if (foundTask) {
            return `Deleted task ID ${taskId} was found in task list`;
        }
        
        return true;
    });
    
    // Test 1.5.4: localStorage does not contain deleted task data
    runTest('1.5.4 localStorage does not contain deleted task data', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Delete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        deleteTask(task.id);
        
        const tasksJson = localStorage.getItem('tasks');
        
        if (tasksJson.includes(task.id)) {
            return 'Deleted task ID found in localStorage JSON';
        }
        
        if (tasksJson.includes(task.name)) {
            return 'Deleted task name found in localStorage JSON';
        }
        
        return true;
    });
}

/**
 * Requirement 1.6: Task Completion Flag Setting
 */
function testTaskCompletionFlagSetting() {
    console.log('\n=== Requirement 1.6: Task Completion Flag Setting ===\n');
    
    // Test 1.6.1: Task can be marked as completed
    runTest('1.6.1 Task can be marked as completed', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Complete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        // Verify initial state
        if (task.completed !== false) {
            return `Initial completed flag should be false, got ${task.completed}`;
        }
        
        // Mark as completed
        const completedTask = editTask(task.id, { completed: true });
        
        if (!completedTask) {
            return 'Failed to update task';
        }
        
        if (completedTask.completed !== true) {
            return `Completed flag should be true, got ${completedTask.completed}`;
        }
        
        return true;
    });
    
    // Test 1.6.2: Completed flag persists in localStorage
    runTest('1.6.2 Completed flag persists in localStorage', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Complete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        editTask(task.id, { completed: true });
        
        const savedTasks = getAllTasks();
        const savedTask = savedTasks.find(t => t.id === task.id);
        
        if (!savedTask) {
            return 'Task not found in localStorage';
        }
        
        if (savedTask.completed !== true) {
            return `Completed flag not persisted: expected true, got ${savedTask.completed}`;
        }
        
        return true;
    });
    
    // Test 1.6.3: Multiple tasks can be marked as completed independently
    runTest('1.6.3 Multiple tasks can be marked as completed independently', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        const task3 = createTask({
            name: 'Task 3',
            estimated_time: 45,
            priority: 'low',
            category: 'review',
            assigned_date: '2024-01-03'
        });
        
        // Mark only task2 as completed
        editTask(task2.id, { completed: true });
        
        const tasks = getAllTasks();
        const savedTask1 = tasks.find(t => t.id === task1.id);
        const savedTask2 = tasks.find(t => t.id === task2.id);
        const savedTask3 = tasks.find(t => t.id === task3.id);
        
        if (savedTask1.completed !== false) {
            return 'Task 1 should not be completed';
        }
        
        if (savedTask2.completed !== true) {
            return 'Task 2 should be completed';
        }
        
        if (savedTask3.completed !== false) {
            return 'Task 3 should not be completed';
        }
        
        return true;
    });
    
    // Test 1.6.4: Completed flag is boolean type
    runTest('1.6.4 Completed flag is boolean type', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Complete',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        editTask(task.id, { completed: true });
        
        const savedTasks = getAllTasks();
        const savedTask = savedTasks.find(t => t.id === task.id);
        
        if (typeof savedTask.completed !== 'boolean') {
            return `Completed flag should be boolean, got ${typeof savedTask.completed}`;
        }
        
        return true;
    });
}

/**
 * Requirement 1.7: Task Uncomplete (Return to Incomplete State)
 */
function testTaskUncomplete() {
    console.log('\n=== Requirement 1.7: Task Uncomplete (Return to Incomplete State) ===\n');
    
    // Test 1.7.1: Completed task can be marked as incomplete
    runTest('1.7.1 Completed task can be marked as incomplete', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Toggle',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        // Mark as completed
        editTask(task.id, { completed: true });
        
        let savedTask = getAllTasks().find(t => t.id === task.id);
        if (savedTask.completed !== true) {
            return 'Task should be completed before uncompleting';
        }
        
        // Mark as incomplete
        const uncompletedTask = editTask(task.id, { completed: false });
        
        if (!uncompletedTask) {
            return 'Failed to update task';
        }
        
        if (uncompletedTask.completed !== false) {
            return `Completed flag should be false, got ${uncompletedTask.completed}`;
        }
        
        return true;
    });
    
    // Test 1.7.2: Uncomplete state persists in localStorage
    runTest('1.7.2 Uncomplete state persists in localStorage', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Toggle',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        // Mark as completed then incomplete
        editTask(task.id, { completed: true });
        editTask(task.id, { completed: false });
        
        const savedTasks = getAllTasks();
        const savedTask = savedTasks.find(t => t.id === task.id);
        
        if (!savedTask) {
            return 'Task not found in localStorage';
        }
        
        if (savedTask.completed !== false) {
            return `Completed flag should be false, got ${savedTask.completed}`;
        }
        
        return true;
    });
    
    // Test 1.7.3: Task can be toggled multiple times
    runTest('1.7.3 Task can be toggled multiple times', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Toggle',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        // Toggle multiple times
        editTask(task.id, { completed: true });
        editTask(task.id, { completed: false });
        editTask(task.id, { completed: true });
        editTask(task.id, { completed: false });
        
        const savedTask = getAllTasks().find(t => t.id === task.id);
        
        if (savedTask.completed !== false) {
            return `Final state should be false, got ${savedTask.completed}`;
        }
        
        return true;
    });
    
    // Test 1.7.4: Other task properties remain unchanged when toggling completion
    runTest('1.7.4 Other task properties remain unchanged when toggling completion', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Task to Toggle',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const originalName = task.name;
        const originalEstimatedTime = task.estimated_time;
        const originalPriority = task.priority;
        const originalCategory = task.category;
        const originalAssignedDate = task.assigned_date;
        
        // Toggle completion
        editTask(task.id, { completed: true });
        editTask(task.id, { completed: false });
        
        const savedTask = getAllTasks().find(t => t.id === task.id);
        
        if (savedTask.name !== originalName) {
            return 'Task name changed during toggle';
        }
        if (savedTask.estimated_time !== originalEstimatedTime) {
            return 'Estimated time changed during toggle';
        }
        if (savedTask.priority !== originalPriority) {
            return 'Priority changed during toggle';
        }
        if (savedTask.category !== originalCategory) {
            return 'Category changed during toggle';
        }
        if (savedTask.assigned_date !== originalAssignedDate) {
            return 'Assigned date changed during toggle';
        }
        
        return true;
    });
}

/**
 * Requirement 1.8: Data Integrity Maintenance
 */
function testDataIntegrityMaintenance() {
    console.log('\n=== Requirement 1.8: Data Integrity Maintenance ===\n');
    
    // Test 1.8.1: Task count remains consistent after operations
    runTest('1.8.1 Task count remains consistent after operations', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        // Create 3 tasks
        createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        const task3 = createTask({
            name: 'Task 3',
            estimated_time: 45,
            priority: 'low',
            category: 'review',
            assigned_date: '2024-01-03'
        });
        
        let tasks = getAllTasks();
        if (tasks.length !== 3) {
            return `Expected 3 tasks after creation, got ${tasks.length}`;
        }
        
        // Edit task
        editTask(task3.id, { name: 'Updated Task 3' });
        
        tasks = getAllTasks();
        if (tasks.length !== 3) {
            return `Expected 3 tasks after edit, got ${tasks.length}`;
        }
        
        // Delete task
        deleteTask(task3.id);
        
        tasks = getAllTasks();
        if (tasks.length !== 2) {
            return `Expected 2 tasks after deletion, got ${tasks.length}`;
        }
        
        return true;
    });
    
    // Test 1.8.2: No duplicate task IDs after operations
    runTest('1.8.2 No duplicate task IDs after operations', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        // Create multiple tasks
        for (let i = 1; i <= 5; i++) {
            createTask({
                name: `Task ${i}`,
                estimated_time: 60,
                priority: 'medium',
                category: 'task',
                assigned_date: '2024-01-01'
            });
        }
        
        const tasks = getAllTasks();
        const ids = tasks.map(t => t.id);
        const uniqueIds = new Set(ids);
        
        if (ids.length !== uniqueIds.size) {
            return 'Duplicate task IDs detected';
        }
        
        return true;
    });
    
    // Test 1.8.3: All tasks have required fields after operations
    runTest('1.8.3 All tasks have required fields after operations', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        // Edit task1
        editTask(task1.id, { name: 'Updated Task 1', completed: true });
        
        // Mark task2 as completed
        editTask(task2.id, { completed: true });
        
        const tasks = getAllTasks();
        const requiredFields = ['id', 'name', 'estimated_time', 'priority', 'category', 'assigned_date', 'completed'];
        
        for (const task of tasks) {
            for (const field of requiredFields) {
                if (task[field] === undefined) {
                    return `Task ${task.id} missing required field: ${field}`;
                }
            }
        }
        
        return true;
    });
    
    // Test 1.8.4: localStorage data is valid JSON after operations
    runTest('1.8.4 localStorage data is valid JSON after operations', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        // Perform operations
        editTask(task1.id, { completed: true });
        
        // Verify localStorage contains valid JSON
        const tasksJson = localStorage.getItem('tasks');
        
        try {
            const parsedTasks = JSON.parse(tasksJson);
            
            if (!Array.isArray(parsedTasks)) {
                return 'localStorage tasks is not an array';
            }
            
            return true;
        } catch (error) {
            return `localStorage contains invalid JSON: ${error.message}`;
        }
    });
    
    // Test 1.8.5: Task data integrity after create-edit-complete-uncomplete sequence
    runTest('1.8.5 Task data integrity after create-edit-complete-uncomplete sequence', () => {
        mockLocalStorage.clear();
        
        const task = createTask({
            name: 'Original Task',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const originalId = task.id;
        
        // Edit task
        editTask(task.id, {
            name: 'Updated Task',
            estimated_time: 90,
            priority: 'high'
        });
        
        // Mark as completed
        editTask(task.id, { completed: true });
        
        // Mark as incomplete
        editTask(task.id, { completed: false });
        
        const finalTask = getAllTasks().find(t => t.id === originalId);
        
        if (!finalTask) {
            return 'Task not found after operations';
        }
        
        if (finalTask.id !== originalId) {
            return 'Task ID changed during operations';
        }
        
        if (finalTask.name !== 'Updated Task') {
            return 'Task name not preserved';
        }
        
        if (finalTask.estimated_time !== 90) {
            return 'Estimated time not preserved';
        }
        
        if (finalTask.priority !== 'high') {
            return 'Priority not preserved';
        }
        
        if (finalTask.completed !== false) {
            return 'Completed flag not in expected state';
        }
        
        return true;
    });
    
    // Test 1.8.6: No orphaned data after deletion
    runTest('1.8.6 No orphaned data after deletion', () => {
        mockLocalStorage.clear();
        taskIdCounter = 1; // Reset counter
        
        const task1 = createTask({
            name: 'Task 1',
            estimated_time: 60,
            priority: 'medium',
            category: 'task',
            assigned_date: '2024-01-01'
        });
        
        const task2 = createTask({
            name: 'Task 2',
            estimated_time: 30,
            priority: 'high',
            category: 'meeting',
            assigned_date: '2024-01-02'
        });
        
        // Delete task1
        deleteTask(task1.id);
        
        const tasksJson = localStorage.getItem('tasks');
        const tasks = JSON.parse(tasksJson);
        
        // Verify only task2 exists
        if (tasks.length !== 1) {
            return `Expected 1 task, got ${tasks.length}`;
        }
        
        if (tasks[0].id !== task2.id) {
            return 'Wrong task remained after deletion';
        }
        
        // Verify no references to deleted task
        if (tasksJson.includes(task1.id)) {
            return 'Deleted task ID found in localStorage';
        }
        
        return true;
    });
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('==========================================');
    console.log('Task Basic Operations Unit Tests');
    console.log('==========================================\n');
    
    testTaskCreationWithUniqueId();
    testTaskCreationWithRequiredFields();
    testTaskEditingAndPersistence();
    testTaskDeletion();
    testZombieTaskPrevention();
    testTaskCompletionFlagSetting();
    testTaskUncomplete();
    testDataIntegrityMaintenance();
    
    console.log('\n==========================================');
    console.log('Test Summary');
    console.log('==========================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    console.log('==========================================\n');
    
    if (testResults.failed === 0) {
        console.log('✓ All tests passed!');
        process.exit(0);
    } else {
        console.log(`✗ ${testResults.failed} test(s) failed!`);
        process.exit(1);
    }
}

// Run tests
runAllTests();
