'use client';

import { useState } from 'react';
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
import { deleteExpense } from '@/features/expense/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Repeat, Calendar, Copy, AlertTriangle } from 'lucide-react';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteExpense(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Despesa excluída com sucesso!');
      router.refresh();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

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
                  <div className="flex flex-1 items-center gap-2">
                    {expense.isRecurring && <Repeat className="h-4 w-4 text-zinc-600" />}
                    <h4 className="font-medium">{expense.description}</h4>
                    {expense.isRecurring && (
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-sm">
                        {expense.recurrence === 'MONTHLY' ? 'Mensal' : expense.recurrence === 'YEARLY' ? 'Anual' : 'Personalizado'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <span className="text-lg font-semibold mr-4">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(expense.amount)}
                  </span>
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
            Despesas de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
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
            <p className="text-2xl font-bold text-rose-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalOneTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{oneTimeExpenses.length} despesas</p>
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

      <ExpenseForm open={formOpen} onOpenChange={handleCloseForm} expense={editingExpense} />

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
