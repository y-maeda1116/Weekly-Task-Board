import type { Task } from '../types';
import { StorageKeys, DEFAULT_SETTINGS } from '../types/storage';
import type { Settings } from '../types/storage';

const JOURNALS_STORAGE_KEY = 'weekly-task-board.journals';

function loadJsonArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSettings(): Settings {
  const settingsJson = localStorage.getItem(StorageKeys.SETTINGS);
  if (!settingsJson) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const loaded = JSON.parse(settingsJson);
    if (typeof loaded !== 'object' || loaded === null) {
      localStorage.removeItem(StorageKeys.SETTINGS);
      return { ...DEFAULT_SETTINGS };
    }
    if (!loaded.weekday_visibility) {
      loaded.weekday_visibility = DEFAULT_SETTINGS.weekday_visibility;
    }
    return loaded;
  } catch {
    localStorage.removeItem(StorageKeys.SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  saveJson(StorageKeys.SETTINGS, settings);
}

export function loadTasksFromStorage(): Task[] {
  return loadJsonArray<Task>(StorageKeys.TASKS);
}

export function saveTasksToStorage(tasks: Task[]): void {
  saveJson(StorageKeys.TASKS, tasks);
}

export function loadArchivedTasksFromStorage<T extends Task = Task>(): T[] {
  return loadJsonArray<T>(StorageKeys.ARCHIVE);
}

export function saveArchivedTasksToStorage(tasks: Task[]): void {
  saveJson(StorageKeys.ARCHIVE, tasks);
}

export function loadTemplates<T = any>(): T[] {
  return loadJsonArray<T>(StorageKeys.TEMPLATES);
}

export function saveTemplates<T>(templates: T[]): void {
  saveJson(StorageKeys.TEMPLATES, templates);
}

export function loadJournals(): any[] {
  return loadJsonArray(JOURNALS_STORAGE_KEY);
}

export function saveJournals(journals: any[]): void {
  saveJson(JOURNALS_STORAGE_KEY, journals);
}

export {
  StorageKeys,
  JOURNALS_STORAGE_KEY,
};
