import type { Task } from '../types';
import type { Settings } from '../types/storage';
import { loadSettings, saveSettings, loadTasksFromStorage, saveTasksToStorage } from './storage';

class AppContext {
  private _tasks: Task[] = [];
  private _settings: Settings;
  private _currentDate: Date;
  private _categoryFilter = '';

  constructor() {
    this._settings = loadSettings();
    this._currentDate = new Date();
    this._currentDate.setHours(0, 0, 0, 0);
  }

  get tasks(): Task[] { return this._tasks; }
  set tasks(value: Task[]) {
    this._tasks = value;
    saveTasksToStorage(value);
  }

  get settings(): Settings { return this._settings; }
  set settings(value: Settings) {
    this._settings = value;
    saveSettings(value);
  }

  get currentDate(): Date { return this._currentDate; }
  set currentDate(value: Date) {
    this._currentDate = value;
  }

  get categoryFilter(): string { return this._categoryFilter; }
  set categoryFilter(value: string) { this._categoryFilter = value; }

  loadTasks(): Task[] {
    this._tasks = loadTasksFromStorage();
    return this._tasks;
  }

  saveTasks(): void {
    saveTasksToStorage(this._tasks);
  }

  saveCurrentSettings(): void {
    saveSettings(this._settings);
  }

  syncToWindow(): void {
    const w = window as any;
    w.tasks = this._tasks;
    w.settings = this._settings;
    w.currentDate = this._currentDate;
    w.currentCategoryFilter = this._categoryFilter;
  }
}

export const appContext = new AppContext();
