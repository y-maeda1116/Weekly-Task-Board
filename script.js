// --- Data Structures ---

/**
 * Task Object
 * @typedef {object} Task
 * @property {number} id - Unique identifier for the task
 * @property {string} name - Name of the task
 * @property {number} estimated_time - Estimated time to complete the task in hours
 * @property {string} assigned_date - Date the task is assigned to (YYYY-MM-DD)
 */

/**
 * User Settings Object
 * @typedef {object} UserSettings
 * @property {number} ideal_work_hours_per_day - Ideal work hours per day
 */

// --- LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';

/**
 * Load tasks from localStorage.
 * @returns {Task[]}
 */
function loadTasks() {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
}

/**
 * Save tasks to localStorage.
 * @param {Task[]} tasks - The tasks to save.
 */
function saveTasks(tasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Load user settings from localStorage.
 * @returns {UserSettings}
 */
function loadSettings() {
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const defaultSettings = { ideal_work_hours_per_day: 8 };
    return settingsJson ? JSON.parse(settingsJson) : defaultSettings;
}

/**
 * Save user settings to localStorage.
 * @param {UserSettings} settings - The settings to save.
 */
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// --- Initialization ---

let tasks = [];
let userSettings = {};

document.addEventListener('DOMContentLoaded', () => {
    tasks = loadTasks();
    userSettings = loadSettings();
    // TODO: Add rendering logic here
    console.log('Tasks loaded:', tasks);
    console.log('Settings loaded:', userSettings);
});