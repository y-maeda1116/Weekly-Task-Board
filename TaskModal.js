/**
 * Task Modal Module
 * Type-safe task modal form handling
 * Standalone version with no external dependencies
 */
/**
 * Logger class
 */
class HybridLogger {
    info(message, ...args) {
        console.log(`[TaskModal] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[TaskModal] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[TaskModal] ${message}`, ...args);
    }
}
const logger = new HybridLogger();
/**
 * Global modal state
 */
const modalState = {
    isOpen: false,
    currentTaskId: null,
    isEditMode: false,
    mode: 'create'
};
const elements = {
    modal: null,
    form: null,
    taskName: null,
    estimatedTime: null,
    actualTime: null,
    priority: null,
    category: null,
    date: null,
    dueDate: null,
    dueTimePeriod: null,
    dueHour: null,
    details: null,
    isRecurring: null,
    recurrenceOptions: null,
    recurrencePattern: null,
    recurrenceEndDate: null,
    duplicateBtn: null,
    saveAsTemplateBtn: null,
    closeModalBtns: null
};
/**
 * Initialize modal elements
 */
function initializeElements() {
    elements.modal = document.getElementById('task-modal');
    elements.form = document.getElementById('task-form');
    elements.taskName = document.getElementById('task-name');
    elements.estimatedTime = document.getElementById('estimated-time');
    elements.actualTime = document.getElementById('actual-time');
    elements.priority = document.getElementById('task-priority');
    elements.category = document.getElementById('task-category');
    elements.date = document.getElementById('task-date');
    elements.dueDate = document.getElementById('due-date');
    elements.dueTimePeriod = document.getElementById('due-time-period');
    elements.dueHour = document.getElementById('due-hour');
    elements.details = document.getElementById('task-details');
    elements.isRecurring = document.getElementById('is-recurring');
    elements.recurrenceOptions = document.getElementById('recurrence-options');
    elements.recurrencePattern = document.getElementById('recurrence-pattern');
    elements.recurrenceEndDate = document.getElementById('recurrence-end-date');
    elements.duplicateBtn = document.getElementById('duplicate-task-btn');
    elements.saveAsTemplateBtn = document.getElementById('save-as-template-btn');
    elements.closeModalBtns = document.querySelectorAll('.close-btn');
    const criticalElements = [
        elements.modal,
        elements.form,
        elements.taskName,
        elements.estimatedTime,
        elements.priority,
        elements.category,
        elements.date
    ];
    const missingElements = criticalElements.filter(el => el === null);
    if (missingElements.length > 0) {
        logger.warn(`Missing critical modal elements: ${missingElements.length}`);
    }
    return missingElements.length === 0;
}
/**
 * Show modal
 */
function showModal() {
    if (elements.modal) {
        elements.modal.style.display = 'block';
        modalState.isOpen = true;
    }
}
/**
 * Hide modal
 */
function hideModal() {
    if (elements.modal) {
        elements.modal.style.display = 'none';
        modalState.isOpen = false;
        modalState.currentTaskId = null;
        modalState.isEditMode = false;
    }
}
/**
 * Open modal for creating new task
 */
function openCreateModal(date) {
    modalState.mode = 'create';
    modalState.isEditMode = false;
    modalState.currentTaskId = null;
    resetForm();
    if (elements.date) {
        elements.date.value = date || formatDate(new Date());
    }
    // Hide edit-only buttons
    if (elements.duplicateBtn) {
        elements.duplicateBtn.style.display = 'none';
    }
    if (elements.saveAsTemplateBtn) {
        elements.saveAsTemplateBtn.style.display = 'none';
    }
    showModal();
    focusFirstInput();
    logger.info('Opened create task modal');
}
/**
 * Open modal for editing existing task
 */
function openEditModal(taskId) {
    modalState.mode = 'edit';
    modalState.isEditMode = true;
    modalState.currentTaskId = taskId;
    loadTaskIntoForm(taskId);
    // Show edit-only buttons
    if (elements.duplicateBtn) {
        elements.duplicateBtn.style.display = 'inline-block';
    }
    if (elements.saveAsTemplateBtn) {
        elements.saveAsTemplateBtn.style.display = 'inline-block';
    }
    showModal();
    logger.info(`Opened edit task modal: ${taskId}`);
}
/**
 * Reset form to default state
 */
function resetForm() {
    if (elements.form) {
        elements.form.reset();
    }
    // Reset actual time to 0
    if (elements.actualTime) {
        elements.actualTime.value = '0';
    }
    // Hide recurrence options
    if (elements.recurrenceOptions) {
        elements.recurrenceOptions.style.display = 'none';
    }
    // Reset recurrence select
    if (elements.recurrencePattern) {
        elements.recurrencePattern.value = '';
    }
    // Reset recurrence end date
    if (elements.recurrenceEndDate) {
        elements.recurrenceEndDate.value = '';
    }
    // Reset due hour select
    if (elements.dueHour) {
        elements.dueHour.value = '';
    }
}
/**
 * Load task data into form
 */
function loadTaskIntoForm(taskId) {
    // Use existing script.js to load task data
    const taskData = getTaskDataFromScript(taskId);
    if (!taskData) {
        logger.warn(`Task not found: ${taskId}`);
        return;
    }
    if (elements.taskName) {
        elements.taskName.value = taskData.name || '';
    }
    if (elements.estimatedTime) {
        elements.estimatedTime.value = String(taskData.estimated_time || 0);
    }
    if (elements.actualTime) {
        elements.actualTime.value = String(taskData.actual_time || 0);
    }
    if (elements.priority) {
        elements.priority.value = taskData.priority || 'medium';
    }
    if (elements.category) {
        elements.category.value = taskData.category || 'task';
    }
    if (elements.date) {
        elements.date.value = taskData.date || formatDate(new Date());
    }
    if (elements.dueDate) {
        elements.dueDate.value = taskData.due_date || '';
    }
    if (elements.dueTimePeriod) {
        elements.dueTimePeriod.value = taskData.due_time_period || '';
    }
    if (elements.dueHour) {
        elements.dueHour.value = taskData.due_hour ? String(taskData.due_hour) : '';
    }
    if (elements.details) {
        elements.details.value = taskData.details || '';
    }
    // Handle recurrence
    if (elements.isRecurring) {
        elements.isRecurring.checked = taskData.is_recurring || false;
        if (elements.recurrenceOptions) {
            elements.recurrenceOptions.style.display = taskData.is_recurring ? 'block' : 'none';
        }
    }
    if (elements.recurrencePattern) {
        elements.recurrencePattern.value = taskData.recurrence_pattern || '';
    }
    if (elements.recurrenceEndDate) {
        elements.recurrenceEndDate.value = taskData.recurrence_end_date || '';
    }
}
/**
 * Get task data from existing script.js
 * This is a fallback - in full migration, would use TaskOperations
 */
function getTaskDataFromScript(taskId) {
    // Try to get task from HybridTaskOperations if available
    if (window.HybridTaskOperations && window.HybridTaskOperations.findTaskById) {
        return window.HybridTaskOperations.findTaskById(taskId);
    }
    // Fallback to existing tasks variable from script.js
    if (window.tasks) {
        return window.tasks.find((t) => t.id === taskId);
    }
    logger.warn('Could not access task data from existing script.js');
    return null;
}
/**
 * Get form data as object
 */
function getFormData() {
    return {
        name: elements.taskName?.value || '',
        estimated_time: parseFloat(elements.estimatedTime?.value || '0'),
        actual_time: parseFloat(elements.actualTime?.value || '0'),
        priority: elements.priority?.value || 'medium',
        category: elements.category?.value || 'task',
        date: elements.date?.value || formatDate(new Date()),
        due_date: elements.dueDate?.value || null,
        due_time_period: elements.dueTimePeriod?.value || null,
        due_hour: elements.dueHour?.value ? parseInt(elements.dueHour?.value) : null,
        details: elements.details?.value || '',
        is_recurring: elements.isRecurring?.checked || false,
        recurrence_pattern: elements.recurrencePattern?.value || null,
        recurrence_end_date: elements.recurrenceEndDate?.value || null
    };
}
/**
 * Validate form data
 */
function validateFormData(formData) {
    const errors = [];
    if (!formData.name || formData.name.trim().length === 0) {
        errors.push('タスク名を入力してください');
    }
    if (formData.estimated_time <= 0) {
        errors.push('見積もり時間は0より大きい値を入力してください');
    }
    if (formData.actual_time < 0) {
        errors.push('実績時間は0以上の値を入力してください');
    }
    if (formData.estimated_time < formData.actual_time) {
        errors.push('実績時間は見積もり時間を超えることはできません');
    }
    // Validate recurrence settings
    if (formData.is_recurring && !formData.recurrence_pattern) {
        errors.push('繰り返しパターンを選択してください');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Handle form submission
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const formData = getFormData();
    const validation = validateFormData(formData);
    if (!validation.isValid) {
        logger.warn('Form validation failed:', validation.errors);
        alert(validation.errors.join('\n'));
        return;
    }
    if (modalState.mode === 'create') {
        createNewTask(formData);
    }
    else {
        updateExistingTask(modalState.currentTaskId, formData);
    }
}
/**
 * Create new task from form data
 */
function createNewTask(formData) {
    // Use HybridTaskOperations if available
    if (window.HybridTaskOperations && window.HybridTaskOperations.createTask) {
        const newTask = window.HybridTaskOperations.createTask(formData);
        if (window.HybridTaskOperations.addTask) {
            window.HybridTaskOperations.addTask(newTask);
            hideModal();
            logger.info('Task created successfully');
            // Trigger UI refresh
            if (window.renderWeek) {
                window.renderWeek();
            }
        }
    }
    else {
        // Fallback: let existing script.js handle it
        logger.info('Delegating task creation to existing script.js');
        hideModal();
    }
}
/**
 * Update existing task from form data
 */
function updateExistingTask(taskId, formData) {
    // Use HybridTaskOperations if available
    if (window.HybridTaskOperations && window.HybridTaskOperations.updateTask) {
        window.HybridTaskOperations.updateTask(taskId, formData);
        hideModal();
        logger.info(`Task updated successfully: ${taskId}`);
        // Trigger UI refresh
        if (window.renderWeek) {
            window.renderWeek();
        }
    }
    else {
        // Fallback: let existing script.js handle it
        logger.info('Delegating task update to existing script.js');
        hideModal();
    }
}
/**
 * Handle duplicate task
 */
function handleDuplicateTask() {
    if (!modalState.currentTaskId) {
        return;
    }
    if (window.HybridTaskOperations && window.HybridTaskOperations.duplicateTask) {
        const newTask = window.HybridTaskOperations.duplicateTask(modalState.currentTaskId);
        if (newTask) {
            hideModal();
            logger.info('Task duplicated successfully');
            // Trigger UI refresh
            if (window.renderWeek) {
                window.renderWeek();
            }
        }
    }
    else {
        logger.info('Delegating task duplication to existing script.js');
    }
}
/**
 * Handle save as template
 */
function handleSaveAsTemplate() {
    if (!modalState.currentTaskId) {
        return;
    }
    if (window.HybridTaskOperations && window.HybridTaskOperations.findTaskById) {
        const task = window.HybridTaskOperations.findTaskById(modalState.currentTaskId);
        if (task && window.HybridTaskOperations.saveAsTemplate) {
            window.HybridTaskOperations.saveAsTemplate(task);
            logger.info('Template saved successfully');
            // Open template panel
            if (window.toggleTemplatePanel) {
                window.toggleTemplatePanel();
            }
        }
    }
    else {
        logger.info('Delegating template save to existing script.js');
    }
}
/**
 * Handle recurrence checkbox change
 */
function handleRecurrenceChange(event) {
    const isChecked = event.target.checked;
    if (elements.recurrenceOptions) {
        elements.recurrenceOptions.style.display = isChecked ? 'block' : 'none';
    }
}
/**
 * Handle due time period change
 */
function handleDueTimePeriodChange(event) {
    const value = event.target.value;
    if (elements.dueHour) {
        elements.dueHour.style.display = value ? 'inline-block' : 'none';
    }
}
/**
 * Focus first input field
 */
function focusFirstInput() {
    if (elements.taskName) {
        elements.taskName.focus();
    }
}
/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * Initialize modal
 */
function initializeModal() {
    const success = initializeElements();
    if (success && elements.form) {
        // Form submit handler
        elements.form.addEventListener('submit', handleFormSubmit);
        // Recurrence checkbox handler
        if (elements.isRecurring) {
            elements.isRecurring.addEventListener('change', handleRecurrenceChange);
        }
        // Due time period handler
        if (elements.dueTimePeriod) {
            elements.dueTimePeriod.addEventListener('change', handleDueTimePeriodChange);
        }
        // Duplicate button handler
        if (elements.duplicateBtn) {
            elements.duplicateBtn.addEventListener('click', handleDuplicateTask);
        }
        // Save as template button handler
        if (elements.saveAsTemplateBtn) {
            elements.saveAsTemplateBtn.addEventListener('click', handleSaveAsTemplate);
        }
        // Close button handlers
        if (elements.closeModalBtns) {
            elements.closeModalBtns.forEach(btn => {
                btn.addEventListener('click', hideModal);
            });
        }
        // Close modal on outside click
        if (elements.modal) {
            elements.modal.addEventListener('click', (event) => {
                if (event.target === elements.modal) {
                    hideModal();
                }
            });
        }
        // Close modal on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modalState.isOpen) {
                hideModal();
            }
        });
    }
    return success;
}
/**
 * Public API
 */
export const TaskModal = {
    // Modal control
    openCreateModal,
    openEditModal,
    closeModal: hideModal,
    // Form data
    getFormData,
    validateFormData,
    resetForm,
    // State
    getState: () => ({ ...modalState }),
    isModalOpen: () => modalState.isOpen,
    getMode: () => modalState.mode,
    // Initialization
    initializeModal
};
// Expose to window for use by existing script.js
window.HybridTaskModal = TaskModal;
console.log('Hybrid task modal module loaded');
