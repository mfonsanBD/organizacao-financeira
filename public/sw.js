 

// Service Worker for PWA
// Handles offline functionality and background sync

const CACHE_NAME = 'organizacao-financeira-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/offline',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline');
        });
      })
  );
});

// Background Sync - sync offline data when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-financial-data') {
    event.waitUntil(syncFinancialData());
  }
});

async function syncFinancialData() {
  try {
    // This will be called when the app comes back online
    // The actual sync logic is handled by the Dexie sync in the app
    console.log('Background sync triggered');
    
    // Notify all clients that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_START',
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.message || 'Nova atualização disponível',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: data.link || '/dashboard',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Organização Financeira', options)
  );
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
