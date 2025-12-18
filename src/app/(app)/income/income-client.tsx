'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncomeForm } from '@/features/income/components/IncomeForm';
import { deleteIncome, toggleIncomeStatus } from '@/features/income/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

interface Income {
  id: string;
  description: string;
  amount: number;
  dueDate: number;
  isActive: boolean;
  createdAt: Date;
}

interface IncomeClientProps {
  incomes: Income[];
}

export function IncomeClient({ incomes }: IncomeClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>();

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta renda?')) return;

    const result = await deleteIncome(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Renda excluída com sucesso!');
      router.refresh();
    }
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleIncomeStatus(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Status atualizado com sucesso!');
      router.refresh();
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingIncome(undefined);
  };

  const totalActive = incomes
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rendas</h1>
          <p className="text-muted-foreground">Gerencie suas fontes de renda mensal</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Renda
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Renda Mensal Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalActive)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {incomes.filter((i) => i.isActive).length} fontes ativas
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {incomes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma renda cadastrada. Clique em &quot;Nova Renda&quot; para começar.
            </p>
          </Card>
        ) : (
          incomes.map((income) => (
            <Card key={income.id} className={!income.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{income.description}</h3>
                      {!income.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Dia {income.dueDate}</span>
                      <span>•</span>
                      <span className="text-lg font-medium text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(income.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleStatus(income.id)}
                      title={income.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {income.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(income.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <IncomeForm open={formOpen} onOpenChange={handleCloseForm} income={editingIncome} />
    </div>
  );
}
