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
  };
  onSuccess?: () => void;
}

export function ExpenseForm({ open, onOpenChange, expense, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

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

  // Reset form when dialog opens or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          description: expense.description,
          amount: expense.amount,
          categoryId: expense.categoryId,
          paymentDate: expense.paymentDate,
          isRecurring: expense.isRecurring,
        });
      } else {
        reset({
          description: '',
          amount: 0,
          categoryId: '',
          paymentDate: new Date(),
          isRecurring: false,
        });
      }
    }
  }, [expense, open, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const result = expense?.id
        ? await updateExpense(expense.id, data)
        : await createExpense(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(expense ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
      reset();
      onOpenChange(false);
      onSuccess?.();
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
              : 'Registre uma nova despesa ou conta fixa.'}
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

          <div className="space-y-3 p-4 border rounded bg-blue-50/50">
            <div className="flex items-center space-x-2">
              <input
                id="isRecurring"
                type="checkbox"
                className="rounded border-gray-300 w-4 h-4"
                {...register('isRecurring')}
              />
              <Label htmlFor="isRecurring" className="font-medium cursor-pointer">
                É uma despesa recorrente?
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Marque para despesas que se repetem regularmente (ex: luz, água, internet, aluguel). O valor pode variar a cada mês.
            </p>
          </div>

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
