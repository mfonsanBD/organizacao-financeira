import { getNotifications } from '@/features/notification/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NotificationsClient } from './notifications-client';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const result = await getNotifications();

  return <NotificationsClient notifications={result.data || []} />;
}
