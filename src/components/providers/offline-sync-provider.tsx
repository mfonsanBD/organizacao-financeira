'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setupAutoSync } from '@/lib/db/sync';

/**
 * Component to initialize offline-first sync
 * Should be placed in root layout or main app component
 */
export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.familyId) {
      // Setup automatic sync on network reconnection and periodic sync
      setupAutoSync();
    }
  }, [session?.user?.familyId]);

  return <>{children}</>;
}
