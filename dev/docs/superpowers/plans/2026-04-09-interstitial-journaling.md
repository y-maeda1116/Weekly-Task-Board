# Interstitial Journaling 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Weekly Task Boardにインタースティシャル・ジャーナリング機能を追加し、タスク開始・完了時のタイムスタンプ自動記録とジャーナル入力でタスク切替え時の認知負荷を軽減する。

**Architecture:** 既存のhybrid moduleパターンに従い、`src/hybrid/` に独立した `JournalManager.ts` と `JournalUI.ts` を作成する。localStorage に `weekly-task-board.journals` キーで永続化し、グローバル bridge (`window.HybridJournal`) 経由で `script.js` と連携する。

**Tech Stack:** TypeScript, vanilla DOM API, localStorage, CSS variables

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/types/journal.ts` | JournalEntry, DayJournal 型定義 |
| Create | `src/hybrid/JournalManager.ts` | ジャーナルデータCRUD + localStorage永続化 + 古いエントリ自動クローズ |
| Create | `src/hybrid/JournalUI.ts` | 開始ボタン注入、ジャーナル/NextStepモーダル、タイムラインパネル |
| Modify | `src/types/index.ts` | journal.ts の re-export 追加 |
| Modify | `index.html` | ジャーナルトグルボタン + タイムラインパネルHTML + モーダルHTML |
| Modify | `script.js` | 初期化フック + 完了トグルインターセプト + bridge呼び出し |
| Modify | `style.css` | ジャーナルUI用スタイル |

---

### Task 1: 型定義の作成

**Files:**
- Create: `src/types/journal.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: journal.ts を作成**

```typescript
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
```

- [ ] **Step 2: index.ts に re-export を追加**

`src/types/index.ts` の既存の export 行の末尾に追加:

```typescript
export * from './journal';
```

- [ ] **Step 3: コミット**

```bash
git add src/types/journal.ts src/types/index.ts
git commit -m "feat: add JournalEntry and DayJournal type definitions"
```

---

### Task 2: JournalManager の作成

**Files:**
- Create: `src/hybrid/JournalManager.ts`

- [ ] **Step 1: JournalManager.ts を作成**

```typescript
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
```

- [ ] **Step 2: コンパイル確認**

```bash
cd /home/ubuntu/projects/Weekly-Task-Board && npx tsc src/hybrid/JournalManager.ts --outDir dist --target ES2020 --module none --strict --esModuleInterop 2>&1 | head -20
```

Expected: no errors or only module-related warnings (standalone file)

- [ ] **Step 3: コミット**

```bash
git add src/hybrid/JournalManager.ts
git commit -m "feat: add JournalManager with CRUD, auto-close, and localStorage persistence"
```

---

### Task 3: JournalUI の作成

**Files:**
- Create: `src/hybrid/JournalUI.ts`

- [ ] **Step 1: JournalUI.ts を作成**

```typescript
// src/hybrid/JournalUI.ts

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

function getManager(): any {
  return (window as any).HybridJournalManager;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Start Button Injection ---

function cleanupStartButtons(): void {
  document.querySelectorAll('.journal-start-btn').forEach(btn => btn.remove());
  if (buttonAbortController) {
    buttonAbortController.abort();
    buttonAbortController = null;
  }
}

function injectStartButtons(): void {
  cleanupStartButtons();

  const manager = getManager();
  if (!manager) {
    logger.error('HybridJournalManager not available');
    return;
  }

  const activeEntry = manager.getActiveEntry() as JournalEntry | null;
  buttonAbortController = new AbortController();
  const signal = buttonAbortController.signal;

  document.querySelectorAll('.task').forEach(taskEl => {
    const taskId = (taskEl as HTMLElement).dataset.taskId;
    if (!taskId) return;

    if (taskEl.classList.contains('completed')) return;

    const btn = document.createElement('button');
    btn.className = 'journal-start-btn';
    btn.type = 'button';

    const isActive = activeEntry && activeEntry.taskId === taskId;

    if (isActive) {
      btn.classList.add('active');
      btn.textContent = '\u25CF 実行中...';
      btn.title = 'ジャーナル実行中';
    } else {
      btn.textContent = '\u25B6 開始';
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

function handleStartClick(taskId: string, taskEl: Element): void {
  const manager = getManager();
  if (!manager) return;

  const activeEntry = manager.getActiveEntry() as JournalEntry | null;

  if (activeEntry && activeEntry.taskId === taskId) return;

  if (activeEntry) {
    if (confirm(`現在「${activeEntry.taskName}」を実行中です。\n現在のタスクを完了して新しいタスクを開始しますか？`)) {
      manager.completeEntry(activeEntry.id, '');
    } else {
      return;
    }
  }

  const taskName = taskEl.querySelector('.task-name')?.textContent || '不明なタスク';
  const entry = manager.createEntry(taskId, taskName) as JournalEntry;

  showJournalModal(entry);
  injectStartButtons();
}

// --- Journal Modal ---

function showJournalModal(entry: JournalEntry): void {
  const existing = document.getElementById('journal-input-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'journal-input-modal';
  overlay.className = 'journal-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'journal-modal';

  const header = document.createElement('div');
  header.className = 'journal-modal-header';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = `\u25B6 「${entry.taskName}」を開始`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'journal-modal-time';
  timeSpan.textContent = formatTime(entry.startedAt);

  header.appendChild(titleSpan);
  header.appendChild(timeSpan);

  const textarea = document.createElement('textarea');
  textarea.className = 'journal-modal-textarea';
  textarea.placeholder = '今から何に取り掛かりますか？（省略可）';
  textarea.value = entry.journal;

  const actions = document.createElement('div');
  actions.className = 'journal-modal-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'journal-modal-save';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', () => {
    const mgr = getManager();
    if (mgr) {
      mgr.updateJournal(entry.id, textarea.value);
    }
    overlay.remove();
  });

  const skipBtn = document.createElement('button');
  skipBtn.className = 'journal-modal-skip';
  skipBtn.textContent = 'スキップ';
  skipBtn.addEventListener('click', () => {
    overlay.remove();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(skipBtn);
  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  textarea.focus();
}

// --- Next Step Modal ---

function showNextStepModal(entry: JournalEntry, onComplete: () => void): void {
  const existing = document.getElementById('journal-nextstep-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'journal-nextstep-modal';
  overlay.className = 'journal-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'journal-modal';

  const header = document.createElement('div');
  header.className = 'journal-modal-header';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = `\u25A0 「${entry.taskName}」を完了`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'journal-modal-time';
  timeSpan.textContent = `${formatTime(entry.startedAt)} - 今`;

  header.appendChild(titleSpan);
  header.appendChild(timeSpan);

  const textarea = document.createElement('textarea');
  textarea.className = 'journal-modal-textarea';
  textarea.placeholder = '次のタスクへの申し送り（省略可）';

  const actions = document.createElement('div');
  actions.className = 'journal-modal-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'journal-modal-save';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', () => {
    const mgr = getManager();
    if (mgr) {
      mgr.completeEntry(entry.id, textarea.value);
    }
    overlay.remove();
    onComplete();
  });

  const skipBtn = document.createElement('button');
  skipBtn.className = 'journal-modal-skip';
  skipBtn.textContent = 'スキップ';
  skipBtn.addEventListener('click', () => {
    const mgr = getManager();
    if (mgr) {
      mgr.completeEntry(entry.id, '');
    }
    overlay.remove();
    onComplete();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(skipBtn);
  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  // Next Step modalはオーバーレイクリックで閉じない（必ず選択させる）

  document.body.appendChild(overlay);
  textarea.focus();
}

// --- Timeline Panel ---

let timelineDate: string = getTodayString();

function openTimeline(): void {
  const panel = document.getElementById('journal-timeline-panel');
  if (panel) {
    panel.style.display = 'block';
    renderTimelinePanel();
  }
}

function closeTimeline(): void {
  const panel = document.getElementById('journal-timeline-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

function renderTimelinePanel(): void {
  const content = document.getElementById('journal-timeline-content');
  const datePicker = document.getElementById('journal-date-picker') as HTMLInputElement | null;
  if (!content || !datePicker) return;

  datePicker.value = timelineDate;
  const manager = getManager();
  if (!manager) return;

  const entries = manager.getEntriesByDate(timelineDate) as JournalEntry[];

  // Clear safely
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
    // 空白時間ラベルの挿入
    if (index > 0) {
      const prev = sorted[index - 1];
      if (prev.completedAt) {
        const gapMs = new Date(entry.startedAt).getTime() - new Date(prev.completedAt).getTime();
        const gapMin = Math.floor(gapMs / 60000);
        if (gapMin >= 15) {
          const gapLabel = document.createElement('div');
          gapLabel.className = 'journal-timeline-gap';
          gapLabel.textContent = `\u2615 休憩/割り込み: ${gapMin}分`;
          content.appendChild(gapLabel);
        }
      }
    }

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
    iconSpan.textContent = isCompleted ? '\u25A0' : '\u25CF';
    titleDiv.appendChild(iconSpan);
    titleDiv.appendChild(document.createTextNode(
      `${isCompleted ? '完了' : '実行中'}: 「${entry.taskName}」`
    ));

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
      nextStepDiv.textContent = `\u27A1 Next Step: ${entry.nextStep}`;
      bodyDiv.appendChild(nextStepDiv);
    }

    entryEl.appendChild(timeDiv);
    entryEl.appendChild(bodyDiv);
    content.appendChild(entryEl);
  });
}

function navigateTimeline(delta: number): void {
  const d = new Date(timelineDate);
  d.setDate(d.getDate() + delta);
  timelineDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  renderTimelinePanel();
}

function initTimelineControls(): void {
  const prevBtn = document.getElementById('journal-prev-day');
  const nextBtn = document.getElementById('journal-next-day');
  const closeBtn = document.getElementById('close-journal-timeline');

  prevBtn?.addEventListener('click', () => navigateTimeline(-1));
  nextBtn?.addEventListener('click', () => navigateTimeline(1));
  closeBtn?.addEventListener('click', closeTimeline);
}

export const JournalUI = {
  injectStartButtons,
  cleanupStartButtons,
  showJournalModal,
  showNextStepModal,
  renderTimelinePanel,
  openTimeline,
  closeTimeline,
  initTimelineControls,
};

(window as any).HybridJournalUI = JournalUI;
```

- [ ] **Step 2: コンパイル確認**

```bash
cd /home/ubuntu/projects/Weekly-Task-Board && npx tsc src/hybrid/JournalUI.ts --outDir dist --target ES2020 --module none --strict --esModuleInterop 2>&1 | head -20
```

- [ ] **Step 3: コミット**

```bash
git add src/hybrid/JournalUI.ts
git commit -m "feat: add JournalUI with start buttons, modals, and timeline panel"
```

---

### Task 4: index.html へのHTML追加

**Files:**
- Modify: `index.html`

- [ ] **Step 1: ヘッダーにジャーナルトグルボタンを追加**

`index.html` の `<button id="theme-toggle" title="テーマ切替">🌙</button>` の直後に追加:

```html
<button id="journal-toggle" title="ジャーナル">&#128221;</button>
```

- [ ] **Step 2: タイムラインパネルHTMLを追加**

`</aside>` の直後、`<!-- ダッシュボードパネル -->` の前に追加:

```html
<!-- ジャーナルタイムラインパネル -->
<div id="journal-timeline-panel" class="dashboard-panel" style="display: none;">
    <div class="dashboard-header">
        <h2>&#128221; 実行ログ</h2>
        <div id="journal-date-controls">
            <button id="journal-prev-day">前日</button>
            <input type="date" id="journal-date-picker" readonly>
            <button id="journal-next-day">次日</button>
        </div>
        <button id="close-journal-timeline" class="close-btn">&times;</button>
    </div>
    <div id="journal-timeline-content" class="dashboard-content"></div>
</div>
```

- [ ] **Step 3: コミット**

```bash
git add index.html
git commit -m "feat: add journal toggle button and timeline panel HTML"
```

---

### Task 5: style.css へのジャーナルスタイル追加

**Files:**
- Modify: `style.css`

- [ ] **Step 1: ジャーナルUI用CSSを追加**

`style.css` の末尾に追加:

```css
/* ===== Journal Start Button ===== */
.journal-start-btn {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 4px 8px;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  background: transparent;
  color: var(--primary-color);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.journal-start-btn:hover {
  background: var(--primary-color);
  color: #fff;
}

.journal-start-btn.active {
  background: #27ae60;
  border-color: #27ae60;
  color: #fff;
  animation: journal-pulse 2s infinite;
  cursor: default;
}

@keyframes journal-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ===== Journal Modal ===== */
.journal-modal-overlay {
  display: flex;
  position: fixed;
  z-index: 10000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
}

.journal-modal {
  background-color: var(--modal-background);
  padding: 20px;
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 420px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.journal-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  color: var(--font-color);
}

.journal-modal-time {
  font-size: 0.85em;
  color: #666;
}

[data-theme="dark"] .journal-modal-time {
  color: #aaa;
}

.journal-modal-textarea {
  width: 100%;
  height: 80px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-background);
  color: var(--font-color);
  font-family: inherit;
  font-size: 0.95em;
  resize: vertical;
  box-sizing: border-box;
}

.journal-modal-textarea:focus {
  outline: 2px solid var(--primary-color);
  border-color: transparent;
}

.journal-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.journal-modal-save {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
  font-family: inherit;
}

.journal-modal-save:hover {
  opacity: 0.9;
}

.journal-modal-skip {
  padding: 6px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--font-color);
  cursor: pointer;
  font-family: inherit;
}

/* ===== Timeline ===== */
.journal-timeline-entry {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.journal-timeline-time {
  min-width: 90px;
  font-size: 0.85em;
  color: #666;
  padding-top: 2px;
}

[data-theme="dark"] .journal-timeline-time {
  color: #aaa;
}

.journal-timeline-body {
  flex: 1;
}

.journal-timeline-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--font-color);
}

.journal-timeline-icon {
  margin-right: 4px;
}

.journal-timeline-journal {
  font-size: 0.9em;
  color: var(--font-color);
  opacity: 0.8;
  margin-bottom: 4px;
  white-space: pre-wrap;
}

.journal-timeline-nextstep {
  font-size: 0.9em;
  color: var(--primary-color);
  margin-top: 4px;
}

.journal-timeline-gap {
  text-align: center;
  padding: 8px;
  margin: 4px 0;
  background: var(--card-background);
  border-radius: 12px;
  font-size: 0.85em;
  font-style: italic;
  color: #888;
  border: 1px dashed var(--border-color);
}

[data-theme="dark"] .journal-timeline-gap {
  color: #aaa;
}

.journal-gap-icon {
  margin-right: 4px;
}

.journal-timeline-empty {
  text-align: center;
  padding: 40px;
  color: #888;
  font-style: italic;
}
```

- [ ] **Step 2: コミット**

```bash
git add style.css
git commit -m "feat: add journal UI styles with pulse animation and timeline"
```

---

### Task 6: script.js への統合

**Files:**
- Modify: `script.js`

- [ ] **Step 1: ジャーナルストレージキー定数を追加**

`script.js` の `const TEMPLATES_STORAGE_KEY = 'weekly-task-board.templates';` の後に追加:

```javascript
const JOURNALS_STORAGE_KEY = 'weekly-task-board.journals';
```

- [ ] **Step 2: ジャーナルトグル初期化関数を追加**

`initializeTemplatePanel()` 関数の定義の後に追加:

```javascript
// --- Journal / Interstitial Journaling ---
function initializeJournalToggle() {
    const journalToggleBtn = document.getElementById('journal-toggle');
    if (!journalToggleBtn) return;

    journalToggleBtn.addEventListener('click', () => {
        if (window.HybridJournalUI) {
            window.HybridJournalUI.openTimeline();
        }
    });

    if (window.HybridJournalUI && window.HybridJournalUI.initTimelineControls) {
        window.HybridJournalUI.initTimelineControls();
    }
}
```

- [ ] **Step 3: 初期化呼び出しを追加**

`initializeTemplatePanel();` の後に追加:

```javascript
// ジャーナル機能の初期化
if (window.HybridJournalManager) {
    window.HybridJournalManager.initialize();
}
initializeJournalToggle();
```

- [ ] **Step 4: タスク完了チェックボックスをインターセプト**

`checkbox.addEventListener('click', (e) => {` の中身（`e.stopPropagation();` から対応する `});` まで）を置換:

```javascript
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const newCompleted = e.target.checked;

            if (newCompleted) {
                // ジャーナル: 未完了エントリがあれば Next Step モーダルを先に表示
                if (window.HybridJournalManager && window.HybridJournalUI) {
                    const activeEntry = window.HybridJournalManager.getEntryByTaskId(task.id);
                    if (activeEntry) {
                        e.preventDefault();
                        checkbox.checked = false;
                        window.HybridJournalUI.showNextStepModal(activeEntry, () => {
                            task.completed = true;
                            checkbox.checked = true;
                            playTaskCompletionAnimation(taskElement, checkbox);
                            setTimeout(() => {
                                archiveCompletedTasks();
                                renderWeek();
                                updateDashboard();
                            }, 1800);
                        });
                        return;
                    }
                }

                task.completed = true;
                playTaskCompletionAnimation(taskElement, checkbox);
                setTimeout(() => {
                    archiveCompletedTasks();
                    renderWeek();
                    updateDashboard();
                }, 1800);
            } else {
                task.completed = false;
                saveTasks();
                renderWeek();
                updateDashboard();
            }
        });
```

- [ ] **Step 5: renderWeek 後にジャーナルボタンを注入**

`renderWeek` 関数内の `isRendering = false;` の直前に追加:

```javascript
        // ジャーナル: タスクカード再描画後に開始ボタンを注入
        if (window.HybridJournalUI) {
            window.HybridJournalUI.injectStartButtons();
        }
```

- [ ] **Step 6: コミット**

```bash
git add script.js
git commit -m "feat: integrate journaling into script.js - toggle, completion intercept, button injection"
```

---

### Task 7: コンパイル確認と最終コミット

- [ ] **Step 1: JournalManager.ts をコンパイル**

```bash
cd /home/ubuntu/projects/Weekly-Task-Board && npx tsc src/hybrid/JournalManager.ts --outDir dist --target ES2020 --module none --strict 2>&1 | head -20
```

- [ ] **Step 2: JournalUI.ts をコンパイル**

```bash
cd /home/ubuntu/projects/Weekly-Task-Board && npx tsc src/hybrid/JournalUI.ts --outDir dist --target ES2020 --module none --strict 2>&1 | head -20
```

- [ ] **Step 3: ブラウザで動作確認**

チェック項目:
- [ ] ヘッダーにジャーナルボタンが表示される
- [ ] 未完了タスクに「▶ 開始」ボタンが表示される
- [ ] 「開始」クリックでジャーナル入力モーダルが表示される
- [ ] モーダル保存後、ボタンが「● 実行中...」に変化
- [ ] 別タスクの「開始」クリックで確認ダイアログ
- [ ] 完了チェック時にNext Stepモーダルが表示される
- [ ] タイムラインパネルにログがストリーム表示
- [ ] ダークモードで色が適切
