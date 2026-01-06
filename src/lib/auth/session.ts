import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SessionUser } from '@/types';

/**
 * Get current authenticated user session
 * Use this in Server Components and Server Actions
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user as SessionUser | null;
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Não autenticado');
  }
  return user;
}

/**
 * Require admin role
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas administradores');
  }
  return user;
}
