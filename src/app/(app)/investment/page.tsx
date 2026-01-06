import { listInvestments } from '@/features/investment/actions';
import { InvestmentClient } from './investment-client';

export default async function InvestmentPage() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  // Buscar investimentos do mês atual
  const startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

  const result = await listInvestments({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const investments = result.data || [];

  // Função assíncrona para filtros
  async function handleFilterChange(filters: {
    startDate: string;
    endDate: string;
  }) {
    'use server';

    const result = await listInvestments({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    return {
      success: !result.error,
      data: result.data || [],
      error: result.error,
    };
  }

  return (
    <InvestmentClient
      investments={investments}
      onFilterChange={handleFilterChange}
    />
  );
}
