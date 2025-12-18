'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBudgetSchema } from '@/lib/validations/financial';
import { upsertBudget } from '@/features/budget/actions';
import { listCategories } from '@/features/expense/actions';
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

type BudgetFormData = z.infer<typeof createBudgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: {
    id: string;
    categoryId: string;
    amount: number;
    month: number;
    year: number;
  };
}

export function BudgetForm({ open, onOpenChange, budget }: BudgetFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: budget
      ? {
          categoryId: budget.categoryId,
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
        }
      : {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
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

  const onSubmit = async (data: BudgetFormData) => {
    try {
      const result = await upsertBudget(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(budget ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!');
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar orçamento');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          <DialogDescription>
            {budget
              ? 'Atualize o orçamento para esta categoria.'
              : 'Defina um orçamento mensal para uma categoria.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              onValueChange={(value) => setValue('categoryId', value)}
              defaultValue={budget?.categoryId}
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
            <Label htmlFor="amount">Valor do Orçamento (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Select
                onValueChange={(value) => setValue('month', parseInt(value))}
                defaultValue={budget?.month.toString() || new Date().getMonth() + 1 + ''}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Janeiro',
                    'Fevereiro',
                    'Março',
                    'Abril',
                    'Maio',
                    'Junho',
                    'Julho',
                    'Agosto',
                    'Setembro',
                    'Outubro',
                    'Novembro',
                    'Dezembro',
                  ].map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && <p className="text-sm text-red-600">{errors.month.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                placeholder="2024"
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
            </div>
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
              {isSubmitting ? 'Salvando...' : budget ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
