// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
let tasks = loadTasks();

/**
 * Load tasks from localStorage.
 * @returns {object[]}
 */
function loadTasks() {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
}

/**
 * Save tasks to localStorage.
 */
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}


// --- Main Application Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selections ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');

    const prevWeekBtn = document.getElementById('prev-week');
    const todayBtn = document.getElementById('today');
    const nextWeekBtn = document.getElementById('next-week');
    const weekTitle = document.getElementById('week-title');
    const dayColumns = document.querySelectorAll('.day-column');

    let currentDate = new Date();

    // --- Modal Logic ---
    addTaskBtn.addEventListener('click', () => {
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

    // --- Form Submission Logic ---
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newTask = {
            id: `task-${Date.now()}`,
            name: document.getElementById('task-name').value,
            estimated_time: parseFloat(document.getElementById('estimated-time').value),
            assigned_date: document.getElementById('task-date').value,
            details: document.getElementById('task-details').value
        };

        tasks.push(newTask);
        saveTasks();
        renderWeek(); // Re-render the week to show the new task
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

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function renderWeek() {
        const monday = getMonday(currentDate);
        monday.setHours(0, 0, 0, 0);

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            weekDates.push(date);
        }

        const startOfWeek = weekDates[0];
        const endOfWeek = weekDates[6];

        weekTitle.textContent = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];

        dayColumns.forEach((column, index) => {
            const cards = column.querySelectorAll('.task-card');
            cards.forEach(card => card.remove());

            const date = weekDates[index];
            const h3 = column.querySelector('h3');
            h3.textContent = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()})`;
            column.dataset.date = formatDate(date);
        });

        const startOfWeekStr = formatDate(startOfWeek);
        const endOfWeekStr = formatDate(endOfWeek);

        const weekTasks = tasks.filter(task => {
            return task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr;
        });

        weekTasks.forEach(task => {
            const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
            if (column) {
                const taskCard = document.createElement('div');
                taskCard.classList.add('task-card');
                taskCard.setAttribute('id', task.id);
                taskCard.innerHTML = `
                    <h4>${task.name}</h4>
                    <p>見積もり: ${task.estimated_time}時間</p>
                    ${task.details ? `<p>${task.details.replace(/\n/g, '<br>')}</p>` : ''}
                `;
                column.appendChild(taskCard);
            }
        });
    }

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

    // --- Initial Render ---
    renderWeek();
});