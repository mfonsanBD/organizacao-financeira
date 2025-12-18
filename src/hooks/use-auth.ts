'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAdmin: session?.user?.role === 'ADMIN',
    isMember: session?.user?.role === 'MEMBER',
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
