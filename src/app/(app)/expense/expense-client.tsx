'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/features/expense/components/ExpenseForm';
import { deleteExpense, updateExpenseStatus } from '@/features/expense/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Repeat, Calendar, Copy, AlertTriangle, CheckCircle2, Clock, Check } from 'lucide-react';
import { DashboardFilterBar } from '../dashboard/dashboard-filter-bar';
import type { DateRange } from 'react-day-picker';

type Preset = 'day' | 'week' | 'month' | 'year';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paymentDate: Date;
  status: string;
  isRecurring: boolean;
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
  onFilterChange: (filters: { startDate: string; endDate: string }) => Promise<{ success: boolean; data: Expense[]; error?: string }>;
}

export function ExpenseClient({ expenses: initialExpenses, categories, onFilterChange }: ExpenseClientProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    | {
        id: string;
        description: string;
        amount: number;
        categoryId: string;
        paymentDate: Date;
        isRecurring: boolean;
      }
    | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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
        setExpenses(result.data);
      } else {
        toast.error(result.error || 'Erro ao filtrar despesas');
      }
    });
  };

  const handleToggleStatus = async (expense: Expense) => {
    setUpdatingStatusId(expense.id);
    const newStatus = expense.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    
    const result = await updateExpenseStatus(expense.id, newStatus);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        newStatus === 'COMPLETED' 
          ? 'Despesa marcada como paga!' 
          : 'Despesa marcada como pendente!'
      );
      
      // Update local state
      setExpenses(prevExpenses =>
        prevExpenses.map(e =>
          e.id === expense.id ? { ...e, status: newStatus } : e
        )
      );
      
      router.refresh();
    }
    
    setUpdatingStatusId(null);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteExpense(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Despesa excluída com sucesso!');
      // Update local state
      setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== id));
      router.refresh();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };;

  const openDeleteDialog = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.category.id,
      paymentDate: expense.paymentDate,
      isRecurring: expense.isRecurring,
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

  // Separar por status
  const completedExpenses = expenses.filter((e) => e.status === 'COMPLETED');
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING');

  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCompleted = completedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Função para renderizar lista de despesas
  const renderExpenseList = (expenseList: Expense[]) => {
    if (expenseList.length === 0) {
      return (
        <Card className="p-8 text-center col-span-2">
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
        <Card key={category.id} className='py-4 md:py-6'>
          <CardHeader className='px-4 md:px-6'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {category.color && (
                  <div
                    className="w-4 h-4 rounded"
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
          <CardContent className="space-y-3 px-4 md:px-6">
            {category.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex flex-1 items-center gap-2 flex-wrap">
                    {expense.isRecurring && <Repeat className="h-4 w-4 text-zinc-600" />}
                    <h4 className="font-medium">{expense.description}</h4>
                    {expense.status === 'COMPLETED' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Pago
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Aguardando
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(expense.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                  <span className="text-lg font-semibold mr-4">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(expense.amount)}
                  </span>
                  
                  <div className='flex items-center gap-2'>
                    <Tooltip>
                      <TooltipTrigger asChild className='rounded'>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleStatus(expense)}
                          disabled={updatingStatusId === expense.id}
                          className={expense.status === 'COMPLETED' ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-yellow-50 hover:bg-yellow-100'}
                        >
                          {updatingStatusId === expense.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : expense.status === 'COMPLETED' ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{expense.status === 'COMPLETED' ? 'Marcar como pendente' : 'Marcar como pago'}</p>
                      </TooltipContent>
                    </Tooltip>
                    {expense.isRecurring && (
                      <Tooltip>
                        <TooltipTrigger asChild className='rounded'>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicate(expense)}
                          >
                            <Copy className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar para este mês</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild className='rounded'>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar despesa</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild className='rounded'>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(expense)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir despesa</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ));
  };

  return (
    <TooltipProvider>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas do período selecionado
          </p>
        </div>

        <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-4">
          <DashboardFilterBar
            value={filterState}
            onChange={setFilterState}
            onApply={handleFilterApply}
            disabled={isPending}
          />

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} {expenses.length === 1 ? 'transação' : 'transações'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalCompleted)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{completedExpenses.length} {completedExpenses.length === 1 ? 'despesa' : 'despesas'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPending)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{pendingExpenses.length} {pendingExpenses.length === 1 ? 'despesa' : 'despesas'}</p>
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
            <p className="text-xs text-muted-foreground mt-1">{recurringExpenses.length} {recurringExpenses.length === 1 ? 'despesa' : 'despesas'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avulsas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalOneTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{oneTimeExpenses.length} {oneTimeExpenses.length === 1 ? 'despesa' : 'despesas'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-2" suppressHydrationWarning>
        <TabsList className="flex flex-col gap-2 w-full md:grid md:grid-cols-3 md:gap-0 h-fit">
          <TabsTrigger value="all" className="w-full justify-start md:justify-center">Todas ({expenses.length})</TabsTrigger>
          <TabsTrigger value="recurring" className="w-full justify-start md:justify-center">
            <Repeat className="h-4 w-4 mr-2" />
            Recorrentes ({recurringExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="onetime" className="w-full justify-start md:justify-center">
            <Calendar className="h-4 w-4 mr-2" />
            Avulsas ({oneTimeExpenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderExpenseList(expenses)}
        </TabsContent>

        <TabsContent value="recurring" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderExpenseList(recurringExpenses)}
        </TabsContent>

        <TabsContent value="onetime" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderExpenseList(oneTimeExpenses)}
        </TabsContent>
      </Tabs>

      <ExpenseForm 
        open={formOpen} 
        onOpenChange={handleCloseForm} 
        expense={editingExpense}
        onSuccess={async () => {
          const result = await onFilterChange({
            startDate: filterState.range.from?.toISOString() || '',
            endDate: filterState.range.to?.toISOString() || '',
          });
          if (result.success && result.data) {
            setExpenses(result.data);
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
              Você está prestes a excluir a despesa:
            </DialogDescription>
          </DialogHeader>
          
          {expenseToDelete && (
            <div className="py-4">
              <div className="p-4 bg-gray-100 rounded space-y-1">
                <p className="font-semibold text-gray-900">{expenseToDelete.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Categoria:</span>
                  <span className="font-medium">{expenseToDelete.category.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Valor:</span>
                  <span className="font-medium text-red-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(expenseToDelete.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Data:</span>
                  <span className="font-medium">{new Date(expenseToDelete.paymentDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                <strong className='text-red-600'>Atenção:</strong> Esta ação não poderá ser desfeita. A despesa será permanentemente removida do sistema.
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
              onClick={() => expenseToDelete && handleDelete(expenseToDelete.id)}
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
