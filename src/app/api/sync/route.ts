import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';

/**
 * GET /api/sync
 * Returns all family data for offline sync
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const familyId = user.familyId;

    // Get all data for the family
    const [incomes, expenses, categories, budgets, receivables] = await Promise.all([
      prisma.income.findMany({
        where: { familyId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.expense.findMany({
        where: { familyId },
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { familyId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.budget.findMany({
        where: { familyId },
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.receivable.findMany({
        where: { familyId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      incomes,
      expenses,
      categories,
      budgets,
      receivables,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    
    // Return empty data instead of error to prevent sync failures
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        incomes: [],
        expenses: [],
        categories: [],
        budgets: [],
        receivables: [],
        error: 'Failed to sync data'
      },
      { status: 500 }
    );
  }
}
