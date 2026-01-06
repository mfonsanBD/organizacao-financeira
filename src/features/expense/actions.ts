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

    // Verify category belongs to user's
    const category = await prisma.category.findFirst({
      where: { id: validatedData.categoryId },
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
      },
      include: {
        category: true,
      },
    });

    // Create notification for members
    await createNotificationForFamily({
      title: '💸 Nova Despesa Registrada',
      message: `${user.name} registrou: ${expense.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)} [${category.name}]`,
      link: '/expense',
    });

    // Send push notification to all members except the creator
    const familyMembers = await prisma.user.findMany({
      where: {
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
    const validatedData = updateExpenseSchema.parse(data);

    const existingExpense = await prisma.expense.findFirst({
      where: { id },
    });

    if (!existingExpense) {
      return {
        success: false,
        error: 'Despesa não encontrada',
      };
    }

    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: validatedData.categoryId },
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
 * Update expense status
 */
export async function updateExpenseStatus(id: string, status: 'PENDING' | 'COMPLETED') {
  try {
    await requireAuth();

    const existingExpense = await prisma.expense.findFirst({
      where: { id },
    });

    if (!existingExpense) {
      return {
        success: false,
        error: 'Despesa não encontrada',
      };
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: { status },
      include: {
        category: true,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/expense');

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    console.error('Update expense status error:', error);
    return {
      success: false,
      error: 'Erro ao atualizar status da despesa',
    };
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(id: string) {
  try {
    const existingExpense = await prisma.expense.findFirst({
      where: { id },
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
    const expenses = await prisma.expense.findMany({
      where: {
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
    const validatedData = createCategorySchema.parse(data);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
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
    const categories = await prisma.category.findMany({
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
    const validatedData = updateCategorySchema.parse(data);

    const existingCategory = await prisma.category.findFirst({
      where: { id },
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
    const existingCategory = await prisma.category.findFirst({
      where: { id },
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
