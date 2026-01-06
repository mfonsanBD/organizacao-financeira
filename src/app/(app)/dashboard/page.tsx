/* eslint-disable @typescript-eslint/no-explicit-any */
import { listCategories } from '@/features/expense/actions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DashboardClient } from './dashboard-client';

import { eachDayOfInterval, eachMonthOfInterval, endOfDay, format, startOfDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

function buildExpenseTrendSeries(
  entries: Array<{ type: string; amount: number; date: Date }>,
  startDate: Date,
  endDate: Date
): Array<{ label: string; despesas: number }> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const useDaily = diffDays <= 60;

  if (useDaily) {
    const byDay = new Map<string, number>();
    for (const entry of entries) {
      if (entry.type !== 'EXPENSE') continue;
      // Usar toISOString para garantir UTC e pegar apenas a parte da data
      const key = entry.date.toISOString().split('T')[0];
      const prev = byDay.get(key) || 0;
      byDay.set(key, prev + entry.amount);
    }
    return eachDayOfInterval({ start, end }).map((date: Date) => {
      const key = format(date, 'yyyy-MM-dd');
      const despesas = byDay.get(key) || 0;
      return {
        label: format(date, 'dd MMM', { locale: ptBR }),
        despesas,
      };
    });
  }

  // Mensal
  const byMonth = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== 'EXPENSE') continue;
    // Usar toISOString para garantir UTC e pegar ano-mês
    const key = entry.date.toISOString().substring(0, 7); // 'YYYY-MM'
    const prev = byMonth.get(key) || 0;
    byMonth.set(key, prev + entry.amount);
  }
  const startMonth = startOfMonth(start);
  const endMonth = startOfMonth(end);
  return eachMonthOfInterval({ start: startMonth, end: endMonth }).map((monthDate: Date) => {
    const key = format(monthDate, 'yyyy-MM');
    const despesas = byMonth.get(key) || 0;
    return {
      label: format(monthDate, 'MMM/yy', { locale: ptBR }),
      despesas,
    };
  });
}

async function getDashboardData(startDate: Date, endDate: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  // Buscar incomes e expenses separadamente
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: {
        paymentData: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        amount: true,
        description: true,
        paymentData: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { paymentDate: 'desc' },
      select: {
        id: true,
        amount: true,
        description: true,
        paymentDate: true,
        categoryId: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
  ]);

  // Transformar em entries unificadas para os gráficos
  const entries = [
    ...incomes.map((i) => ({
      type: 'INCOME' as const,
      amount: i.amount,
      date: i.paymentData,
      categoryId: null,
    })),
    ...expenses.map((e) => ({
      type: 'EXPENSE' as const,
      amount: e.amount,
      date: e.paymentDate,
      categoryId: e.categoryId,
    })),
  ];

  const totalIncome = entries.filter((e) => e.type === 'INCOME').reduce((sum: number, e) => sum + e.amount, 0);
  const totalExpenses = entries.filter((e) => e.type === 'EXPENSE').reduce((sum: number, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const incomesCount = entries.filter((e) => e.type === 'INCOME').length;
  const expensesCount = entries.filter((e) => e.type === 'EXPENSE').length;

  const monthlyTrendData = buildExpenseTrendSeries(entries, startDate, endDate);

  const categoriesResult = await listCategories();
  const expensesByCategory =
    categoriesResult.data
      ?.map((cat: any) => {
        const total = entries.filter((e) => e.type === 'EXPENSE' && e.categoryId === cat.id).reduce((sum: number, e) => sum + e.amount, 0) || 0;
        return {
          name: cat.name,
          value: total,
          color: cat.color || '#6b7280',
        };
      })
      .filter((item: any) => item.value > 0) || [];

  return {
    totalIncome,
    totalExpenses,
    balance,
    balanceChangePercentage: 0,
    incomesCount,
    expensesCount,
    monthlyTrendData,
    expensesByCategory,
    isEmpty: entries.length === 0,
    expenses: expenses.map((e) => ({
      amount: e.amount,
      date: e.paymentDate,
      expense: {
        description: e.description,
        category: {
          name: e.category.name,
        },
        status: e.status,
      },
      createdBy: {
        name: session.user.name,
      },
    })),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Criar datas em UTC para evitar problemas de timezone
  const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

  const initialData = await getDashboardData(startDate, endDate);

  async function handleFilterChange(filters: { startDate: string; endDate: string }) {
    'use server';
    return getDashboardData(new Date(filters.startDate), new Date(filters.endDate));
  }

  return (
    <DashboardClient
      userName={session.user.name}
      initialData={initialData}
      onFilterChange={handleFilterChange}
    />
  );
}