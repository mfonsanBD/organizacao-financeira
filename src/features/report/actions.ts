'use server';

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  type: 'expenses' | 'incomes' | 'budgets' | 'receivables' | 'complete';
}

/**
 * Export financial data to XLSX
 * Returns base64 encoded file data
 */
export async function exportToExcel(options: ExportOptions) {
  try {
    const user = await requireAuth();
    const { startDate, endDate, type } = options;

    const workbook = XLSX.utils.book_new();

    // Export based on type
    switch (type) {
      case 'expenses':
        await exportExpenses(workbook, user.familyId, startDate, endDate);
        break;
      case 'incomes':
        await exportIncomes(workbook, user.familyId);
        break;
      case 'budgets':
        await exportBudgets(workbook, user.familyId, startDate, endDate);
        break;
      case 'receivables':
        await exportReceivables(workbook, user.familyId);
        break;
      case 'complete':
        await exportExpenses(workbook, user.familyId, startDate, endDate);
        await exportIncomes(workbook, user.familyId);
        await exportBudgets(workbook, user.familyId, startDate, endDate);
        await exportReceivables(workbook, user.familyId);
        break;
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');

    return {
      success: true,
      data: base64,
      filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: 'Erro ao exportar dados',
    };
  }
}

async function exportExpenses(
  workbook: XLSX.WorkBook,
  familyId: string,
  startDate?: Date,
  endDate?: Date,
) {
  const expenses = await prisma.expense.findMany({
    where: {
      familyId,
      ...(startDate && endDate
        ? {
            paymentDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    },
    include: {
      category: true,
    },
    orderBy: {
      paymentDate: 'desc',
    },
  });

  const data = expenses.map((expense) => ({
    Data: new Date(expense.paymentDate).toLocaleDateString('pt-BR'),
    Descrição: expense.description,
    Categoria: expense.category.name,
    Valor: expense.amount,
    Recorrente: expense.isRecurring ? 'Sim' : 'Não',
    Recorrência: expense.recurrence || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Despesas');
}

async function exportIncomes(workbook: XLSX.WorkBook, familyId: string) {
  const incomes = await prisma.income.findMany({
    where: {
      familyId,
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  const data = incomes.map((income) => ({
    Descrição: income.description,
    Valor: income.amount,
    'Dia do Vencimento': income.dueDate,
    Ativo: income.isActive ? 'Sim' : 'Não',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rendas');
}

async function exportBudgets(
  workbook: XLSX.WorkBook,
  familyId: string,
  startDate?: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _endDate?: Date,
) {
  const month = startDate?.getMonth() ?? new Date().getMonth();
  const year = startDate?.getFullYear() ?? new Date().getFullYear();

  const budgets = await prisma.budget.findMany({
    where: {
      familyId,
      month: month + 1,
      year,
    },
    include: {
      category: true,
    },
  });

  const budgetData = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.expense.aggregate({
        where: {
          familyId,
          categoryId: budget.categoryId,
          paymentDate: {
            gte: new Date(year, month, 1),
            lte: new Date(year, month + 1, 0, 23, 59, 59),
          },
        },
        _sum: {
          amount: true,
        },
      });

      const spentAmount = spent._sum.amount || 0;
      const percentage = (spentAmount / budget.amount) * 100;

      return {
        Categoria: budget.category.name,
        Orçamento: budget.amount,
        Gasto: spentAmount,
        Restante: budget.amount - spentAmount,
        'Percentual (%)': percentage.toFixed(2),
        Status: percentage > 100 ? 'EXCEDIDO' : percentage > 80 ? 'ALERTA' : 'OK',
      };
    }),
  );

  const worksheet = XLSX.utils.json_to_sheet(budgetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orçamentos');
}

async function exportReceivables(workbook: XLSX.WorkBook, familyId: string) {
  const receivables = await prisma.receivable.findMany({
    where: {
      familyId,
    },
    orderBy: {
      expectedDate: 'asc',
    },
  });

  const data = receivables.map((receivable) => ({
    Descrição: receivable.description,
    Valor: receivable.amount,
    'Data Esperada': new Date(receivable.expectedDate).toLocaleDateString('pt-BR'),
    'Data Recebida': receivable.receivedDate
      ? new Date(receivable.receivedDate).toLocaleDateString('pt-BR')
      : '-',
    Status: receivable.isReceived ? 'Recebido' : 'Pendente',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'A Receber');
}

/**
 * Get summary report data
 */
export async function getSummaryReport(startDate: Date, endDate: Date) {
  try {
    const user = await requireAuth();

    const [incomes, expenses, budgets, receivables] = await Promise.all([
      prisma.income.findMany({
        where: { familyId: user.familyId, isActive: true },
      }),
      prisma.expense.findMany({
        where: {
          familyId: user.familyId,
          paymentDate: { gte: startDate, lte: endDate },
        },
        include: { category: true },
      }),
      prisma.budget.findMany({
        where: {
          familyId: user.familyId,
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear(),
        },
        include: { category: true },
      }),
      prisma.receivable.findMany({
        where: {
          familyId: user.familyId,
          expectedDate: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalReceivables = receivables
      .filter((r) => !r.isReceived)
      .reduce((sum, r) => sum + r.amount, 0);

    const expensesByCategory = expenses.reduce(
      (acc, expense) => {
        const categoryName = expense.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalBudget,
        totalReceivables,
        balance: totalIncome - totalExpenses,
        expensesByCategory,
        period: {
          start: startDate,
          end: endDate,
        },
      },
    };
  } catch (error) {
    console.error('Get summary report error:', error);
    return {
      success: false,
      error: 'Erro ao gerar relatório',
    };
  }
}
