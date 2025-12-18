'use client';

import { useEffect } from 'react';
import { register } from '@/lib/notifications/service-worker';

/**
 * Component to register service worker on mount
 * Place in root layout
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker after mount
    if (process.env.NODE_ENV === 'production') {
      register().catch((error) => {
        console.error('Failed to register service worker:', error);
      });
    }
  }, []);

  return null;
}
