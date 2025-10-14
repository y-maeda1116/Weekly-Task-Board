// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';

// グローバル変数として宣言のみ行い、初期化はDOMContentLoaded内で行う
let tasks; 
let settings; 
let currentDate; // 💡 修正: アプリケーションの基点となる日付
let datePicker; // DOM要素もグローバルでアクセスできるように定義

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
    const date = new Date(d);
    date.setHours(0, 0, 0, 0); 
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    
    // 💡 修正 2: setDataをsetDateに修正
    date.setDate(diff);
    
    // 💡 修正 3: mondayをdateに修正
    return date;
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
    date.setHours(0, 0, 0, 0); 
    date.setDate(date.getDate() + daysToAdd);
    
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
        // 💡 修正 4: サンプルタスクの assigned_date を現在の週に割り当てる
        const todayMonday = formatDate(getMonday(new Date())); 

        tasksData = [
            { id: `task-${Date.now()+1}`, name: "D&D機能を実装する", estimated_time: 8, assigned_date: todayMonday, due_date: null, details: "タスクをドラッグ＆ドロップで移動できるようにする", completed: false },
            { id: `task-${Date.now()+2}`, name: "UIを修正する", estimated_time: 5, assigned_date: getNextDate(1), due_date: getNextDate(3) + 'T18:00', details: "新しいレイアウトを適用する", completed: false },
            { id: `task-${Date.now()+3}`, name: "バグを修正する", estimated_time: 3, assigned_date: null, due_date: getNextDate(2) + 'T23:59', details: "報告されたバグを調査・修正", completed: true },
        ];
    } else {
        tasksData = JSON.parse(tasksJson);
    }
    // 💡 修正 5: assigned_dateが空文字や未定義の場合に備え、nullに変換
    return tasksData.map(task => ({ 
        ...task, 
        completed: task.completed || false,
        assigned_date: task.assigned_date === "" || task.assigned_date === undefined ? null : task.assigned_date
    }));
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
        if(document.body.renderWeek) document.body.renderWeek();
    }
}


/**
 * Moves incomplete tasks from past weeks to the unassigned list.
 */
function carryOverOldTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayStr = formatDate(today);

    let tasksModified = false;
    tasks.forEach(task => {
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
    
    // 1. データの初期化
    tasks = loadTasks(); 
    settings = loadSettings();
    // 💡 currentDateを現在の週の月曜日に設定し、時刻情報をクリアする
    currentDate = getMonday(new Date()); 

    // --- DOM Element Selections ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const estimatedTimeInput = document.getElementById('estimated-time');
    const taskDateInput = document.getElementById('task-date');
    const dueDateInput = document.getElementById('due-date');
    const taskDetailsInput = document.getElementById('task-details');

    const prevWeekBtn = document.getElementById('prev-week');
    const todayBtn = document.getElementById('today');
    const nextWeekBtn = document.getElementById('next-week');
    
    // グローバル変数に代入
    datePicker = document.getElementById('date-picker'); 

    const weekTitle = document.getElementById('week-title');
    const dayColumns = Array.from(document.querySelectorAll('#task-board .day-column'));
    const unassignedColumn = document.getElementById('unassigned-tasks');
    const idealDailyMinutesInput = document.getElementById('ideal-daily-minutes');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');

    let editingTaskId = null;
    let isRendering = false; 

    // --- Initial Load ---
    carryOverOldTasks();

    // 💡 修正 6: currentDate を基にした週の月曜日の日付を datePicker に設定
    datePicker.value = formatDate(currentDate);

    // 💡 修正 7: 初期ロード時にタスクボードを描画する
    renderWeek();

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
        // 💡 修正: nullの場合は空文字列を設定し、HTML inputで表示できるようにする
        taskDateInput.value = task.assigned_date || ''; 
        dueDateInput.value = task.due_date || '';
        taskDetailsInput.value = task.details || '';
        taskForm.querySelector('button').textContent = '更新';
        modal.style.display = 'block';
    }


    // --- Form Submission Logic (タスク修正の成功ロジック) ---
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // 💡 修正 8: taskDateInput.valueが空文字列の場合はnullにする
        const assignedDateValue = taskDateInput.value || null; 

        const taskData = {
            name: taskNameInput.value,
            estimated_time: parseFloat(estimatedTimeInput.value),
            assigned_date: assignedDateValue,
            due_date: dueDateInput.value || null,
            details: taskDetailsInput.value,
        };

        if (editingTaskId) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex > -1) {
                // 既存タスクを更新
                tasks[taskIndex] = { ...tasks[taskIndex], ...taskData }; 
            }
        } else {
            // 新規タスクを追加
            const newTask = {
                id: `task-${Date.now()}`,
                completed: false, 
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

        // 💡 タスク修正/完了チェックボックスのイベントリスナー
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); 
            task.completed = e.target.checked;
            saveTasks();
            renderWeek(); 
        });

        // 💡 タスク修正/編集モーダルを開くイベントリスナー
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
        if (isRendering) return;
        isRendering = true;

        const monday = getMonday(currentDate); 
        
        dayColumns.forEach(col => {
            col.querySelectorAll('.task').forEach(task => task.remove());
            const totalTimeEl = col.querySelector('.daily-total-time');
            if (totalTimeEl) { totalTimeEl.textContent = ''; totalTimeEl.classList.remove('overload'); }
        });
        unassignedColumn.querySelector('#unassigned-list').innerHTML = '';

        const weekDates = [];
        const dailyTotals = {}; 

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            date.setHours(0, 0, 0, 0); 
            const dateStr = formatDate(date);
            weekDates.push(date);
            dailyTotals[dateStr] = 0;
        }

        const startOfWeek = weekDates[0];
        const endOfWeek = weekDates[6];
        weekTitle.textContent = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

        const startOfWeekStr = formatDate(startOfWeek);
        const endOfWeekStr = formatDate(endOfWeek);

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.assigned_date && task.assigned_date >= startOfWeekStr && task.assigned_date <= endOfWeekStr) {
                const column = document.querySelector(`.day-column[data-date="${task.assigned_date}"]`);
                if (column) {
                    column.appendChild(taskElement);
                    dailyTotals[task.assigned_date] += (task.estimated_time || 0) * 60;
                }
            } else if (task.assigned_date === null) {
                unassignedColumn.querySelector('#unassigned-list').appendChild(taskElement);
            }
        });

        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);
            const totalMinutes = dailyTotals[dateStr];

            const h3 = column.querySelector('h3');
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

        datePicker.value = formatDate(monday);
        isRendering = false;
    }
    document.body.renderWeek = renderWeek;


    // --- Navigation Event Listeners ---
    prevWeekBtn.addEventListener('click', () => {
        const currentMonday = getMonday(currentDate); 
        // 💡 修正 9: 前週へ移動
        currentMonday.setDate(currentMonday.getDate() - 7); 
        currentDate = currentMonday; 
        datePicker.value = formatDate(currentDate);
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        const currentMonday = getMonday(currentDate); 
        // 💡 修正 10: 次週へ移動
        currentMonday.setDate(currentMonday.getDate() + 7); 
        currentDate = currentMonday; 
        datePicker.value = formatDate(currentDate);
        renderWeek();
    });

    // 💡 修正 11: 今週に戻るボタンのイベントリスナー (安定動作のためgetMondayを使用)
    todayBtn.addEventListener('click', () => {
        currentDate = getMonday(new Date());
        datePicker.value = formatDate(currentDate);
        renderWeek();
    });

    // 💡 修正 12: 日付ピッカーの変更リスナー (安定動作のためgetMondayを使用)
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = getMonday(new Date(e.target.value));
            renderWeek();
        }
    });

    // 💡 修正 13: idealDailyMinutesの変更リスナー
    idealDailyMinutesInput.value = settings.ideal_daily_minutes; // 初期値を反映
    idealDailyMinutesInput.addEventListener('change', (e) => {
        settings.ideal_daily_minutes = parseInt(e.target.value, 10) || 480;
        saveSettings();
        renderWeek(); // 合計時間の表示を更新
    });
    
    // --- データのエクスポート/インポートロジック ---
    
    function exportData() {
        const data = { tasks: tasks, settings: settings };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-task-board-data-${formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.tasks) {
                    // タスク配列を上書き
                    tasks = importedData.tasks.map(task => ({ ...task, completed: task.completed || false }));
                    saveTasks();
                }
                if (importedData.settings) {
                    // 設定オブジェクトを上書き
                    settings = { ...settings, ...importedData.settings };
                    saveSettings();
                    idealDailyMinutesInput.value = settings.ideal_daily_minutes; // UIを更新
                }
                renderWeek();
                alert('データのインポートが完了しました。');
            } catch (error) {
                alert('インポート中にエラーが発生しました: ' + error.message);
                console.error('Import Error:', error);
            }
        };
        reader.readAsText(file);
    }
    
    // イベントリスナー
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
        }
    });

}); // DOMContentLoaded 終了