'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/features/expense/components/ExpenseForm';
import { deleteExpense } from '@/features/expense/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Repeat, Calendar, Copy } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paymentDate: Date;
  isRecurring: boolean;
  recurrence?: 'MONTHLY' | 'YEARLY' | 'CUSTOM' | null;
  category: {
    id: string;
    name: string;
    color?: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface ExpenseClientProps {
  expenses: Expense[];
  categories: Category[];
}

export function ExpenseClient({ expenses, categories }: ExpenseClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    | {
        id: string;
        description: string;
        amount: number;
        categoryId: string;
        paymentDate: Date;
        isRecurring: boolean;
        recurrence?: 'MONTHLY' | 'YEARLY' | 'CUSTOM' | null;
      }
    | undefined
  >();

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    const result = await deleteExpense(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Despesa excluída com sucesso!');
      router.refresh();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.category.id,
      paymentDate: expense.paymentDate,
      isRecurring: expense.isRecurring,
      recurrence: expense.recurrence,
    });
    setFormOpen(true);
  };

  const handleDuplicate = (expense: Expense) => {
    // Remove ID to create new expense, update date to current month
    const today = new Date();
    setEditingExpense({
      id: '', // Empty ID means creating new
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.category.id,
      paymentDate: new Date(today.getFullYear(), today.getMonth(), new Date(expense.paymentDate).getDate()),
      isRecurring: expense.isRecurring,
      recurrence: expense.recurrence,
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingExpense(undefined);
  };

  // Separar despesas recorrentes (contas fixas) de avulsas
  const recurringExpenses = expenses.filter((e) => e.isRecurring);
  const oneTimeExpenses = expenses.filter((e) => !e.isRecurring);

  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Função para renderizar lista de despesas
  const renderExpenseList = (expenseList: Expense[]) => {
    if (expenseList.length === 0) {
      return (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma despesa cadastrada nesta categoria.
          </p>
        </Card>
      );
    }

    const expensesByCategory = categories.map((cat) => {
      const categoryExpenses = expenseList.filter((e) => e.category.id === cat.id);
      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...cat,
        expenses: categoryExpenses,
        total,
      };
    });

    return expensesByCategory
      .filter((cat) => cat.expenses.length > 0)
      .map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {category.color && (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <CardTitle>{category.name}</CardTitle>
              </div>
              <span className="text-lg font-bold text-red-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(category.total)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {category.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {expense.isRecurring && <Repeat className="h-4 w-4 text-blue-600" />}
                    <h4 className="font-medium">{expense.description}</h4>
                    {expense.isRecurring && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {expense.recurrence === 'MONTHLY' ? 'Mensal' : expense.recurrence === 'YEARLY' ? 'Anual' : 'Personalizado'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold mr-4">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(expense.amount)}
                  </span>
                  {expense.isRecurring && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicate(expense)}
                      title="Duplicar para este mês"
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-muted-foreground">
            Despesas de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalRecurring)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{recurringExpenses.length} despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Despesas Avulsas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalOneTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{oneTimeExpenses.length} despesas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas ({expenses.length})</TabsTrigger>
          <TabsTrigger value="recurring">
            <Repeat className="h-4 w-4 mr-2" />
            Recorrentes ({recurringExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="onetime">
            <Calendar className="h-4 w-4 mr-2" />
            Avulsas ({oneTimeExpenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {renderExpenseList(expenses)}
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          {renderExpenseList(recurringExpenses)}
        </TabsContent>

        <TabsContent value="onetime" className="space-y-6">
          {renderExpenseList(oneTimeExpenses)}
        </TabsContent>
      </Tabs>

      <ExpenseForm open={formOpen} onOpenChange={handleCloseForm} expense={editingExpense} />
    </div>
  );
}
