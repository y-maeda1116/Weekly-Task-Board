/**
 * Integration Test Scenarios
 * Tests end-to-end workflows combining multiple features
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */

// Import test helpers
const { MockLocalStorage, TestDataGenerator, CustomAssertions } = require('../utils/test-helpers.js');

/**
 * Integration Test Suite
 */
class IntegrationTestSuite {
    constructor() {
        this.testResults = [];
        this.mockStorage = new MockLocalStorage();
        this.dataGenerator = new TestDataGenerator();
    }

    /**
     * Run all integration tests
     */
    runAllTests() {
        console.log('\n=== Integration Test Scenarios ===\n');
        
        // Task 16.1: End-to-end workflows
        this.testTaskCreateCompleteArchiveWorkflow();
        this.testTemplateCreateApplyWorkflow();
        this.testRecurringTaskCreateWeekMoveWorkflow();
        this.testDataExportImportWorkflow();
        
        // Task 16.2: Combined feature integration
        this.testWeekdayHideTaskMoveWorkflow();
        this.testCategoryFilterTaskEditWorkflow();
        this.testThemeSwitchWorkflow();
        this.testWeekMoveStatisticsWorkflow();
        
        this.printSummary();
        return this.testResults;
    }

    /**
     * Test 1: Task Create → Complete → Archive Workflow
     * Validates: Requirement 7.1
     */
    testTaskCreateCompleteArchiveWorkflow() {
        const testName = 'Task Create → Complete → Archive Workflow';
        try {
            // Step 1: Create a task
            const task = this.dataGenerator.generateTask({
                name: 'Integration Test Task',
                estimated_time: 2,
                assigned_date: '2024-01-15'
            });
            
            const tasks = [task];
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Verify task was created
            const savedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            if (savedTasks.length !== 1) {
                throw new Error(`Expected 1 task, got ${savedTasks.length}`);
            }
            
            // Step 2: Mark task as complete
            task.completed = true;
            tasks[0] = task;
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            const completedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            if (!completedTasks[0].completed) {
                throw new Error('Task was not marked as completed');
            }
            
            // Step 3: Archive the task
            const archivedTasks = [];
            task.archived_date = new Date().toISOString();
            archivedTasks.push(task);
            this.mockStorage.setItem('archived_tasks', JSON.stringify(archivedTasks));
            
            // Remove from active tasks
            this.mockStorage.setItem('tasks', JSON.stringify([]));
            
            // Verify archive
            const savedArchived = JSON.parse(this.mockStorage.getItem('archived_tasks'));
            if (savedArchived.length !== 1) {
                throw new Error(`Expected 1 archived task, got ${savedArchived.length}`);
            }
            
            if (!savedArchived[0].archived_date) {
                throw new Error('Archived task missing archived_date');
            }
            
            this.addTestResult(testName, true, 'Task successfully created, completed, and archived');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 2: Template Create → Apply Workflow
     * Validates: Requirement 7.2
     */
    testTemplateCreateApplyWorkflow() {
        const testName = 'Template Create → Apply Workflow';
        try {
            // Step 1: Create a template
            const template = this.dataGenerator.generateTemplate({
                name: 'Weekly Review Template',
                tasks: [
                    this.dataGenerator.generateTask({ name: 'Review Progress', estimated_time: 1 }),
                    this.dataGenerator.generateTask({ name: 'Plan Next Week', estimated_time: 1 })
                ]
            });
            
            const templates = [template];
            this.mockStorage.setItem('templates', JSON.stringify(templates));
            
            // Verify template was created
            const savedTemplates = JSON.parse(this.mockStorage.getItem('templates'));
            if (savedTemplates.length !== 1) {
                throw new Error(`Expected 1 template, got ${savedTemplates.length}`);
            }
            
            // Step 2: Apply template (create tasks from template)
            const appliedTasks = [];
            template.tasks.forEach(templateTask => {
                const newTask = this.dataGenerator.generateTask({
                    name: templateTask.name,
                    estimated_time: templateTask.estimated_time,
                    category: templateTask.category,
                    assigned_date: '2024-01-15'
                });
                appliedTasks.push(newTask);
            });
            
            this.mockStorage.setItem('tasks', JSON.stringify(appliedTasks));
            
            // Verify tasks were created from template
            const savedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            if (savedTasks.length !== 2) {
                throw new Error(`Expected 2 tasks from template, got ${savedTasks.length}`);
            }
            
            // Verify task properties match template
            if (savedTasks[0].name !== 'Review Progress') {
                throw new Error('Task name does not match template');
            }
            
            // Update template usage count
            template.usage_count++;
            templates[0] = template;
            this.mockStorage.setItem('templates', JSON.stringify(templates));
            
            const updatedTemplates = JSON.parse(this.mockStorage.getItem('templates'));
            if (updatedTemplates[0].usage_count !== 1) {
                throw new Error('Template usage count not updated');
            }
            
            this.addTestResult(testName, true, 'Template successfully created and applied');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 3: Recurring Task Create → Week Move Workflow
     * Validates: Requirement 7.3
     */
    testRecurringTaskCreateWeekMoveWorkflow() {
        const testName = 'Recurring Task Create → Week Move Workflow';
        try {
            // Step 1: Create a recurring task
            const recurringTask = this.dataGenerator.generateRecurringTask('weekly', {
                name: 'Weekly Meeting',
                estimated_time: 1,
                assigned_date: '2024-01-15'
            });
            
            const tasks = [recurringTask];
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Verify recurring task was created
            const savedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            if (!savedTasks[0].is_recurring) {
                throw new Error('Task is not marked as recurring');
            }
            
            if (savedTasks[0].recurrence_pattern !== 'weekly') {
                throw new Error('Recurrence pattern not set correctly');
            }
            
            // Step 2: Simulate week move (generate new tasks for next week)
            const nextWeekTask = this.dataGenerator.generateTask({
                name: recurringTask.name,
                estimated_time: recurringTask.estimated_time,
                assigned_date: '2024-01-22', // Next week
                category: recurringTask.category
            });
            
            tasks.push(nextWeekTask);
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Verify new task was generated for next week
            const updatedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            if (updatedTasks.length !== 2) {
                throw new Error(`Expected 2 tasks, got ${updatedTasks.length}`);
            }
            
            const nextWeekTasks = updatedTasks.filter(t => t.assigned_date === '2024-01-22');
            if (nextWeekTasks.length !== 1) {
                throw new Error('Next week task not generated correctly');
            }
            
            this.addTestResult(testName, true, 'Recurring task successfully created and moved to next week');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 4: Data Export → Import Workflow
     * Validates: Requirement 7.4
     */
    testDataExportImportWorkflow() {
        const testName = 'Data Export → Import Workflow';
        try {
            // Step 1: Create test data
            const tasks = [
                this.dataGenerator.generateTask({ name: 'Task 1', estimated_time: 1 }),
                this.dataGenerator.generateTask({ name: 'Task 2', estimated_time: 2 })
            ];
            
            const templates = [
                this.dataGenerator.generateTemplate({ name: 'Template 1' })
            ];
            
            const settings = this.dataGenerator.generateSettings();
            
            const archivedTasks = [
                this.dataGenerator.generateTask({ name: 'Archived Task', completed: true })
            ];
            
            // Store all data
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            this.mockStorage.setItem('templates', JSON.stringify(templates));
            this.mockStorage.setItem('settings', JSON.stringify(settings));
            this.mockStorage.setItem('archived_tasks', JSON.stringify(archivedTasks));
            
            // Step 2: Export data
            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                tasks: JSON.parse(this.mockStorage.getItem('tasks')),
                templates: JSON.parse(this.mockStorage.getItem('templates')),
                settings: JSON.parse(this.mockStorage.getItem('settings')),
                archived_tasks: JSON.parse(this.mockStorage.getItem('archived_tasks'))
            };
            
            const exportJson = JSON.stringify(exportData);
            
            // Verify export is valid JSON
            try {
                JSON.parse(exportJson);
            } catch (e) {
                throw new Error('Exported data is not valid JSON');
            }
            
            // Step 3: Clear storage and import
            this.mockStorage.clear();
            
            const importedData = JSON.parse(exportJson);
            this.mockStorage.setItem('tasks', JSON.stringify(importedData.tasks));
            this.mockStorage.setItem('templates', JSON.stringify(importedData.templates));
            this.mockStorage.setItem('settings', JSON.stringify(importedData.settings));
            this.mockStorage.setItem('archived_tasks', JSON.stringify(importedData.archived_tasks));
            
            // Step 4: Verify all data was restored
            const restoredTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            const restoredTemplates = JSON.parse(this.mockStorage.getItem('templates'));
            const restoredSettings = JSON.parse(this.mockStorage.getItem('settings'));
            const restoredArchived = JSON.parse(this.mockStorage.getItem('archived_tasks'));
            
            if (restoredTasks.length !== 2) {
                throw new Error(`Expected 2 tasks, got ${restoredTasks.length}`);
            }
            
            if (restoredTemplates.length !== 1) {
                throw new Error(`Expected 1 template, got ${restoredTemplates.length}`);
            }
            
            if (restoredArchived.length !== 1) {
                throw new Error(`Expected 1 archived task, got ${restoredArchived.length}`);
            }
            
            if (!restoredSettings.ideal_daily_minutes) {
                throw new Error('Settings not restored correctly');
            }
            
            this.addTestResult(testName, true, 'Data successfully exported and imported');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 5: Weekday Hide → Task Move Workflow
     * Validates: Requirement 7.5
     */
    testWeekdayHideTaskMoveWorkflow() {
        const testName = 'Weekday Hide → Task Move Workflow';
        try {
            // Step 1: Create tasks assigned to different weekdays
            const tasks = [
                this.dataGenerator.generateTask({ name: 'Monday Task', assigned_date: '2024-01-15' }), // Monday
                this.dataGenerator.generateTask({ name: 'Tuesday Task', assigned_date: '2024-01-16' }), // Tuesday
                this.dataGenerator.generateTask({ name: 'Wednesday Task', assigned_date: '2024-01-17' }) // Wednesday
            ];
            
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Step 2: Hide Monday (move Monday tasks to unassigned)
            const updatedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            updatedTasks.forEach(task => {
                if (task.assigned_date === '2024-01-15') {
                    task.assigned_date = null; // Move to unassigned
                }
            });
            
            this.mockStorage.setItem('tasks', JSON.stringify(updatedTasks));
            
            // Step 3: Verify Monday tasks were moved
            const finalTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            const unassignedTasks = finalTasks.filter(t => t.assigned_date === null);
            const assignedTasks = finalTasks.filter(t => t.assigned_date !== null);
            
            if (unassignedTasks.length !== 1) {
                throw new Error(`Expected 1 unassigned task, got ${unassignedTasks.length}`);
            }
            
            if (assignedTasks.length !== 2) {
                throw new Error(`Expected 2 assigned tasks, got ${assignedTasks.length}`);
            }
            
            if (unassignedTasks[0].name !== 'Monday Task') {
                throw new Error('Wrong task was moved to unassigned');
            }
            
            this.addTestResult(testName, true, 'Weekday successfully hidden and tasks moved');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 6: Category Filter → Task Edit Workflow
     * Validates: Requirement 7.6
     */
    testCategoryFilterTaskEditWorkflow() {
        const testName = 'Category Filter → Task Edit Workflow';
        try {
            // Step 1: Create tasks with different categories
            const tasks = [
                this.dataGenerator.generateTask({ name: 'Work Task', category: 'work', estimated_time: 2 }),
                this.dataGenerator.generateTask({ name: 'Personal Task', category: 'personal', estimated_time: 1 }),
                this.dataGenerator.generateTask({ name: 'Another Work Task', category: 'work', estimated_time: 3 })
            ];
            
            this.mockStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Step 2: Filter by 'work' category
            const allTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            const filteredTasks = allTasks.filter(t => t.category === 'work');
            
            if (filteredTasks.length !== 2) {
                throw new Error(`Expected 2 work tasks, got ${filteredTasks.length}`);
            }
            
            // Step 3: Edit a filtered task
            const taskToEdit = filteredTasks[0];
            taskToEdit.estimated_time = 4;
            taskToEdit.priority = 'high';
            
            // Update in storage
            const updatedTasks = allTasks.map(t => t.id === taskToEdit.id ? taskToEdit : t);
            this.mockStorage.setItem('tasks', JSON.stringify(updatedTasks));
            
            // Step 4: Verify edit was saved
            const savedTasks = JSON.parse(this.mockStorage.getItem('tasks'));
            const editedTask = savedTasks.find(t => t.id === taskToEdit.id);
            
            if (editedTask.estimated_time !== 4) {
                throw new Error('Task estimated_time was not updated');
            }
            
            if (editedTask.priority !== 'high') {
                throw new Error('Task priority was not updated');
            }
            
            // Verify filter still works after edit
            const reFilteredTasks = savedTasks.filter(t => t.category === 'work');
            if (reFilteredTasks.length !== 2) {
                throw new Error('Filter state was not maintained after edit');
            }
            
            this.addTestResult(testName, true, 'Category filter maintained and task successfully edited');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 7: Theme Switch Workflow
     * Validates: Requirement 7.7
     */
    testThemeSwitchWorkflow() {
        const testName = 'Theme Switch Workflow';
        try {
            // Step 1: Set initial theme to light
            const settings = this.dataGenerator.generateSettings({ theme: 'light' });
            this.mockStorage.setItem('settings', JSON.stringify(settings));
            
            // Verify initial theme
            const initialSettings = JSON.parse(this.mockStorage.getItem('settings'));
            if (initialSettings.theme !== 'light') {
                throw new Error('Initial theme not set correctly');
            }
            
            // Step 2: Switch to dark theme
            settings.theme = 'dark';
            this.mockStorage.setItem('settings', JSON.stringify(settings));
            
            // Step 3: Verify theme was switched
            const updatedSettings = JSON.parse(this.mockStorage.getItem('settings'));
            if (updatedSettings.theme !== 'dark') {
                throw new Error('Theme was not switched to dark');
            }
            
            // Step 4: Switch back to light
            settings.theme = 'light';
            this.mockStorage.setItem('settings', JSON.stringify(settings));
            
            const finalSettings = JSON.parse(this.mockStorage.getItem('settings'));
            if (finalSettings.theme !== 'light') {
                throw new Error('Theme was not switched back to light');
            }
            
            this.addTestResult(testName, true, 'Theme successfully switched between light and dark');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test 8: Week Move → Statistics Display Workflow
     * Validates: Requirement 7.8
     */
    testWeekMoveStatisticsWorkflow() {
        const testName = 'Week Move → Statistics Display Workflow';
        try {
            // Step 1: Create tasks for week 1
            const week1Tasks = [
                this.dataGenerator.generateTask({ 
                    name: 'Task 1', 
                    estimated_time: 2, 
                    actual_time: 2,
                    completed: true,
                    assigned_date: '2024-01-15' 
                }),
                this.dataGenerator.generateTask({ 
                    name: 'Task 2', 
                    estimated_time: 3, 
                    actual_time: null,
                    completed: false,
                    assigned_date: '2024-01-16' 
                })
            ];
            
            this.mockStorage.setItem('tasks', JSON.stringify(week1Tasks));
            
            // Step 2: Calculate statistics for week 1
            const week1Stats = this.calculateWeekStatistics('2024-01-15');
            
            if (week1Stats.total_tasks !== 2) {
                throw new Error(`Expected 2 tasks in week 1, got ${week1Stats.total_tasks}`);
            }
            
            if (week1Stats.completed_tasks !== 1) {
                throw new Error(`Expected 1 completed task in week 1, got ${week1Stats.completed_tasks}`);
            }
            
            // Step 3: Move to week 2 and create new tasks
            const week2Tasks = [
                this.dataGenerator.generateTask({ 
                    name: 'Task 3', 
                    estimated_time: 1, 
                    actual_time: 1,
                    completed: true,
                    assigned_date: '2024-01-22' 
                }),
                this.dataGenerator.generateTask({ 
                    name: 'Task 4', 
                    estimated_time: 2, 
                    actual_time: 2,
                    completed: true,
                    assigned_date: '2024-01-23' 
                })
            ];
            
            const allTasks = [...week1Tasks, ...week2Tasks];
            this.mockStorage.setItem('tasks', JSON.stringify(allTasks));
            
            // Step 4: Calculate statistics for week 2
            const week2Stats = this.calculateWeekStatistics('2024-01-22');
            
            if (week2Stats.total_tasks !== 2) {
                throw new Error(`Expected 2 tasks in week 2, got ${week2Stats.total_tasks}`);
            }
            
            if (week2Stats.completed_tasks !== 2) {
                throw new Error(`Expected 2 completed tasks in week 2, got ${week2Stats.completed_tasks}`);
            }
            
            // Step 5: Verify week 1 statistics are still correct
            const week1StatsAfterMove = this.calculateWeekStatistics('2024-01-15');
            if (week1StatsAfterMove.total_tasks !== 2) {
                throw new Error('Week 1 statistics changed after moving to week 2');
            }
            
            this.addTestResult(testName, true, 'Week move and statistics display working correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Helper: Calculate statistics for a given week
     */
    calculateWeekStatistics(weekStartDate) {
        const tasks = JSON.parse(this.mockStorage.getItem('tasks') || '[]');
        
        // Parse week start date
        const [year, month, day] = weekStartDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekStartStr = this.formatDate(weekStart);
        const weekEndStr = this.formatDate(weekEnd);
        
        // Filter tasks for this week
        const weekTasks = tasks.filter(t => 
            t.assigned_date && 
            t.assigned_date >= weekStartStr && 
            t.assigned_date <= weekEndStr
        );
        
        const completedTasks = weekTasks.filter(t => t.completed);
        const totalEstimatedTime = weekTasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
        const totalActualTime = weekTasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        return {
            week_start: weekStartStr,
            total_tasks: weekTasks.length,
            completed_tasks: completedTasks.length,
            completion_rate: weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0,
            total_estimated_time: totalEstimatedTime,
            total_actual_time: totalActualTime
        };
    }

    /**
     * Helper: Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Add test result
     */
    addTestResult(testName, passed, details = '') {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
    }

    /**
     * Print test summary
     */
    printSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = total - passed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        
        console.log('\n=== Test Summary ===');
        console.log(`Total: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${rate}%\n`);
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} - ${result.name}`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
        });
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTestSuite;
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const suite = new IntegrationTestSuite();
    suite.runAllTests();
}
