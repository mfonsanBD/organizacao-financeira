'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIncomeSchema } from '@/lib/validations/financial';
import { createIncome, updateIncome } from '@/features/income/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useEffect } from 'react';

type IncomeFormData = z.infer<typeof createIncomeSchema>;

interface IncomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: {
    id: string;
    description: string;
    amount: number;
    dueDate: number;
    isActive: boolean;
  };
}

export function IncomeForm({ open, onOpenChange, income }: IncomeFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dueDate: 1,
      isActive: true,
    },
  });

  // Update form when income changes or dialog opens
  useEffect(() => {
    if (open) {
      if (income) {
        reset({
          description: income.description,
          amount: income.amount,
          dueDate: income.dueDate,
          isActive: income.isActive,
        });
      } else {
        reset({
          description: '',
          amount: 0,
          dueDate: 1,
          isActive: true,
        });
      }
    }
  }, [income, open, reset]);

  const onSubmit = async (data: IncomeFormData) => {
    try {
      const result = income
        ? await updateIncome(income.id, data)
        : await createIncome(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(income ? 'Renda atualizada com sucesso!' : 'Renda criada com sucesso!');
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar renda');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{income ? 'Editar Renda' : 'Nova Renda'}</DialogTitle>
          <DialogDescription>
            {income
              ? 'Atualize as informações da sua renda mensal.'
              : 'Adicione uma nova fonte de renda mensal.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Freelance, Aluguel"
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
            <Label htmlFor="dueDate">Dia do Recebimento</Label>
            <Input
              id="dueDate"
              type="number"
              min="1"
              max="31"
              placeholder="1-31"
              {...register('dueDate', { valueAsNumber: true })}
            />
            {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              className="rounded border-gray-300"
              {...register('isActive')}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Renda ativa
            </Label>
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
              {isSubmitting ? 'Salvando...' : income ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
