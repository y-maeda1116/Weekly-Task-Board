/**
 * Service Worker for Weekly Task Board PWA
 * オフライン対応とキャッシュ機能を提供
 */

const CACHE_NAME = 'taskboard-v1.5.7';
const RUNTIME_CACHE = 'taskboard-runtime-v1';

// キャッシュするアセット
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  // ライブラリ（CDNを使用している場合）
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// インストールイベント - 静的リソースをキャッシュ
self.addEventListener('install', (event) => {
  console.log('[SW] Install event:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
        // CDNリソースが利用できない場合でも続行
        return Promise.resolve();
      });
    })
  );
  
  // 新しい Service Worker をすぐにアクティベート
  self.skipWaiting();
});

// アクティベートイベント - 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ以外を削除
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // クライアントを即座にコントロール
  self.clients.claim();
});

// フェッチイベント - ネットワークリクエストを制御
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 同一オリジンのリクエストのみ処理
  if (url.origin !== self.location.origin) {
    // CDNリソースは Stale-While-Revalidate
    if (url.hostname === 'cdnjs.cloudflare.com') {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
              // ネットワーク成功時はキャッシュを更新
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              // ネットワーク失敗時はキャッシュを返す
              return cachedResponse;
            });
            
            // キャッシュがあれば即座に返し、バックグラウンドで更新
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }
    return; // 他のオリジンは処理しない
  }
  
  // HTML リクエストは Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // レスポンスをキャッシュ
          const clonedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュまたは offline.html
          return caches.match(request)
            .then((cached) => cached || caches.match('./index.html'));
        })
    );
    return;
  }
  
  // 静的アセットは Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // キャッシュがあれば返す
        return cachedResponse;
      }
      
      // キャッシュがなければネットワークから取得
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // レスポンスをキャッシュ
        const responseToCache = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // 画像リクエストの場合は何も返さない
        if (request.destination === 'image') {
          return new Response('', { status: 404 });
        }
      });
    })
  );
});

// メッセージイベント - キャッシュの手動管理
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(payload.urls);
      })
    );
  }
  
  if (type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      // タスクの同期処理
      Promise.resolve()
    );
  }
});

// プッシュ通知（オプション）
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Task Board', options)
    );
  }
});
