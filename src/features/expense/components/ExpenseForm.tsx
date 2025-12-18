'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpenseSchema } from '@/lib/validations/financial';
import { createExpense, updateExpense } from '@/features/expense/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { listCategories } from '@/features/expense/actions';

type ExpenseFormData = z.infer<typeof createExpenseSchema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    paymentDate: Date;
    isRecurring: boolean;
    recurrence?: 'MONTHLY' | 'YEARLY' | 'CUSTOM' | null;
  };
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: expense
      ? {
          description: expense.description,
          amount: expense.amount,
          categoryId: expense.categoryId,
          paymentDate: expense.paymentDate,
          isRecurring: expense.isRecurring,
          recurrence: expense.recurrence ?? undefined,
        }
      : {
          isRecurring: false,
        },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isRecurring = watch('isRecurring');

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await listCategories();
      if (result.data) {
        setCategories(result.data);
      }
    };
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const result = expense
        ? await updateExpense(expense.id, data)
        : await createExpense(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(expense ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar despesa');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
          <DialogDescription>
            {expense
              ? 'Atualize as informações da despesa.'
              : 'Registre uma nova despesa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Conta de luz, Supermercado"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              onValueChange={(value) => setValue('categoryId', value)}
              defaultValue={expense?.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data de Pagamento</Label>
            <Input
              id="paymentDate"
              type="date"
              {...register('paymentDate', {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
            />
            {errors.paymentDate && (
              <p className="text-sm text-red-600">{errors.paymentDate.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isRecurring"
              type="checkbox"
              className="rounded border-gray-300"
              {...register('isRecurring')}
            />
            <Label htmlFor="isRecurring" className="font-normal cursor-pointer">
              Despesa recorrente
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <Select
                onValueChange={(value) =>
                  setValue('recurrence', value as 'MONTHLY' | 'YEARLY' | 'CUSTOM')
                }
                defaultValue={expense?.recurrence || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {errors.recurrence && (
                <p className="text-sm text-red-600">{errors.recurrence.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : expense ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
