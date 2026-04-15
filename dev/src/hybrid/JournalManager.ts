// src/hybrid/JournalManager.ts

interface JournalEntry {
  id: string;
  taskId: string;
  taskName: string;
  startedAt: string;
  completedAt: string | null;
  journal: string;
  nextStep: string;
  isManual?: boolean;
}

interface DayJournal {
  date: string;
  entries: JournalEntry[];
}

const STORAGE_KEY = 'weekly-task-board.journals';

class HybridLogger {
  info(message: string, ...args: unknown[]): void {
    console.log(`[JournalManager] ${message}`, ...args);
  }
  error(message: string, ...args: unknown[]): void {
    console.error(`[JournalManager] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDayKey(isoString: string): string {
  return isoString.substring(0, 10);
}

// --- Storage ---

function loadAll(): DayJournal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DayJournal[];
  } catch (e) {
    logger.error('Failed to load journals', e);
    return [];
  }
}

function saveAll(journals: DayJournal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
  } catch (e) {
    logger.error('Failed to save journals', e);
  }
}

function findOrCreateDay(journals: DayJournal[], date: string): DayJournal {
  let day = journals.find(d => d.date === date);
  if (!day) {
    day = { date, entries: [] };
    journals.push(day);
  }
  return day;
}

// --- Core Operations ---

function closeStaleEntries(): void {
  const today = getTodayString();
  const journals = loadAll();
  let changed = false;

  for (const day of journals) {
    for (const entry of day.entries) {
      if (entry.completedAt === null) {
        const entryDate = getDayKey(entry.startedAt);
        if (entryDate < today) {
          entry.completedAt = `${entryDate}T23:59:59`;
          changed = true;
          logger.info(`Auto-closed stale entry: ${entry.id} (${entry.taskName})`);
        }
      }
    }
  }

  if (changed) {
    saveAll(journals);
  }
}

function createEntry(taskId: string, taskName: string): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    taskId,
    taskName,
    startedAt: now,
    completedAt: null,
    journal: '',
    nextStep: '',
    isManual: false,
  };

  const dateKey = getDayKey(now);
  const journals = loadAll();
  const day = findOrCreateDay(journals, dateKey);
  day.entries.push(entry);
  saveAll(journals);

  logger.info(`Created entry: ${entry.id} for task "${taskName}"`);
  return { ...entry };
}

function completeEntry(entryId: string, nextStep: string): void {
  const journals = loadAll();
  for (const day of journals) {
    const entry = day.entries.find(e => e.id === entryId);
    if (entry && entry.completedAt === null) {
      entry.completedAt = new Date().toISOString();
      entry.nextStep = nextStep;
      saveAll(journals);
      logger.info(`Completed entry: ${entryId}`);
      return;
    }
  }
  logger.error(`Entry not found or already completed: ${entryId}`);
}

function updateJournal(entryId: string, text: string): void {
  const journals = loadAll();
  for (const day of journals) {
    const entry = day.entries.find(e => e.id === entryId);
    if (entry) {
      entry.journal = text;
      saveAll(journals);
      return;
    }
  }
}

function getEntriesByDate(date: string): JournalEntry[] {
  const journals = loadAll();
  const day = journals.find(d => d.date === date);
  return day ? day.entries.map(e => ({ ...e })) : [];
}

function getActiveEntry(): JournalEntry | null {
  const journals = loadAll();
  for (const day of journals) {
    for (const entry of day.entries) {
      if (entry.completedAt === null) {
        return { ...entry };
      }
    }
  }
  return null;
}

function getEntryByTaskId(taskId: string): JournalEntry | null {
  const journals = loadAll();
  for (const day of journals) {
    const entry = day.entries.find(e => e.taskId === taskId && e.completedAt === null);
    if (entry) return { ...entry };
  }
  return null;
}

function initialize(): void {
  logger.info('Initializing JournalManager...');
  closeStaleEntries();
}

export const JournalManager = {
  initialize,
  createEntry,
  completeEntry,
  updateJournal,
  getEntriesByDate,
  getActiveEntry,
  getEntryByTaskId,
  closeStaleEntries,
};

(window as any).HybridJournalManager = JournalManager;
