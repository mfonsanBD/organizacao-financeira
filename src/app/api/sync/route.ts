import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sync
 * Returns all family data for offline sync
 */
export async function GET() {
  try {
    const [incomes, expenses, categories] = await Promise.all([
      prisma.income.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.expense.findMany({
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      incomes,
      expenses,
      categories,
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
