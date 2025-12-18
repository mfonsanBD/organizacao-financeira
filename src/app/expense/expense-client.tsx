'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/features/expense/components/ExpenseForm';
import { deleteExpense } from '@/features/expense/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus } from 'lucide-react';

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

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingExpense(undefined);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category
  const expensesByCategory = categories.map((cat) => {
    const categoryExpenses = expenses.filter((e) => e.category.id === cat.id);
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...cat,
      expenses: categoryExpenses,
      total,
    };
  });

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

      <Card>
        <CardHeader>
          <CardTitle>Total do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalExpenses)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{expenses.length} transações</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {expenses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma despesa cadastrada neste mês. Clique em &quot;Nova Despesa&quot; para começar.
            </p>
          </Card>
        ) : (
          expensesByCategory
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
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{expense.description}</h4>
                          {expense.isRecurring && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {expense.recurrence === 'MONTHLY' ? 'Mensal' : expense.recurrence === 'YEARLY' ? 'Anual' : 'Personalizado'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold mr-4">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(expense.amount)}
                        </span>
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
            ))
        )}
      </div>

      <ExpenseForm open={formOpen} onOpenChange={handleCloseForm} expense={editingExpense} />
    </div>
  );
}
