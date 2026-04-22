/**
 * TS7 Minimal Entry Point
 * TypeScript 7.0 Beta (Go-based) で動作確認するための最小エントリ
 */

interface Task {
  id: string;
  name: string;
  completed: boolean;
  signifier: SignifierType;
}

type SignifierType = 'none' | 'task' | 'note' | 'important' | 'consider' | 'idea';

const SIGNIFIER_SYMBOLS: Record<SignifierType, string> = {
  none: '\u2B1C',
  task: '\u2705',
  note: '\uD83D\uDCDD',
  important: '\u2757',
  consider: '\uD83E\uDD14',
  idea: '\uD83D\uDCA1'
};

const SIGNIFIER_LABELS: Record<SignifierType, string> = {
  none: '\u672A\u8A2D\u5B9A',
  task: '\u30BF\u30B9\u30AF',
  note: '\u30E1\u30E2',
  important: '\u91CD\u8981',
  consider: '\u691C\u8A0E',
  idea: '\u30A2\u30A4\u30C7\u30A2'
};

const SIGNIFIER_ORDER: SignifierType[] = [
  'none', 'task', 'note', 'important', 'consider', 'idea'
];

function createTask(name: string): Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    completed: false,
    signifier: 'none'
  };
}

function cycleSignifier(task: Task): Task {
  const currentIndex = SIGNIFIER_ORDER.indexOf(task.signifier);
  const nextIndex = (currentIndex + 1) % SIGNIFIER_ORDER.length;
  return {
    ...task,
    signifier: SIGNIFIER_ORDER[nextIndex]
  };
}

function toggleComplete(task: Task): Task {
  return {
    ...task,
    completed: !task.completed
  };
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// State
const state: Task[] = [
  createTask('TS 7.0 Beta \u306E\u52D5\u4F5C\u78BA\u8A8D'),
  createTask('Vite \u30D3\u30EB\u30C9\u306E\u78BA\u8A8D'),
  createTask('tsgo \u578B\u30C1\u30A7\u30C3\u30AF\u306E\u78BA\u8A8D')
];

function createTaskElement(task: Task, index: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'task-item';
  if (task.completed) {
    row.style.textDecoration = 'line-through';
    row.style.opacity = '0.5';
  }

  const symbol = document.createElement('span');
  symbol.className = 'task-signifier';
  symbol.textContent = SIGNIFIER_SYMBOLS[task.signifier];
  symbol.title = SIGNIFIER_LABELS[task.signifier];
  symbol.style.cursor = 'pointer';
  symbol.style.fontSize = '1.4em';
  symbol.addEventListener('click', () => {
    state[index] = cycleSignifier(state[index]);
    render();
  });

  const name = document.createElement('span');
  name.className = 'task-name';
  name.textContent = task.name;
  name.style.cursor = 'pointer';
  name.style.flex = '1';
  name.addEventListener('click', () => {
    state[index] = toggleComplete(state[index]);
    render();
  });

  row.appendChild(symbol);
  row.appendChild(name);
  return row;
}

// Render
function render(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.textContent = '';

  const toolbar = document.createElement('div');
  toolbar.style.marginBottom = '12px';

  const input = document.createElement('input');
  input.id = 'new-task-input';
  input.type = 'text';
  input.placeholder = '\u65B0\u3057\u3044\u30BF\u30B9\u30AF...';
  input.style.padding = '8px';
  input.style.border = '1px solid #ddd';
  input.style.borderRadius = '6px';
  input.style.width = '70%';

  const addBtn = document.createElement('button');
  addBtn.textContent = '\u8FFD\u52A0';

  const addTask = (): void => {
    const taskName = input.value.trim();
    if (taskName) {
      state.push(createTask(taskName));
      render();
    }
  };

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });

  toolbar.appendChild(input);
  toolbar.appendChild(addBtn);

  const list = document.createElement('div');
  list.id = 'task-list';
  state.forEach((task, index) => {
    list.appendChild(createTaskElement(task, index));
  });

  const hint = document.createElement('p');
  hint.style.color = '#888';
  hint.style.fontSize = '0.85em';
  hint.style.marginTop = '12px';
  hint.textContent = '\u8A18\u53F7\u30AF\u30EA\u30C3\u30AF \u2192 \u30B5\u30A4\u30AF\u30EB | \u540D\u524D\u30AF\u30EA\u30C3\u30AF \u2192 \u5B8C\u4E86\u5207\u66FF';

  app.appendChild(toolbar);
  app.appendChild(list);
  app.appendChild(hint);
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  console.log('[TS7] Weekly Task Board \u2014 TypeScript 7.0 Beta scaffold loaded');
  render();
});
