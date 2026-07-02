import {
  savePage,
  getPage,
  extractTodoItems,
  bulkRegisterTasks,
  shouldShowOnLaunch,
} from './MorningPages';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

function updateWordCount(textarea: HTMLTextAreaElement, countEl: HTMLSpanElement): void {
  const text = textarea.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  countEl.textContent = `${chars} 文字 / ${words} ワード`;
}

function createHeader(today: string, onClose: () => void): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'morning-pages-header';

  const title = document.createElement('h2');
  title.textContent = `🌅 モーニングページ - ${getDayLabel(today)}`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'morning-pages-close-btn';
  closeBtn.textContent = '✕ 保存して閉じる';
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);
  return header;
}

function createEditor(content: string): HTMLTextAreaElement {
  const editor = document.createElement('textarea');
  editor.className = 'morning-pages-editor';
  editor.id = 'morning-pages-editor';
  editor.placeholder = '今日の思考を自由に書き出してください。\n[ ] でタスク化、TODO: でもタスク化できます。';
  editor.value = content;
  return editor;
}

function createFooter(editor: HTMLTextAreaElement, onExtract: () => void): HTMLDivElement {
  const footer = document.createElement('div');
  footer.className = 'morning-pages-footer';

  const wordCount = document.createElement('span');
  wordCount.className = 'morning-pages-wordcount';
  wordCount.id = 'morning-pages-wordcount';

  const actions = document.createElement('div');
  actions.className = 'morning-pages-actions';

  const extractBtn = document.createElement('button');
  extractBtn.className = 'morning-pages-extract-btn';
  extractBtn.textContent = '📋 TODOを抽出してタスク登録';
  extractBtn.addEventListener('click', onExtract);

  actions.appendChild(extractBtn);
  footer.appendChild(wordCount);
  footer.appendChild(actions);

  editor.addEventListener('input', () => updateWordCount(editor, wordCount));
  updateWordCount(editor, wordCount);

  return footer;
}

export function showMorningPageOverlay(): void {
  const old = document.getElementById('morning-pages-overlay');
  if (old) old.remove();

  const today = getTodayString();
  const existing = getPage(today);
  const existingContent = existing ? existing.content : '';

  const overlay = document.createElement('div');
  overlay.id = 'morning-pages-overlay';
  overlay.className = 'morning-pages-overlay';

  const editor = createEditor(existingContent);
  const header = createHeader(today, closeMorningPageOverlay);
  const footer = createFooter(editor, () => handleExtractAndRegister(editor.value));

  overlay.appendChild(header);
  overlay.appendChild(editor);
  overlay.appendChild(footer);
  document.body.appendChild(overlay);

  editor.focus();

  overlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      closeMorningPageOverlay();
    }
  });
}

export function closeMorningPageOverlay(): void {
  const editor = document.getElementById('morning-pages-editor') as HTMLTextAreaElement | null;
  const overlay = document.getElementById('morning-pages-overlay');

  if (editor) {
    savePage(getTodayString(), editor.value);
  }
  if (overlay) overlay.remove();
}

function handleExtractAndRegister(content: string): void {
  const items = extractTodoItems(content);
  if (items.length === 0) {
    showNotification('抽出対象の TODO がありません。[ ] や TODO: を使ってください。');
    return;
  }
  showExtractPreview(items);
}

function createExtractItemList(
  items: string[],
): { list: HTMLDivElement; checkboxes: HTMLInputElement[] } {
  const list = document.createElement('div');
  list.className = 'morning-extract-list';

  const checkboxes: HTMLInputElement[] = [];

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'morning-extract-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.dataset.index = String(index);
    checkboxes.push(cb);

    const label = document.createElement('span');
    label.textContent = item;

    row.appendChild(cb);
    row.appendChild(label);
    list.appendChild(row);
  });

  return { list, checkboxes };
}

function createTargetSelector(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'morning-extract-target-select';

  const inboxOpt = document.createElement('option');
  inboxOpt.value = '';
  inboxOpt.textContent = '未割り当て (Inbox)';

  const todayOpt = document.createElement('option');
  const today = getTodayString();
  todayOpt.value = today;
  todayOpt.textContent = `今日 (${getDayLabel(today)})`;

  select.appendChild(inboxOpt);
  select.appendChild(todayOpt);
  return select;
}

function showExtractPreview(items: string[]): void {
  const existing = document.getElementById('morning-extract-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.id = 'morning-extract-dialog';
  dialog.className = 'morning-extract-dialog';

  const dialogContent = document.createElement('div');
  dialogContent.className = 'morning-extract-content';

  const title = document.createElement('h3');
  title.textContent = `📋 抽出されたタスク (${items.length}件)`;
  dialogContent.appendChild(title);

  const hint = document.createElement('p');
  hint.className = 'morning-extract-hint';
  hint.textContent = '登録するタスクを選択してください';
  dialogContent.appendChild(hint);

  const { list, checkboxes } = createExtractItemList(items);
  dialogContent.appendChild(list);

  const targetSection = document.createElement('div');
  targetSection.className = 'morning-extract-target';

  const targetLabel = document.createElement('label');
  targetLabel.textContent = '登録先: ';
  targetLabel.className = 'morning-extract-target-label';

  const targetSelect = createTargetSelector();

  targetSection.appendChild(targetLabel);
  targetSection.appendChild(targetSelect);
  dialogContent.appendChild(targetSection);

  const actions = document.createElement('div');
  actions.className = 'morning-extract-actions';

  const registerBtn = document.createElement('button');
  registerBtn.className = 'morning-extract-register-btn';
  registerBtn.textContent = 'タスクとして登録';
  registerBtn.addEventListener('click', () => {
    const selectedItems = checkboxes
      .filter((cb) => cb.checked)
      .map((cb) => items[Number(cb.dataset.index)])
      .filter((item): item is string => item !== undefined);

    if (selectedItems.length === 0) {
      showNotification('タスクが選択されていません');
      return;
    }

    const targetDate = targetSelect.value || undefined;
    const count = bulkRegisterTasks(selectedItems, targetDate);
    dialog.remove();
    showNotification(`${count}件のタスクを登録しました`);
    window.location.reload();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'morning-extract-cancel-btn';
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.addEventListener('click', () => dialog.remove());

  actions.appendChild(registerBtn);
  actions.appendChild(cancelBtn);
  dialogContent.appendChild(actions);

  dialog.appendChild(dialogContent);
  document.body.appendChild(dialog);

  dialog.addEventListener('click', (e: MouseEvent) => {
    if (e.target === dialog) dialog.remove();
  });
}

function showNotification(message: string): void {
  const existing = document.getElementById('morning-notification');
  if (existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'morning-notification';
  notif.className = 'morning-notification';
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('morning-notification-fade'), 10);
  setTimeout(() => {
    if (notif.parentNode) notif.remove();
  }, 3000);
}

export function initializeMorningPagesUI(): void {
  const toggleBtn = document.getElementById('morning-pages-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', showMorningPageOverlay);
  }

  if (shouldShowOnLaunch()) {
    setTimeout(showMorningPageOverlay, 500);
  }
}
