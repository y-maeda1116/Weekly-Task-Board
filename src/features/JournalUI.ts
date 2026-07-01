import type { JournalEntry } from '../types/journal';
import * as JournalManager from './JournalManager';

class HybridLogger {
  info(message: string, ...args: unknown[]): void {
    console.log(`[JournalUI] ${message}`, ...args);
  }
  error(message: string, ...args: unknown[]): void {
    console.error(`[JournalUI] ${message}`, ...args);
  }
}

const logger = new HybridLogger();

let buttonAbortController: AbortController | null = null;

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function cleanupStartButtons(): void {
  document.querySelectorAll('.journal-start-btn').forEach(btn => btn.remove());
  if (buttonAbortController) {
    buttonAbortController.abort();
    buttonAbortController = null;
  }
}

function handleStartClick(taskId: string, taskEl: Element): void {
  const activeEntry = JournalManager.getActiveEntry();

  if (activeEntry && activeEntry.taskId === taskId) {
    showNextStepModal(activeEntry, () => {
      injectStartButtons();
    });
    return;
  }

  if (activeEntry) {
    if (confirm(`現在「${activeEntry.taskName}」を実行中です。\n現在のタスクを完了して新しいタスクを開始しますか？`)) {
      JournalManager.completeEntry(activeEntry.id, '');
    } else {
      return;
    }
  }

  const taskName = taskEl.querySelector('.task-name')?.textContent || '不明なタスク';
  const entry = JournalManager.createEntry(taskId, taskName);
  showJournalModal(entry);
  injectStartButtons();
}

export function injectStartButtons(): void {
  cleanupStartButtons();

  const activeEntry = JournalManager.getActiveEntry();
  buttonAbortController = new AbortController();
  const signal = buttonAbortController.signal;

  document.querySelectorAll<HTMLElement>('.task').forEach(taskEl => {
    const taskId = taskEl.dataset.taskId;
    if (!taskId) return;
    if (taskEl.classList.contains('completed')) return;

    const btn = document.createElement('button');
    btn.className = 'journal-start-btn';
    btn.type = 'button';

    const isActive = activeEntry !== null && activeEntry.taskId === taskId;
    if (isActive) {
      btn.classList.add('active');
      btn.textContent = '■ 停止';
      btn.title = 'このタスクのジャーナルを停止';
    } else {
      btn.textContent = '▶ 開始';
      btn.title = 'このタスクのジャーナルを開始';
    }

    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleStartClick(taskId, taskEl);
    }, { signal });

    taskEl.appendChild(btn);
  });

  logger.info('Start buttons injected');
}

export function showJournalModal(entry: JournalEntry): void {
  const existing = document.getElementById('journal-input-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'journal-input-modal';
  overlay.className = 'journal-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'journal-modal';

  const header = buildModalHeader(`▶ 「${entry.taskName}」を開始`, formatTime(entry.startedAt));

  const textarea = document.createElement('textarea');
  textarea.className = 'journal-modal-textarea';
  textarea.placeholder = '今から何に取り掛かりますか？（省略可）';
  textarea.value = entry.journal;

  const actions = buildModalActions(textarea, {
    onSave: () => {
      JournalManager.updateJournal(entry.id, textarea.value);
      overlay.remove();
    },
    onSkip: () => overlay.remove(),
  });

  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  textarea.focus();
}

export function showNextStepModal(entry: JournalEntry, onComplete: () => void): void {
  const existing = document.getElementById('journal-nextstep-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'journal-nextstep-modal';
  overlay.className = 'journal-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'journal-modal';

  const header = buildModalHeader(`■ 「${entry.taskName}」を完了`, `${formatTime(entry.startedAt)} - 今`);

  const textarea = document.createElement('textarea');
  textarea.className = 'journal-modal-textarea';
  textarea.placeholder = '次のタスクへの申し送り（省略可）';

  const actions = buildModalActions(textarea, {
    onSave: () => {
      JournalManager.completeEntry(entry.id, textarea.value);
      overlay.remove();
      onComplete();
    },
    onSkip: () => {
      JournalManager.completeEntry(entry.id, '');
      overlay.remove();
      onComplete();
    },
  });

  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);
  textarea.focus();
}

function buildModalHeader(title: string, time: string): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'journal-modal-header';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'journal-modal-time';
  timeSpan.textContent = time;

  header.appendChild(titleSpan);
  header.appendChild(timeSpan);
  return header;
}

function buildModalActions(
  textarea: HTMLTextAreaElement,
  handlers: { onSave: () => void; onSkip: () => void }
): HTMLDivElement {
  const actions = document.createElement('div');
  actions.className = 'journal-modal-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'journal-modal-save';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', handlers.onSave);

  const skipBtn = document.createElement('button');
  skipBtn.className = 'journal-modal-skip';
  skipBtn.textContent = 'スキップ';
  skipBtn.addEventListener('click', handlers.onSkip);

  actions.appendChild(saveBtn);
  actions.appendChild(skipBtn);
  return actions;
}

let timelineDate: string = getTodayString();

export function openTimeline(): void {
  const panel = document.getElementById('journal-timeline-panel');
  if (panel) {
    panel.style.display = 'block';
    renderTimelinePanel();
  }
}

export function closeTimeline(): void {
  const panel = document.getElementById('journal-timeline-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

export function renderTimelinePanel(): void {
  const content = document.getElementById('journal-timeline-content');
  const datePicker = document.getElementById('journal-date-picker') as HTMLInputElement | null;
  if (!content || !datePicker) return;

  datePicker.value = timelineDate;

  const entries = JournalManager.getEntriesByDate(timelineDate);

  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'journal-timeline-empty';
    empty.textContent = 'この日のジャーナルはありません';
    content.appendChild(empty);
    return;
  }

  const sorted = [...entries].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  sorted.forEach((entry, index) => {
    appendGapLabelIfNeeded(content, sorted, entry, index);
    appendTimelineEntry(content, entry);
  });
}

function appendGapLabelIfNeeded(
  container: HTMLElement,
  sorted: JournalEntry[],
  entry: JournalEntry,
  index: number
): void {
  if (index === 0) return;

  // index === 0 は上記で除外済みのため index-1 >= 0 が保証される
  const prev = sorted[index - 1]!;
  if (!prev.completedAt) return;

  const gapMs = new Date(entry.startedAt).getTime() - new Date(prev.completedAt).getTime();
  const gapMin = Math.floor(gapMs / 60000);
  if (gapMin < 15) return;

  const gapLabel = document.createElement('div');
  gapLabel.className = 'journal-timeline-gap';
  gapLabel.textContent = `☕ 休憩/割り込み: ${gapMin}分`;
  container.appendChild(gapLabel);
}

function appendTimelineEntry(container: HTMLElement, entry: JournalEntry): void {
  const entryEl = document.createElement('div');
  entryEl.className = 'journal-timeline-entry';

  const isCompleted = entry.completedAt !== null;
  const timeRange = isCompleted
    ? `${formatTime(entry.startedAt)} - ${formatTime(entry.completedAt!)}`
    : `${formatTime(entry.startedAt)} - ...`;

  const timeDiv = document.createElement('div');
  timeDiv.className = 'journal-timeline-time';
  timeDiv.textContent = timeRange;

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'journal-timeline-body';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'journal-timeline-title';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'journal-timeline-icon';
  iconSpan.textContent = isCompleted ? '■' : '●';
  titleDiv.appendChild(iconSpan);
  titleDiv.appendChild(document.createTextNode(`${isCompleted ? '完了' : '実行中'}: 「${entry.taskName}」`));
  bodyDiv.appendChild(titleDiv);

  if (entry.journal) {
    const journalDiv = document.createElement('div');
    journalDiv.className = 'journal-timeline-journal';
    journalDiv.textContent = entry.journal;
    bodyDiv.appendChild(journalDiv);
  }

  if (isCompleted && entry.nextStep) {
    const nextStepDiv = document.createElement('div');
    nextStepDiv.className = 'journal-timeline-nextstep';
    nextStepDiv.textContent = `➡ Next Step: ${entry.nextStep}`;
    bodyDiv.appendChild(nextStepDiv);
  }

  entryEl.appendChild(timeDiv);
  entryEl.appendChild(bodyDiv);
  container.appendChild(entryEl);
}

function navigateTimeline(delta: number): void {
  const d = new Date(timelineDate);
  d.setDate(d.getDate() + delta);
  timelineDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  renderTimelinePanel();
}

export function initTimelineControls(): void {
  document.getElementById('journal-prev-day')?.addEventListener('click', () => navigateTimeline(-1));
  document.getElementById('journal-next-day')?.addEventListener('click', () => navigateTimeline(1));
  document.getElementById('close-journal-timeline')?.addEventListener('click', closeTimeline);
}
