'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import {
  createIncomeSchema,
  updateIncomeSchema,
  CreateIncomeInput,
  UpdateIncomeInput,
} from '@/lib/validations/financial';

/**
 * Create new income
 */
export async function createIncome(data: CreateIncomeInput) {
  try {
    const user = await requireAuth();
    const validatedData = createIncomeSchema.parse(data);

    const income = await prisma.income.create({
      data: {
        ...validatedData,
        familyId: user.familyId,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/income');

    return {
      success: true,
      data: income,
    };
  } catch (error) {
    console.error('Create income error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar renda',
    };
  }
}

/**
 * Update income
 */
export async function updateIncome(id: string, data: UpdateIncomeInput) {
  try {
    const user = await requireAuth();
    const validatedData = updateIncomeSchema.parse(data);

    // Verify income belongs to user's family
    const existingIncome = await prisma.income.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingIncome) {
      return {
        success: false,
        error: 'Renda não encontrada',
      };
    }

    const income = await prisma.income.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/income');

    return {
      success: true,
      data: income,
    };
  } catch (error) {
    console.error('Update income error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar renda',
    };
  }
}

/**
 * Delete income
 */
export async function deleteIncome(id: string) {
  try {
    const user = await requireAuth();

    // Verify income belongs to user's family
    const existingIncome = await prisma.income.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingIncome) {
      return {
        success: false,
        error: 'Renda não encontrada',
      };
    }

    await prisma.income.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/income');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete income error:', error);
    return {
      success: false,
      error: 'Erro ao deletar renda',
    };
  }
}

/**
 * List all incomes for user's family
 */
export async function listIncomes() {
  try {
    const user = await requireAuth();

    const incomes = await prisma.income.findMany({
      where: { familyId: user.familyId },
      orderBy: { dueDate: 'asc' },
    });

    return {
      success: true,
      data: incomes,
    };
  } catch (error) {
    console.error('List incomes error:', error);
    return {
      success: false,
      error: 'Erro ao listar rendas',
      data: [],
    };
  }
}

/**
 * Toggle income active status
 */
export async function toggleIncomeStatus(id: string) {
  try {
    const user = await requireAuth();

    const existingIncome = await prisma.income.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingIncome) {
      return {
        success: false,
        error: 'Renda não encontrada',
      };
    }

    const income = await prisma.income.update({
      where: { id },
      data: { isActive: !existingIncome.isActive },
    });

    revalidatePath('/dashboard');
    revalidatePath('/income');

    return {
      success: true,
      data: income,
    };
  } catch (error) {
    console.error('Toggle income status error:', error);
    return {
      success: false,
      error: 'Erro ao atualizar status',
    };
  }
}
