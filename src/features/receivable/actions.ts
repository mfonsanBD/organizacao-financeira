'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import {
  createReceivableSchema,
  updateReceivableSchema,
  CreateReceivableInput,
  UpdateReceivableInput,
} from '@/lib/validations/financial';

/**
 * Create new receivable
 */
export async function createReceivable(data: CreateReceivableInput) {
  try {
    const user = await requireAuth();
    const validatedData = createReceivableSchema.parse(data);

    const receivable = await prisma.receivable.create({
      data: {
        ...validatedData,
        familyId: user.familyId,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/receivable');

    return {
      success: true,
      data: receivable,
    };
  } catch (error) {
    console.error('Create receivable error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar recebível',
    };
  }
}

/**
 * Update receivable
 */
export async function updateReceivable(id: string, data: UpdateReceivableInput) {
  try {
    const user = await requireAuth();
    const validatedData = updateReceivableSchema.parse(data);

    const existingReceivable = await prisma.receivable.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingReceivable) {
      return {
        success: false,
        error: 'Recebível não encontrado',
      };
    }

    const receivable = await prisma.receivable.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/receivable');

    return {
      success: true,
      data: receivable,
    };
  } catch (error) {
    console.error('Update receivable error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar recebível',
    };
  }
}

/**
 * Mark receivable as received
 */
export async function markAsReceived(id: string, receivedDate?: Date) {
  try {
    const user = await requireAuth();

    const existingReceivable = await prisma.receivable.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingReceivable) {
      return {
        success: false,
        error: 'Recebível não encontrado',
      };
    }

    const receivable = await prisma.receivable.update({
      where: { id },
      data: {
        isReceived: true,
        receivedDate: receivedDate || new Date(),
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/receivable');

    return {
      success: true,
      data: receivable,
    };
  } catch (error) {
    console.error('Mark as received error:', error);
    return {
      success: false,
      error: 'Erro ao marcar como recebido',
    };
  }
}

/**
 * Delete receivable
 */
export async function deleteReceivable(id: string) {
  try {
    const user = await requireAuth();

    const existingReceivable = await prisma.receivable.findFirst({
      where: { id, familyId: user.familyId },
    });

    if (!existingReceivable) {
      return {
        success: false,
        error: 'Recebível não encontrado',
      };
    }

    await prisma.receivable.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/receivable');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete receivable error:', error);
    return {
      success: false,
      error: 'Erro ao deletar recebível',
    };
  }
}

/**
 * List receivables with optional filters
 */
export async function listReceivables(filters?: { isReceived?: boolean }) {
  try {
    const user = await requireAuth();

    const receivables = await prisma.receivable.findMany({
      where: {
        familyId: user.familyId,
        ...(filters?.isReceived !== undefined && { isReceived: filters.isReceived }),
      },
      orderBy: { expectedDate: 'asc' },
    });

    return {
      success: true,
      data: receivables,
    };
  } catch (error) {
    console.error('List receivables error:', error);
    return {
      success: false,
      error: 'Erro ao listar recebíveis',
      data: [],
    };
  }
}

/**
 * Get receivables summary
 */
export async function getReceivablesSummary() {
  try {
    const user = await requireAuth();

    const [total, received, pending] = await Promise.all([
      prisma.receivable.aggregate({
        where: { familyId: user.familyId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.receivable.aggregate({
        where: { familyId: user.familyId, isReceived: true },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.receivable.aggregate({
        where: { familyId: user.familyId, isReceived: false },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        total: {
          amount: total._sum.amount || 0,
          count: total._count,
        },
        received: {
          amount: received._sum.amount || 0,
          count: received._count,
        },
        pending: {
          amount: pending._sum.amount || 0,
          count: pending._count,
        },
      },
    };
  } catch (error) {
    console.error('Get receivables summary error:', error);
    return {
      success: false,
      error: 'Erro ao buscar resumo',
      data: null,
    };
  }
}
