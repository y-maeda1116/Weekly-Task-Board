/**
 * Service Worker for Weekly Task Board
 * Handles offline caching and PWA functionality
 */

const CACHE_NAME = 'weekly-task-board-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/favicon.svg',
  '/manifest.json'
];

/**
 * Install event - Cache application shell
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache:', CACHE_NAME);
      return cache.addAll(CACHE_URLS);
    }).catch((error) => {
      console.error('Cache installation failed:', error);
    })
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Fetch event - Serve from cache, fall back to network
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip caching for non-same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Try cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      // Fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        throw error;
      });
    })
  );
});

/**
 * Message event - Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Get current cache name
 * @returns Cache name
 */
export function getCacheName(): string {
  return CACHE_NAME;
}

/**
 * Get cache URLs
 * @returns Array of cached URLs
 */
export function getCacheUrls(): string[] {
  return [...CACHE_URLS];
}
