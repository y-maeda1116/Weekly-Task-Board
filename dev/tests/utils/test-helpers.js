/**
 * Test Helper Module
 * Provides utilities for testing: MockLocalStorage, TestDataGenerator, and CustomAssertions
 * 
 * Validates: Requirements 15.1, 15.2, 15.5
 */

/**
 * MockLocalStorage - Simulates localStorage for testing
 */
class MockLocalStorage {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = value.toString();
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

/**
 * TestDataGenerator - Generates consistent test data
 */
class TestDataGenerator {
    constructor() {
        this.idCounter = 1;
    }

    /**
     * Generate a single task with optional overrides
     * @param {Object} overrides - Properties to override defaults
     * @returns {Object} Task object
     */
    generateTask(overrides = {}) {
        const defaults = {
            id: `task-${this.idCounter++}`,
            name: 'Test Task',
            estimated_time: 60,
            actual_time: null,
            priority: 'medium',
            category: 'task',
            assigned_date: null,
            completed: false,
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null,
            details: ''
        };
        
        return { ...defaults, ...overrides };
    }

    /**
     * Generate multiple tasks
     * @param {number} count - Number of tasks to generate
     * @param {Object} overrides - Properties to override defaults
     * @returns {Array} Array of task objects
     */
    generateTasks(count, overrides = {}) {
        const tasks = [];
        for (let i = 0; i < count; i++) {
            tasks.push(this.generateTask(overrides));
        }
        return tasks;
    }

    /**
     * Generate a recurring task
     * @param {string} pattern - Recurrence pattern (daily, weekly, monthly)
     * @param {Object} overrides - Properties to override defaults
     * @returns {Object} Recurring task object
     */
    generateRecurringTask(pattern = 'daily', overrides = {}) {
        const recurringDefaults = {
            is_recurring: true,
            recurrence_pattern: pattern,
            recurrence_end_date: null
        };
        
        return this.generateTask({ ...recurringDefaults, ...overrides });
    }

    /**
     * Generate a template
     * @param {Object} overrides - Properties to override defaults
     * @returns {Object} Template object
     */
    generateTemplate(overrides = {}) {
        const defaults = {
            id: `template-${this.idCounter++}`,
            name: 'Test Template',
            tasks: [],
            usage_count: 0,
            created_at: new Date().toISOString()
        };
        
        return { ...defaults, ...overrides };
    }

    /**
     * Generate settings object
     * @param {Object} overrides - Properties to override defaults
     * @returns {Object} Settings object
     */
    generateSettings(overrides = {}) {
        const defaults = {
            ideal_daily_minutes: 480,
            weekday_visibility: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            },
            theme: 'light'
        };
        
        return { ...defaults, ...overrides };
    }

    /**
     * Reset the ID counter
     */
    resetCounter() {
        this.idCounter = 1;
    }
}

/**
 * CustomAssertions - Specialized test assertions
 */
const CustomAssertions = {
    /**
     * Assert that two tasks are equal
     * @param {Object} actual - Actual task
     * @param {Object} expected - Expected task
     * @returns {boolean|string} true if equal, error message otherwise
     */
    assertTaskEquals(actual, expected) {
        const keys = ['id', 'name', 'estimated_time', 'actual_time', 'priority', 
                      'category', 'assigned_date', 'completed', 'is_recurring', 
                      'recurrence_pattern', 'recurrence_end_date'];
        
        for (const key of keys) {
            if (actual[key] !== expected[key]) {
                return `Task property '${key}' mismatch: expected ${expected[key]}, got ${actual[key]}`;
            }
        }
        
        return true;
    },

    /**
     * Assert that two task arrays are equal
     * @param {Array} actual - Actual task array
     * @param {Array} expected - Expected task array
     * @returns {boolean|string} true if equal, error message otherwise
     */
    assertTaskArrayEquals(actual, expected) {
        if (actual.length !== expected.length) {
            return `Array length mismatch: expected ${expected.length}, got ${actual.length}`;
        }
        
        for (let i = 0; i < actual.length; i++) {
            const result = this.assertTaskEquals(actual[i], expected[i]);
            if (result !== true) {
                return `Task at index ${i}: ${result}`;
            }
        }
        
        return true;
    },

    /**
     * Assert that a time value is within a tolerance range
     * @param {number} actual - Actual time value
     * @param {number} expected - Expected time value
     * @param {number} tolerance - Tolerance range
     * @returns {boolean|string} true if within range, error message otherwise
     */
    assertTimeWithinRange(actual, expected, tolerance) {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            return `Time out of range: expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`;
        }
        
        return true;
    },

    /**
     * Assert that two dates are equal (YYYY-MM-DD format)
     * @param {string} actual - Actual date string
     * @param {string} expected - Expected date string
     * @returns {boolean|string} true if equal, error message otherwise
     */
    assertDateEquals(actual, expected) {
        if (actual !== expected) {
            return `Date mismatch: expected ${expected}, got ${actual}`;
        }
        
        return true;
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MockLocalStorage,
        TestDataGenerator,
        CustomAssertions
    };
}
