'use server';

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  type: 'expenses' | 'incomes' | 'complete';
}

/**
 * Export financial data to XLSX
 * Returns base64 encoded file data
 */
export async function exportToExcel(options: ExportOptions) {
  try {
    await requireAuth();
    const { startDate, endDate, type } = options;

    const workbook = XLSX.utils.book_new();

    // Export based on type
    switch (type) {
      case 'expenses':
        await exportExpenses(workbook, startDate, endDate);
        break;
      case 'incomes':
        await exportIncomes(workbook);
        break;
      case 'complete':
        await exportExpenses(workbook, startDate, endDate);
        await exportIncomes(workbook);
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
  startDate?: Date,
  endDate?: Date,
) {
  const expenses = await prisma.expense.findMany({
    where: {
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
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Despesas');
}

async function exportIncomes(workbook: XLSX.WorkBook) {
  const incomes = await prisma.income.findMany({
    orderBy: {
      paymentData: 'asc',
    },
  });

  const data = incomes.map((income) => ({
    Descrição: income.description,
    Valor: income.amount,
    'Data de Pagamento': new Date(income.paymentData).toLocaleDateString('pt-BR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rendas');
}

/**
 * Get summary report data
 */
export async function getSummaryReport(startDate: Date, endDate: Date) {
  try {
    await requireAuth();

    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: { paymentData: { gte: startDate, lte: endDate } },
      }),
      prisma.expense.findMany({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
        },
        include: { category: true },
      }),
    ]);

    const totalIncome = incomes.reduce((sum: number, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0);

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
