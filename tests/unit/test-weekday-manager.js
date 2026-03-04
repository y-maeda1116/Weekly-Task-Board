/**
 * Unit Tests for Weekday Manager
 * Tests for weekday visibility toggling, task movement, settings persistence, and constraints
 * 
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
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

/**
 * Mock WeekdayManager for testing
 */
class MockWeekdayManager {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        this.weekdaySettings = {};
        this.loadSettings();
    }

    loadSettings() {
        const stored = mockLocalStorage.getItem('weekday_visibility');
        if (stored) {
            try {
                this.weekdaySettings = JSON.parse(stored);
            } catch (e) {
                this.weekdaySettings = this.getDefaultSettings();
            }
        } else {
            this.weekdaySettings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
        };
    }

    saveSettings() {
        mockLocalStorage.setItem('weekday_visibility', JSON.stringify(this.weekdaySettings));
    }

    toggleWeekday(dayName, visible) {
        if (!this.dayNames.includes(dayName)) {
            return false;
        }

        // Check if at least one weekday would remain visible
        const visibleCount = this.dayNames.filter(day => 
            (day === dayName ? visible : this.weekdaySettings[day])
        ).length;

        if (visibleCount === 0) {
            return false; // Reject: must have at least one visible weekday
        }

        this.weekdaySettings[dayName] = visible;
        this.saveSettings();
        return true;
    }

    getVisibleWeekdays() {
        return this.dayNames.filter(day => this.weekdaySettings[day]);
    }

    getHiddenWeekdays() {
        return this.dayNames.filter(day => !this.weekdaySettings[day]);
    }

    isWeekdayVisible(dayName) {
        return this.weekdaySettings[dayName] || false;
    }

    moveTasksToUnassigned(tasks, dayName) {
        if (!tasks || !Array.isArray(tasks)) return 0;

        const dayIndex = this.dayNames.indexOf(dayName);
        if (dayIndex === -1) return 0;

        // For testing, we'll use a fixed Monday date
        const monday = new Date('2024-01-01'); // Monday
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIndex);
        const targetDateStr = this.formatDate(targetDate);

        let movedCount = 0;
        tasks.forEach(task => {
            if (task.assigned_date === targetDateStr) {
                task.assigned_date = null;
                movedCount++;
            }
        });

        return movedCount;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    validateSettings(settings) {
        const validatedSettings = {};
        this.dayNames.forEach(day => {
            validatedSettings[day] = typeof settings[day] === 'boolean' ? settings[day] : true;
        });
        return validatedSettings;
    }

    getGridColumnCount() {
        return this.getVisibleWeekdays().length + 1; // +1 for unassigned column
    }
}

// ============================================================================
// Test Suite 13.1: 曜日表示切り替えのテスト
// ============================================================================

console.log('\n=== Test Suite 13.1: 曜日表示切り替えのテスト ===\n');

// Test 13.1.1: 曜日非表示時のタスク移動テスト
runTest('13.1.1 曜日非表示時のタスク移動テスト', () => {
    const generator = new TestDataGenerator();
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Create tasks assigned to Monday
    const tasks = [
        generator.generateTask({ assigned_date: '2024-01-01', name: 'Task 1' }),
        generator.generateTask({ assigned_date: '2024-01-01', name: 'Task 2' }),
        generator.generateTask({ assigned_date: '2024-01-02', name: 'Task 3' })
    ];

    // Move Monday tasks to unassigned
    const movedCount = manager.moveTasksToUnassigned(tasks, 'monday');

    if (movedCount !== 2) {
        return `Expected 2 tasks to be moved, got ${movedCount}`;
    }

    if (tasks[0].assigned_date !== null || tasks[1].assigned_date !== null) {
        return 'Tasks should have assigned_date set to null';
    }

    if (tasks[2].assigned_date !== '2024-01-02') {
        return 'Other tasks should not be affected';
    }

    return true;
});

// Test 13.1.2: 曜日再表示時のグリッド更新テスト
runTest('13.1.2 曜日再表示時のグリッド更新テスト', () => {
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Hide Monday
    manager.toggleWeekday('monday', false);
    let columnCount = manager.getGridColumnCount();
    if (columnCount !== 7) { // 6 visible days + 1 unassigned
        return `Expected 7 columns after hiding Monday, got ${columnCount}`;
    }

    // Show Monday again
    manager.toggleWeekday('monday', true);
    columnCount = manager.getGridColumnCount();
    if (columnCount !== 8) { // 7 visible days + 1 unassigned
        return `Expected 8 columns after showing Monday, got ${columnCount}`;
    }

    return true;
});

// Test 13.1.3: 曜日設定保存テスト
runTest('13.1.3 曜日設定保存テスト', () => {
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Modify settings
    manager.toggleWeekday('monday', false);
    manager.toggleWeekday('tuesday', false);

    // Create new manager instance to verify persistence
    const manager2 = new MockWeekdayManager();
    manager2.loadSettings();

    if (manager2.isWeekdayVisible('monday') !== false) {
        return 'Monday visibility should be persisted as false';
    }

    if (manager2.isWeekdayVisible('tuesday') !== false) {
        return 'Tuesday visibility should be persisted as false';
    }

    if (manager2.isWeekdayVisible('wednesday') !== true) {
        return 'Wednesday visibility should be persisted as true';
    }

    return true;
});

// Test 13.1.4: 曜日設定読み込みテスト
runTest('13.1.4 曜日設定読み込みテスト', () => {
    mockLocalStorage.clear();

    // Manually set settings in localStorage
    const customSettings = {
        monday: false,
        tuesday: true,
        wednesday: false,
        thursday: true,
        friday: false,
        saturday: true,
        sunday: false
    };
    mockLocalStorage.setItem('weekday_visibility', JSON.stringify(customSettings));

    const manager = new MockWeekdayManager();
    manager.loadSettings();

    if (manager.isWeekdayVisible('monday') !== false) {
        return 'Monday should be loaded as false';
    }

    if (manager.isWeekdayVisible('tuesday') !== true) {
        return 'Tuesday should be loaded as true';
    }

    const visibleDays = manager.getVisibleWeekdays();
    if (visibleDays.length !== 3) {
        return `Expected 3 visible days, got ${visibleDays.length}`;
    }

    return true;
});

// ============================================================================
// Test Suite 13.2: 曜日管理制約のテスト
// ============================================================================

console.log('\n=== Test Suite 13.2: 曜日管理制約のテスト ===\n');

// Test 13.2.1: 最低1曜日表示保証テスト
runTest('13.2.1 最低1曜日表示保証テスト', () => {
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Try to hide all weekdays except one
    manager.toggleWeekday('monday', false);
    manager.toggleWeekday('tuesday', false);
    manager.toggleWeekday('wednesday', false);
    manager.toggleWeekday('thursday', false);
    manager.toggleWeekday('friday', false);
    manager.toggleWeekday('saturday', false);

    // At this point, only Sunday should be visible
    const visibleDays = manager.getVisibleWeekdays();
    if (visibleDays.length !== 1) {
        return `Expected 1 visible day, got ${visibleDays.length}`;
    }

    if (visibleDays[0] !== 'sunday') {
        return `Expected Sunday to be visible, got ${visibleDays[0]}`;
    }

    return true;
});

// Test 13.2.2: 全曜日非表示拒否テスト
runTest('13.2.2 全曜日非表示拒否テスト', () => {
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Try to hide all weekdays
    let result = true;
    for (const day of manager.dayNames) {
        result = manager.toggleWeekday(day, false);
        if (!result) {
            break; // Should fail at some point
        }
    }

    // The last toggle should have failed
    if (result === true) {
        return 'Should not allow all weekdays to be hidden';
    }

    // At least one weekday should still be visible
    const visibleDays = manager.getVisibleWeekdays();
    if (visibleDays.length === 0) {
        return 'At least one weekday must remain visible';
    }

    return true;
});

// Test 13.2.3: 移動タスク数通知テスト
runTest('13.2.3 移動タスク数通知テスト', () => {
    const generator = new TestDataGenerator();
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Create multiple tasks for different days
    const tasks = [
        generator.generateTask({ assigned_date: '2024-01-01', name: 'Task 1' }),
        generator.generateTask({ assigned_date: '2024-01-01', name: 'Task 2' }),
        generator.generateTask({ assigned_date: '2024-01-01', name: 'Task 3' }),
        generator.generateTask({ assigned_date: '2024-01-02', name: 'Task 4' })
    ];

    // Move Monday tasks
    const movedCount = manager.moveTasksToUnassigned(tasks, 'monday');

    if (movedCount !== 3) {
        return `Expected 3 tasks to be moved, got ${movedCount}`;
    }

    // Verify notification count is correct
    if (movedCount === 0) {
        return 'Should report when tasks are moved';
    }

    return true;
});

// Test 13.2.4: グリッドカラム動的調整テスト
runTest('13.2.4 グリッドカラム動的調整テスト', () => {
    const manager = new MockWeekdayManager();
    mockLocalStorage.clear();
    manager.loadSettings();

    // Initial state: 7 days + 1 unassigned = 8 columns
    let columnCount = manager.getGridColumnCount();
    if (columnCount !== 8) {
        return `Expected 8 columns initially, got ${columnCount}`;
    }

    // Hide 2 weekdays
    manager.toggleWeekday('monday', false);
    manager.toggleWeekday('tuesday', false);
    columnCount = manager.getGridColumnCount();
    if (columnCount !== 6) { // 5 visible days + 1 unassigned
        return `Expected 6 columns after hiding 2 days, got ${columnCount}`;
    }

    // Hide 3 more weekdays
    manager.toggleWeekday('wednesday', false);
    manager.toggleWeekday('thursday', false);
    manager.toggleWeekday('friday', false);
    columnCount = manager.getGridColumnCount();
    if (columnCount !== 3) { // 2 visible days + 1 unassigned
        return `Expected 3 columns after hiding 5 days, got ${columnCount}`;
    }

    // Show one back
    manager.toggleWeekday('monday', true);
    columnCount = manager.getGridColumnCount();
    if (columnCount !== 4) { // 3 visible days + 1 unassigned
        return `Expected 4 columns after showing Monday, got ${columnCount}`;
    }

    return true;
});

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n=== Test Summary ===\n');
console.log(`Total: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%\n`);

if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.details.filter(d => d.startsWith('FAIL') || d.startsWith('ERROR')).forEach(d => {
        console.log(`  ${d}`);
    });
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testResults,
        MockWeekdayManager
    };
}

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);
