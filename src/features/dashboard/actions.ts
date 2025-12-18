'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';

/**
 * Get monthly financial summary for the last N months
 */
export async function getMonthlyTrend(months: number = 6) {
  try {
    const user = await requireAuth();
    const now = new Date();
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get incomes for the month
      const incomes = await prisma.income.findMany({
        where: {
          familyId: user.familyId,
          isActive: true,
        },
      });

      // Get expenses for the month
      const expenses = await prisma.expense.findMany({
        where: {
          familyId: user.familyId,
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      monthlyData.push({
        month: targetDate.toLocaleDateString('pt-BR', { month: 'short' }),
        year,
        monthNumber: month,
        receitas: totalIncome,
        despesas: totalExpenses,
        saldo: totalIncome - totalExpenses,
      });
    }

    return {
      success: true,
      data: monthlyData,
    };
  } catch (error) {
    console.error('Get monthly trend error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar tendência mensal',
    };
  }
}

/**
 * Compare current month with previous month
 */
export async function getMonthComparison() {
  try {
    const user = await requireAuth();
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [currentIncomes, currentExpenses, previousIncomes, previousExpenses] = await Promise.all([
      prisma.income.findMany({
        where: {
          familyId: user.familyId,
          isActive: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          familyId: user.familyId,
          paymentDate: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      }),
      prisma.income.findMany({
        where: {
          familyId: user.familyId,
          isActive: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          familyId: user.familyId,
          paymentDate: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      }),
    ]);

    const currentTotalIncome = currentIncomes.reduce((sum, i) => sum + i.amount, 0);
    const currentTotalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = currentTotalIncome - currentTotalExpenses;

    const previousTotalIncome = previousIncomes.reduce((sum, i) => sum + i.amount, 0);
    const previousTotalExpenses = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousBalance = previousTotalIncome - previousTotalExpenses;

    // Calculate percentage change
    const balanceChange = previousBalance !== 0
      ? ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100
      : currentBalance !== 0 ? 100 : 0;

    const expenseChange = previousTotalExpenses !== 0
      ? ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
      : currentTotalExpenses !== 0 ? 100 : 0;

    const incomeChange = previousTotalIncome !== 0
      ? ((currentTotalIncome - previousTotalIncome) / previousTotalIncome) * 100
      : currentTotalIncome !== 0 ? 100 : 0;

    return {
      success: true,
      data: {
        current: {
          income: currentTotalIncome,
          expenses: currentTotalExpenses,
          balance: currentBalance,
        },
        previous: {
          income: previousTotalIncome,
          expenses: previousTotalExpenses,
          balance: previousBalance,
        },
        changes: {
          balance: balanceChange,
          expenses: expenseChange,
          income: incomeChange,
        },
      },
    };
  } catch (error) {
    console.error('Get month comparison error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao comparar meses',
    };
  }
}
