import type { Task } from '../types';
import type { Settings } from '../types/storage';
import {
  saveTasksToStorage,
  loadTasksFromStorage,
  loadArchivedTasksFromStorage,
  saveArchivedTasksToStorage,
  saveSettings,
} from '../app/storage';
import { validateCategory } from '../utils/validation';
import { formatDate } from '../utils/date';

interface ExportData {
  tasks: Task[];
  settings: Settings;
  archive: Task[];
  exportInfo: {
    exportDate: string;
    version: string;
    categoriesIncluded: boolean;
    recurringTasksIncluded: boolean;
  };
}

function loadArchivedTasks(): Task[] {
  return loadArchivedTasksFromStorage();
}

function saveArchivedTasks(tasks: Task[]): void {
  saveArchivedTasksToStorage(tasks);
}

export function exportData(
  tasks: Task[],
  settings: Settings,
): void {
  const archivedTasks = loadArchivedTasks();
  const data: ExportData = {
    tasks,
    settings,
    archive: archivedTasks,
    exportInfo: {
      exportDate: new Date().toISOString(),
      version: '1.1',
      categoriesIncluded: true,
      recurringTasksIncluded: true,
    },
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

export function importData(
  file: File,
  onTasksUpdate: (tasks: Task[]) => void,
  onSettingsUpdate: (settings: Settings) => void,
  renderWeek: () => void,
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target!.result as string) as ExportData;

      if (importedData.tasks) {
        const tasks = importedData.tasks.map(task => ({
          ...task,
          completed: task.completed || false,
          category: validateCategory(task.category),
          is_recurring: task.is_recurring === true,
          recurrence_pattern: task.is_recurring ? (task.recurrence_pattern || null) : null,
          recurrence_end_date: task.is_recurring ? (task.recurrence_end_date || null) : null,
        }));
        onTasksUpdate(tasks);
        saveTasksToStorage(tasks);
      }

      if (importedData.settings) {
        const settings = importedData.settings;
        onSettingsUpdate(settings);
        saveSettings(settings);
        const input = document.getElementById('ideal-daily-minutes') as HTMLInputElement | null;
        if (input) input.value = String(settings.ideal_daily_minutes);
      }

      if (importedData.archive) {
        const archive = importedData.archive.map(task => ({
          ...task,
          category: validateCategory(task.category),
          is_recurring: task.is_recurring === true,
          recurrence_pattern: task.is_recurring ? (task.recurrence_pattern || null) : null,
          recurrence_end_date: task.is_recurring ? (task.recurrence_end_date || null) : null,
        }));
        saveArchivedTasks(archive);
      }

      renderWeek();
      alert('データのインポートが完了しました。');
    } catch (error) {
      alert('インポート中にエラーが発生しました: ' + (error as Error).message);
    }
  };
  reader.readAsText(file);
}
