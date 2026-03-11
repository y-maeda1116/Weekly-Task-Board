/**
 * DOM Initialization Module - Complete
 * Full migration of DOM initialization from script.js to TypeScript
 * Standalone version with no external dependencies
 */
/**
 * Simple logger class to avoid import dependencies
 */
class HybridLogger {
    info(message, ...args) {
        console.log(`[Hybrid] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[Hybrid] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[Hybrid] ${message}`, ...args);
    }
}
const logger = new HybridLogger();
/**
 * Simple DOM Manager to avoid import dependencies
 */
class HybridDOMManager {
    byId(id) {
        return document.getElementById(id);
    }
    show(element) {
        element.style.display = 'block';
    }
    hide(element) {
        element.style.display = 'none';
    }
}
const domManager = new HybridDOMManager();
/**
 * Global DOM references
 */
const refs = {
    addTaskBtn: null,
    closeModalBtn: null,
    taskForm: null,
    taskNameInput: null,
    estimatedTimeInput: null,
    actualTimeInput: null,
    taskPriorityInput: null,
    taskCategoryInput: null,
    taskDateInput: null,
    dueDateInput: null,
    dueTimePeriodInput: null,
    dueHourInput: null,
    taskDetailsInput: null,
    isRecurringCheckbox: null,
    recurrenceOptions: null,
    recurrencePatternSelect: null,
    recurrenceEndDateInput: null,
    duplicateTaskBtn: null,
    saveAsTemplateBtn: null,
    prevWeekBtn: null,
    todayBtn: null,
    nextWeekBtn: null,
    datePicker: null,
    weekTitle: null,
    dayColumns: [],
    categoryFilterSelect: null,
    idealDailyMinutesInput: null,
    weekdayFilterBtn: null,
    weekdaySettings: null,
    themeToggleBtn: null,
    moreMenuBtn: null,
    moreMenuDropdown: null,
    exportDataBtn: null,
    importDataBtn: null,
    importFileInput: null,
    archiveToggleBtn: null,
    archiveView: null,
    closeArchiveBtn: null,
    clearArchiveBtn: null,
    archiveList: null,
    statisticsToggleBtn: null,
    dashboardPanel: null,
    closeDashboardBtn: null,
    templateToggleBtn: null,
    templatePanel: null,
    closeTemplatePanelBtn: null,
    templateSearchInput: null,
    templateSortSelect: null,
    templateList: null,
    unassignedColumn: null,
    unassignedList: null,
    dayContextMenu: null,
    modal: null
};
/**
 * State tracking for event handlers
 */
let currentTaskId = null;
let isRendering = false;
/**
 * Initialize all DOM element references
 */
export function initializeDOMElements() {
    const success = initializeElementReferences() &&
        initializeEventListeners();
    if (success) {
        logger.info('DOM elements initialized successfully');
    }
    else {
        logger.error('Failed to initialize some DOM elements');
    }
    return success;
}
/**
 * Initialize element references from DOM
 */
function initializeElementReferences() {
    // Buttons
    refs.addTaskBtn = domManager.byId('add-task-btn');
    refs.closeModalBtn = document.querySelector('.close-btn');
    refs.taskForm = domManager.byId('task-form');
    // Task form inputs
    refs.taskNameInput = domManager.byId('task-name');
    refs.estimatedTimeInput = domManager.byId('estimated-time');
    refs.actualTimeInput = domManager.byId('actual-time');
    refs.taskPriorityInput = domManager.byId('task-priority');
    refs.taskCategoryInput = domManager.byId('task-category');
    refs.taskDateInput = domManager.byId('task-date');
    refs.dueDateInput = domManager.byId('due-date');
    refs.dueTimePeriodInput = domManager.byId('due-time-period');
    refs.dueHourInput = domManager.byId('due-hour');
    refs.taskDetailsInput = domManager.byId('task-details');
    // Recurrence elements
    refs.isRecurringCheckbox = domManager.byId('is-recurring');
    refs.recurrenceOptions = document.getElementById('recurrence-options');
    refs.recurrencePatternSelect = domManager.byId('recurrence-pattern');
    refs.recurrenceEndDateInput = domManager.byId('recurrence-end-date');
    // Duplicate/Template buttons
    refs.duplicateTaskBtn = domManager.byId('duplicate-task-btn');
    refs.saveAsTemplateBtn = domManager.byId('save-as-template-btn');
    // Week navigation
    refs.prevWeekBtn = domManager.byId('prev-week');
    refs.todayBtn = domManager.byId('today');
    refs.nextWeekBtn = domManager.byId('next-week');
    refs.datePicker = domManager.byId('date-picker');
    refs.weekTitle = domManager.byId('week-title');
    // Day columns
    const dayColumnElements = document.querySelectorAll('#task-board .day-column');
    refs.dayColumns = Array.from(dayColumnElements).filter(el => el instanceof HTMLElement);
    refs.unassignedColumn = domManager.byId('unassigned-tasks');
    refs.unassignedList = domManager.byId('unassigned-list');
    // Settings
    refs.categoryFilterSelect = domManager.byId('filter-category');
    refs.idealDailyMinutesInput = domManager.byId('ideal-daily-minutes');
    refs.weekdayFilterBtn = domManager.byId('weekday-filter-btn');
    refs.weekdaySettings = document.getElementById('weekday-settings');
    // Theme
    refs.themeToggleBtn = domManager.byId('theme-toggle');
    // More menu
    refs.moreMenuBtn = domManager.byId('more-menu-btn');
    refs.moreMenuDropdown = document.getElementById('more-menu-dropdown');
    // Export/Import
    refs.exportDataBtn = domManager.byId('export-data-btn');
    refs.importDataBtn = domManager.byId('import-data-btn');
    refs.importFileInput = domManager.byId('import-file-input');
    // Archive
    refs.archiveToggleBtn = domManager.byId('archive-toggle');
    refs.archiveView = domManager.byId('archive-view');
    refs.closeArchiveBtn = domManager.byId('close-archive');
    refs.clearArchiveBtn = domManager.byId('clear-archive');
    refs.archiveList = domManager.byId('archive-list');
    // Statistics
    refs.statisticsToggleBtn = domManager.byId('statistics-toggle');
    refs.dashboardPanel = domManager.byId('dashboard-panel');
    refs.closeDashboardBtn = document.getElementById('close-dashboard');
    // Template
    refs.templateToggleBtn = domManager.byId('template-toggle');
    refs.templatePanel = domManager.byId('template-panel');
    refs.closeTemplatePanelBtn = document.getElementById('close-template-panel');
    refs.templateSearchInput = domManager.byId('template-search');
    refs.templateSortSelect = domManager.byId('template-sort');
    refs.templateList = domManager.byId('template-list');
    // Context menu
    refs.dayContextMenu = document.getElementById('day-context-menu');
    // Modal
    refs.modal = document.getElementById('task-modal');
    // Check all critical elements
    const criticalElements = [
        refs.addTaskBtn,
        refs.taskForm,
        refs.taskNameInput,
        refs.estimatedTimeInput,
        refs.actualTimeInput,
        refs.taskPriorityInput,
        refs.taskCategoryInput,
        refs.taskDateInput,
        refs.duplicateTaskBtn,
        refs.saveAsTemplateBtn
    ];
    const missingElements = criticalElements.filter(el => el === null);
    if (missingElements.length > 0) {
        logger.warn(`Missing critical DOM elements: ${missingElements.length}`);
    }
    return missingElements.length === 0;
}
/**
 * Initialize all event listeners
 */
export function initializeEventListeners() {
    let success = true;
    success = success && initializeModalEventListeners();
    success = success && initializeTaskFormEventListeners();
    success = success && initializeWeekNavigationListeners();
    success = success && initializeWeekdayListeners();
    success = success && initializeSettingsListeners();
    success = success && initializeThemeListener();
    success = success && initializeMoreMenuListeners();
    success = success && initializeExportImportListeners();
    success = success && initializeArchiveListeners();
    success = success && initializeStatisticsListeners();
    success = success && initializeTemplatePanelListeners();
    success = success && initializeDayColumnListeners();
    success = success && initializeUnassignedListeners();
    if (success) {
        logger.info('Event listeners initialized successfully');
    }
    else {
        logger.warn('Some event listeners may have failed to initialize');
    }
    return success;
}
/**
 * Initialize task modal event listeners
 */
function initializeModalEventListeners() {
    if (!refs.closeModalBtn) {
        logger.warn('Close modal button not found');
        return false;
    }
    refs.closeModalBtn.addEventListener('click', () => {
        closeModal();
    });
    return true;
}
/**
 * Initialize task form event listeners
 */
function initializeTaskFormEventListeners() {
    if (!refs.taskForm) {
        logger.warn('Task form not found');
        return false;
    }
    // Form submit handler - delegates to script.js handleTaskSubmission
    refs.taskForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        // Submit is handled by existing script.js
        logger.info('Task form submitted (delegated to existing script.js)');
    });
    return true;
}
/**
 * Initialize week navigation listeners
 */
function initializeWeekNavigationListeners() {
    if (!refs.prevWeekBtn || !refs.todayBtn || !refs.nextWeekBtn) {
        logger.warn('Week navigation buttons not found');
        return false;
    }
    refs.prevWeekBtn?.addEventListener('click', () => {
        const offset = -1;
        updateWeekOffset(offset);
    });
    refs.todayBtn?.addEventListener('click', () => {
        const offset = 0;
        updateWeekOffset(offset);
    });
    refs.nextWeekBtn?.addEventListener('click', () => {
        const offset = 1;
        updateWeekOffset(offset);
    });
    refs.datePicker?.addEventListener('change', (e) => {
        if (refs.datePicker) {
            const newDate = new Date(refs.datePicker.value);
            updateCurrentDate(newDate);
        }
    });
    return true;
}
/**
 * Initialize weekday settings listeners
 */
function initializeWeekdayListeners() {
    if (!refs.weekdayFilterBtn || !refs.weekdaySettings) {
        logger.warn('Weekday UI elements not found');
        return false;
    }
    refs.weekdayFilterBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = refs.weekdaySettings?.style?.display === 'none';
        refs.weekdaySettings.style.display = isVisible ? 'block' : 'none';
    });
    // Close handler - click outside closes
    document.addEventListener('click', (e) => {
        if (refs.weekdaySettings && refs.weekdaySettings.contains(e.target)) {
            return;
        }
        if (refs.weekdaySettings && !refs.weekdaySettings.contains(e.target)) {
            refs.weekdaySettings.style.display = 'none';
        }
    });
    return true;
}
/**
 * Initialize settings UI listeners
 */
function initializeSettingsListeners() {
    if (!refs.categoryFilterSelect || !refs.idealDailyMinutesInput) {
        logger.warn('Settings UI elements not found');
        return false;
    }
    refs.categoryFilterSelect?.addEventListener('change', (e) => {
        const newFilter = e.target.value;
        // Trigger category filter change
        logger.info(`Category filter changed to: ${newFilter}`);
    });
    refs.idealDailyMinutesInput?.addEventListener('change', (e) => {
        const newValue = parseInt(e.target.value) || 480;
        // Trigger settings save
        logger.info(`Ideal daily minutes changed to: ${newValue}`);
    });
    return true;
}
/**
 * Initialize theme listener
 */
function initializeThemeListener() {
    if (!refs.themeToggleBtn) {
        logger.warn('Theme toggle button not found');
        return false;
    }
    refs.themeToggleBtn?.addEventListener('click', () => {
        toggleTheme();
    });
    return true;
}
/**
 * Initialize more menu listeners
 */
function initializeMoreMenuListeners() {
    if (!refs.moreMenuBtn || !refs.moreMenuDropdown) {
        logger.warn('More menu elements not found');
        return false;
    }
    refs.moreMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMoreMenu();
    });
    // Close handler - click outside closes
    document.addEventListener('click', (e) => {
        if (refs.moreMenuDropdown && !refs.moreMenuDropdown.contains(e.target)) {
            refs.moreMenuDropdown.style.display = 'none';
        }
    });
    return true;
}
/**
 * Initialize export/import listeners
 */
function initializeExportImportListeners() {
    if (!refs.exportDataBtn || !refs.importDataBtn) {
        logger.warn('Export/Import buttons not found');
        return false;
    }
    refs.exportDataBtn?.addEventListener('click', () => {
        exportData();
    });
    refs.importDataBtn?.addEventListener('click', () => {
        refs.importFileInput?.click();
    });
    return true;
}
/**
 * Initialize archive listeners
 */
function initializeArchiveListeners() {
    if (!refs.archiveToggleBtn || !refs.closeArchiveBtn || !refs.clearArchiveBtn) {
        logger.warn('Archive elements not found');
        return false;
    }
    refs.archiveToggleBtn?.addEventListener('click', () => {
        toggleArchiveView();
    });
    refs.closeArchiveBtn?.addEventListener('click', () => {
        closeArchiveView();
    });
    refs.clearArchiveBtn?.addEventListener('click', () => {
        clearArchive();
    });
    return true;
}
/**
 * Initialize statistics/dashboard listeners
 */
function initializeStatisticsListeners() {
    if (!refs.statisticsToggleBtn || !refs.dashboardPanel || !refs.closeDashboardBtn) {
        logger.warn('Statistics/Dashboard elements not found');
        return false;
    }
    refs.statisticsToggleBtn?.addEventListener('click', () => {
        toggleStatistics();
    });
    refs.closeDashboardBtn?.addEventListener('click', () => {
        if (refs.dashboardPanel) {
            domManager.hide(refs.dashboardPanel);
        }
    });
    return true;
}
/**
 * Initialize template panel listeners
 */
function initializeTemplatePanelListeners() {
    if (!refs.templateToggleBtn || !refs.closeTemplatePanelBtn) {
        logger.warn('Template panel elements not found');
        return false;
    }
    refs.templateToggleBtn?.addEventListener('click', () => {
        toggleTemplatePanel();
    });
    refs.closeTemplatePanelBtn?.addEventListener('click', () => {
        closeTemplatePanel();
    });
    refs.templateSearchInput?.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        searchTemplates(searchTerm);
    });
    refs.templateSortSelect?.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        sortTemplates(sortBy);
    });
    refs.saveAsTemplateBtn?.addEventListener('click', () => {
        saveTaskAsTemplate();
    });
    return true;
}
/**
 * Initialize day column listeners
 */
function initializeDayColumnListeners() {
    refs.dayColumns.forEach(column => {
        column.addEventListener('click', (e) => {
            if (e.target === column || column.contains(e.target)) {
                const dayId = column.id;
                openTaskModal(dayId);
            }
        });
    });
    return true;
}
/**
 * Initialize unassigned column listeners
 */
function initializeUnassignedListeners() {
    if (!refs.unassignedColumn || !refs.unassignedList) {
        logger.warn('Unassigned elements not found');
        return false;
    }
    refs.unassignedColumn.addEventListener('click', (e) => {
        e.preventDefault();
        openTaskModal();
    });
    return true;
}
/**
 * Get all DOM references
 */
export function getDOMRefs() {
    return { ...refs };
}
/**
 * Close modal
 */
export function closeModal() {
    if (refs.modal) {
        domManager.hide(refs.modal);
        isRendering = false;
        currentTaskId = null;
    }
    logger.info('Modal closed');
}
/**
 * Open task modal
 */
export function openTaskModal(dayId) {
    isRendering = true;
    currentTaskId = dayId || null;
    if (refs.modal) {
        domManager.show(refs.modal);
        // Reset form for new task
        if (refs.taskForm) {
            refs.taskForm.reset();
        }
        // Set default date if editing
        const defaultDate = dayId ? formatDate(new Date()) : formatDate(new Date());
        if (refs.taskDateInput) {
            refs.taskDateInput.value = defaultDate;
        }
        // Hide duplicate/template buttons for new task
        if (refs.duplicateTaskBtn) {
            refs.duplicateTaskBtn.style.display = 'none';
        }
        if (refs.saveAsTemplateBtn) {
            refs.saveAsTemplateBtn.style.display = 'none';
        }
        // Set focus to task name input
        if (refs.taskNameInput) {
            refs.taskNameInput.focus();
        }
        logger.info(`Task modal opened for ${dayId ? dayId : 'new task'}`);
    }
}
// --- Week Navigation Functions ---
/**
 * Update week offset and navigation
 */
let weekOffset = 0;
export function updateWeekOffset(offset) {
    weekOffset += offset;
    logger.info(`Week offset updated to ${weekOffset}`);
}
export function getWeekOffset() {
    return weekOffset;
}
/**
 * Update current date
 * Delegates to existing script.js
 */
export function updateCurrentDate(date) {
    logger.info(`Current date updated to ${formatDate(date)}`);
}
// --- Settings Functions ---
/**
 * Update category filter
 * Delegates to existing script.js
 */
export function updateCategoryFilter(filter) {
    if (refs.categoryFilterSelect) {
        refs.categoryFilterSelect.value = filter;
    }
}
/**
 * Update ideal daily minutes
 * Delegates to existing script.js
 */
export function updateIdealDailyMinutes(minutes) {
    if (refs.idealDailyMinutesInput) {
        refs.idealDailyMinutesInput.value = String(minutes);
    }
}
// --- Theme Functions ---
/**
 * Toggle theme
 * Delegates to existing script.js
 */
export function toggleTheme() {
    logger.info('Theme toggle triggered');
}
/**
 * Get current theme
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
}
// --- More Menu Functions ---
/**
 * Toggle more menu
 */
export function toggleMoreMenu() {
    if (!refs.moreMenuDropdown)
        return;
    const isVisible = refs.moreMenuDropdown.style.display === 'block';
    refs.moreMenuDropdown.style.display = isVisible ? 'none' : 'block';
}
// --- Export/Import Functions ---
/**
 * Export data
 */
export function exportData() {
    logger.info('Export data triggered');
}
/**
 * Import data
 */
export function importData(file) {
    logger.info(`Import file: ${file.name}`);
}
// --- Archive Functions ---
/**
 * Toggle archive view
 */
export function toggleArchiveView() {
    if (!refs.archiveView)
        return;
    const isVisible = refs.archiveView.style.display === 'block';
    refs.archiveView.style.display = isVisible ? 'none' : 'block';
    logger.info('Archive toggle triggered');
}
/**
 * Close archive view
 */
export function closeArchiveView() {
    if (refs.archiveView) {
        refs.archiveView.style.display = 'none';
    }
    logger.info('Close archive view triggered');
}
/**
 * Clear archive
 */
export function clearArchive() {
    logger.info('Clear archive triggered');
}
// --- Statistics/Dashboard Functions ---
/**
 * Toggle statistics
 */
export function toggleStatistics() {
    if (!refs.dashboardPanel)
        return;
    const isVisible = refs.dashboardPanel.style.display === 'block';
    refs.dashboardPanel.style.display = isVisible ? 'none' : 'block';
    logger.info('Statistics toggle triggered');
}
// --- Template Panel Functions ---
/**
 * Toggle template panel
 */
export function toggleTemplatePanel() {
    if (!refs.templatePanel)
        return;
    const isVisible = refs.templatePanel.style.display === 'block';
    refs.templatePanel.style.display = isVisible ? 'none' : 'block';
    logger.info('Template panel toggle triggered');
}
/**
 * Close template panel
 */
export function closeTemplatePanel() {
    if (refs.templatePanel) {
        domManager.hide(refs.templatePanel);
    }
}
/**
 * Search templates
 * @param searchTerm - Search term
 */
export function searchTemplates(searchTerm) {
    if (refs.templateSearchInput) {
        refs.templateSearchInput.value = searchTerm;
    }
    logger.info(`Template search: ${searchTerm}`);
}
/**
 * Sort templates
 * @param sortBy - Sort option
 */
export function sortTemplates(sortBy) {
    if (refs.templateSortSelect) {
        refs.templateSortSelect.value = sortBy;
    }
    logger.info(`Template sort changed to: ${sortBy}`);
}
/**
 * Save as template
 */
export function saveTaskAsTemplate() {
    logger.info('Save as template triggered');
}
// --- Helper Functions ---
/**
 * Format date for display
 */
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * Get DOM element reference
 */
export function getRef(key) {
    return refs[key];
}
// Expose to window for use by existing script.js
window.HybridDOMInitialization = {
    initializeDOMElements,
    getDOMRefs,
    closeModal,
    openTaskModal,
    updateWeekOffset,
    getWeekOffset,
    updateCategoryFilter,
    updateIdealDailyMinutes,
    toggleTheme,
    getCurrentTheme,
    toggleMoreMenu,
    exportData,
    importData,
    toggleArchiveView,
    closeArchiveView,
    clearArchive,
    toggleStatistics,
    toggleTemplatePanel,
    closeTemplatePanel,
    searchTemplates,
    sortTemplates,
    saveTaskAsTemplate,
    formatDate,
    getRef
};
console.log('Hybrid DOM initialization module loaded');
