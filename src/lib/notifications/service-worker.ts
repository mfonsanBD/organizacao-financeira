/**
 * Register service worker for background sync
 */
export async function register() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration.scope);

      // Request permission for notifications
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

      // Listen for sync events from service worker
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data.type === 'SYNC_START') {
          console.log('Background sync started');
          // Trigger sync logic
          const { syncWithBackend } = await import('@/lib/db/sync');
          await syncWithBackend();
        }
      });

      // Register background sync if supported
      if ('sync' in registration) {
        try {
          await (registration as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-financial-data');
          console.log('Background sync registered');
        } catch (error) {
          console.error('Background sync registration failed:', error);
        }
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  return null;
}

/**
 * Unregister service worker
 */
export async function unregister() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
  }
}

/**
 * Check if app can be installed (PWA)
 */
export function checkInstallability() {
  if (typeof window === 'undefined') return false;

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false; // Already installed
  }

  return true;
}

/**
 * Show install prompt
 */
export function showInstallPrompt() {
  // This should be called in response to the beforeinstallprompt event
  // Implementation depends on storing the event in your app state
  console.log('Install prompt triggered');
}
