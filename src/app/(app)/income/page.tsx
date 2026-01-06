import { listIncomes } from '@/features/income/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { IncomeClient } from './income-client';

export default async function IncomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Buscar rendas do mês atual com UTC
  const result = await listIncomes({
    startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0)),
    endDate: new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59)),
  });

  async function handleFilterChange(filters: { startDate: string; endDate: string }) {
    'use server';
    return listIncomes({
      startDate: new Date(filters.startDate),
      endDate: new Date(filters.endDate),
    });
  }

  return <IncomeClient incomes={result.data || []} onFilterChange={handleFilterChange} />;
}
