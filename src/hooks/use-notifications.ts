'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotifications, getUnreadCount } from '@/features/notification/actions';

/**
 * Hook to fetch notifications with real-time updates
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await getNotifications();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await getUnreadCount();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
}
