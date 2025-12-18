import { listUsers } from '@/features/user/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UsersClient } from './users-client';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const result = await listUsers();

  return <UsersClient users={result.data || []} currentUserId={session.user.id} />;
}
