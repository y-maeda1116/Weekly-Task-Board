(function() {
'use strict';

/**
 * RecurrenceEngine - 繰り返しタスク生成エンジン
 * 毎日、毎週、毎月のパターンで新規タスクを自動生成
 */
class RecurrenceEngine {
    constructor() {
        this.RECURRENCE_PATTERNS = {
            'daily': { name: '毎日', interval: 1 },
            'weekly': { name: '毎週', interval: 7 },
            'monthly': { name: '毎月', interval: 30 }
        };
    }

    /**
     * 繰り返しタスクから新規タスクを生成
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} targetDate - 生成対象の日付
     * @returns {object|null} 生成されたタスク、または生成不可の場合はnull
     */
    generateTaskFromRecurrence(recurringTask, targetDate) {
        // 繰り返しタスクの有効性チェック
        if (!recurringTask.is_recurring || !recurringTask.recurrence_pattern) {
            return null;
        }

        // targetDate のバリデーション
        if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
            console.error('Invalid targetDate:', targetDate);
            return null;
        }

        // 終了日チェック
        if (recurringTask.recurrence_end_date) {
            const endDate = new Date(recurringTask.recurrence_end_date);
            endDate.setHours(0, 0, 0, 0);
            targetDate.setHours(0, 0, 0, 0);

            if (targetDate > endDate) {
                return null;
            }
        }

        // 新規タスクを生成
        const newTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: recurringTask.name,
            estimated_time: recurringTask.estimated_time,
            actual_time: 0,
            priority: recurringTask.priority,
            category: recurringTask.category,
            assigned_date: formatDate(targetDate),
            due_date: null,
            details: recurringTask.details,
            completed: false,
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_end_date: null
        };

        return newTask;
    }

    /**
     * 毎日パターンの生成 (8.1)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateDailyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        while (currentDate <= end) {
            const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
            if (newTask) {
                generatedTasks.push(newTask);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return generatedTasks;
    }

    /**
     * 毎週パターンの生成 (8.2)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateWeeklyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];

        // 元のタスクの日付を取得
        if (!recurringTask.assigned_date) {
            return generatedTasks;
        }

        const originalDate = new Date(recurringTask.assigned_date);
        originalDate.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        // 元のタスクの曜日を取得
        const originalDayOfWeek = originalDate.getDay();

        // startDateから最初の該当曜日を見つける
        let currentDate = new Date(start);
        const currentDayOfWeek = currentDate.getDay();
        const daysUntilTarget = (originalDayOfWeek - currentDayOfWeek + 7) % 7;
        currentDate.setDate(currentDate.getDate() + daysUntilTarget);

        // 該当曜日のタスクを生成（元のタスクの日付以降のみ）
        while (currentDate <= end) {
            // 元のタスクの日付よりも前の日付には生成しない
            if (currentDate >= originalDate) {
                const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
                if (newTask) {
                    generatedTasks.push(newTask);
                }
            }
            currentDate.setDate(currentDate.getDate() + 7);
        }

        return generatedTasks;
    }

    /**
     * 毎月パターンの生成 (8.3)
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたタスク配列
     */
    generateMonthlyTasks(recurringTask, startDate, endDate) {
        const generatedTasks = [];
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        const startDay = currentDate.getDate();

        while (currentDate <= end) {
            const newTask = this.generateTaskFromRecurrence(recurringTask, new Date(currentDate));
            if (newTask) {
                generatedTasks.push(newTask);
            }

            // 月を進める（日付をリセットしてから月を進める）
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() + 1);

            // 月末の日付調整（例：1月31日 -> 2月28日）
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            if (startDay > lastDayOfMonth) {
                currentDate.setDate(lastDayOfMonth);
            } else {
                currentDate.setDate(startDay);
            }
        }

        return generatedTasks;
    }

    /**
     * 終了日の処理 (8.4)
     * 繰り返しタスクの終了日を検証・更新
     * @param {object} recurringTask - 繰り返しタスク設定
     * @param {string} newEndDate - 新しい終了日 (YYYY-MM-DD形式)
     * @returns {boolean} 更新成功の可否
     */
    updateRecurrenceEndDate(recurringTask, newEndDate) {
        if (!recurringTask.is_recurring) {
            console.warn('This task is not a recurring task');
            return false;
        }

        // 終了日の妥当性チェック
        if (newEndDate) {
            const endDate = new Date(newEndDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (endDate < today) {
                console.warn('End date cannot be in the past');
                return false;
            }
        }

        recurringTask.recurrence_end_date = newEndDate || null;
        return true;
    }

    /**
     * 繰り返しタスクの有効期限をチェック
     * @param {object} recurringTask - 繰り返しタスク設定
     * @returns {boolean} 有効期限内かどうか
     */
    isRecurrenceActive(recurringTask) {
        if (!recurringTask.is_recurring) {
            return false;
        }

        if (recurringTask.recurrence_end_date) {
            const endDate = new Date(recurringTask.recurrence_end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return today <= endDate;
        }

        return true;
    }

    /**
     * 指定期間内の繰り返しタスクをすべて生成
     * @param {object[]} recurringTasks - 繰り返しタスク配列
     * @param {Date} startDate - 開始日
     * @param {Date} endDate - 終了日
     * @returns {object[]} 生成されたすべてのタスク
     */
    generateAllRecurringTasks(recurringTasks, startDate, endDate) {
        const allGeneratedTasks = [];

        recurringTasks.forEach(recurringTask => {
            if (!this.isRecurrenceActive(recurringTask)) {
                return;
            }

            let generatedTasks = [];

            switch (recurringTask.recurrence_pattern) {
                case 'daily':
                    generatedTasks = this.generateDailyTasks(recurringTask, startDate, endDate);
                    break;
                case 'weekly':
                    generatedTasks = this.generateWeeklyTasks(recurringTask, startDate, endDate);
                    break;
                case 'monthly':
                    generatedTasks = this.generateMonthlyTasks(recurringTask, startDate, endDate);
                    break;
                default:
                    console.warn(`Unknown recurrence pattern: ${recurringTask.recurrence_pattern}`);
            }

            allGeneratedTasks.push(...generatedTasks);
        });

        return allGeneratedTasks;
    }
}

window.RecurrenceEngine = RecurrenceEngine;

})();
