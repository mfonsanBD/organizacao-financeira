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
    paymentData: Date;
  };
  onSuccess?: () => void;
}

export function IncomeForm({ open, onOpenChange, income, onSuccess }: IncomeFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paymentData: new Date(),
    },
  });

  // Update form when income changes or dialog opens
  useEffect(() => {
    if (open) {
      if (income) {
        const dateStr = income.paymentData instanceof Date 
          ? income.paymentData.toISOString().split('T')[0]
          : new Date(income.paymentData).toISOString().split('T')[0];
        
        reset({
          description: income.description,
          amount: income.amount,
        });
        // Set date separately as string for proper display in date input
        setValue('paymentData', dateStr as any);
      } else {
        const today = new Date().toISOString().split('T')[0];
        reset({
          description: '',
          amount: 0,
        });
        setValue('paymentData', today as any);
      }
    }
  }, [income, open, reset, setValue]);

  const onSubmit = async (data: IncomeFormData) => {
    try {
      const result = income && income.id
        ? await updateIncome(income.id, data)
        : await createIncome(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(income && income.id ? 'Renda atualizada com sucesso!' : 'Renda criada com sucesso!');
      reset();
      onOpenChange(false);
      onSuccess?.();
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
          <DialogTitle>{income && income.id ? 'Editar Renda' : 'Nova Renda'}</DialogTitle>
          <DialogDescription>
            {income && income.id
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
            <Label htmlFor="paymentData">Dia do Recebimento</Label>
            <Input
              id="paymentData"
              type="date"
              {...register('paymentData', { 
                setValueAs: (value) => value ? new Date(value) : new Date() 
              })}
            />
            {errors.paymentData && <p className="text-sm text-red-600">{errors.paymentData.message}</p>}
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
