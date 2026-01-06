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
      startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0)),
      endDate: new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59)),
    }),
    listCategories(),
  ]);

  async function handleFilterChange(filters: { startDate: string; endDate: string }) {
    'use server';
    const result = await listExpenses({
      startDate: new Date(filters.startDate),
      endDate: new Date(filters.endDate),
    });
    return result;
  }

  return (
    <ExpenseClient
      expenses={expensesResult.data || []}
      categories={categoriesResult.data || []}
      onFilterChange={handleFilterChange}
    />
  );
}
