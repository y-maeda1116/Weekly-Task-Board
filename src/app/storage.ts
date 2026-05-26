import type { Task } from '../types';
import { StorageKeys, DEFAULT_SETTINGS } from '../types/storage';
import type { Settings } from '../types/storage';

const JOURNALS_STORAGE_KEY = 'weekly-task-board.journals';

export function loadSettings(): Settings {
  const settingsJson = localStorage.getItem(StorageKeys.SETTINGS);
  if (!settingsJson) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const loaded = JSON.parse(settingsJson);
    if (!loaded.weekday_visibility) {
      loaded.weekday_visibility = DEFAULT_SETTINGS.weekday_visibility;
    }
    return loaded;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
}

export function loadTasksFromStorage(): Task[] {
  const raw = localStorage.getItem(StorageKeys.TASKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  localStorage.setItem(StorageKeys.TASKS, JSON.stringify(tasks));
}

export function loadTemplates(): any[] {
  const raw = localStorage.getItem(StorageKeys.TEMPLATES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTemplates(templates: any[]): void {
  localStorage.setItem(StorageKeys.TEMPLATES, JSON.stringify(templates));
}

export function loadJournals(): any[] {
  const raw = localStorage.getItem(JOURNALS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveJournals(journals: any[]): void {
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(journals));
}

export {
  StorageKeys,
  JOURNALS_STORAGE_KEY,
};
