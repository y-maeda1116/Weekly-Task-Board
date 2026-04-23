(function() {
'use strict';

/**
 * TaskBulkMover - タスクの一括移動を管理するクラス
 */
class TaskBulkMover {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
    }

    /**
     * 指定日のタスクを未割り当てに移動
     * @param {string} dateString - 移動対象の日付文字列 (YYYY-MM-DD)
     * @returns {number} 移動したタスク数
     */
    moveTasksToUnassigned(dateString) {
        if (!tasks || !dateString) return 0;

        try {
            let movedCount = 0;
            tasks.forEach(task => {
                if (task.assigned_date === dateString && !task.completed) {
                    task.assigned_date = null;
                    movedCount++;
                }
            });

            if (movedCount > 0) {
                saveTasks();
            }

            return movedCount;
        } catch (error) {
            console.error('タスク移動エラー:', error);
            showBulkMoveNotification('タスクの移動に失敗しました', 'error');
            return 0;
        }
    }

    /**
     * 指定日のタスクを取得
     * @param {string} dateString - 対象の日付文字列 (YYYY-MM-DD)
     * @returns {Array} その日のタスク配列
     */
    getTasksForDate(dateString) {
        if (!tasks || !dateString) return [];

        return tasks.filter(task =>
            task.assigned_date === dateString && !task.completed
        );
    }

    /**
     * 一括移動の実行
     * @param {Array} tasksToMove - 移動するタスク配列
     * @returns {number} 移動したタスク数
     */
    executeBulkMove(tasksToMove) {
        let movedCount = 0;

        tasksToMove.forEach(task => {
            task.assigned_date = null;
            movedCount++;
        });

        if (movedCount > 0) {
            saveTasks();
        }

        return movedCount;
    }

    /**
     * 移動結果の通知
     * @param {number} movedCount - 移動したタスク数
     * @param {string} dateString - 移動元の日付
     */
    notifyMoveResult(movedCount, dateString) {
        if (movedCount === 0) {
            showBulkMoveNotification('移動するタスクがありませんでした', 'info');
            return;
        }

        const date = new Date(dateString);
        const dayOfWeek = this.dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]; // 日曜日を6に調整
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek})`;

        showBulkMoveNotification(
            `${dateStr}の${movedCount}個のタスクを未割り当てに移動しました`,
            'success'
        );
    }

    /**
     * 日付から曜日名を取得
     * @param {string} dateString - 日付文字列 (YYYY-MM-DD)
     * @returns {string} 曜日名
     */
    getDayNameFromDate(dateString) {
        const date = new Date(dateString);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // 日曜日を6に調整
        return this.dayNames[dayIndex];
    }
}

/**
 * WeekdayManager - 曜日の表示/非表示状態を管理するクラス
 */
class WeekdayManager {
    constructor() {
        this.dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        this.weekdaySettings = {};
        this.loadSettings();
    }

    /**
     * 設定の読み込み
     */
    loadSettings() {
        if (settings && settings.weekday_visibility) {
            this.weekdaySettings = { ...settings.weekday_visibility };
        } else {
            // デフォルト設定
            this.weekdaySettings = {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: true,
                sunday: true
            };
        }
    }

    /**
     * 設定の保存
     */
    saveSettings() {
        try {
            if (settings) {
                settings.weekday_visibility = { ...this.weekdaySettings };
                saveSettings();
            }
        } catch (error) {
            console.error('曜日設定の保存に失敗:', error);
            showBulkMoveNotification('設定の保存に失敗しました', 'error');
        }
    }

    /**
     * 曜日の表示/非表示切り替え
     * @param {string} dayName - 曜日名 (monday, tuesday, etc.)
     * @param {boolean} visible - 表示するかどうか
     */
    toggleWeekday(dayName, visible) {
        if (this.dayNames.includes(dayName)) {
            this.weekdaySettings[dayName] = visible;
            this.saveSettings();

            // 非表示にする場合、その曜日のタスクを未割り当てに移動
            if (!visible) {
                this.moveTasksToUnassigned(dayName);
            }
        }
    }

    /**
     * 表示中の曜日一覧を取得
     * @returns {string[]} 表示中の曜日名配列
     */
    getVisibleWeekdays() {
        return this.dayNames.filter(day => this.weekdaySettings[day]);
    }

    /**
     * 非表示の曜日一覧を取得
     * @returns {string[]} 非表示の曜日名配列
     */
    getHiddenWeekdays() {
        return this.dayNames.filter(day => !this.weekdaySettings[day]);
    }

    /**
     * 曜日が表示されているかチェック
     * @param {string} dayName - 曜日名
     * @returns {boolean} 表示されているかどうか
     */
    isWeekdayVisible(dayName) {
        return this.weekdaySettings[dayName] || false;
    }

    /**
     * 指定曜日のタスクを未割り当てに移動
     * @param {string} dayName - 曜日名
     * @returns {number} 移動したタスク数
     */
    moveTasksToUnassigned(dayName) {
        if (!tasks) return 0;

        const monday = getMonday(currentDate);
        const dayIndex = this.dayNames.indexOf(dayName);
        if (dayIndex === -1) return 0;

        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIndex);
        const targetDateStr = formatDate(targetDate);

        let movedCount = 0;
        tasks.forEach(task => {
            if (task.assigned_date === targetDateStr) {
                task.assigned_date = null;
                movedCount++;
            }
        });

        if (movedCount > 0) {
            saveTasks();
            console.log(`${movedCount}個のタスクを未割り当てに移動しました`);
        }

        return movedCount;
    }

    /**
     * 曜日設定のバリデーション
     * @param {object} settings - 検証する設定オブジェクト
     * @returns {object} 検証済み設定オブジェクト
     */
    validateSettings(settings) {
        const validatedSettings = {};

        this.dayNames.forEach(day => {
            validatedSettings[day] = typeof settings[day] === 'boolean' ? settings[day] : true;
        });

        return validatedSettings;
    }
}

window.TaskBulkMover = TaskBulkMover;
window.WeekdayManager = WeekdayManager;

})();
