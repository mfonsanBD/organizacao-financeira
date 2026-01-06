/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  type CreateInvestmentInput,
  type UpdateInvestmentInput,
} from '@/lib/validations/investment';

/**
 * Create new investment (deposit or withdraw)
 */
export async function createInvestment(data: CreateInvestmentInput) {
  try {
    await requireAuth();
    const validatedData = createInvestmentSchema.parse(data);

    const investment = await prisma.investment.create({
      data: validatedData,
    });

    revalidatePath('/investment');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: investment,
    };
  } catch (error) {
    console.error('Create investment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar investimento',
    };
  }
}

/**
 * Update investment
 */
export async function updateInvestment(id: string, data: UpdateInvestmentInput) {
  try {
    await requireAuth();
    const validatedData = updateInvestmentSchema.parse(data);

    const investment = await prisma.investment.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/investment');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: investment,
    };
  } catch (error) {
    console.error('Update investment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar investimento',
    };
  }
}

/**
 * Delete investment
 */
export async function deleteInvestment(id: string) {
  try {
    await requireAuth();

    await prisma.investment.delete({
      where: { id },
    });

    revalidatePath('/investment');
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete investment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir investimento',
    };
  }
}

/**
 * List investments with optional filters
 */
export async function listInvestments(filters?: {
  startDate?: Date;
  endDate?: Date;
  type?: 'DEPOSIT' | 'WITHDRAW';
}) {
  try {
    await requireAuth();

    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const investments = await prisma.investment.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    return {
      success: true,
      data: investments,
    };
  } catch (error) {
    console.error('List investments error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar investimentos',
      data: [],
    };
  }
}

/**
 * Get investment summary (total deposits, withdraws, and balance)
 */
export async function getInvestmentSummary(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    await requireAuth();

    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const investments = await prisma.investment.findMany({
      where,
      select: {
        type: true,
        amount: true,
      },
    });

    const totalDeposits = investments
      .filter((i) => i.type === 'DEPOSIT')
      .reduce((sum, i) => sum + i.amount, 0);

    const totalWithdraws = investments
      .filter((i) => i.type === 'WITHDRAW')
      .reduce((sum, i) => sum + i.amount, 0);

    const balance = totalDeposits - totalWithdraws;

    return {
      success: true,
      data: {
        totalDeposits,
        totalWithdraws,
        balance,
        depositsCount: investments.filter((i) => i.type === 'DEPOSIT').length,
        withdrawsCount: investments.filter((i) => i.type === 'WITHDRAW').length,
      },
    };
  } catch (error) {
    console.error('Get investment summary error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar resumo de investimentos',
      data: {
        totalDeposits: 0,
        totalWithdraws: 0,
        balance: 0,
        depositsCount: 0,
        withdrawsCount: 0,
      },
    };
  }
}
