// src/types/journal.ts

export interface JournalEntry {
  id: string;
  taskId: string;
  taskName: string;
  startedAt: string;
  completedAt: string | null;
  journal: string;
  nextStep: string;
  isManual?: boolean;
}

export interface DayJournal {
  date: string;
  entries: JournalEntry[];
}
