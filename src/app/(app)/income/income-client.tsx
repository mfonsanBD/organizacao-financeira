'use client';

import { useState } from 'react';
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
import { deleteIncome, toggleIncomeStatus } from '@/features/income/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ToggleLeft, ToggleRight, Plus, AlertTriangle } from 'lucide-react';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteIncome(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Receita excluída com sucesso!');
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
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground">Gerencie suas fontes de receita mensal</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

      <Card className='bg-teal-600'>
        <CardHeader>
          <CardTitle className='text-white'>Receita Mensal Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalActive)}
          </p>
          <p className="text-sm text-teal-200 mt-1">
            {incomes.filter((i) => i.isActive).length} fontes ativas
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {incomes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma receita cadastrada. Clique em &quot;Nova Receita&quot; para começar.
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
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleStatus(income.id)}
                        >
                          {income.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{income.isActive ? 'Desativar receita' : 'Ativar receita'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      <TooltipTrigger asChild>
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

      <IncomeForm open={formOpen} onOpenChange={handleCloseForm} income={editingIncome} />

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
              <div className="p-4 bg-gray-100 rounded-lg space-y-1">
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
                  <span className="font-medium">{incomeToDelete.dueDate}</span>
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
