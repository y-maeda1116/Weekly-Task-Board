// src/hybrid/SignifierManager.ts
// Bullet Journal Signifier management module

type SignifierType = 'task' | 'note' | 'important' | 'consider' | 'idea';

const SIGNIFIER_ORDER: (SignifierType | null)[] = [
  null, 'task', 'note', 'important', 'consider', 'idea'
];

const SIGNIFIER_SYMBOLS: Record<SignifierType, string> = {
  task: '\u30FB',
  note: '\uFF0D',
  important: '\uFF01',
  consider: '\uFF1F',
  idea: '\u2601'
};

const SIGNIFIER_LABELS: Record<SignifierType, string> = {
  task: '\u30BF\u30B9\u30AF',
  note: '\u30E1\u30E2',
  important: '\u91CD\u8981',
  consider: '\u691C\u8A0E',
  idea: '\u30A2\u30A4\u30C7\u30A2'
};

const STORAGE_KEY = 'weekly-task-board.tasks';

class HybridLogger {
  info(message: string, ...args: unknown[]): void {
    console.log(`[Signifier] ${message}`, ...args);
  }
  error(message: string, ...args: unknown[]): void {
    console.error(`[Signifier] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

function cycleSignifier(current: SignifierType | null): SignifierType | null {
  const index = SIGNIFIER_ORDER.indexOf(current);
  return SIGNIFIER_ORDER[(index + 1) % SIGNIFIER_ORDER.length];
}

function getSignifierSymbol(signifier: SignifierType | null): string {
  if (!signifier) return '';
  return SIGNIFIER_SYMBOLS[signifier] || '';
}

function getSignifierLabel(signifier: SignifierType | null): string {
  if (!signifier) return '';
  return SIGNIFIER_LABELS[signifier] || '';
}

function updateTaskSignifier(taskId: string, signifier: SignifierType | null): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const tasks = JSON.parse(raw);
    const index = tasks.findIndex((t: any) => t.id === taskId);
    if (index === -1) return false;

    tasks[index] = { ...tasks[index], signifier };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    logger.info(`Signifier updated: ${taskId} -> ${signifier}`);
    return true;
  } catch (e) {
    logger.error('Failed to update signifier', e);
    return false;
  }
}

export const SignifierManager = {
  cycleSignifier,
  getSignifierSymbol,
  getSignifierLabel,
  updateTaskSignifier,
  SIGNIFIER_ORDER,
  SIGNIFIER_SYMBOLS,
  SIGNIFIER_LABELS
};

(window as any).HybridSignifierManager = SignifierManager;
