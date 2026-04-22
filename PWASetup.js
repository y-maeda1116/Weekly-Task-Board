(function() {
    'use strict';

    var deferredPrompt = null;

    /**
     * Service Worker の登録
     */
    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                var registration = await navigator.serviceWorker.register('./sw.js', {
                    scope: './'
                });
                console.log('\u2705 Service Worker \u767b\u9332\u6210\u529f:', registration.scope);

                // Service Worker の更新をチェック
                registration.addEventListener('updatefound', function() {
                    var newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 新しい Service Worker が利用可能
                                showUpdateNotification();
                            }
                        });
                    }
                });

            } catch (error) {
                console.error('\u274c Service Worker \u767b\u9332\u5931\u6557:', error);
            }
        }
    }

    /**
     * 更新通知を表示
     */
    function showUpdateNotification() {
        var notification = document.createElement('div');
        notification.className = 'update-notification';

        var span = document.createElement('span');
        span.textContent = '\ud83d\udd04 \u65b0\u3057\u3044\u30d0\u30fc\u30b8\u30e7\u30f3\u304c\u5229\u7528\u53ef\u80fd\u3067\u3059';

        var updateBtn = document.createElement('button');
        updateBtn.id = 'update-btn';
        updateBtn.textContent = '\u66f4\u65b0';

        var dismissBtn = document.createElement('button');
        dismissBtn.id = 'dismiss-btn';
        dismissBtn.textContent = '\u5f8c\u3067';

        notification.appendChild(span);
        notification.appendChild(updateBtn);
        notification.appendChild(dismissBtn);

        document.body.appendChild(notification);

        updateBtn.addEventListener('click', function() {
            // Service Worker にスキップを指示
            navigator.serviceWorker.getRegistration().then(function(registration) {
                if (registration) {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            });
            window.location.reload();
        });

        dismissBtn.addEventListener('click', function() {
            notification.remove();
        });
    }

    /**
     * PWA インストールプロンプトを設定
     */
    function setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', function(e) {
            // デフォルトのプロンプトを防止
            e.preventDefault();
            deferredPrompt = e;

            // インストールボタンを表示
            showInstallButton();
        });

        // インストール完了を検知
        window.addEventListener('appinstalled', function() {
            deferredPrompt = null;
            hideInstallButton();
            showNotification('\ud83c\udf89 \u30a2\u30d7\u30ea\u3092\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3057\u307e\u3057\u305f\uff01', 'success');
        });
    }

    /**
     * インストールボタンを表示
     */
    function showInstallButton() {
        // 既存のボタンがあれば削除
        var existingBtn = document.getElementById('install-app-btn');
        if (existingBtn) existingBtn.remove();

        var installBtn = document.createElement('button');
        installBtn.id = 'install-app-btn';
        installBtn.className = 'install-btn';
        installBtn.textContent = '\ud83d\udcf1 \u30a2\u30d7\u30ea\u3092\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb';
        installBtn.title = '\u30db\u30fc\u30e0\u753b\u9762\u306b\u8ffd\u52a0';

        installBtn.addEventListener('click', async function() {
            if (deferredPrompt) {
                // インストールプロンプトを表示
                deferredPrompt.prompt();

                // ユーザーの選択を待機
                var result = await deferredPrompt.userChoice;

                console.log('\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u7d50\u679c: ' + result.outcome);
                deferredPrompt = null;

                if (result.outcome === 'accepted') {
                    hideInstallButton();
                }
            }
        });

        // ヘッダーコントロールに追加
        var headerControls = document.getElementById('header-controls');
        if (headerControls) {
            headerControls.appendChild(installBtn);
        }
    }

    /**
     * インストールボタンを非表示
     */
    function hideInstallButton() {
        var installBtn = document.getElementById('install-app-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    /**
     * PWA 機能を初期化
     */
    function initPWA() {
        // Service Worker 登録
        registerServiceWorker();

        // インストールプロンプト設定
        setupInstallPrompt();

        // オンライン/オフライン状態の監視
        window.addEventListener('online', function() {
            showNotification('\ud83c\udf10 \u30aa\u30f3\u30e9\u30a4\u30f3\u306b\u63a5\u7d9a\u3057\u307e\u3057\u305f', 'success');
        });

        window.addEventListener('offline', function() {
            showNotification('\ud83d\udce1 \u30aa\u30d5\u30e9\u30a4\u30f3\u3067\u3059\u3002\u30ad\u30e3\u30c3\u30b7\u30e5\u3055\u308c\u305f\u30c7\u30fc\u30bf\u3092\u8868\u793a\u3057\u307e\u3059', 'warning');
        });
    }

    /**
     * 通知を表示
     */
    function showNotification(message, type) {
        if (type === undefined) type = 'info';

        var notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(function() {
            notification.classList.add('show');
        }, 10);

        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() { notification.remove(); }, 300);
        }, 3000);
    }

    // Export via window
    window.PWASetup = {
        registerServiceWorker,
        showUpdateNotification,
        setupInstallPrompt,
        showInstallButton,
        hideInstallButton,
        initPWA,
        showNotification
    };

})();
