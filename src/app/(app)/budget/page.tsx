import { getBudgetWithSpending } from '@/features/budget/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BudgetClient } from './budget-client';

export default async function BudgetPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const result = await getBudgetWithSpending(currentMonth, currentYear);

  return (
    <BudgetClient
      budgets={result.data || []}
      month={currentMonth}
      year={currentYear}
    />
  );
}
