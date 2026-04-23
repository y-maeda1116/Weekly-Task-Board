(function() {
    'use strict';

    /**
     * ダッシュボード更新関数
     * 週間統計情報を計算してダッシュボードに表示
     */
    function updateDashboard() {
        try {
            // 統計パネルの日付を取得
            var dashboardDatePicker = document.getElementById('dashboard-date-picker');
            var targetDate = new Date();

            if (dashboardDatePicker && dashboardDatePicker.value) {
                targetDate = new Date(dashboardDatePicker.value + 'T00:00:00');
            }

            // 統計情報を計算（指定された週のデータを使用）
            var completionRate = calculateCompletionRateForDate(targetDate);
            var categoryAnalysis = calculateCategoryTimeAnalysisForDate(targetDate);
            var dailyWorkTime = calculateDailyWorkTimeForDate(targetDate);

            // 完了率を更新
            var completionRateValue = document.getElementById('completion-rate-value');
            if (completionRateValue) {
                completionRateValue.textContent = completionRate.completion_rate + '%';
            }

            // 完了タスク数を更新
            var completedTasksValue = document.getElementById('completed-tasks-value');
            if (completedTasksValue) {
                completedTasksValue.textContent = completionRate.completed_tasks + '/' + completionRate.total_tasks;
            }

            // 見積時間を更新
            var estimatedTimeValue = document.getElementById('estimated-time-value');
            if (estimatedTimeValue) {
                var estimatedHours = Math.floor(categoryAnalysis.total_estimated_time);
                var estimatedMinutes = Math.round((categoryAnalysis.total_estimated_time % 1) * 60);
                estimatedTimeValue.textContent = estimatedHours + 'h ' + estimatedMinutes + 'm';
            }

            // 実績時間を更新
            var actualTimeValue = document.getElementById('actual-time-value');
            if (actualTimeValue) {
                var actualHours = Math.floor(categoryAnalysis.total_actual_time);
                var actualMinutes = Math.round((categoryAnalysis.total_actual_time % 1) * 60);
                actualTimeValue.textContent = actualHours + 'h ' + actualMinutes + 'm';
            }

            // カテゴリ別時間分析を更新
            updateCategoryBreakdown(categoryAnalysis);

            // 日別作業時間を更新
            updateDailyBreakdown(dailyWorkTime);

        } catch (error) {
            console.error('ダッシュボード更新エラー:', error);
        }
    }

    /**
     * カテゴリ別時間分析を表示
     * @param {object} categoryAnalysis - カテゴリ別分析データ
     */
    function updateCategoryBreakdown(categoryAnalysis) {
        var categoryBreakdownEl = document.getElementById('category-breakdown');
        if (!categoryBreakdownEl) return;

        categoryBreakdownEl.textContent = '';

        // カテゴリ情報を取得して表示
        Object.keys(categoryAnalysis.categories).forEach(function(categoryKey) {
            var category = categoryAnalysis.categories[categoryKey];

            // タスク数が0の場合はスキップ
            if (category.task_count === 0) {
                return;
            }

            var categoryInfo = getCategoryInfo(categoryKey);

            var categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.style.borderLeftColor = categoryInfo.color;

            var completionRate = category.task_count > 0
                ? Math.round((category.completed_count / category.task_count) * 100)
                : 0;

            // Build category item using DOM methods
            var nameDiv = document.createElement('div');
            nameDiv.className = 'category-item-name';
            nameDiv.style.color = categoryInfo.color;
            nameDiv.textContent = categoryInfo.name;

            var statsDiv = document.createElement('div');
            statsDiv.className = 'category-item-stats';

            var estimStat = document.createElement('div');
            estimStat.className = 'category-item-stat';
            var estimLabel = document.createElement('div');
            estimLabel.className = 'category-item-stat-label';
            estimLabel.textContent = '\u898b\u7a4d';
            var estimValue = document.createElement('div');
            estimValue.className = 'category-item-stat-value';
            estimValue.textContent = category.estimated_time.toFixed(1) + 'h';
            estimStat.appendChild(estimLabel);
            estimStat.appendChild(estimValue);
            statsDiv.appendChild(estimStat);

            var actStat = document.createElement('div');
            actStat.className = 'category-item-stat';
            var actLabel = document.createElement('div');
            actLabel.className = 'category-item-stat-label';
            actLabel.textContent = '\u5b9f\u7e3e';
            var actValue = document.createElement('div');
            actValue.className = 'category-item-stat-value';
            actValue.textContent = category.actual_time.toFixed(1) + 'h';
            actStat.appendChild(actLabel);
            actStat.appendChild(actValue);
            statsDiv.appendChild(actStat);

            var rateStat = document.createElement('div');
            rateStat.className = 'category-item-stat';
            var rateLabel = document.createElement('div');
            rateLabel.className = 'category-item-stat-label';
            rateLabel.textContent = '\u5b8c\u4e86\u7387';
            var rateValue = document.createElement('div');
            rateValue.className = 'category-item-stat-value';
            rateValue.textContent = completionRate + '%';
            rateStat.appendChild(rateLabel);
            rateStat.appendChild(rateValue);
            statsDiv.appendChild(rateStat);

            var countStat = document.createElement('div');
            countStat.className = 'category-item-stat';
            var countLabel = document.createElement('div');
            countLabel.className = 'category-item-stat-label';
            countLabel.textContent = '\u30bf\u30b9\u30af\u6570';
            var countValue = document.createElement('div');
            countValue.className = 'category-item-stat-value';
            countValue.textContent = category.completed_count + '/' + category.task_count;
            countStat.appendChild(countLabel);
            countStat.appendChild(countValue);
            statsDiv.appendChild(countStat);

            categoryItem.appendChild(nameDiv);
            categoryItem.appendChild(statsDiv);
            categoryBreakdownEl.appendChild(categoryItem);
        });
    }

    /**
     * 日別作業時間を表示
     * @param {object} dailyWorkTime - 日別作業時間データ
     */
    function updateDailyBreakdown(dailyWorkTime) {
        var dailyBreakdownEl = document.getElementById('daily-breakdown');
        if (!dailyBreakdownEl) return;

        dailyBreakdownEl.textContent = '';

        // dailyWorkTimeがnullまたはundefinedの場合は処理を中止
        if (!dailyWorkTime) return;

        // 日別データを表示
        var dailyData = dailyWorkTime.daily_breakdown || dailyWorkTime;

        Object.keys(dailyData).forEach(function(dateStr) {
            var day = dailyData[dateStr];

            var dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';

            // 日付をフォーマット
            var date = new Date(dateStr);
            var dateFormatted = (date.getMonth() + 1) + '/' + date.getDate();

            // 見積時間と実績時間の差分を計算
            var estimatedTime = day.estimated_time || 0;
            var actualTime = day.actual_time || 0;
            var variance = actualTime - estimatedTime;
            var varianceClass = variance > 0 ? 'overrun' : variance < 0 ? 'underrun' : 'match';
            var varianceText = variance > 0 ? '+' + variance.toFixed(1) + 'h' : variance.toFixed(1) + 'h';

            // Build using DOM methods
            var dayDiv = document.createElement('div');
            dayDiv.className = 'daily-item-day';
            dayDiv.textContent = (day.day_name || '') + '\u66dc\u65e5';

            var dateDiv = document.createElement('div');
            dateDiv.className = 'daily-item-date';
            dateDiv.textContent = dateFormatted;

            var statsDiv = document.createElement('div');
            statsDiv.className = 'daily-item-stats';

            var estStat = document.createElement('div');
            estStat.className = 'daily-item-stat';
            var estLbl = document.createElement('span');
            estLbl.className = 'daily-item-stat-label';
            estLbl.textContent = '\u898b\u7a4d';
            var estVal = document.createElement('span');
            estVal.className = 'daily-item-stat-value';
            estVal.textContent = estimatedTime.toFixed(1) + 'h';
            estStat.appendChild(estLbl);
            estStat.appendChild(estVal);
            statsDiv.appendChild(estStat);

            var actStat = document.createElement('div');
            actStat.className = 'daily-item-stat';
            var actLbl = document.createElement('span');
            actLbl.className = 'daily-item-stat-label';
            actLbl.textContent = '\u5b9f\u7e3e';
            var actVal = document.createElement('span');
            actVal.className = 'daily-item-stat-value';
            actVal.textContent = actualTime.toFixed(1) + 'h';
            actStat.appendChild(actLbl);
            actStat.appendChild(actVal);
            statsDiv.appendChild(actStat);

            var varStat = document.createElement('div');
            varStat.className = 'daily-item-stat';
            var varLbl = document.createElement('span');
            varLbl.className = 'daily-item-stat-label';
            varLbl.textContent = '\u5dee\u5206';
            var varVal = document.createElement('span');
            varVal.className = 'daily-item-stat-value time-' + varianceClass;
            varVal.textContent = varianceText;
            varStat.appendChild(varLbl);
            varStat.appendChild(varVal);
            statsDiv.appendChild(varStat);

            var tasksDiv = document.createElement('div');
            tasksDiv.className = 'daily-item-tasks';
            tasksDiv.textContent = '\u5b8c\u4e86: ' + (day.completed_count || 0) + '/' + (day.task_count || 0);

            dailyItem.appendChild(dayDiv);
            dailyItem.appendChild(dateDiv);
            dailyItem.appendChild(statsDiv);
            dailyItem.appendChild(tasksDiv);

            dailyBreakdownEl.appendChild(dailyItem);
        });
    }

    /**
     * 指定された日付の週の完了率を計算
     */
    function calculateCompletionRateForDate(targetDate) {
        var monday = getMonday(targetDate);
        var sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        var mondayStr = formatDate(monday);
        var sundayStr = formatDate(sunday);

        var allTasks = loadTasks();
        var archivedTasks = loadArchivedTasks();
        var weekTasks = allTasks.concat(archivedTasks).filter(function(task) {
            if (!task.assigned_date) return false;
            return task.assigned_date >= mondayStr && task.assigned_date <= sundayStr;
        });

        var completedCount = weekTasks.filter(function(t) { return t.completed; }).length;
        var completionRate = weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;

        return {
            total_tasks: weekTasks.length,
            completed_tasks: completedCount,
            completion_rate: completionRate,
            is_valid: true
        };
    }

    /**
     * 指定された日付の週のカテゴリ別時間分析を計算
     */
    function calculateCategoryTimeAnalysisForDate(targetDate) {
        var monday = getMonday(targetDate);
        var sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        var mondayStr = formatDate(monday);
        var sundayStr = formatDate(sunday);

        var allTasks = loadTasks();
        var archivedTasks = loadArchivedTasks();
        var weekTasks = allTasks.concat(archivedTasks).filter(function(task) {
            if (!task.assigned_date) return false;
            return task.assigned_date >= mondayStr && task.assigned_date <= sundayStr;
        });

        var categories = {};
        var totalEstimatedTime = 0;
        var totalActualTime = 0;

        weekTasks.forEach(function(task) {
            var category = task.category || 'task';
            if (!categories[category]) {
                categories[category] = {
                    task_count: 0,
                    completed_count: 0,
                    estimated_time: 0,
                    actual_time: 0
                };
            }

            categories[category].task_count++;
            if (task.completed) categories[category].completed_count++;
            categories[category].estimated_time += task.estimated_time || 0;
            categories[category].actual_time += task.actual_time || 0;

            totalEstimatedTime += task.estimated_time || 0;
            totalActualTime += task.actual_time || 0;
        });

        return {
            categories: categories,
            total_estimated_time: totalEstimatedTime / 60,
            total_actual_time: totalActualTime / 60
        };
    }

    /**
     * 指定された日付の週の日別作業時間を計算
     */
    function calculateDailyWorkTimeForDate(targetDate) {
        var monday = getMonday(targetDate);
        var dailyBreakdown = {};

        for (var i = 0; i < 7; i++) {
            var date = new Date(monday);
            date.setDate(monday.getDate() + i);
            var dateStr = formatDate(date);

            var allTasks = loadTasks();
            var archivedTasks = loadArchivedTasks();
            var dayTasks = allTasks.concat(archivedTasks).filter(function(task) { return task.assigned_date === dateStr; });

            var totalEstimatedTime = dayTasks.reduce(function(sum, task) { return sum + (task.estimated_time || 0); }, 0);
            var totalActualTime = dayTasks.reduce(function(sum, task) { return sum + (task.actual_time || 0); }, 0);
            var completedCount = dayTasks.filter(function(t) { return t.completed; }).length;

            var dayNames = ['\u65e5', '\u6708', '\u706b', '\u6c34', '\u6728', '\u91d1', '\u571f'];

            dailyBreakdown[dateStr] = {
                day_name: dayNames[date.getDay()],
                estimated_time: totalEstimatedTime / 60,
                actual_time: totalActualTime / 60,
                task_count: dayTasks.length,
                completed_count: completedCount
            };
        }

        return {
            daily_breakdown: dailyBreakdown
        };
    }

    /**
     * ダッシュボード表示切り替え機能
     */
    function initializeDashboardToggle() {
        var statisticsToggleBtn = document.getElementById('statistics-toggle');
        var dashboardPanel = document.getElementById('dashboard-panel');
        var closeDashboardBtn = document.getElementById('close-dashboard');
        var dashboardDatePicker = document.getElementById('dashboard-date-picker');
        var dashboardPrevWeekBtn = document.getElementById('dashboard-prev-week');
        var dashboardNextWeekBtn = document.getElementById('dashboard-next-week');

        if (!statisticsToggleBtn || !dashboardPanel) return;

        var dashboardWeekOffset = 0;

        // 日付ピッカーの更新表示
        function updateDashboardDateDisplay() {
            if (dashboardDatePicker) {
                var monday = getMonday(new Date());
                var weekMonday = new Date(monday);
                weekMonday.setDate(monday.getDate() + (dashboardWeekOffset * 7));
                dashboardDatePicker.value = formatDate(weekMonday);
            }
        }

        // 統計ボタンクリックで統計パネルを表示
        statisticsToggleBtn.addEventListener('click', function() {
            dashboardPanel.style.display = 'block';
            dashboardWeekOffset = 0;
            updateDashboardDateDisplay();
            updateDashboard();
        });

        // 閉じるボタンで統計パネルを非表示
        if (closeDashboardBtn) {
            closeDashboardBtn.addEventListener('click', function() {
                dashboardPanel.style.display = 'none';
            });
        }

        // 前週ボタン
        if (dashboardPrevWeekBtn) {
            dashboardPrevWeekBtn.addEventListener('click', function() {
                dashboardWeekOffset--;
                updateDashboardDateDisplay();
                updateDashboard();
            });
        }

        // 次週ボタン
        if (dashboardNextWeekBtn) {
            dashboardNextWeekBtn.addEventListener('click', function() {
                dashboardWeekOffset++;
                updateDashboardDateDisplay();
                updateDashboard();
            });
        }

        // パネル外をクリックで閉じる
        dashboardPanel.addEventListener('click', function(e) {
            if (e.target === dashboardPanel) {
                dashboardPanel.style.display = 'none';
            }
        });
    }

    // Export via window
    window.DashboardManager = {
        updateDashboard,
        updateCategoryBreakdown,
        updateDailyBreakdown,
        calculateCompletionRateForDate,
        calculateCategoryTimeAnalysisForDate,
        calculateDailyWorkTimeForDate,
        initializeDashboardToggle
    };

})();
