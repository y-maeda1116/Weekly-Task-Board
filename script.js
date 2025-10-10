// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';

// DOM要素をグローバルに近いスコープで宣言 (DOMContentLoaded内で初期化)
let addTaskBtn, modal, taskForm;
let prevWeekBtn, todayBtn, nextWeekBtn, datePicker, weekTitle;
let dayColumns, unassignedColumn, idealDailyMinutesInput;
let exportDataBtn, importDataBtn, importFileInput;
let taskNameInput, estimatedTimeInput, taskDateInput, dueDateInput, taskDetailsInput;
let closeModalBtn;


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
 * Gets the Monday of the week for the given date.
 * @param {Date} d - The date.
 * @returns {Date} The Monday of that week, set to 00:00:00 local time.
 */
function getMonday(d) {
    d = new Date(d);
    // 最初に時刻をリセットすることで、曜日計算を安全にする
    d.setHours(0, 0, 0, 0); 
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    // 時刻情報をローカルタイムの午前0時に強制リセット（getMonday内で保証）
    monday.setHours(0, 0, 0, 0); 
    return monday;
}

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
 * Helper to get a future date string in YYYY-MM-DD format.
 * @param {number} daysToAdd - Number of days to add to today.
 * @returns {string}
 */
function getNextDate(daysToAdd) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    // getNextDateでも時刻をリセット
    date.setHours(0, 0, 0, 0); 
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
            { id: `task-${Date.now()+1}`, name: "D&D機能を実装する", estimated_time: 8, assigned_date: null, due_date: null, details: "タスクをドラッグ＆ドロップで移動できるようにする", completed: false },
            { id: `task-${Date.now()+2}`, name: "UIを修正する", estimated_time: 5, assigned_date: getNextDate(1), due_date: getNextDate(3) + 'T18:00', details: "新しいレイアウトを適用する", completed: false },
            { id: `task-${Date.now()+3}`, name: "バグを修正する", estimated_time: 3, assigned_date: getNextDate(2), due_date: getNextDate(2) + 'T23:59', details: "報告されたバグを調査・修正", completed: true },
        ];
    } else {
        tasksData = JSON.parse(tasksJson);
    }
    // Ensure all tasks have a 'completed' property for backward compatibility
    return tasksData.map(task => ({ ...task, completed: task.completed || false }));
}

// グローバル変数の宣言と初期化を実行
let tasks = loadTasks();
let settings = loadSettings();


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
        if(document.body.renderWeek) document.body.renderWeek();
    }
}


// --- Date and Rendering Logic ---

/**
 * Moves incomplete tasks from past weeks to the unassigned list.
 */
function carryOverOldTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayStr = formatDate(today);

    let tasksModified = false;
    tasks.forEach(task => {
        // assigned_dateが過去の日付（todayStrより小さい）で、完了していないタスクをチェック
        if (task.assigned_date && task.assigned_date < todayStr && !task.completed) {
            task.assigned_date = null; // 未割り当てに戻す
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
    addTaskBtn = document.getElementById('add-task-btn');
    modal = document.getElementById('task-modal');
    closeModalBtn = document.querySelector('.close-btn');
    taskForm = document.getElementById('task-form');
    taskNameInput = document.getElementById('task-name');
    estimatedTimeInput = document.getElementById('estimated-time');
    taskDateInput = document.getElementById('task-date');
    dueDateInput = document.getElementById('due-date');
    taskDetailsInput = document.getElementById('task-details');

    prevWeekBtn = document.getElementById('prev-week');
    todayBtn = document.getElementById('today');
    nextWeekBtn = document.getElementById('next-week');
    datePicker = document.getElementById('date-picker');
    weekTitle = document.getElementById('week-title');
    dayColumns = Array.from(document.querySelectorAll('#task-board .day-column'));
    unassignedColumn = document.getElementById('unassigned-tasks');
    idealDailyMinutesInput = document.getElementById('ideal-daily-minutes');
    exportDataBtn = document.getElementById('export-data-btn');
    importDataBtn = document.getElementById('import-data-btn');
    importFileInput = document.getElementById('import-file-input');

    let currentDate; // currentDateはDOMContentLoaded内でlet宣言を維持
    let editingTaskId = null;
    let isRendering = false; // 💡 描画制御フラグ

    // --- Initial Load ---
    // carryOverOldTasks(); // データ消失を防ぐため、この自動実行を一時的に無効化

    // --- Event Delegation for Task Clicks ---
    // Using event delegation on the main container is more robust and performant.
    // It ensures that clicks are handled correctly even for tasks that are re-rendered.
    document.getElementById('app-container').addEventListener('click', (e) => {
        // Find the closest ancestor which is a task element
        const taskElement = e.target.closest('.task');

        // If a task was clicked, but not the checkbox inside it
        if (taskElement && !e.target.matches('.task-checkbox')) {
            const taskId = taskElement.dataset.taskId;
            // Find the task from the global `tasks` array to ensure data is up-to-date
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                openEditModal(task);
            }
        }
    });

    // --- Modal Logic ---
    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        taskForm.reset();
        document.querySelector('#task-modal h2').textContent = 'タスクを新規登録';
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
        document.querySelector('#task-modal h2').textContent = 'タスクを編集';
        taskNameInput.value = task.name;
        estimatedTimeInput.value = task.estimated_time;
        taskDateInput.value = task.assigned_date || ''; // Handle null assigned_date
        dueDateInput.value = task.due_date || '';
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
            // Ensure empty date string is saved as null
            assigned_date: taskDateInput.value || null,
            due_date: dueDateInput.value || null,
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

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        taskElement.dataset.taskId = task.id;
        taskElement.draggable = true;

        let dueDateHTML = '';
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
            dueDateHTML = `<div class="task-due-date">期限: ${formattedDate}</div>`;
        }

        taskElement.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-name">${task.name}</div>
                <div class="task-time">${task.estimated_time}h</div>
            </div>
            ${dueDateHTML}
        `;

        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            // The delegated listener on #app-container will ignore checkbox clicks,
            // so we no longer need e.stopPropagation() here.
            task.completed = e.target.checked;
            saveTasks();
            renderWeek(); // Re-render to apply style changes immediately
        });

        // The 'click' listener for opening the modal is now handled by event delegation.
        // We only need drag listeners directly on the element.
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
        if (isRendering) return; // 既に描画中なら処理を中断
        isRendering = true; // 描画開始

        const monday = getMonday(currentDate); 
        
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
            date.setHours(0, 0, 0, 0); // 描画に使用する日付も安全のためリセット
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

            // Render tasks that are within the current week
            if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr) {
                const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
                if (column) {
                    column.appendChild(taskElement);
                    // Add estimated time to the daily total
                    dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
                }
            // Render tasks that are unassigned (new or carried over) in the sidebar
            } else if (task.assigned_date === null) {
                unassignedColumn.querySelector('#unassigned-list').appendChild(taskElement);
            }
            // Tasks from past (and completed) or future weeksは意図的に無視
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

        // Update the date picker to the Monday of the current week
        datePicker.value = formatDate(monday);
        
        // 描画処理の最後でフラグをリセットし、描画を再度遅延実行
        isRendering = false;
        
        // 💡 描画の完了を待って、さらに50ms後に再描画を試みる（最後の砦）
        setTimeout(() => {
            // isRenderingがfalse（つまり、すぐに次の描画イベントが起きていない）であれば、再描画処理を起動
            if (!isRendering) {
                renderWeek();
            }
        }, 50);
    }

    // Attach renderWeek to the body so it can be called from the global handleDrop function
    document.body.renderWeek = renderWeek;


    // --- Navigation Event Listeners ---
    // prev/nextボタンは遅延の必要がないため、従来のロジックを維持
    prevWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate); 
        newMonday.setDate(newMonday.getDate() - 7); 
        
        currentDate = newMonday; 
        datePicker.value = formatDate(currentDate);
        
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate); 
        newMonday.setDate(newMonday.getDate() + 7); 
        
        currentDate = newMonday; 
        datePicker.value = formatDate(currentDate);
        
        renderWeek();
    });
    
	// 💡 最終修正: todayBtn のロジック。強制リフローとrenderWeek呼び出し
	todayBtn.addEventListener('click', () => {
	    const today = new Date();
        const mondayOfThisWeek = getMonday(today); 
        
        // 1. currentDate と datePicker の UI を更新
        currentDate = mondayOfThisWeek; 
        datePicker.value = formatDate(currentDate); 
        
        // 2. 描画を強制的に実行させるためのトリック (DOM強制リフロー)
        document.body.offsetHeight;
        
        // 3. 確実に renderWeek を呼び出す (描画フラグが再試行処理を制御)
        renderWeek();
	});

    // datePicker の変更イベントは、シンプルな状態に戻す
    datePicker.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            const newDate = new Date(selectedDate + 'T00:00:00'); 
            newDate.setHours(0, 0, 0, 0); 
            currentDate = newDate;
            renderWeek();
        }
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

    // --- Data Management ---
    function exportData() {
        const dataToExport = {
            tasks: tasks,
            settings: settings
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-task-board-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportDataBtn.addEventListener('click', exportData);

    function importData(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.tasks && data.settings) {
                    if (confirm('現在のデータを上書きして、インポートしたデータに置き換えますか？この操作は元に戻せません。')) {
                        tasks = data.tasks;
                        settings = data.settings;

                        saveTasks();
                        saveSettings();

                        // Update UI components with new settings
                        idealDailyMinutesInput.value = settings.ideal_daily_minutes;

                        // Re-render the entire application
                        renderWeek();
                        alert('データが正常にインポートされました。');
                    }
                } else {
                    alert('無効なファイル形式です。エクスポートされたJSONファイルを選択してください。');
                }
            } catch (error) {
                alert('ファイルの読み込み中にエラーが発生しました: ' + error.message);
            } finally {
                // Reset file input to allow re-importing the same file
                importFileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    importDataBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', importData);

    // --- Initial Render ---
    const initialMonday = getMonday(new Date()); 
    currentDate = initialMonday;
    datePicker.value = formatDate(currentDate);
    renderWeek();
});