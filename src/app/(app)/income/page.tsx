import { listIncomes, deleteIncome, toggleIncomeStatus } from '@/features/income/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { IncomeClient } from './income-client';

export default async function IncomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const result = await listIncomes();

  return <IncomeClient incomes={result.data || []} />;
}
