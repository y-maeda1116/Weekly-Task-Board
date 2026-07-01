import type { Theme } from '../types/app';

const CONFETTI_COLORS = ['red', 'orange', 'green', 'blue', 'purple'] as const;
const CONFETTI_COUNT = 20;
const BURST_COUNT = 8;

const SUCCESS_MESSAGES = [
  'タスク完了！お疲れさまでした！',
  '素晴らしい！また一つ達成しました！',
  'やったね！タスククリア！',
  '完了！次のタスクも頑張りましょう！',
  'ナイス！効率的ですね！',
];

export function initializeTheme(): void {
  const savedTheme = (localStorage.getItem('theme') || 'light') as Theme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

export function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme: Theme = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

export function updateThemeButton(theme: Theme): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.textContent = theme === 'dark' ? '☀️ ライト' : '🌙 ダーク';
}

export function initThemeEventListeners(): void {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

export function playTaskCompletionAnimation(
  taskElement: HTMLElement,
  checkbox: HTMLInputElement,
  saveTasks: () => void,
): void {
  checkbox.classList.add('success-animation');
  taskElement.classList.add('glow-effect');

  createConfettiEffect(taskElement);
  showSuccessMessage();

  setTimeout(() => {
    taskElement.classList.add('completing');
  }, 400);

  saveTasks();
}

function createConfettiEffect(taskElement: HTMLElement): void {
  const rect = taskElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const confettiElements = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const confetti = document.createElement('div');
    confetti.className = `confetti ${color}`;

    const angle = (360 / CONFETTI_COUNT) * i + Math.random() * 30;
    const distance = 40 + Math.random() * 80;
    const x = centerX + Math.cos((angle * Math.PI) / 180) * distance;
    const y = centerY + Math.sin((angle * Math.PI) / 180) * distance;

    confetti.style.left = `${x}px`;
    confetti.style.top = `${y}px`;

    const size = 6 + Math.random() * 8;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.classList.add(Math.random() > 0.5 ? 'explode' : 'fall');
    }, Math.random() * 200);

    setTimeout(() => {
      confetti.parentNode?.removeChild(confetti);
    }, 2200);

    return confetti;
  });

  void confettiElements;
  createCenterBurst(centerX, centerY);
}

function createCenterBurst(centerX: number, centerY: number): void {
  Array.from({ length: BURST_COUNT }, (_, i) => {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const burst = document.createElement('div');
    burst.className = `confetti ${color}`;

    burst.style.left = `${centerX}px`;
    burst.style.top = `${centerY}px`;
    burst.style.width = '12px';
    burst.style.height = '12px';

    document.body.appendChild(burst);

    const distance = 100 + Math.random() * 50;
    const angle = (360 / BURST_COUNT) * i;
    const endX = centerX + Math.cos((angle * Math.PI) / 180) * distance;
    const endY = centerY + Math.sin((angle * Math.PI) / 180) * distance;

    setTimeout(() => {
      burst.style.transition = 'all 1s ease-out';
      burst.style.transform = `translate(${endX - centerX}px, ${endY - centerY}px) rotate(720deg) scale(0)`;
      burst.style.opacity = '0';
    }, 100);

    setTimeout(() => {
      burst.parentNode?.removeChild(burst);
    }, 1200);

    return burst;
  });
}

function showSuccessMessage(): void {
  const message = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)] ?? '';

  const el = document.createElement('div');
  el.className = 'success-message';
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add('show');
  }, 100);

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => {
      el.parentNode?.removeChild(el);
    }, 300);
  }, 2000);
}
