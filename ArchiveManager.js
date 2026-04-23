(function() {
    'use strict';

    const ARCHIVE_STORAGE_KEY = 'weekly-task-board.archive';

    /**
     * Migrate archived tasks to add actual_time field
     * @param {object[]} archivedTasks
     * @returns {object[]}
     */
    function migrateArchivedTasksAddActualTime(archivedTasks) {
        return archivedTasks.map(task => {
            if (task.actual_time === undefined) {
                return {
                    ...task,
                    actual_time: 0
                };
            }
            return task;
        });
    }

    /**
     * Migrate archived tasks to add recurring task fields
     * @param {object[]} archivedTasks
     * @returns {object[]}
     */
    function migrateArchivedTasksAddRecurringFields(archivedTasks) {
        return archivedTasks.map(task => {
            const updatedTask = { ...task };

            if (updatedTask.is_recurring === undefined) {
                updatedTask.is_recurring = false;
            }
            if (updatedTask.recurrence_pattern === undefined) {
                updatedTask.recurrence_pattern = null;
            }
            if (updatedTask.recurrence_end_date === undefined) {
                updatedTask.recurrence_end_date = null;
            }

            return updatedTask;
        });
    }

    /**
     * Load archived tasks from localStorage.
     * @returns {object[]}
     */
    function loadArchivedTasks() {
        const archivedJson = localStorage.getItem(ARCHIVE_STORAGE_KEY);
        if (!archivedJson) {
            return [];
        }

        try {
            let archivedTasks = JSON.parse(archivedJson);

            // マイグレーション実行
            const history = getMigrationHistory();
            if (history.version >= '1.0') {
                archivedTasks = migrateArchivedTasksAddActualTime(archivedTasks);
            }
            if (history.version >= '1.1') {
                archivedTasks = migrateArchivedTasksAddRecurringFields(archivedTasks);
            }

            return archivedTasks;
        } catch (error) {
            console.error('アーカイブタスクの読み込みに失敗:', error);
            return [];
        }
    }

    /**
     * Save archived tasks to localStorage.
     * @param {object[]} archivedTasks
     */
    function saveArchivedTasks(archivedTasks) {
        // マイグレーション適用
        let migratedTasks = migrateArchivedTasksAddActualTime(archivedTasks);
        migratedTasks = migrateArchivedTasksAddRecurringFields(migratedTasks);
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(migratedTasks));
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

    // --- Archive View Functions ---

    function showArchiveView() {
        renderArchive();
        const archiveView = document.getElementById('archive-view');
        archiveView.style.display = 'block';
        document.body.style.overflow = 'hidden'; // スクロールを無効化
    }

    function hideArchiveView() {
        const archiveView = document.getElementById('archive-view');
        archiveView.style.display = 'none';
        document.body.style.overflow = 'auto'; // スクロールを有効化
    }

    function renderArchive() {
        const archivedTasks = loadArchivedTasks();
        const archiveList = document.getElementById('archive-list');
        archiveList.textContent = '';

        if (archivedTasks.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'archive-empty';
            emptyDiv.textContent = 'アーカイブされたタスクはありません';
            archiveList.appendChild(emptyDiv);
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

        // カテゴリ情報を取得
        const categoryKey = validateCategory(task.category);
        const categoryInfo = getCategoryInfo(categoryKey);
        taskElement.classList.add('category-' + categoryKey);

        const archivedDate = new Date(task.archived_date);
        const formattedArchivedDate = archivedDate.getFullYear() + '/' + (archivedDate.getMonth() + 1) + '/' + archivedDate.getDate() + ' ' + String(archivedDate.getHours()).padStart(2, '0') + ':' + String(archivedDate.getMinutes()).padStart(2, '0');

        let datesHTML = '';
        if (task.assigned_date) {
            const assignedDate = new Date(task.assigned_date);
            datesHTML += '担当日: ' + (assignedDate.getMonth() + 1) + '/' + assignedDate.getDate();
        }
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            if (datesHTML) datesHTML += ' | ';
            datesHTML += '期限: ' + (dueDate.getMonth() + 1) + '/' + dueDate.getDate() + ' ' + String(dueDate.getHours()).padStart(2, '0') + ':' + String(dueDate.getMinutes()).padStart(2, '0');
        }

        // Create elements safely without innerHTML to prevent XSS
        const categoryBar = document.createElement('div');
        categoryBar.className = 'category-bar';
        categoryBar.style.backgroundColor = categoryInfo.color;

        const archivedTaskHeader = document.createElement('div');
        archivedTaskHeader.className = 'archived-task-header';

        const archivedTaskName = document.createElement('div');
        archivedTaskName.className = 'archived-task-name';
        archivedTaskName.textContent = task.name;

        const archivedTaskTime = document.createElement('div');
        archivedTaskTime.className = 'archived-task-time';
        archivedTaskTime.textContent = task.estimated_time + 'h';

        archivedTaskHeader.appendChild(archivedTaskName);
        archivedTaskHeader.appendChild(archivedTaskTime);

        taskElement.appendChild(categoryBar);
        taskElement.appendChild(archivedTaskHeader);

        if (datesHTML) {
            const archivedTaskDates = document.createElement('div');
            archivedTaskDates.className = 'archived-task-dates';
            archivedTaskDates.textContent = datesHTML;
            taskElement.appendChild(archivedTaskDates);
        }

        if (task.details) {
            const archivedTaskDetails = document.createElement('div');
            archivedTaskDetails.className = 'archived-task-details';
            archivedTaskDetails.textContent = task.details;
            taskElement.appendChild(archivedTaskDetails);
        }

        const archivedTaskCompletedDate = document.createElement('div');
        archivedTaskCompletedDate.className = 'archived-task-completed-date';
        archivedTaskCompletedDate.textContent = '完了: ' + formattedArchivedDate;
        taskElement.appendChild(archivedTaskCompletedDate);

        const archivedTaskActions = document.createElement('div');
        archivedTaskActions.className = 'archived-task-actions';

        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'restore-task-btn';
        restoreBtn.dataset.taskId = task.id;
        restoreBtn.textContent = '\u21a9\uFE0F 復元';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task-btn';
        deleteBtn.dataset.taskId = task.id;
        deleteBtn.textContent = '\uD83D\uDDD1\uFE0F 削除';

        archivedTaskActions.appendChild(restoreBtn);
        archivedTaskActions.appendChild(deleteBtn);
        taskElement.appendChild(archivedTaskActions);

        // 復元ボタンのイベントリスナー
        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            restoreTaskFromArchive(task.id, taskElement);
        });

        // 削除ボタンのイベントリスナー
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTaskFromArchive(task.id, taskElement);
        });

        return taskElement;
    }

    function clearAllArchive() {
        if (confirm('アーカイブされた全てのタスクを削除しますか？この操作は取り消せません。')) {
            saveArchivedTasks([]);
            renderArchive();
        }
    }

    function restoreTaskFromArchive(taskId, taskElement) {
        const archivedTasks = loadArchivedTasks();
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) return;

        const taskToRestore = archivedTasks[taskIndex];

        // 復元アニメーション
        taskElement.classList.add('restoring');

        setTimeout(() => {
            // アーカイブから削除
            archivedTasks.splice(taskIndex, 1);
            saveArchivedTasks(archivedTasks);

            // タスクを未完了状態で復元
            const restoredTask = {
                ...taskToRestore,
                completed: false
            };
            delete restoredTask.archived_date;

            // 通常のタスクリストに追加
            tasks.push(restoredTask);
            saveTasks();

            // アーカイブビューを更新
            renderArchive();

            // 成功メッセージ
            showRestoreMessage(taskToRestore.name);

        }, 800);
    }

    function deleteTaskFromArchive(taskId, taskElement) {
        const archivedTasks = loadArchivedTasks();
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) return;

        const taskToDelete = archivedTasks[taskIndex];

        if (confirm('\u300c' + taskToDelete.name + '\u300dを完全に削除しますか？この操作は取り消せません。')) {
            // 削除アニメーション
            taskElement.classList.add('restoring');

            setTimeout(() => {
                // アーカイブから削除
                archivedTasks.splice(taskIndex, 1);
                saveArchivedTasks(archivedTasks);

                // アーカイブビューを更新
                renderArchive();

            }, 800);
        }
    }

    function showRestoreMessage(taskName) {
        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = '\u300c' + taskName + '\u300dを復元しました！';
        messageElement.style.background = 'linear-gradient(135deg, #4a90e2, #5aa3f0)';

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

    /**
     * Initialize archive view event listeners.
     */
    function initArchiveEventListeners() {
        const archiveToggleBtn = document.getElementById('archive-toggle');
        const closeArchiveBtn = document.getElementById('close-archive');
        const clearArchiveBtn = document.getElementById('clear-archive');

        if (archiveToggleBtn) {
            archiveToggleBtn.addEventListener('click', showArchiveView);
        }
        if (closeArchiveBtn) {
            closeArchiveBtn.addEventListener('click', hideArchiveView);
        }
        if (clearArchiveBtn) {
            clearArchiveBtn.addEventListener('click', clearAllArchive);
        }
    }

    // Export via window
    window.ArchiveManager = {
        loadArchivedTasks,
        saveArchivedTasks,
        archiveCompletedTasks,
        migrateArchivedTasksAddActualTime,
        migrateArchivedTasksAddRecurringFields,
        showArchiveView,
        hideArchiveView,
        renderArchive,
        clearAllArchive,
        initArchiveEventListeners
    };

})();
