'use client';

import { useMemo, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { LayoutDashboard, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { DashboardFilterBar } from './dashboard-filter-bar';
import { endOfMonth, startOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type Preset = 'day' | 'week' | 'month' | 'year';

type DashboardData = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  balanceChangePercentage: number;
  incomesCount: number;
  expensesCount: number;
  monthlyTrendData: Array<{
    label: string;
    receitas: number;
    despesas: number;
  }>;
  expensesByCategory: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  isEmpty: boolean;
};

type Props = {
  userName: string;
  initialData: DashboardData;
  onFilterChange: (filters: { startDate: string; endDate: string }) => Promise<DashboardData>;
};

export function DashboardClient({ userName, initialData, onFilterChange }: Props) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const defaultRange = useMemo<DateRange>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  }, []);

  const [filters, setFilters] = useState<{ preset: Preset; range: DateRange }>(() => ({
    preset: 'month',
    range: defaultRange,
  }));

  const applyRange = (next: { from: Date; to: Date }) => {
    startTransition(async () => {
      const newData = await onFilterChange({
        startDate: next.from.toISOString(),
        endDate: next.to.toISOString(),
      });
      setData(newData);
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-400 mx-auto">
      {/* Push Notifications Toggle */}
      <PushNotificationToggle />

      {/* Header */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Olá, {userName}! Aqui está seu resumo financeiro.
          </p>
        </div>

        <DashboardFilterBar
          value={filters}
          onChange={setFilters}
          onApply={applyRange}
          disabled={isPending}
        />
      </div>

      {/* Main Balance Card */}
      <Card className="bg-linear-to-br from-teal-700 to-teal-800 border-0 rounded-lg overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-teal-200 text-sm font-medium mb-3">Saldo Total</p>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.balance)}
                </h2>
                <p className="text-sm font-medium">
                  {data.balance >= 0 ? (
                    <span className="inline-flex items-center gap-1 text-teal-300">
                      <span>
                        {data.balanceChangePercentage >= 0 ? '↗' : '↘'} {Math.abs(data.balanceChangePercentage).toFixed(2)}%
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-300">
                      <span>↘ Déficit</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border border-gray-100 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-teal-100 rounded">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">Receitas</p>
                <h3 className="text-2xl font-bold text-gray-900 truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.totalIncome)}
                </h3>
              </div>
            </div>
            <p className="text-xs text-teal-600 font-medium">
              ↗ {data.incomesCount} fontes ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">Despesas</p>
                <h3 className="text-2xl font-bold text-gray-900 truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.totalExpenses)}
                </h3>
              </div>
            </div>
            <p className="text-xs text-red-600 font-medium">
              ↘ {data.expensesCount} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2.5 rounded ${data.balance >= 0 ? 'bg-teal-100' : 'bg-amber-100'}`}>
                <PiggyBank className={`h-5 w-5 ${data.balance >= 0 ? 'text-teal-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">Saldo</p>
                <h3 className={`text-2xl font-bold truncate ${data.balance >= 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.balance)}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {data.balance >= 0 ? '↗ Positivo' : '↘ Negativo'} no período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Monthly Trend Chart */}
        <MonthlyTrendChart data={data.monthlyTrendData} />

        {/* Expenses by Category Chart */}
        {data.expensesByCategory.length > 0 && (
          <Card className="bg-white border border-gray-100">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ExpensesByCategoryChart data={data.expensesByCategory} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {data.isEmpty && (
        <Card className="bg-white border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-5">
              <LayoutDashboard className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum dado financeiro
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Comece adicionando suas receitas e despesas para visualizar seu dashboard!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="/income"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-teal-600 to-teal-600 rounded hover:from-teal-700 hover:to-teal-700 transition-all"
              >
                Adicionar Receita
              </a>
              <a
                href="/expense"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-all"
              >
                Adicionar Despesa
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
