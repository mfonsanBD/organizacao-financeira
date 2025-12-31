'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import {
  createExpenseSchema,
  updateExpenseSchema,
  createCategorySchema,
  updateCategorySchema,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/lib/validations/financial';
import { createNotificationForFamily } from '@/features/notification/actions';
import { sendPushToUsers } from '@/lib/webpush/server';

/**
 * Create new expense
 */
export async function createExpense(data: CreateExpenseInput) {
  try {
    const user = await requireAuth();
    const validatedData = createExpenseSchema.parse(data);

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

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        familyId: user.familyId,
      },
      include: {
        category: true,
      },
    });

    // Cria TransactionEntry para histórico
    try {
      await prisma.transactionEntry.create({
        data: {
          familyId: user.familyId,
          type: 'EXPENSE',
          expenseId: expense.id,
          categoryId: expense.categoryId,
          date: expense.paymentDate,
          amount: expense.amount,
          note: 'Lançamento automático ao criar despesa',
          createdById: user.id
        },
      });
    } catch (err) {
      console.error('Falha ao criar TransactionEntry automático (expense):', err);
    }

    // Create notification for family members
    await createNotificationForFamily({
      title: '💸 Nova Despesa Registrada',
      message: `${user.name} registrou: ${expense.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)} [${category.name}]`,
      link: '/expense',
    });

    // Send push notification to all family members except the creator
    const familyMembers = await prisma.user.findMany({
      where: {
        familyId: user.familyId,
        id: { not: user.id },
      },
      select: { id: true },
    });

    if (familyMembers.length > 0) {
      await sendPushToUsers(
        familyMembers.map((m) => m.id),
        {
          title: '💸 Nova Despesa',
          body: `${user.name} registrou: ${expense.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}`,
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          data: {
            url: '/expense',
            expenseId: expense.id,
          },
        },
        prisma
      );
    }

    revalidatePath('/dashboard');
    revalidatePath('/expense');

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    console.error('Create expense error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar despesa',
    };
  }
}

/**
 * Update expense
 */
export async function updateExpense(id: string, data: UpdateExpenseInput) {
  try {
    const user = await requireAuth();
    const validatedData = updateExpenseSchema.parse(data);

    // Verify expense belongs to user's family
    const existingExpense = await prisma.expense.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingExpense) {
      return {
        success: false,
        error: 'Despesa não encontrada',
      };
    }

    // If updating category, verify it belongs to user's family
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: validatedData.categoryId, familyId: user.familyId },
      });

      if (!category) {
        return {
          success: false,
          error: 'Categoria não encontrada',
        };
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    // Cria TransactionEntry para histórico se valor ou data mudou
    if (
      (typeof validatedData.amount === 'number' && existingExpense.amount !== validatedData.amount) ||
      (validatedData.paymentDate &&
        new Date(existingExpense.paymentDate).getTime() !== new Date(validatedData.paymentDate).getTime())
    ) {
      try {
        await prisma.transactionEntry.create({
            data: {
            familyId: user.familyId,
            type: 'EXPENSE',
            expenseId: expense.id,
              categoryId: expense.categoryId,
              date: expense.paymentDate,
              amount: expense.amount,
              note: 'Lançamento automático ao editar despesa',
            },
          });
      } catch (err) {
        console.error('Falha ao criar TransactionEntry automático (update expense):', err);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/expense');

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    console.error('Update expense error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar despesa',
    };
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(id: string) {
  try {
    const user = await requireAuth();

    const existingExpense = await prisma.expense.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingExpense) {
      return {
        success: false,
        error: 'Despesa não encontrada',
      };
    }

    await prisma.expense.delete({
      where: { id },
    });

    const entry = await prisma.transactionEntry.findFirst({
      where: { expenseId: id },
    });

    if (entry) {
      await prisma.transactionEntry.delete({
        where: { id: entry.id },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/expense');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete expense error:', error);
    return {
      success: false,
      error: 'Erro ao deletar despesa',
    };
  }
}

/**
 * List expenses with filters
 */
export async function listExpenses(filters?: {
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const user = await requireAuth();

    const expenses = await prisma.expense.findMany({
      where: {
        familyId: user.familyId,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.startDate &&
          filters?.endDate && {
            paymentDate: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      include: {
        category: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return {
      success: true,
      data: expenses,
    };
  } catch (error) {
    console.error('List expenses error:', error);
    return {
      success: false,
      error: 'Erro ao listar despesas',
      data: [],
    };
  }
}

/**
 * Create category
 */
export async function createCategory(data: CreateCategoryInput) {
  try {
    const user = await requireAuth();
    const validatedData = createCategorySchema.parse(data);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        familyId: user.familyId,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/expense');
    revalidatePath('/budget');

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error('Create category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar categoria',
    };
  }
}

/**
 * List categories
 */
export async function listCategories() {
  try {
    const user = await requireAuth();

    const categories = await prisma.category.findMany({
      where: { familyId: user.familyId },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error('List categories error:', error);
    return {
      success: false,
      error: 'Erro ao listar categorias',
      data: [],
    };
  }
}

/**
 * Update category
 */
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  try {
    const user = await requireAuth();
    const validatedData = updateCategorySchema.parse(data);

    const existingCategory = await prisma.category.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingCategory) {
      return {
        success: false,
        error: 'Categoria não encontrada',
      };
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/expense');
    revalidatePath('/budget');

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error('Update category error:', error);
    return {
      success: false,
      error: 'Erro ao atualizar categoria',
    };
  }
}

/**
 * Delete category
 */
export async function deleteCategory(id: string) {
  try {
    const user = await requireAuth();

    const existingCategory = await prisma.category.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingCategory) {
      return {
        success: false,
        error: 'Categoria não encontrada',
      };
    }

    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      return {
        success: false,
        error: 'Não é possível deletar categoria com despesas associadas',
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/expense');
    revalidatePath('/budget');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete category error:', error);
    return {
      success: false,
      error: 'Erro ao deletar categoria',
    };
  }
}
