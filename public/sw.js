 

// Service Worker for PWA
// Handles offline functionality, background sync, and push notifications

const CACHE_NAME = 'organizacao-financeira-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll([
        '/',
        '/dashboard',
        '/offline',
        '/manifest.json',
      ]).catch((error) => {
        console.error('[SW] Cache failed:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch((error) => {
        console.log('[SW] Fetch failed, returning cached version:', error);
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline');
        });
      })
  );
});

// Background Sync - sync offline data when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  if (event.tag === 'sync-financial-data') {
    event.waitUntil(syncFinancialData());
  }
});

async function syncFinancialData() {
  try {
    console.log('[SW] Background sync triggered');
    
    // Notify all clients that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_START',
      });
    });
    
    console.log('[SW] Sync completed successfully');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // Re-throw to retry sync
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body || data.message || 'Nova atualização disponível',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-96x96.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'financial-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
      data: {
        url: data.data?.url || data.link || '/dashboard',
        timestamp: Date.now(),
        ...data.data,
      },
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Organização Financeira',
        options
      ).then(() => {
        console.log('[SW] Notification shown successfully');
      }).catch((error) => {
        console.error('[SW] Failed to show notification:', error);
      })
    );
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
