import type { Task, TaskCategory, TaskPriority, SignifierType } from '../types';
import { StorageKeys } from '../types';

const PAGES_KEY = 'weekly-task-board.morning-pages';

export interface MorningPageEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId(): string {
  return 'mp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function generateTaskId(): string {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

function loadPages(): MorningPageEntry[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[MorningPages] Failed to load pages', e);
    return [];
  }
}

function persistPages(pages: MorningPageEntry[]): void {
  try {
    localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
  } catch (e) {
    console.error('[MorningPages] Failed to save pages', e);
  }
}

export function savePage(date: string, content: string): MorningPageEntry {
  const pages = loadPages();
  const existingIndex = pages.findIndex((p) => p.date === date);
  const existing = existingIndex >= 0 ? pages[existingIndex] : null;

  const entry: MorningPageEntry = {
    id: existing ? existing.id : generateId(),
    date,
    content,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated =
    existingIndex >= 0
      ? pages.map((p, i) => (i === existingIndex ? entry : p))
      : [...pages, entry];

  persistPages(updated);
  console.log(`[MorningPages] Saved page for ${date}`);
  return entry;
}

export function getPage(date: string): MorningPageEntry | null {
  return loadPages().find((p) => p.date === date) ?? null;
}

export function extractTodoItems(content: string): string[] {
  if (!content) return [];

  return content.split('\n').reduce<string[]>((items, line) => {
    const trimmed = line.trim();
    if (!trimmed) return items;

    const bracketMatch = trimmed.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      const text = bracketMatch[1].trim();
      if (text) items.push(text);
      return items;
    }

    const todoMatch = trimmed.match(/^TODO:\s*(.+)$/i);
    if (todoMatch) {
      const text = todoMatch[1].trim();
      if (text) items.push(text);
    }

    return items;
  }, []);
}

export function bulkRegisterTasks(items: string[], targetDate?: string): number {
  if (!items || items.length === 0) return 0;

  const raw = localStorage.getItem(StorageKeys.TASKS);
  const tasks: Task[] = raw ? JSON.parse(raw) : [];
  const date = targetDate || getTodayString();

  const newTasks = items.map(
    (name, i): Task => ({
      id: generateTaskId() + '-' + i,
      name,
      estimated_time: 0,
      actual_time: 0,
      completed: false,
      priority: 'medium' as TaskPriority,
      category: 'task' as TaskCategory,
      date,
      assigned_date: targetDate ? date : null,
      due_date: null,
      due_time_period: null,
      due_hour: null,
      details: '',
      is_recurring: false,
      recurrence_pattern: null,
      recurrence_end_date: null,
      signifier: 'task' as SignifierType,
    }),
  );

  localStorage.setItem(StorageKeys.TASKS, JSON.stringify([...tasks, ...newTasks]));
  console.log(`[MorningPages] Registered ${newTasks.length} tasks`);
  return newTasks.length;
}

export function shouldShowOnLaunch(): boolean {
  try {
    const raw = localStorage.getItem(StorageKeys.SETTINGS);
    if (!raw) return false;
    const settings = JSON.parse(raw);
    if (!settings.morningPageEnabled) return false;
    return !getPage(getTodayString());
  } catch {
    return false;
  }
}

export function isMorningPageEnabled(): boolean {
  try {
    const raw = localStorage.getItem(StorageKeys.SETTINGS);
    if (!raw) return false;
    const settings = JSON.parse(raw);
    return !!settings.morningPageEnabled;
  } catch {
    return false;
  }
}

export function setMorningPageEnabled(enabled: boolean): void {
  try {
    const raw = localStorage.getItem(StorageKeys.SETTINGS);
    const settings = raw ? JSON.parse(raw) : {};
    settings.morningPageEnabled = !!enabled;
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
    console.log(`[MorningPages] Setting updated: ${enabled}`);
  } catch (e) {
    console.error('[MorningPages] Failed to update setting', e);
  }
}
