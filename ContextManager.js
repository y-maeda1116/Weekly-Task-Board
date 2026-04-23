(function() {
    'use strict';

    /**
     * Initialize weekday settings UI.
     */
    function initializeWeekdaySettings() {
        var weekdayCheckboxes = document.querySelectorAll('#weekday-checkboxes input[type="checkbox"]');

        // チェックボックスの初期状態を設定
        weekdayCheckboxes.forEach(function(checkbox, index) {
            var dayName = weekdayManager.dayNames[index];
            checkbox.checked = weekdayManager.isWeekdayVisible(dayName);

            // イベントリスナーを追加
            checkbox.addEventListener('change', function(e) {
                handleWeekdayChange(dayName, e.target.checked);
            });
        });
    }

    /**
     * Handle weekday visibility change with optimized performance.
     * @param {string} dayName - 曜日名
     * @param {boolean} visible - 表示するかどうか
     */
    function handleWeekdayChange(dayName, visible) {
        weekdayManager.toggleWeekday(dayName, visible);

        updateWeekdayVisibility();

        // アニメーション完了後にrenderWeekを実行
        setTimeout(function() {
            renderWeek();
        }, 450);

        // 移動したタスク数を通知
        if (!visible) {
            var movedCount = weekdayManager.moveTasksToUnassigned(dayName);
            if (movedCount > 0) {
                showWeekdayNotification(weekdayManager.dayLabels[weekdayManager.dayNames.indexOf(dayName)] + '\u66dc\u65e5\u306e' + movedCount + '\u500b\u306e\u30bf\u30b9\u30af\u3092\u672a\u5272\u308a\u5f53\u3066\u306b\u79fb\u52d5\u3057\u307e\u3057\u305f');
            }
        }
    }

    /**
     * Update weekday column visibility with smooth animations.
     */
    function updateWeekdayVisibility() {
        var dayColumns = document.querySelectorAll('.day-column');
        dayColumns.forEach(function(column, index) {
            if (index >= weekdayManager.dayNames.length) return; // 未割り当て列をスキップ

            var dayName = weekdayManager.dayNames[index];
            var isVisible = weekdayManager.isWeekdayVisible(dayName);

            if (isVisible) {
                column.style.display = '';
                column.classList.remove('hidden-day');
            } else {
                column.classList.add('hidden-day');
                // アニメーション後に完全に非表示
                setTimeout(function() {
                    if (!weekdayManager.isWeekdayVisible(dayName)) {
                        column.style.display = 'none';
                    }
                }, 450);
            }
        });

        updateGridColumns();
    }

    /**
     * Update grid columns based on visible weekdays count.
     */
    function updateGridColumns() {
        var taskBoard = document.getElementById('task-board');
        if (!taskBoard) return;

        var visibleCount = weekdayManager.getVisibleWeekdays().length;

        // 既存のweekdaysクラスを削除
        taskBoard.classList.remove('weekdays-1', 'weekdays-2', 'weekdays-3', 'weekdays-4', 'weekdays-5', 'weekdays-6');

        if (visibleCount > 0 && visibleCount < 7) {
            taskBoard.classList.add('weekdays-' + visibleCount);
        }
    }

    /**
     * Show weekday notification.
     * @param {string} message
     */
    function showWeekdayNotification(message) {
        showBulkMoveNotification(message, 'info');
    }

    /**
     * Show bulk move notification.
     * @param {string} message
     * @param {string} type
     */
    function showBulkMoveNotification(message, type) {
        if (type === undefined) type = 'info';

        var existingNotification = document.querySelector('.bulk-move-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        var notification = document.createElement('div');
        notification.className = 'bulk-move-notification ' + type;
        notification.textContent = message;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-size: 14px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

        if (type === 'info') {
            notification.style.backgroundColor = '#4a90e2';
        } else if (type === 'success') {
            notification.style.backgroundColor = '#27ae60';
        } else {
            notification.style.backgroundColor = '#6c757d';
        }

        document.body.appendChild(notification);

        setTimeout(function() {
            notification.style.transition = 'opacity 0.3s ease';
            notification.style.opacity = '0';
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Initialize context menu functionality.
     */
    function initializeContextMenu() {
        var contextMenu = document.getElementById('day-context-menu');
        var currentTargetDate = null;
        var currentTargetColumn = null;

        var dayColumns = document.querySelectorAll('.day-column');

        // 日付列の右クリックイベント
        dayColumns.forEach(function(column) {
            column.addEventListener('contextmenu', function(e) {
                // タスク要素上での右クリックは無視
                if (e.target.closest('.task')) {
                    return;
                }

                e.preventDefault();

                var dateStr = column.dataset.date;
                if (!dateStr || dateStr === 'null') return;

                currentTargetDate = dateStr;
                currentTargetColumn = column;

                showContextMenu(e.pageX, e.pageY, dateStr);
            });
        });

        // コンテキストメニューのクリックイベント
        contextMenu.addEventListener('click', function(e) {
            var action = e.target.dataset.action;
            if (!action || !currentTargetDate) return;

            handleContextMenuAction(action, currentTargetDate, currentTargetColumn);
            hideContextMenu();
        });

        // 外部クリックでメニューを閉じる
        document.addEventListener('click', function(e) {
            if (!contextMenu.contains(e.target)) {
                hideContextMenu();
            }
        });

        // Escキーでメニューを閉じる
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideContextMenu();
            }
        });

        /**
         * Show context menu at specified position.
         * @param {number} x - X座標
         * @param {number} y - Y座標
         * @param {string} dateStr - 対象日付
         */
        function showContextMenu(x, y, dateStr) {
            var tasksCount = taskBulkMover.getTasksForDate(dateStr).length;

            // タスク数に応じてメニュー項目を更新
            var moveItem = contextMenu.querySelector('[data-action="move-all-tasks"]');
            if (tasksCount === 0) {
                moveItem.textContent = '\ud83d\udce4 \u79fb\u52d5\u3059\u308b\u30bf\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093';
                moveItem.style.opacity = '0.5';
                moveItem.style.cursor = 'not-allowed';
            } else {
                moveItem.textContent = '\ud83d\udce4 ' + tasksCount + '\u500b\u306e\u30bf\u30b9\u30af\u3092\u672a\u5272\u308a\u5f53\u3066\u306b\u79fb\u52d5';
                moveItem.style.opacity = '1';
                moveItem.style.cursor = 'pointer';
            }

            // 曜日非表示項目の更新
            var date = new Date(dateStr);
            var dayName = taskBulkMover.getDayNameFromDate(dateStr);
            var dayLabel = taskBulkMover.dayLabels[taskBulkMover.dayNames.indexOf(dayName)];

            var hideItem = contextMenu.querySelector('[data-action="hide-day"]');
            hideItem.textContent = '\ud83d\udc41\ufe0f ' + dayLabel + '\u66dc\u65e5\u3092\u975e\u8868\u793a';

            // メニューを表示
            contextMenu.style.display = 'block';

            // 画面外に出ないように位置調整
            var menuRect = contextMenu.getBoundingClientRect();
            var viewportWidth = window.innerWidth;
            var viewportHeight = window.innerHeight;

            var adjustedX = x;
            var adjustedY = y;

            if (x + menuRect.width > viewportWidth) {
                adjustedX = viewportWidth - menuRect.width - 10;
            }

            if (y + menuRect.height > viewportHeight) {
                adjustedY = viewportHeight - menuRect.height - 10;
            }

            contextMenu.style.left = adjustedX + 'px';
            contextMenu.style.top = adjustedY + 'px';
        }

        /**
         * Hide context menu.
         */
        function hideContextMenu() {
            contextMenu.style.display = 'none';
            currentTargetDate = null;
            currentTargetColumn = null;
        }

        /**
         * Handle context menu action.
         * @param {string} action - アクション名
         * @param {string} dateStr - 対象日付
         * @param {HTMLElement} column - 対象列要素
         */
        function handleContextMenuAction(action, dateStr, column) {
            switch (action) {
                case 'move-all-tasks':
                    handleBulkMoveAction(dateStr);
                    break;

                case 'hide-day':
                    handleHideDayAction(dateStr);
                    break;

                case 'cancel':
                    // 何もしない（メニューが閉じるだけ）
                    break;
            }
        }

        /**
         * Handle bulk move action.
         * @param {string} dateStr - 対象日付
         */
        function handleBulkMoveAction(dateStr) {
            var tasksToMove = taskBulkMover.getTasksForDate(dateStr);

            if (tasksToMove.length === 0) {
                showBulkMoveNotification('\u79fb\u52d5\u3059\u308b\u30bf\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093', 'info');
                return;
            }

            // 確認ダイアログ
            var date = new Date(dateStr);
            var dayLabel = taskBulkMover.dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
            var dateLabel = (date.getMonth() + 1) + '/' + date.getDate() + '(' + dayLabel + ')';

            if (confirm(dateLabel + '\u306e' + tasksToMove.length + '\u500b\u306e\u30bf\u30b9\u30af\u3092\u672a\u5272\u308a\u5f53\u3066\u306b\u79fb\u52d5\u3057\u307e\u3059\u304b\uff1f')) {
                var movedCount = taskBulkMover.moveTasksToUnassigned(dateStr);
                taskBulkMover.notifyMoveResult(movedCount, dateStr);
                renderWeek();
            }
        }

        /**
         * Handle hide day action.
         * @param {string} dateStr - 対象日付
         */
        function handleHideDayAction(dateStr) {
            var dayName = taskBulkMover.getDayNameFromDate(dateStr);
            var dayLabel = taskBulkMover.dayLabels[taskBulkMover.dayNames.indexOf(dayName)];

            if (confirm(dayLabel + '\u66dc\u65e5\u3092\u975e\u8868\u793a\u306b\u3057\u307e\u3059\u304b\uff1f\n\u305d\u306e\u66dc\u65e5\u306e\u30bf\u30b9\u30af\u306f\u672a\u5272\u308a\u5f53\u3066\u306b\u79fb\u52d5\u3055\u308c\u307e\u3059\u3002')) {
                // 曜日設定のチェックボックスを更新
                var checkbox = document.getElementById('show-' + dayName);
                if (checkbox) {
                    checkbox.checked = false;
                    handleWeekdayChange(dayName, false);
                }
            }
        }
    }

    // Export via window
    window.ContextManager = {
        initializeWeekdaySettings,
        handleWeekdayChange,
        updateWeekdayVisibility,
        updateGridColumns,
        showWeekdayNotification,
        showBulkMoveNotification,
        initializeContextMenu
    };

})();
