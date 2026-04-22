(function() {
'use strict';

/**
 * Statistics Engine - 統計計算エンジン
 * 週間のタスク統計を計算するための関数群
 */

/**
 * Calculate completion rate for the current week
 * Validates: Requirements 1.1, 1.2
 *
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Completion rate statistics with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     total_tasks: number,
 *     completed_tasks: number,
 *     completion_rate: number (0-100),
 *     is_valid: boolean
 *   }
 */
function calculateCompletionRate(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);

        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);

        // Count total and completed tasks for the current week
        let totalTasks = 0;
        let completedTasks = 0;

        // Count active tasks assigned to this week
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                if (task.completed) {
                    completedTasks++;
                }
            }
        });

        // Count archived (completed) tasks from this week
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                totalTasks++;
                completedTasks++;
            }
        });

        // Calculate completion rate
        let completionRate = 0;
        if (totalTasks > 0) {
            completionRate = (completedTasks / totalTasks) * 100;
            // Round to 2 decimal places
            completionRate = Math.round(completionRate * 100) / 100;
        }

        return {
            week_start: weekStartStr,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            completion_rate: completionRate,
            is_valid: true
        };
    } catch (error) {
        console.error('完了率計算エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            total_tasks: 0,
            completed_tasks: 0,
            completion_rate: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Get completion rate for a specific week
 * Validates: Requirements 1.1, 1.2
 *
 * @param {number} weeksOffset - Number of weeks to offset from current week (0 = current, -1 = last week, 1 = next week)
 * @returns {object} Completion rate statistics
 */
function getCompletionRateForWeek(weeksOffset = 0) {
    const targetDate = new Date(currentDate);
    const monday = getMonday(targetDate);
    monday.setDate(monday.getDate() + (weeksOffset * 7));

    return calculateCompletionRate(monday);
}

/**
 * Calculate category-based time analysis for the current week
 * Validates: Requirements 1.3
 *
 * Analyzes time spent on each category by calculating:
 * - Total estimated time per category
 * - Total actual time per category
 * - Time variance (actual - estimated) per category
 *
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Category breakdown with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     categories: {
 *       [categoryKey]: {
 *         name: string,
 *         estimated_time: number,
 *         actual_time: number,
 *         variance: number (actual - estimated),
 *         task_count: number,
 *         completed_count: number
 *       }
 *     },
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     is_valid: boolean
 *   }
 */
function calculateCategoryTimeAnalysis(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);

        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);

        // Initialize category breakdown object
        const categoryBreakdown = {};
        let totalEstimatedTime = 0;
        let totalActualTime = 0;

        // Initialize all categories
        Object.keys(TASK_CATEGORIES).forEach(categoryKey => {
            categoryBreakdown[categoryKey] = {
                name: TASK_CATEGORIES[categoryKey].name,
                estimated_time: 0,
                actual_time: 0,
                variance: 0,
                task_count: 0,
                completed_count: 0
            };
        });

        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const category = validateCategory(task.category);

                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = {
                        name: TASK_CATEGORIES[category].name,
                        estimated_time: 0,
                        actual_time: 0,
                        variance: 0,
                        task_count: 0,
                        completed_count: 0
                    };
                }

                categoryBreakdown[category].estimated_time += task.estimated_time || 0;
                categoryBreakdown[category].actual_time += task.actual_time || 0;
                categoryBreakdown[category].task_count++;

                if (task.completed) {
                    categoryBreakdown[category].completed_count++;
                }
            }
        });

        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const category = validateCategory(task.category);

                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = {
                        name: TASK_CATEGORIES[category].name,
                        estimated_time: 0,
                        actual_time: 0,
                        variance: 0,
                        task_count: 0,
                        completed_count: 0
                    };
                }

                categoryBreakdown[category].estimated_time += task.estimated_time || 0;
                categoryBreakdown[category].actual_time += task.actual_time || 0;
                categoryBreakdown[category].task_count++;
                categoryBreakdown[category].completed_count++;
            }
        });

        // Calculate variance and totals
        Object.keys(categoryBreakdown).forEach(categoryKey => {
            const category = categoryBreakdown[categoryKey];
            category.variance = category.actual_time - category.estimated_time;
            category.variance = Math.round(category.variance * 100) / 100;

            totalEstimatedTime += category.estimated_time;
            totalActualTime += category.actual_time;
        });

        // Round totals to 2 decimal places
        totalEstimatedTime = Math.round(totalEstimatedTime * 100) / 100;
        totalActualTime = Math.round(totalActualTime * 100) / 100;

        return {
            week_start: weekStartStr,
            categories: categoryBreakdown,
            total_estimated_time: totalEstimatedTime,
            total_actual_time: totalActualTime,
            is_valid: true
        };
    } catch (error) {
        console.error('カテゴリ別時間分析エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            categories: {},
            total_estimated_time: 0,
            total_actual_time: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Calculate daily work time for the current week
 * Validates: Requirements 1.4
 *
 * Calculates the total estimated and actual time for each day of the week.
 *
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Daily breakdown with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     daily_breakdown: {
 *       [dateString]: {
 *         date: string (YYYY-MM-DD),
 *         day_name: string (月, 火, etc.),
 *         estimated_time: number,
 *         actual_time: number,
 *         variance: number (actual - estimated),
 *         task_count: number,
 *         completed_count: number
 *       }
 *     },
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     is_valid: boolean
 *   }
 */
function calculateDailyWorkTime(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);

        // Day names in Japanese
        const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

        // Initialize daily breakdown
        const dailyBreakdown = {};
        let totalEstimatedTime = 0;
        let totalActualTime = 0;

        // Initialize all days of the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = formatDate(date);

            dailyBreakdown[dateStr] = {
                date: dateStr,
                day_name: dayNames[i],
                estimated_time: 0,
                actual_time: 0,
                variance: 0,
                task_count: 0,
                completed_count: 0
            };
        }

        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr) {
                const endOfWeek = new Date(monday);
                endOfWeek.setDate(monday.getDate() + 6);
                const endOfWeekStr = formatDate(endOfWeek);

                if (task.assigned_date <= endOfWeekStr) {
                    const dateStr = task.assigned_date;

                    if (dailyBreakdown[dateStr]) {
                        dailyBreakdown[dateStr].estimated_time += task.estimated_time || 0;
                        dailyBreakdown[dateStr].actual_time += task.actual_time || 0;
                        dailyBreakdown[dateStr].task_count++;

                        if (task.completed) {
                            dailyBreakdown[dateStr].completed_count++;
                        }
                    }
                }
            }
        });

        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr) {
                const endOfWeek = new Date(monday);
                endOfWeek.setDate(monday.getDate() + 6);
                const endOfWeekStr = formatDate(endOfWeek);

                if (task.assigned_date <= endOfWeekStr) {
                    const dateStr = task.assigned_date;

                    if (dailyBreakdown[dateStr]) {
                        dailyBreakdown[dateStr].estimated_time += task.estimated_time || 0;
                        dailyBreakdown[dateStr].actual_time += task.actual_time || 0;
                        dailyBreakdown[dateStr].task_count++;
                        dailyBreakdown[dateStr].completed_count++;
                    }
                }
            }
        });

        // Calculate variance and totals
        Object.keys(dailyBreakdown).forEach(dateStr => {
            const day = dailyBreakdown[dateStr];
            day.variance = day.actual_time - day.estimated_time;
            day.variance = Math.round(day.variance * 100) / 100;

            totalEstimatedTime += day.estimated_time;
            totalActualTime += day.actual_time;
        });

        // Round totals to 2 decimal places
        totalEstimatedTime = Math.round(totalEstimatedTime * 100) / 100;
        totalActualTime = Math.round(totalActualTime * 100) / 100;

        return {
            week_start: weekStartStr,
            daily_breakdown: dailyBreakdown,
            total_estimated_time: totalEstimatedTime,
            total_actual_time: totalActualTime,
            is_valid: true
        };
    } catch (error) {
        console.error('日別作業時間計算エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            daily_breakdown: {},
            total_estimated_time: 0,
            total_actual_time: 0,
            is_valid: false,
            error: error.message
        };
    }
}

/**
 * Calculate estimated vs actual time analysis for the current week
 * Validates: Requirements 1.5
 *
 * Compares estimated and actual times to identify:
 * - Overall time variance
 * - Tasks with time overruns
 * - Estimation accuracy
 *
 * @param {Date} weekStartDate - The Monday of the week to calculate for (optional, defaults to current week)
 * @returns {object} Estimated vs actual analysis with the following structure:
 *   {
 *     week_start: string (YYYY-MM-DD),
 *     total_estimated_time: number,
 *     total_actual_time: number,
 *     total_variance: number (actual - estimated),
 *     variance_percentage: number (variance / estimated * 100),
 *     overrun_tasks: Array<{
 *       id: string,
 *       name: string,
 *       estimated_time: number,
 *       actual_time: number,
 *       overrun_time: number,
 *       overrun_percentage: number,
 *       severity: string (minor, moderate, severe)
 *     }>,
 *     on_track_tasks: number,
 *     overrun_task_count: number,
 *     estimation_accuracy: number (0-100, higher is better),
 *     is_valid: boolean
 *   }
 */
function calculateEstimatedVsActualAnalysis(weekStartDate = null) {
    try {
        // Determine the week start date
        const monday = weekStartDate ? getMonday(weekStartDate) : getMonday(currentDate);
        const weekStartStr = formatDate(monday);

        // Calculate the end of the week
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endOfWeekStr = formatDate(endOfWeek);

        let totalEstimatedTime = 0;
        let totalActualTime = 0;
        let onTrackTasks = 0;
        const overrunTasks = [];

        // Analyze active tasks
        tasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const estimatedTime = task.estimated_time || 0;
                const actualTime = task.actual_time || 0;

                totalEstimatedTime += estimatedTime;
                totalActualTime += actualTime;

                // Check for time overrun
                if (actualTime > estimatedTime) {
                    const overrunTime = actualTime - estimatedTime;
                    const overrunPercentage = estimatedTime > 0 ? (overrunTime / estimatedTime) * 100 : 0;
                    const severity = getTimeOverrunSeverity(estimatedTime, actualTime);

                    overrunTasks.push({
                        id: task.id,
                        name: task.name,
                        estimated_time: estimatedTime,
                        actual_time: actualTime,
                        overrun_time: Math.round(overrunTime * 100) / 100,
                        overrun_percentage: Math.round(overrunPercentage * 100) / 100,
                        severity: severity
                    });
                } else {
                    onTrackTasks++;
                }
            }
        });

        // Analyze archived tasks
        const archivedTasks = loadArchivedTasks();
        archivedTasks.forEach(task => {
            if (task.assigned_date && task.assigned_date >= weekStartStr && task.assigned_date <= endOfWeekStr) {
                const estimatedTime = task.estimated_time || 0;
                const actualTime = task.actual_time || 0;

                totalEstimatedTime += estimatedTime;
                totalActualTime += actualTime;

                // Archived tasks are considered on track (completed)
                onTrackTasks++;
            }
        });

        // Calculate variance
        const totalVariance = totalActualTime - totalEstimatedTime;
        const variancePercentage = totalEstimatedTime > 0 ? (totalVariance / totalEstimatedTime) * 100 : 0;

        // Calculate estimation accuracy (0-100, higher is better)
        // Perfect estimation = 100, 50% overrun = 0
        let estimationAccuracy = 100;
        if (variancePercentage > 0) {
            estimationAccuracy = Math.max(0, 100 - variancePercentage);
        } else if (variancePercentage < 0) {
            // Underestimation is also penalized, but less severely
            estimationAccuracy = Math.max(0, 100 + (variancePercentage / 2));
        }
        estimationAccuracy = Math.round(estimationAccuracy * 100) / 100;

        return {
            week_start: weekStartStr,
            total_estimated_time: Math.round(totalEstimatedTime * 100) / 100,
            total_actual_time: Math.round(totalActualTime * 100) / 100,
            total_variance: Math.round(totalVariance * 100) / 100,
            variance_percentage: Math.round(variancePercentage * 100) / 100,
            overrun_tasks: overrunTasks,
            on_track_tasks: onTrackTasks,
            overrun_task_count: overrunTasks.length,
            estimation_accuracy: estimationAccuracy,
            is_valid: true
        };
    } catch (error) {
        console.error('見積もり vs 実績分析エラー:', error);
        return {
            week_start: formatDate(getMonday(currentDate)),
            total_estimated_time: 0,
            total_actual_time: 0,
            total_variance: 0,
            variance_percentage: 0,
            overrun_tasks: [],
            on_track_tasks: 0,
            overrun_task_count: 0,
            estimation_accuracy: 0,
            is_valid: false,
            error: error.message
        };
    }
}

window.StatisticsEngine = {
    calculateCompletionRate,
    getCompletionRateForWeek,
    calculateCategoryTimeAnalysis,
    calculateDailyWorkTime,
    calculateEstimatedVsActualAnalysis
};

})();
