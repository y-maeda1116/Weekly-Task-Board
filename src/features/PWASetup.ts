type NotificationType = 'info' | 'success' | 'warning';

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: './',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          showUpdateNotification();
        }
      });
    });
  } catch (error) {
    console.error('❌ Service Worker 登録失敗:', error);
  }
}

function showUpdateNotification(): void {
  const notification = document.createElement('div');
  notification.className = 'update-notification';

  const span = document.createElement('span');
  span.textContent = '🔄 新しいバージョンが利用可能です';

  const updateBtn = document.createElement('button');
  updateBtn.id = 'update-btn';
  updateBtn.textContent = '更新';

  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'dismiss-btn';
  dismissBtn.textContent = '後で';

  notification.appendChild(span);
  notification.appendChild(updateBtn);
  notification.appendChild(dismissBtn);
  document.body.appendChild(notification);

  updateBtn.addEventListener('click', () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    window.location.reload();
  });

  dismissBtn.addEventListener('click', () => {
    notification.remove();
  });
}

function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    showNotification('🎉 アプリをインストールしました！', 'success');
  });
}

function showInstallButton(): void {
  const existingBtn = document.getElementById('install-app-btn');
  if (existingBtn) existingBtn.remove();

  const installBtn = document.createElement('button');
  installBtn.id = 'install-app-btn';
  installBtn.className = 'install-btn';
  installBtn.textContent = '📱 アプリをインストール';
  installBtn.title = 'ホーム画面に追加';

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    console.log('インストール結果: ' + result.outcome);
    deferredPrompt = null;

    if (result.outcome === 'accepted') {
      hideInstallButton();
    }
  });

  const headerControls = document.getElementById('header-controls');
  if (headerControls) {
    headerControls.appendChild(installBtn);
  }
}

function hideInstallButton(): void {
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.remove();
  }
}

function showNotification(message: string, type: NotificationType = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => { notification.remove(); }, 300);
  }, 3000);
}

function initPWA(): void {
  registerServiceWorker();
  setupInstallPrompt();

  window.addEventListener('online', () => {
    showNotification('🌐 オンラインに接続しました', 'success');
  });

  window.addEventListener('offline', () => {
    showNotification('📡 オフラインです。キャッシュされたデータを表示します', 'warning');
  });
}

export {
  registerServiceWorker,
  showUpdateNotification,
  setupInstallPrompt,
  showInstallButton,
  hideInstallButton,
  initPWA,
  showNotification,
};
