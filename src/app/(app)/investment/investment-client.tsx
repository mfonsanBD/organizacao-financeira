'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Plus, TrendingUp, TrendingDown, Wallet, Edit2, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { InvestmentForm } from '@/features/investment/components/InvestmentForm';
import { deleteInvestment } from '@/features/investment/actions';
import { DashboardFilterBar } from '../dashboard/dashboard-filter-bar';
import type { DateRange } from 'react-day-picker';

type Preset = 'day' | 'week' | 'month' | 'year';

interface Investment {
  id: string;
  description: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  date: Date;
  createdAt: Date;
}

interface InvestmentClientProps {
  investments: Investment[];
  onFilterChange: (filters: {
    startDate: string;
    endDate: string;
  }) => Promise<{ success: boolean; data: Investment[]; error?: string }>;
}

export function InvestmentClient({
  investments: initialInvestments,
  onFilterChange,
}: InvestmentClientProps) {
  const router = useRouter();
  const [investments, setInvestments] = useState(initialInvestments);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<
    | {
        id: string;
        description: string;
        type: 'DEPOSIT' | 'WITHDRAW';
        amount: number;
        date: Date;
      }
    | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
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
        setInvestments(result.data);
      } else {
        toast.error(result.error || 'Erro ao filtrar investimentos');
      }
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteInvestment(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Investimento excluído com sucesso!');
      setInvestments((prev) => prev.filter((inv) => inv.id !== id));
      router.refresh();
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };

  const openDeleteDialog = (investment: Investment) => {
    setInvestmentToDelete(investment);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment({
      id: investment.id,
      description: investment.description,
      type: investment.type,
      amount: investment.amount,
      date: investment.date,
    });
    setFormOpen(true);
  };

  const handleDuplicate = (investment: Investment) => {
    const today = new Date();
    setEditingInvestment({
      id: '',
      description: investment.description,
      type: investment.type,
      amount: investment.amount,
      date: today,
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingInvestment(undefined);
  };

  // Calcular resumo
  const totalDeposits = investments
    .filter((i) => i.type === 'DEPOSIT')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalWithdraws = investments
    .filter((i) => i.type === 'WITHDRAW')
    .reduce((sum, i) => sum + i.amount, 0);

  const balance = totalDeposits - totalWithdraws;

  const depositsCount = investments.filter((i) => i.type === 'DEPOSIT').length;
  const withdrawsCount = investments.filter((i) => i.type === 'WITHDRAW').length;

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col-reverse md:flex-row gap-2 items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investimentos</h1>
            <p className="text-muted-foreground">
              Gerencie seus aportes e resgates do período selecionado
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DashboardFilterBar
              value={filterState}
              onChange={setFilterState}
              onApply={handleFilterApply}
              disabled={isPending}
            />

            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Investimento
            </Button>
          </div>
        </div>


        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {investments.length} {investments.length === 1 ? 'registro' : 'registros'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aportes</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalDeposits)}
              </div>
              <p className="text-xs text-muted-foreground">
                {depositsCount} {depositsCount === 1 ? 'aporte' : 'aportes'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Resgates</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalWithdraws)}
              </div>
              <p className="text-xs text-muted-foreground">
                {withdrawsCount} {withdrawsCount === 1 ? 'resgate' : 'resgates'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {balance >= 0 ? '+' : ''}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(balance)}
              </div>
              <p className="text-xs text-muted-foreground">no período</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Investimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Investimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {investments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum investimento registrado no período selecionado
              </p>
            ) : (
              investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded ${
                        investment.type === 'DEPOSIT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {investment.type === 'DEPOSIT' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{investment.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {investment.type === 'DEPOSIT' ? 'Aporte' : 'Resgate'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(investment.date).toLocaleDateString('pt-BR', {
                            timeZone: 'UTC',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
                    <span
                      className={`text-lg font-semibold ${
                        investment.type === 'DEPOSIT'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {investment.type === 'DEPOSIT' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(investment.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild className="rounded">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicate(investment)}
                          >
                            <Copy className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar investimento</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild className="rounded">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(investment)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar investimento</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild className="rounded">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(investment)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir investimento</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <InvestmentForm
          open={formOpen}
          onOpenChange={handleCloseForm}
          investment={editingInvestment}
          onSuccess={async () => {
            const result = await onFilterChange({
              startDate: filterState.range.from!.toISOString(),
              endDate: filterState.range.to!.toISOString(),
            });
            if (result.success && result.data) {
              setInvestments(result.data);
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
                Você está prestes a excluir o investimento:
              </DialogDescription>
            </DialogHeader>
            
            {investmentToDelete && (
              <div className="py-4">
                <div className="p-4 bg-gray-100 rounded space-y-1">
                  <p className="font-semibold text-gray-900">{investmentToDelete.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Tipo:</span>
                    <span className="font-medium">
                      {investmentToDelete.type === 'DEPOSIT' ? 'Aporte' : 'Resgate'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Valor:</span>
                    <span className={`font-medium ${investmentToDelete.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(investmentToDelete.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Data:</span>
                    <span className="font-medium">
                      {new Date(investmentToDelete.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-4">
                  <strong className='text-red-600'>Atenção:</strong> Esta ação não poderá ser desfeita. O investimento será permanentemente removido do sistema.
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
                onClick={() => investmentToDelete && handleDelete(investmentToDelete.id)}
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
