'use client';

import { useEffect } from 'react';
import { setupAutoSync } from '@/lib/db/sync';

/**
 * Component to initialize offline-first sync
 * Should be placed in root layout or main app component
 */
export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupAutoSync();
  }, []);

  return <>{children}</>;
}
