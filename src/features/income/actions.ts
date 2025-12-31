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

    // Monta receivedAt a partir de dueDate se não vier receivedAt
    let receivedAt: Date;
    if (validatedData.dueDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = String(validatedData.dueDate).padStart(2, '0');
      receivedAt = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${day}T00:00:00`);
    } else {
      receivedAt = new Date();
    }

    const income = await prisma.income.create({
      data: {
        ...validatedData,
        familyId: user.familyId,
      },
    });

    // Cria TransactionEntry para histórico
    try {
      await prisma.transactionEntry.create({
        data: {
          familyId: user.familyId,
          type: 'INCOME',
          incomeId: income.id,
          date: receivedAt,
          amount: income.amount,
          note: 'Lançamento automático ao criar receita',
          createdById: user.id
        },
      });
    } catch (err) {
      console.error('Falha ao criar TransactionEntry automático (income):', err);
    }

    // Create notification for family members
    await createNotificationForFamily({
      title: '💰 Nova Renda Adicionada',
      message: `${user.name} adicionou: ${income.description} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income.amount)}`,
      link: '/income',
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
    const user = await requireAuth();
    const validatedData = updateIncomeSchema.parse(data);

    // Monta receivedAt a partir de dueDate se não vier receivedAt
    let receivedAt: Date | undefined = undefined;
    if (validatedData.dueDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = String(validatedData.dueDate).padStart(2, '0');
      receivedAt = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${day}T00:00:00`);
    } else {
      receivedAt = new Date();
    }

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

    // Se o valor mudou, cria TransactionEntry para a data correta
    if (existingIncome.amount !== validatedData.amount) {
      try {
        await prisma.transactionEntry.create({
          data: {
            familyId: user.familyId,
            type: 'INCOME',
            incomeId: income.id,
            date: receivedAt,
            amount: validatedData.amount!,
            note: 'Lançamento automático ao editar receita',
          },
        });
      } catch (err) {
        console.error('Falha ao criar TransactionEntry automático (update income):', err);
      }
    }

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
