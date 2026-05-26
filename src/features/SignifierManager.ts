import type { SignifierType, Task } from '../types';
import { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS } from '../constants/signifiers';

const STORAGE_KEY = 'weekly-task-board.tasks';

export function cycleSignifier(current: SignifierType | null): SignifierType | null {
  const index = SIGNIFIER_ORDER.indexOf(current);
  return SIGNIFIER_ORDER[(index + 1) % SIGNIFIER_ORDER.length];
}

export function getSignifierSymbol(signifier: SignifierType | null | undefined): string {
  if (!signifier) return '';
  return SIGNIFIER_MAP[signifier] ?? '';
}

export function getSignifierLabel(signifier: SignifierType | null | undefined): string {
  if (!signifier) return '';
  return SIGNIFIER_LABELS[signifier] ?? '';
}

export function updateTaskSignifier(taskId: string, signifier: SignifierType | null): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const tasks: Task[] = JSON.parse(raw);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;

    const updated = tasks.map((t, i) =>
      i === index ? { ...t, signifier } : t,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    console.log(`[Signifier] Updated: ${taskId} -> ${signifier}`);
    return true;
  } catch (e) {
    console.error('[Signifier] Failed to update signifier', e);
    return false;
  }
}

export { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS };
