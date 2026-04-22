(function() {
'use strict';

// --- データのエクスポート/インポートロジック ---

function exportData() {
    const archivedTasks = loadArchivedTasks();

    // カテゴリ情報と繰り返しタスク情報を含むデータの準備
    const data = {
        tasks: tasks,
        settings: settings,
        archive: archivedTasks,
        exportInfo: {
            exportDate: new Date().toISOString(),
            version: "1.1",
            categoriesIncluded: true,
            recurringTasksIncluded: true
        }
    };

    // エクスポート前にカテゴリ情報と繰り返しタスク情報の存在を確認
    const tasksWithCategories = tasks.filter(task => task.category).length;
    const archivedWithCategories = archivedTasks.filter(task => task.category).length;
    const tasksWithRecurrence = tasks.filter(task => task.is_recurring).length;
    const archivedWithRecurrence = archivedTasks.filter(task => task.is_recurring).length;

    console.log(`Exporting ${tasks.length} tasks (${tasksWithCategories} with categories, ${tasksWithRecurrence} recurring) and ${archivedTasks.length} archived tasks (${archivedWithCategories} with categories, ${archivedWithRecurrence} recurring)`);

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

    // エクスポート完了メッセージ
    console.log("Data export completed with category information and recurring task data included.");
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            let importStats = {
                tasksImported: 0,
                tasksWithCategories: 0,
                tasksWithRecurrence: 0,
                archivedImported: 0,
                archivedWithCategories: 0,
                archivedWithRecurrence: 0,
                categoriesFixed: 0,
                recurringTasksImported: 0
            };

            if (importedData.tasks) {
                // タスク配列を上書き（カテゴリ情報と繰り返しタスク情報の検証を含む）
                tasks = importedData.tasks.map(task => {
                    const originalCategory = task.category;
                    const validatedCategory = validateCategory(task.category);

                    if (originalCategory !== validatedCategory) {
                        importStats.categoriesFixed++;
                    }
                    if (validatedCategory !== 'task') {
                        importStats.tasksWithCategories++;
                    }

                    // 繰り返しタスク情報の検証
                    const isRecurring = task.is_recurring === true;
                    if (isRecurring) {
                        importStats.tasksWithRecurrence++;
                        importStats.recurringTasksImported++;
                    }

                    return {
                        ...task,
                        completed: task.completed || false,
                        category: validatedCategory,
                        is_recurring: isRecurring,
                        recurrence_pattern: isRecurring ? (task.recurrence_pattern || null) : null,
                        recurrence_end_date: isRecurring ? (task.recurrence_end_date || null) : null
                    };
                });
                importStats.tasksImported = tasks.length;
                saveTasks();
                console.log(`Imported ${importStats.tasksImported} tasks, ${importStats.tasksWithCategories} with categories, ${importStats.tasksWithRecurrence} recurring`);
            }

            if (importedData.settings) {
                // 設定オブジェクトを上書き
                settings = { ...settings, ...importedData.settings };
                saveSettings();
                const idealDailyMinutesInput = document.getElementById('ideal-daily-minutes');
                if (idealDailyMinutesInput) {
                    idealDailyMinutesInput.value = settings.ideal_daily_minutes;
                }
                console.log('Settings imported successfully');
            }

            if (importedData.archive) {
                // アーカイブデータを上書き（カテゴリ情報と繰り返しタスク情報の検証を含む）
                const validatedArchive = importedData.archive.map(task => {
                    const originalCategory = task.category;
                    const validatedCategory = validateCategory(task.category);

                    if (originalCategory !== validatedCategory) {
                        importStats.categoriesFixed++;
                    }
                    if (validatedCategory !== 'task') {
                        importStats.archivedWithCategories++;
                    }

                    // 繰り返しタスク情報の検証
                    const isRecurring = task.is_recurring === true;
                    if (isRecurring) {
                        importStats.archivedWithRecurrence++;
                        importStats.recurringTasksImported++;
                    }

                    return {
                        ...task,
                        category: validatedCategory,
                        is_recurring: isRecurring,
                        recurrence_pattern: isRecurring ? (task.recurrence_pattern || null) : null,
                        recurrence_end_date: isRecurring ? (task.recurrence_end_date || null) : null
                    };
                });
                importStats.archivedImported = validatedArchive.length;
                saveArchivedTasks(validatedArchive);
                console.log(`Imported ${importStats.archivedImported} archived tasks, ${importStats.archivedWithCategories} with categories, ${importStats.archivedWithRecurrence} recurring`);
            }

            renderWeek();

            // 詳細なインポート結果を表示
            let message = 'データのインポートが完了しました。';
            if (importStats.categoriesFixed > 0) {
                message += `\n${importStats.categoriesFixed}個のカテゴリが修正されました。`;
            }
            if (importStats.recurringTasksImported > 0) {
                message += `\n${importStats.recurringTasksImported}個の繰り返しタスク情報がインポートされました。`;
            }
            alert(message);

            console.log('Import completed:', importStats);

        } catch (error) {
            alert('インポート中にエラーが発生しました: ' + error.message);
            console.error('Import Error:', error);
        }
    };
    reader.readAsText(file);
}

window.ExportImport = { exportData, importData };

})();
