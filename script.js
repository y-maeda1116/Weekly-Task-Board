// --- Global State and LocalStorage Functions ---

const TASKS_STORAGE_KEY = 'weekly-task-board.tasks';
const SETTINGS_STORAGE_KEY = 'weekly-task-board.settings';
const ARCHIVE_STORAGE_KEY = 'weekly-task-board.archive';

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
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
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
        // LocalStorageが空の場合、現在の週に表示されるサンプルタスクを生成
        const today = new Date();
        const monday = getMonday(today);

        // 今週の月曜日から水曜日の日付を取得
        const mondayStr = formatDate(monday);
        const tuesday = new Date(monday);
        tuesday.setDate(monday.getDate() + 1);
        const tuesdayStr = formatDate(tuesday);
        const wednesday = new Date(monday);
        wednesday.setDate(monday.getDate() + 2);
        const wednesdayStr = formatDate(wednesday);

        tasksData = [
            { id: `task-${Date.now() + 1}`, name: "D&D機能を実装する", estimated_time: 8, priority: "high", assigned_date: null, due_date: null, details: "タスクをドラッグ＆ドロップで移動できるようにする", completed: false },
            { id: `task-${Date.now() + 2}`, name: "UIを修正する", estimated_time: 5, priority: "medium", assigned_date: tuesdayStr, due_date: wednesdayStr + 'T18:00', details: "新しいレイアウトを適用する", completed: false },
            { id: `task-${Date.now() + 3}`, name: "バグを修正する", estimated_time: 3, priority: "low", assigned_date: mondayStr, due_date: mondayStr + 'T23:59', details: "報告されたバグを調査・修正", completed: false },
        ];
    } else {
        tasksData = JSON.parse(tasksJson);
    }
    return tasksData.map(task => ({ 
        ...task, 
        completed: task.completed || false,
        priority: task.priority || 'medium' // 既存タスクにデフォルト優先度を設定
    }));
}


/**
 * Save tasks to localStorage.
 */
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Load archived tasks from localStorage.
 * @returns {object[]}
 */
function loadArchivedTasks() {
    const archivedJson = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    return archivedJson ? JSON.parse(archivedJson) : [];
}

/**
 * Save archived tasks to localStorage.
 * @param {object[]} archivedTasks
 */
function saveArchivedTasks(archivedTasks) {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedTasks));
}

/**
 * Move completed tasks to archive.
 */
function archiveCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return;

    const archivedTasks = loadArchivedTasks();
    const currentDate = new Date().toISOString();

    // 完了タスクにアーカイブ日時を追加
    completedTasks.forEach(task => {
        task.archived_date = currentDate;
        archivedTasks.push(task);
    });

    // 完了タスクを通常のタスクリストから削除
    tasks = tasks.filter(task => !task.completed);

    saveArchivedTasks(archivedTasks);
    saveTasks();
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
        if (document.body.renderWeek) document.body.renderWeek();
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
    // 💡 修正 1: currentDateを現在の日付で初期化し、週の基点を定める
    currentDate = new Date();

    // --- DOM Element Selections ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const estimatedTimeInput = document.getElementById('estimated-time');
    const taskPriorityInput = document.getElementById('task-priority');
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
    const themeToggleBtn = document.getElementById('theme-toggle');
    const archiveToggleBtn = document.getElementById('archive-toggle');
    const archiveView = document.getElementById('archive-view');
    const closeArchiveBtn = document.getElementById('close-archive');
    const clearArchiveBtn = document.getElementById('clear-archive');
    const archiveList = document.getElementById('archive-list');

    let editingTaskId = null;
    let isRendering = false;
    let selectedDate = null; // 日付クリックで選択された日付

    // --- Initial Load ---
    carryOverOldTasks();

    // 設定値をUIに反映
    idealDailyMinutesInput.value = settings.ideal_daily_minutes;
    
    // ダークモードの初期化
    initializeTheme();

    // 💡 修正 2: 初期ロード時にタスクボードを描画する
    renderWeek();

    // --- Modal Logic ---
    addTaskBtn.addEventListener('click', () => {
        openTaskModal();
    });
    
    function openTaskModal(presetDate = null) {
        editingTaskId = null;
        selectedDate = presetDate;
        taskForm.reset();
        
        // 事前設定された日付がある場合は設定
        if (presetDate) {
            taskDateInput.value = presetDate;
        }
        
        taskForm.querySelector('button').textContent = '登録';
        modal.style.display = 'block';
    }
    
    // 日付入力フィールドをカレンダー専用にする
    function makeDateInputCalendarOnly(inputElement) {
        // キーボード入力を無効にする
        inputElement.addEventListener('keydown', function(e) {
            // Tabキー、Enterキー、Escapeキーは許可
            if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
                return;
            }
            // その他のキー入力を無効にする
            e.preventDefault();
        });
        
        // キーボード入力を完全に無効にする
        inputElement.addEventListener('keypress', function(e) {
            e.preventDefault();
        });
        
        // 入力イベントも無効にする
        inputElement.addEventListener('input', function(e) {
            // カレンダーからの入力は許可するため、手動入力のみブロック
        });
        
        // フィールドクリックでカレンダーを開く
        inputElement.addEventListener('click', function() {
            // readonly属性を一時的に解除してカレンダーを開く
            this.removeAttribute('readonly');
            if (typeof this.showPicker === 'function') {
                try {
                    this.showPicker();
                } catch (error) {
                    this.focus();
                }
            } else {
                this.focus();
            }
        });
        
        // フォーカス時にもカレンダーを開く
        inputElement.addEventListener('focus', function() {
            this.removeAttribute('readonly');
            if (typeof this.showPicker === 'function') {
                try {
                    this.showPicker();
                } catch (error) {
                    // カレンダーが開けない場合はそのまま
                }
            }
        });
        
        // カレンダーが閉じられた後にreadonly属性を復元
        inputElement.addEventListener('blur', function() {
            // 少し遅延させてからreadonly属性を復元
            setTimeout(() => {
                this.setAttribute('readonly', 'readonly');
            }, 100);
        });
        
        // 値が変更された後もreadonly属性を復元
        inputElement.addEventListener('change', function() {
            setTimeout(() => {
                this.setAttribute('readonly', 'readonly');
            }, 100);
        });
        
        // ラベルクリックでも日付ピッカーを開く
        const label = document.querySelector(`label[for="${inputElement.id}"]`);
        if (label) {
            label.style.cursor = 'pointer';
            label.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof inputElement.showPicker === 'function') {
                    try {
                        inputElement.showPicker();
                    } catch (error) {
                        inputElement.focus();
                    }
                } else {
                    inputElement.focus();
                }
            });
        }
    }
    
    // 日付入力フィールドをカレンダー専用に設定
    makeDateInputCalendarOnly(taskDateInput);
    makeDateInputCalendarOnly(dueDateInput);

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        selectedDate = null;
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            selectedDate = null;
        }
    });

    function openEditModal(task) {
        editingTaskId = task.id;
        taskNameInput.value = task.name;
        estimatedTimeInput.value = task.estimated_time;
        taskPriorityInput.value = task.priority || 'medium';
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

        // 💡 修正 3: taskDateInput.valueが空文字列の場合はnullにする
        const assignedDateValue = taskDateInput.value || null;

        const taskData = {
            name: taskNameInput.value,
            estimated_time: parseFloat(estimatedTimeInput.value),
            priority: taskPriorityInput.value,
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
        selectedDate = null; // 選択された日付をクリア
    });

    // --- Date and Rendering Logic ---

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        // 優先度クラスを追加
        taskElement.classList.add(`priority-${task.priority || 'medium'}`);
        taskElement.dataset.taskId = task.id;
        taskElement.draggable = true;

        let dueDateHTML = '';
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
            dueDateHTML = `<div class="task-due-date">期限: ${formattedDate}</div>`;
        }

        const priorityLabels = { high: '高', medium: '中', low: '低' };
        const priorityLabel = priorityLabels[task.priority] || '中';
        
        taskElement.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-name">${task.name}</div>
                <span class="task-priority ${task.priority || 'medium'}">${priorityLabel}</span>
                <div class="task-time">${task.estimated_time}h</div>
            </div>
            ${dueDateHTML}
        `;

        // 💡 タスク修正/完了チェックボックスのイベントリスナー
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            task.completed = e.target.checked;
            
            if (task.completed) {
                // 派手な完了アニメーションを実行
                playTaskCompletionAnimation(taskElement, checkbox);
                
                // アニメーション完了後にアーカイブ
                setTimeout(() => {
                    archiveCompletedTasks();
                    renderWeek();
                }, 1200);
            } else {
                // チェック解除時は即座に更新
                saveTasks();
                renderWeek();
            }
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
    
    function addDateClickListeners() {
        // 未割り当てエリア以外の日付列にクリックリスナーを追加
        dayColumns.forEach(col => {
            col.addEventListener('click', (e) => {
                // タスク要素やその子要素がクリックされた場合は無視
                if (e.target.closest('.task')) {
                    return;
                }
                
                // ドラッグ&ドロップ中は無視
                if (e.target.closest('.dragging')) {
                    return;
                }
                
                const dateStr = col.dataset.date;
                if (dateStr && dateStr !== 'null') {
                    openTaskModal(dateStr);
                }
            });
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

        // 先に各カラムにdata-date属性を設定
        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);

            // data-date属性を先に設定
            column.dataset.date = dateStr;

            const h3 = column.querySelector('h3');
            h3.innerHTML = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()}) <span class="daily-total-time"></span>`;
        });

        // タスクを配置
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

        // 合計時間を表示
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const dateStr = formatDate(date);
            const totalMinutes = dailyTotals[dateStr];

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
        });

        unassignedColumn.dataset.date = "null";
        addDragAndDropListeners();
        addDateClickListeners();

        datePicker.value = formatDate(monday);
        isRendering = false;
    }
    document.body.renderWeek = renderWeek;


    // --- Navigation Event Listeners ---
    prevWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate);
        newMonday.setDate(newMonday.getDate() - 7);
        currentDate = newMonday;
        datePicker.value = formatDate(currentDate);
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        const newMonday = getMonday(currentDate);
        // 💡 修正 4: 次週へ移動するように修正 (getDate() + 7)
        newMonday.setDate(newMonday.getDate() + 7);
        currentDate = newMonday;
        datePicker.value = formatDate(currentDate);
        renderWeek();
    });

    // 💡 修正 5: 今週に戻るボタンのイベントリスナーを追加
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderWeek();
    });

    // 💡 修正 6: 日付ピッカーの変更リスナーを追加
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = new Date(e.target.value);
            renderWeek();
        }
    });

    // 💡 修正 7: idealDailyMinutesの変更リスナーを追加（設定の保存）
    idealDailyMinutesInput.addEventListener('change', (e) => {
        settings.ideal_daily_minutes = parseInt(e.target.value, 10) || 480;
        saveSettings();
        renderWeek(); // 合計時間の表示を更新
    });

    // --- データのエクスポート/インポートロジック ---

    function exportData() {
        const archivedTasks = loadArchivedTasks();
        const data = { 
            tasks: tasks, 
            settings: settings,
            archive: archivedTasks
        };
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
                if (importedData.archive) {
                    // アーカイブデータを上書き
                    saveArchivedTasks(importedData.archive);
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

    // --- ダークモード機能 ---
    
    function initializeTheme() {
        // LocalStorageからテーマ設定を読み込み
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    }
    
    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '☀️ ライト';
        } else {
            themeToggleBtn.innerHTML = '🌙 ダーク';
        }
    }

    // --- タスク完了アニメーション ---
    
    function playTaskCompletionAnimation(taskElement, checkbox) {
        // チェックボックスの成功アニメーション
        checkbox.classList.add('success-animation');
        
        // 光る効果
        taskElement.classList.add('glow-effect');
        
        // 紙吹雪エフェクト
        createConfettiEffect(taskElement);
        
        // 成功メッセージ表示
        showSuccessMessage();
        
        // タスク要素の完了アニメーション（少し遅延）
        setTimeout(() => {
            taskElement.classList.add('completing');
        }, 300);
        
        // データ保存
        saveTasks();
    }
    
    function createConfettiEffect(taskElement) {
        const rect = taskElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const colors = ['red', 'orange', 'green', 'blue', 'purple'];
        const confettiCount = 12;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            // ランダムな位置に配置
            const angle = (360 / confettiCount) * i;
            const distance = 30 + Math.random() * 40;
            const x = centerX + Math.cos(angle * Math.PI / 180) * distance;
            const y = centerY + Math.sin(angle * Math.PI / 180) * distance;
            
            confetti.style.left = x + 'px';
            confetti.style.top = y + 'px';
            
            document.body.appendChild(confetti);
            
            // アニメーション開始
            setTimeout(() => {
                confetti.classList.add('animate');
            }, 50);
            
            // 要素を削除
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 1300);
        }
    }
    
    function showSuccessMessage() {
        const messages = [
            'タスク完了！お疲れさまでした！',
            '素晴らしい！また一つ達成しました！',
            'やったね！タスククリア！',
            '完了！次のタスクも頑張りましょう！',
            'ナイス！効率的ですね！'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // メッセージ表示
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // メッセージ非表示・削除
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }

    // --- アーカイブ機能 ---
    
    function showArchiveView() {
        renderArchive();
        archiveView.style.display = 'block';
        document.body.style.overflow = 'hidden'; // スクロールを無効化
    }
    
    function hideArchiveView() {
        archiveView.style.display = 'none';
        document.body.style.overflow = 'auto'; // スクロールを有効化
    }
    
    function renderArchive() {
        const archivedTasks = loadArchivedTasks();
        archiveList.innerHTML = '';
        
        if (archivedTasks.length === 0) {
            archiveList.innerHTML = '<div class="archive-empty">アーカイブされたタスクはありません</div>';
            return;
        }
        
        // 新しい順にソート
        archivedTasks.sort((a, b) => new Date(b.archived_date) - new Date(a.archived_date));
        
        archivedTasks.forEach(task => {
            const taskElement = createArchivedTaskElement(task);
            archiveList.appendChild(taskElement);
        });
    }
    
    function createArchivedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'archived-task';
        
        const archivedDate = new Date(task.archived_date);
        const formattedArchivedDate = `${archivedDate.getFullYear()}/${archivedDate.getMonth() + 1}/${archivedDate.getDate()} ${String(archivedDate.getHours()).padStart(2, '0')}:${String(archivedDate.getMinutes()).padStart(2, '0')}`;
        
        let datesHTML = '';
        if (task.assigned_date) {
            const assignedDate = new Date(task.assigned_date);
            datesHTML += `担当日: ${assignedDate.getMonth() + 1}/${assignedDate.getDate()}`;
        }
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            if (datesHTML) datesHTML += ' | ';
            datesHTML += `期限: ${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        }
        
        taskElement.innerHTML = `
            <div class="archived-task-header">
                <div class="archived-task-name">${task.name}</div>
                <div class="archived-task-time">${task.estimated_time}h</div>
            </div>
            ${datesHTML ? `<div class="archived-task-dates">${datesHTML}</div>` : ''}
            ${task.details ? `<div class="archived-task-details">${task.details}</div>` : ''}
            <div class="archived-task-completed-date">完了: ${formattedArchivedDate}</div>
        `;
        
        return taskElement;
    }
    
    function clearAllArchive() {
        if (confirm('アーカイブされた全てのタスクを削除しますか？この操作は取り消せません。')) {
            saveArchivedTasks([]);
            renderArchive();
        }
    }

    // イベントリスナー
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
        }
    });
    themeToggleBtn.addEventListener('click', toggleTheme);
    archiveToggleBtn.addEventListener('click', showArchiveView);
    closeArchiveBtn.addEventListener('click', hideArchiveView);
    clearArchiveBtn.addEventListener('click', clearAllArchive);

}); // DOMContentLoaded 終了