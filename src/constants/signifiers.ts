import type { SignifierType } from '../types';

export const SIGNIFIER_ORDER: (SignifierType | null)[] = [
  null, 'task', 'note', 'important', 'consider', 'idea',
];

export const SIGNIFIER_MAP: Record<SignifierType, string> = {
  task: '✅',
  note: '📝',
  important: '❗',
  consider: '🤔',
  idea: '💡',
};

export const SIGNIFIER_LABELS: Record<SignifierType, string> = {
  task: 'タスク',
  note: 'メモ',
  important: '重要',
  consider: '検討',
  idea: 'アイデア',
};
