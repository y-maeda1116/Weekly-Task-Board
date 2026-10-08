import type { SignifierType, Task } from '../types';
import { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS } from '../constants/signifiers';
import { loadTasksFromStorage, saveTasksToStorage } from '../app/storage';

export function cycleSignifier(current: SignifierType | null): SignifierType | null {
  const index = SIGNIFIER_ORDER.indexOf(current);
  return SIGNIFIER_ORDER[(index + 1) % SIGNIFIER_ORDER.length] ?? null;
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
    const tasks = loadTasksFromStorage();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;

    const updated = tasks.map((t, i) =>
      i === index ? { ...t, signifier } : t,
    );
    saveTasksToStorage(updated);

    console.log(`[Signifier] Updated: ${taskId} -> ${signifier}`);
    return true;
  } catch (e) {
    console.error('[Signifier] Failed to update signifier', e);
    return false;
  }
}

export { SIGNIFIER_ORDER, SIGNIFIER_MAP, SIGNIFIER_LABELS };
