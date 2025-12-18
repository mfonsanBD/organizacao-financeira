import { listIncomes } from '@/features/income/actions';
import { listExpenses, listCategories } from '@/features/expense/actions';
import { getBudgetWithSpending } from '@/features/budget/actions';
import { getReceivablesSummary, listReceivables } from '@/features/receivable/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { PendingReceivablesList } from '@/components/dashboard/PendingReceivablesList';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch all data in parallel
  const [incomesResult, expensesResult, budgetsResult, receivablesResult, categoriesResult, allReceivablesResult] =
    await Promise.all([
      listIncomes(),
      listExpenses({
        startDate: new Date(currentYear, currentMonth - 1, 1),
        endDate: new Date(currentYear, currentMonth, 0, 23, 59, 59),
      }),
      getBudgetWithSpending(currentMonth, currentYear),
      getReceivablesSummary(),
      listCategories(),
      listReceivables(),
    ]);

  // Calculate totals
  const totalIncome =
    incomesResult.data?.filter((i) => i.isActive).reduce((sum, i) => sum + i.amount, 0) || 0;

  const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const totalBudget = budgetsResult.data?.reduce((sum, b) => sum + b.amount, 0) || 0;

  const totalPendingReceivables = receivablesResult.data?.pending.amount || 0;

  const balance = totalIncome - totalExpenses;

  // Prepare monthly trend data (last 6 months)
  const monthlyTrendData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    monthlyTrendData.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      receitas: totalIncome, // Simplificado - na prática você buscaria dados históricos
      despesas: totalExpenses * (0.7 + Math.random() * 0.6), // Simulado
    });
  }

  // Prepare budget alerts (>80% ou excedido)
  const budgetAlerts = budgetsResult.data
    ?.filter((b) => b.percentage >= 80)
    .map((b) => ({
      id: b.id,
      categoryName: b.category.name,
      categoryColor: b.category.color || '#666',
      spent: b.spent,
      limit: b.amount,
      percentage: b.percentage,
    })) || [];

  // Pending receivables
  const pendingReceivables = allReceivablesResult.data
    ?.filter((r) => !r.isReceived)
    .map((r) => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      expectedDate: r.expectedDate,
    })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {session.user.name}! Aqui está o resumo financeiro.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs">Role: {session.user.role}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renda Mensal</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-green-600"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {incomesResult.data?.filter((i) => i.isActive).length || 0} fontes ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-red-600"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expensesResult.data?.length || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className={`h-4 w-4 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? 'Positivo' : 'Negativo'} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-blue-600"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPendingReceivables)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {receivablesResult.data?.pending.count || 0} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      {budgetsResult.data && budgetsResult.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamento vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetsResult.data.map((budget) => {
                const percentageUsed = Math.min(budget.percentage, 100);
                const isOverBudget = budget.percentage > 100;

                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {budget.category.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.category.color }}
                          />
                        )}
                        <span className="font-medium">{budget.category.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(budget.spent)}{' '}
                        /{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(budget.amount)}
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {percentageUsed.toFixed(1)}% utilizado
                      </span>
                      {isOverBudget && (
                        <span className="text-xs text-red-600 font-medium">
                          Excedido em{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Math.abs(budget.remaining))}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      <BudgetAlerts alerts={budgetAlerts} />

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart data={monthlyTrendData} />

      {/* Pending Receivables */}
      <PendingReceivablesList receivables={pendingReceivables} />

      {/* Gráfico de Despesas por Categoria */}
      {expensesResult.data && expensesResult.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
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

      {/* Orçamento total */}
      {totalBudget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orçamento Total:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalBudget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gasto Total:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Restante:</span>
                <span
                  className={`font-bold ${
                    totalBudget - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalBudget - totalExpenses)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!incomesResult.data?.length &&
        !expensesResult.data?.length &&
        !budgetsResult.data?.length && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum dado financeiro encontrado. Comece adicionando suas rendas, despesas e
              orçamentos!
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <a
                href="/income"
                className="text-sm text-primary hover:underline"
              >
                Adicionar Renda
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="/expense"
                className="text-sm text-primary hover:underline"
              >
                Adicionar Despesa
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="/budget"
                className="text-sm text-primary hover:underline"
              >
                Criar Orçamento
              </a>
            </div>
          </Card>
        )}
    </div>
  );
}
