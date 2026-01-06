'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IncomeForm } from '@/features/income/components/IncomeForm';
import { deleteIncome } from '@/features/income/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, AlertTriangle, Copy } from 'lucide-react';
import { DashboardFilterBar } from '../dashboard/dashboard-filter-bar';
import { endOfMonth, startOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type Preset = 'day' | 'week' | 'month' | 'year';

interface Income {
  id: string;
  description: string;
  amount: number;
  paymentData: Date;
  createdAt: Date;
}

interface IncomeClientProps {
  incomes: Income[];
  onFilterChange: (filters: { startDate: string; endDate: string }) => Promise<{ success: boolean; data: Income[]; error?: string }>;
}

export function IncomeClient({ incomes: initialIncomes, onFilterChange }: IncomeClientProps) {
  const router = useRouter();
  const [incomes, setIncomes] = useState(initialIncomes);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<
    | {
        id: string;
        description: string;
        amount: number;
        paymentData: Date;
      }
    | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultRange = useMemo<DateRange>(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    return {
      from: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
      to: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)),
    };
  }, []);

  const [filterState, setFilterState] = useState<{ preset: Preset; range: DateRange }>({
    preset: 'month',
    range: defaultRange,
  });

  const handleFilterApply = (range: { from: Date; to: Date }) => {
    startTransition(async () => {
      const result = await onFilterChange({
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
      });

      if (result.success && result.data) {
        setIncomes(result.data);
      } else {
        toast.error(result.error || 'Erro ao filtrar receitas');
      }
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteIncome(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Receita excluída com sucesso!');
      // Update local state
      setIncomes(prevIncomes => prevIncomes.filter(i => i.id !== id));
      router.refresh();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  const openDeleteDialog = (income: Income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (income: Income) => {
    setEditingIncome({
      id: income.id,
      description: income.description,
      amount: income.amount,
      paymentData: income.paymentData,
    });
    setFormOpen(true);
  };

  const handleDuplicate = (income: Income) => {
    // Remove ID to create new income, keep current date
    const today = new Date();
    setEditingIncome({
      id: '', // Empty ID means creating new
      description: income.description,
      amount: income.amount,
      paymentData: today,
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingIncome(undefined);
  };

  const totalActive = incomes
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col-reverse md:flex-row gap-2 items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground">Gerencie suas fontes de receita mensal</p>
          </div>

          <div className='flex flex-col-reverse md:flex-row items-start md:items-center gap-4'>
            <DashboardFilterBar
              value={filterState}
              onChange={setFilterState}
              onApply={handleFilterApply}
              disabled={isPending}
            />

            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </div>
        </div>

        <Card className='bg-teal-600'>
          <CardHeader>
            <CardTitle className='text-white'>Receita Total no Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalActive)}
            </p>
            <p className="text-sm text-teal-200 mt-1">
              {incomes.length} {incomes.length === 1 ? 'receita' : 'receitas'}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {incomes.length === 0 ? (
            <Card className="p-8 text-center md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground">
                Nenhuma receita cadastrada. Clique em &quot;Nova Receita&quot; para começar.
              </p>
            </Card>
          ) : (
            incomes.map((income) => (
              <Card key={income.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{income.description}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Dia {new Date(income.paymentData).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <span>•</span>
                        <span className="text-lg font-medium text-teal-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(income.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild className='rounded'>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicate(income)}
                          >
                            <Copy className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar receita</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild className='rounded'>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(income)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar receita</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild className='rounded'>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(income)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir receita</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <IncomeForm 
          open={formOpen} 
          onOpenChange={handleCloseForm} 
          income={editingIncome}
          onSuccess={async () => {
            const result = await onFilterChange({
              startDate: filterState.range.from?.toISOString() || '',
              endDate: filterState.range.to?.toISOString() || '',
            });
            if (result.success && result.data) {
              setIncomes(result.data);
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="pt-2">
                Você está prestes a excluir a receita:
              </DialogDescription>
            </DialogHeader>
            
            {incomeToDelete && (
              <div className="py-4">
                <div className="p-4 bg-gray-100 rounded space-y-1">
                  <p className="font-semibold text-gray-900">{incomeToDelete.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Valor:</span>
                    <span className="font-medium text-teal-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(incomeToDelete.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Dia do recebimento:</span>
                    <span className="font-medium">{new Date(incomeToDelete.paymentData).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-4">
                  <strong className='text-red-600'>Atenção:</strong> Esta ação não poderá ser desfeita. A receita será permanentemente removida do sistema.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => incomeToDelete && handleDelete(incomeToDelete.id)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
