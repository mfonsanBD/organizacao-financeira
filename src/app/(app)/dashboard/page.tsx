import { listIncomes } from '@/features/income/actions';
import { listExpenses, listCategories } from '@/features/expense/actions';
import { getMonthlyTrend, getMonthComparison } from '@/features/dashboard/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch all data in parallel
  const [incomesResult, expensesResult, categoriesResult, monthlyTrendResult, monthComparisonResult] =
    await Promise.all([
      listIncomes(),
      listExpenses({
        startDate: new Date(currentYear, currentMonth - 1, 1),
        endDate: new Date(currentYear, currentMonth, 0, 23, 59, 59),
      }),
      listCategories(),
      getMonthlyTrend(6),
      getMonthComparison(),
    ]);

  // Calculate totals
  const totalIncome =
    incomesResult.data?.filter((i) => i.isActive).reduce((sum, i) => sum + i.amount, 0) || 0;

  const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const balance = totalIncome - totalExpenses;

  // Get real month comparison data
  const balanceChangePercentage = monthComparisonResult.data?.changes.balance || 0;

  // Prepare monthly trend data from real database
  const monthlyTrendData = monthlyTrendResult.data || [];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-400 mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Olá, {session.user.name}! Aqui está seu resumo financeiro.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white rounded border border-gray-200">
            <p className="text-xs font-medium text-gray-600">
              {new Date().toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          </div>
        </div>
      </div>

      {/* Main Balance Card - Sequence Style */}
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
                  }).format(balance)}
                </h2>
                <p className="text-sm font-medium">
                  {balance >= 0 ? (
                    <span className="inline-flex items-center gap-1 text-teal-300">
                      <span>
                        {balanceChangePercentage >= 0 ? '↗' : '↘'} {Math.abs(balanceChangePercentage).toFixed(2)}%
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
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                className="bg-teal-500 text-white hover:bg-teal-600 font-semibold px-4 py-2 rounded border-0"
              >
                Adicionar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white font-medium px-4 py-2 rounded backdrop-blur-sm"
              >
                Enviar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white font-medium px-4 py-2 rounded backdrop-blur-sm"
              >
                Solicitar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Sequence Style */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border border-gray-100 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-teal-100 rounded">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">Receitas</p>
                <div className="text-2xl font-bold text-gray-900 truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalIncome)}
                </div>
              </div>
            </div>
            <p className="text-xs text-teal-600 font-medium">
              ↗ {incomesResult.data?.filter((i) => i.isActive).length || 0} fontes ativas
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
                <div className="text-2xl font-bold text-gray-900 truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalExpenses)}
                </div>
              </div>
            </div>
            <p className="text-xs text-red-600 font-medium">
              ↘ {expensesResult.data?.length || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2.5 rounded ${balance >= 0 ? 'bg-teal-100' : 'bg-amber-100'}`}>
                <PiggyBank className={`h-5 w-5 ${balance >= 0 ? 'text-teal-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">Saldo</p>
                <div className={`text-2xl font-bold truncate ${balance >= 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(balance)}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {balance >= 0 ? '↗ Positivo' : '↘ Negativo'} este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart data={monthlyTrendData} />

      {/* Gráfico de Despesas por Categoria */}
      {expensesResult.data && expensesResult.data.length > 0 && (
        <Card className="bg-white border border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ExpensesByCategoryChart
              data={
                categoriesResult.data?.map((cat) => {
                  const categoryExpenses = expensesResult.data?.filter(
                    (e) => e.category.id === cat.id
                  );
                  const total = categoryExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
                  return {
                    name: cat.name,
                    value: total,
                    color: cat.color,
                  };
                }).filter((item) => item.value > 0) || []
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Empty state - Sequence Style */}
      {!incomesResult.data?.length && !expensesResult.data?.length && (
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
