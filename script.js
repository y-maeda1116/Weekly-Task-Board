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

// --- DOM Elements ---
const weekDaysContainer = document.getElementById('week-days');
const unassignedList = document.getElementById('unassigned-list');

// --- Rendering Functions ---

/**
 * Renders the entire task board.
 */
function renderBoard() {
    // Clear existing content
    weekDaysContainer.innerHTML = '';
    unassignedList.innerHTML = '';

    // Create day columns
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateString = day.toISOString().split('T')[0]; // YYYY-MM-DD

        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.dataset.date = dateString;

        dayColumn.innerHTML = `
            <h3>${days[i]} (${day.getMonth() + 1}/${day.getDate()})</h3>
            <div class="task-list" data-date="${dateString}"></div>
        `;
        weekDaysContainer.appendChild(dayColumn);
    }

    // Render tasks
    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        if (task.assigned_date) {
            const dayContainer = weekDaysContainer.querySelector(`.task-list[data-date="${task.assigned_date}"]`);
            if (dayContainer) {
                dayContainer.appendChild(taskCard);
            } else {
                 // If the task is assigned to a date not in the current week, add to unassigned
                unassignedList.appendChild(taskCard);
            }
        } else {
            unassignedList.appendChild(taskCard);
        }
    });

    // Add D&D listeners to the newly created lists
    addDragAndDropListeners();
}

/**
 * Creates a task card element.
 * @param {Task} task - The task object.
 * @returns {HTMLElement}
 */
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;

    card.innerHTML = `
        <div class="task-name">${task.name}</div>
        <div class="task-time">${task.estimated_time}h</div>
    `;

    // Add D&D event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

// --- D&D Handlers ---

function handleDragStart(e) {
    // Set the data to be transferred (the task ID)
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    // Add a class to the dragged element for visual feedback
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
}

function handleDragEnd(e) {
    // Clean up the visual feedback class
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    // Prevent the default behavior to allow dropping
    e.preventDefault();
    const targetList = e.target.closest('.task-list');
    if (targetList) {
        targetList.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetList = e.target.closest('.task-list');
    if (targetList) {
        targetList.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetList = e.target.closest('.task-list');
    if (!targetList) return;

    targetList.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    const newDate = targetList.dataset.date || null; // null for unassigned

    // Update task data
    const task = tasks.find(t => t.id == taskId);
    if (task) {
        task.assigned_date = newDate;
        saveTasks(tasks);
        renderBoard(); // Re-render the board to reflect the change
    }
}

// --- Event Listener Setup ---

/**
 * Adds D&D event listeners to all task lists.
 */
function addDragAndDropListeners() {
    const allTaskLists = document.querySelectorAll('.task-list');
    allTaskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('dragleave', handleDragLeave);
        list.addEventListener('drop', handleDrop);
    });
}


// --- Initialization ---

/**
 * Adds sample data if the board is empty.
 */
function addSampleDataIfEmpty() {
    if (loadTasks().length === 0) {
        const sampleTasks = [
            { id: 1, name: "Design UI mockups", estimated_time: 4, assigned_date: null },
            { id: 2, name: "Develop API endpoints", estimated_time: 8, assigned_date: new Date().toISOString().split('T')[0] },
            { id: 3, name: "Setup database", estimated_time: 6, assigned_date: null },
            { id: 4, name: "Write documentation", estimated_time: 3, assigned_date: getNextDate(1) },
            { id: 5, name: "Test feature A", estimated_time: 5, assigned_date: getNextDate(2) },
            { id: 6, name: "Deploy to staging", estimated_time: 2, assigned_date: getNextDate(4) },
        ];
        saveTasks(sampleTasks);
    }
}

/**
 * Helper to get a future date string.
 * @param {number} daysToAdd - Number of days to add to today.
 * @returns {string}
 */
function getNextDate(daysToAdd) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
}


let tasks = [];
let userSettings = {};

document.addEventListener('DOMContentLoaded', () => {
    addSampleDataIfEmpty();
    tasks = loadTasks();
    userSettings = loadSettings();
    renderBoard();
});