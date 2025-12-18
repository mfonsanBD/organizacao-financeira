'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseRealtimeQueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  pollingInterval?: number;
  enabled?: boolean;
}

/**
 * Hook for real-time data with intelligent polling
 * Automatically refetches data at intervals for collaborative updates
 */
export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  pollingInterval = 30000, // Default 30 seconds
  enabled = true,
}: UseRealtimeQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    // Polling for real-time updates
    refetchInterval: pollingInterval,
    // Refetch when window gets focus (user returns to app)
    refetchOnWindowFocus: true,
    // Refetch when reconnecting to internet
    refetchOnReconnect: true,
    // Keep previous data while fetching new data (better UX)
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to invalidate queries manually
 * Useful for triggering updates after mutations
 */
export function useQueryHelpers() {
  const client = useQueryClient();

  const invalidateFinancialData = () => {
    // Invalidate all financial queries
    client.invalidateQueries({ queryKey: ['incomes'] });
    client.invalidateQueries({ queryKey: ['expenses'] });
    client.invalidateQueries({ queryKey: ['budgets'] });
    client.invalidateQueries({ queryKey: ['receivables'] });
    client.invalidateQueries({ queryKey: ['categories'] });
    client.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const invalidateNotifications = () => {
    client.invalidateQueries({ queryKey: ['notifications'] });
  };

  const invalidateAll = () => {
    client.invalidateQueries();
  };

  return {
    invalidateFinancialData,
    invalidateNotifications,
    invalidateAll,
  };
}

/**
 * Hook for online/offline detection
 */
export function useOnlineStatus() {
  return useQuery({
    queryKey: ['online-status'],
    queryFn: () => navigator.onLine,
    // Check every 5 seconds
    refetchInterval: 5000,
    initialData: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
}
