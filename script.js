// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';

let tasks = loadTasks();
let settings = loadSettings();


/**
 * Load settings from localStorage, providing defaults if empty.
 * @returns {object}
 */
function loadSettings() {
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return settingsJson ? JSON.parse(settingsJson) : { ideal_daily_minutes: 480 }; // Default to 8 hours
}

/**
 * Save settings to localStorage.
 */
function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Load tasks from localStorage, adding sample data if it's empty.
 * @returns {object[]}
 */
function loadTasks() {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    let tasksData = [];
    if (!tasksJson || JSON.parse(tasksJson).length === 0) {
        // Provide sample tasks if storage is empty
        tasksData = [
            { id: `task-${Date.now()+1}`, name: "D&D機能を実装する", estimated_time: 8, assigned_date: null, details: "タスクをドラッグ＆ドロップで移動できるようにする", completed: false },
            { id: `task-${Date.now()+2}`, name: "UIを修正する", estimated_time: 5, assigned_date: getNextDate(1), details: "新しいレイアウトを適用する", completed: false },
            { id: `task-${Date.now()+3}`, name: "バグを修正する", estimated_time: 3, assigned_date: getNextDate(2), details: "報告されたバグを調査・修正", completed: true },
        ];
    } else {
        tasksData = JSON.parse(tasksJson);
    }
    // Ensure all tasks have a 'completed' property for backward compatibility
    return tasksData.map(task => ({ ...task, completed: task.completed || false }));
}

/**
 * Helper to get a future date string in YYYY-MM-DD format.
 * @param {number} daysToAdd - Number of days to add to today.
 * @returns {string}
 */
function getNextDate(daysToAdd) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}


/**
 * Save tasks to localStorage.
 */
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

// --- D&D Handlers (Global Scope) ---

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const targetColumn = e.target.closest('.day-column');
    if (targetColumn) {
        targetColumn.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetColumn = e.target.closest('.day-column');
    if (targetColumn) {
        targetColumn.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetColumn = e.target.closest('.day-column');
    if (!targetColumn) return;

    targetColumn.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    const newDate = targetColumn.dataset.date === "null" ? null : targetColumn.dataset.date;

    const task = tasks.find(t => t.id == taskId);
    if (task) {
        task.assigned_date = newDate;
        saveTasks();
        // Re-render the entire week to reflect the change
        // Access the render function attached to the body
        if(document.body.renderWeek) document.body.renderWeek();
    }
}


// --- Date and Rendering Logic ---

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string}
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Moves incomplete tasks from past weeks to the unassigned list.
 */
function carryOverOldTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day
    const todayStr = formatDate(today);

    let tasksModified = false;
    tasks.forEach(task => {
        if (task.assigned_date && task.assigned_date < todayStr && !task.completed) {
            task.assigned_date = null;
            tasksModified = true;
        }
    });

    if (tasksModified) {
        console.log("Carried over incomplete tasks from previous weeks.");
        saveTasks();
    }
}


// --- Main Application Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selections ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const estimatedTimeInput = document.getElementById('estimated-time');
    const taskDateInput = document.getElementById('task-date');
    const taskDetailsInput = document.getElementById('task-details');

    const prevWeekBtn = document.getElementById('prev-week');
    const todayBtn = document.getElementById('today');
    const nextWeekBtn = document.getElementById('next-week');
    const weekTitle = document.getElementById('week-title');
    const dayColumns = Array.from(document.querySelectorAll('#task-board .day-column'));
    const unassignedColumn = document.getElementById('unassigned-tasks');
    const idealDailyMinutesInput = document.getElementById('ideal-daily-minutes');

    let currentDate = new Date();
    let editingTaskId = null;

    // --- Initial Load ---
    carryOverOldTasks(); // Carry over tasks before the first render

    // --- Modal Logic ---
    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        taskForm.reset();
        taskForm.querySelector('button').textContent = '登録';
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    function openEditModal(task) {
        editingTaskId = task.id;
        taskNameInput.value = task.name;
        estimatedTimeInput.value = task.estimated_time;
        taskDateInput.value = task.assigned_date;
        taskDetailsInput.value = task.details || '';
        taskForm.querySelector('button').textContent = '更新';
        modal.style.display = 'block';
    }


    // --- Form Submission Logic ---
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const taskData = {
            name: taskNameInput.value,
            estimated_time: parseFloat(estimatedTimeInput.value),
            assigned_date: taskDateInput.value,
            details: taskDetailsInput.value,
        };

        if (editingTaskId) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex > -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            }
        } else {
            const newTask = {
                id: `task-${Date.now()}`,
                completed: false, // Set default completed status
                ...taskData
            };
            tasks.push(newTask);
        }

        saveTasks();
        renderWeek();
        modal.style.display = 'none';
        taskForm.reset();
    });

    // --- Date and Rendering Logic ---
    function getMonday(d) {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }


    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        taskElement.dataset.taskId = task.id;
        taskElement.draggable = true;

        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-name">${task.name}</div>
            <div class="task-time">${task.estimated_time}h</div>
        `;

        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from opening the modal
            task.completed = e.target.checked;
            saveTasks();
            renderWeek(); // Re-render to apply style changes immediately
        });

        taskElement.addEventListener('click', () => openEditModal(task));
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);

        return taskElement;
    }

    function addDragAndDropListeners() {
        const allColumns = document.querySelectorAll('.day-column');
        allColumns.forEach(col => {
            col.addEventListener('dragover', handleDragOver);
            col.addEventListener('dragleave', handleDragLeave);
            col.addEventListener('drop', handleDrop);
        });
    }

    function renderWeek() {
        const monday = getMonday(currentDate);
        monday.setHours(0, 0, 0, 0);

        // Clear all task elements and reset daily totals
        dayColumns.forEach(col => {
            col.querySelectorAll('.task').forEach(task => task.remove());
            const totalTimeEl = col.querySelector('.daily-total-time');
            if (totalTimeEl) {
                totalTimeEl.textContent = '';
                totalTimeEl.classList.remove('overload');
            }
        });
        unassignedColumn.querySelector('#unassigned-list').innerHTML = '';

        const weekDates = [];
        const dailyTotals = {}; // { 'YYYY-MM-DD': totalMinutes }

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = formatDate(date);
            weekDates.push(date);
            dailyTotals[dateStr] = 0;
        }

        const startOfWeek = weekDates[0];
        const endOfWeek = weekDates[6];
        weekTitle.textContent = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

        const startOfWeekStr = formatDate(startOfWeek);
        const endOfWeekStr = formatDate(endOfWeek);

        // Place tasks and calculate totals
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr) {
                const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
                if (column) {
                    column.appendChild(taskElement);
                    // Add estimated time (in hours) to the daily total (in minutes)
                    dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
                }
            } else {
                // If the task is not in the current week, it goes to unassigned
                unassignedColumn.querySelector('#unassigned-list').appendChild(taskElement);
            }
        });

        // Update DOM with daily totals and check for overload
        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);
            const totalMinutes = dailyTotals[dateStr];

            const h3 = column.querySelector('h3');
            // Ensure the h3 content doesn't get duplicated
            h3.innerHTML = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()}) <span class="daily-total-time"></span>`;

            const totalTimeEl = column.querySelector('.daily-total-time');
            if (totalTimeEl) {
                if (totalMinutes > 0) {
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    totalTimeEl.textContent = `(${hours}h ${minutes}m)`;
                } else {
                    totalTimeEl.textContent = '(0h 0m)';
                }

                if (totalMinutes > settings.ideal_daily_minutes) {
                    totalTimeEl.classList.add('overload');
                }
            }
            column.dataset.date = dateStr;
        });

        unassignedColumn.dataset.date = "null";
        addDragAndDropListeners();
    }

    // Attach renderWeek to the body so it can be called from the global handleDrop function
    document.body.renderWeek = renderWeek;

    // --- Navigation Event Listeners ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek();
    });
    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek();
    });
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderWeek();
    });

    // --- Settings Event Listener ---
    idealDailyMinutesInput.value = settings.ideal_daily_minutes;
    idealDailyMinutesInput.addEventListener('change', () => {
        const newIdealTime = parseInt(idealDailyMinutesInput.value, 10);
        if (!isNaN(newIdealTime) && newIdealTime > 0) {
            settings.ideal_daily_minutes = newIdealTime;
            saveSettings();
            renderWeek(); // Re-render to apply new overload limits
        }
    });

    // --- Initial Render ---
    renderWeek();
});