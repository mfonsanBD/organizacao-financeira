/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createInvestment, updateInvestment } from '../actions';
import {
  createInvestmentSchema,
  type CreateInvestmentInput,
} from '@/lib/validations/investment';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: {
    id: string;
    description: string;
    type: 'DEPOSIT' | 'WITHDRAW';
    amount: number;
    date: Date;
  };
  onSuccess?: () => void;
}

export function InvestmentForm({
  open,
  onOpenChange,
  investment,
  onSuccess,
}: InvestmentFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateInvestmentInput>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      description: '',
      type: 'DEPOSIT',
      amount: 0,
      date: new Date(),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const type = watch('type');

  useEffect(() => {
    if (open) {
      if (investment) {
        setValue('description', investment.description);
        setValue('type', investment.type);
        setValue('amount', investment.amount);
        
        const date = new Date(investment.date);
        const dateString = new Date(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate()
        ).toISOString().split('T')[0];
        setValue('date', dateString as any);
      } else {
        const today = new Date().toISOString().split('T')[0];
        reset({
          description: '',
          type: 'DEPOSIT',
          amount: 0,
        });
        setValue('date', today as any);
      }
    }
  }, [investment, open, setValue, reset]);

  const onSubmit = async (data: CreateInvestmentInput) => {
    try {
      let result;
      
      if (investment && investment.id) {
        result = await updateInvestment(investment.id, data);
      } else {
        result = await createInvestment(data);
      }

      if (result.success) {
        toast.success(
          investment && investment.id
            ? 'Investimento atualizado com sucesso!'
            : 'Investimento criado com sucesso!'
        );
        reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao salvar investimento');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Erro ao salvar investimento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {investment && investment.id ? 'Editar Investimento' : 'Novo Investimento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Investimento</Label>
            <RadioGroup value={type} onValueChange={(value: 'DEPOSIT' | 'WITHDRAW') => setValue('type', value)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldLabel htmlFor="deposit">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <div className="flex flex-col items-center gap-3">
                        <div className='w-full flex items-center justify-between gap-2'>
                          <span className="bg-emerald-100 text-emerald-600 text-2xl p-2.5 rounded">
                            <TrendingUp />
                          </span>

                          <RadioGroupItem value="DEPOSIT" id="deposit" />
                        </div>
                        <div className='w-full'>
                          <FieldTitle>Aporte</FieldTitle>
                          <FieldDescription>Valor depositado</FieldDescription>
                        </div>
                      </div>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                
                <FieldLabel htmlFor="withdraw">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <div className="flex flex-col items-center gap-3">
                        <div className='w-full flex items-center justify-between gap-2'>
                          <span className="bg-red-50 text-red-600 text-2xl p-2.5 rounded">
                            <TrendingDown />
                          </span>
                          <RadioGroupItem value="WITHDRAW" id="withdraw" />
                        </div>
                        <div className='w-full'>
                          <FieldTitle>Resgate</FieldTitle>
                          <FieldDescription>Valor retirado</FieldDescription>
                        </div>
                      </div>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </div>
            </RadioGroup>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Tesouro Direto, Ações, CDB..."
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
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              {...register('date', {
                setValueAs: (v) => (v ? new Date(v) : undefined),
              })}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : investment && investment.id
                ? 'Atualizar'
                : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
