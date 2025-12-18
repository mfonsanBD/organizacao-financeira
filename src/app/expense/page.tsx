import { listExpenses, listCategories } from '@/features/expense/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ExpenseClient } from './expense-client';

export default async function ExpensePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [expensesResult, categoriesResult] = await Promise.all([
    listExpenses({
      startDate: new Date(currentYear, currentMonth - 1, 1),
      endDate: new Date(currentYear, currentMonth, 0, 23, 59, 59),
    }),
    listCategories(),
  ]);

  return (
    <ExpenseClient
      expenses={expensesResult.data || []}
      categories={categoriesResult.data || []}
    />
  );
}
