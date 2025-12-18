'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import {
  createBudgetSchema,
  CreateBudgetInput,
} from '@/lib/validations/financial';

/**
 * Create or update budget for a category/month/year
 */
export async function upsertBudget(data: CreateBudgetInput) {
  try {
    const user = await requireAuth();
    const validatedData = createBudgetSchema.parse(data);

    // Verify category belongs to user's family
    const category = await prisma.category.findFirst({
      where: { id: validatedData.categoryId, familyId: user.familyId },
    });

    if (!category) {
      return {
        success: false,
        error: 'Categoria não encontrada',
      };
    }

    const budget = await prisma.budget.upsert({
      where: {
        familyId_categoryId_month_year: {
          familyId: user.familyId,
          categoryId: validatedData.categoryId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
      create: {
        ...validatedData,
        familyId: user.familyId,
      },
      update: {
        amount: validatedData.amount,
      },
      include: {
        category: true,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/budget');

    return {
      success: true,
      data: budget,
    };
  } catch (error) {
    console.error('Upsert budget error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar orçamento',
    };
  }
}

/**
 * Delete budget
 */
export async function deleteBudget(id: string) {
  try {
    const user = await requireAuth();

    const existingBudget = await prisma.budget.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingBudget) {
      return {
        success: false,
        error: 'Orçamento não encontrado',
      };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/budget');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete budget error:', error);
    return {
      success: false,
      error: 'Erro ao deletar orçamento',
    };
  }
}

/**
 * List budgets for a specific month/year
 */
export async function listBudgets(month: number, year: number) {
  try {
    const user = await requireAuth();

    const budgets = await prisma.budget.findMany({
      where: {
        familyId: user.familyId,
        month,
        year,
      },
      include: {
        category: true,
      },
      orderBy: {
        category: {
          name: 'asc',
        },
      },
    });

    return {
      success: true,
      data: budgets,
    };
  } catch (error) {
    console.error('List budgets error:', error);
    return {
      success: false,
      error: 'Erro ao listar orçamentos',
      data: [],
    };
  }
}

/**
 * Get budget with actual spending comparison
 */
export async function getBudgetWithSpending(month: number, year: number) {
  try {
    const user = await requireAuth();

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        familyId: user.familyId,
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    // Get actual expenses for each category in the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        familyId: user.familyId,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate spending per category
    const spendingByCategory = expenses.reduce(
      (acc, expense) => {
        acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Combine budgets with actual spending
    const budgetsWithSpending = budgets.map((budget) => ({
      ...budget,
      spent: spendingByCategory[budget.categoryId] || 0,
      remaining: budget.amount - (spendingByCategory[budget.categoryId] || 0),
      percentage: ((spendingByCategory[budget.categoryId] || 0) / budget.amount) * 100,
    }));

    return {
      success: true,
      data: budgetsWithSpending,
    };
  } catch (error) {
    console.error('Get budget with spending error:', error);
    return {
      success: false,
      error: 'Erro ao buscar orçamento',
      data: [],
    };
  }
}
