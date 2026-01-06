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
import { createNotificationForFamily } from '@/features/notification/actions';
import { sendPushToUsers } from '@/lib/webpush/server';

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
      },
    });

    // Create notification
    await createNotificationForFamily({
      title: '💰 Nova Renda Adicionada',
      message: `${user.name} adicionou: ${income.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income.amount)}`,
      link: '/income',
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
          title: '💰 Nova Receita',
          body: `${user.name} adicionou: ${income.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income.amount)}`,
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          data: {
            url: '/income',
            incomeId: income.id,
          },
        },
        prisma
      );
    }

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
    const validatedData = updateIncomeSchema.parse(data);

    const existingIncome = await prisma.income.findFirst({
      where: { id },
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
    const existingIncome = await prisma.income.findFirst({
      where: { id },
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
 * List all incomes for user's
 */
export async function listIncomes(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const incomes = await prisma.income.findMany({
      where: {
        ...(filters?.startDate && filters?.endDate
          ? {
              paymentData: {
                gte: filters.startDate,
                lte: filters.endDate,
              },
            }
          : {}),
      },
      orderBy: { paymentData: 'asc' },
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
