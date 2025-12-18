'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetForm } from '@/features/budget/components/BudgetForm';
import { deleteBudget } from '@/features/budget/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: {
    id: string;
    name: string;
    color?: string | null;
  };
}

interface BudgetClientProps {
  budgets: Budget[];
  month: number;
  year: number;
}

export function BudgetClient({ budgets, month, year }: BudgetClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<
    | {
        id: string;
        categoryId: string;
        amount: number;
        month: number;
        year: number;
      }
    | undefined
  >();

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    const result = await deleteBudget(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Orçamento excluído com sucesso!');
      router.refresh();
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingBudget(undefined);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">{monthName}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalBudget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum orçamento definido para este mês. Clique em &quot;Novo Orçamento&quot; para começar.
            </p>
          </Card>
        ) : (
          budgets.map((budget) => {
            const percentageUsed = Math.min(budget.percentage, 100);
            const isOverBudget = budget.percentage > 100;

            return (
              <Card key={budget.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {budget.category.color && (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: budget.category.color }}
                          />
                        )}
                        <h3 className="text-lg font-semibold">{budget.category.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(budget)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(budget.spent)}{' '}
                          de{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(budget.amount)}
                        </span>
                        <span
                          className={`font-medium ${
                            isOverBudget ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {percentageUsed.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-secondary rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            isOverBudget ? 'bg-red-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-medium ${
                            budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {budget.remaining >= 0 ? 'Disponível' : 'Excedido'}:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Math.abs(budget.remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BudgetForm open={formOpen} onOpenChange={handleCloseForm} budget={editingBudget} />
    </div>
  );
}
