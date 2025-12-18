import { listReceivables } from '@/features/receivable/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ReceivableClient } from './receivable-client';

export default async function ReceivablePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const result = await listReceivables();

  return <ReceivableClient receivables={result.data || []} />;
}
