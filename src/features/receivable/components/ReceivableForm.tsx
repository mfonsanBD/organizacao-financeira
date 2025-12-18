'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReceivableSchema } from '@/lib/validations/financial';
import { createReceivable, updateReceivable } from '@/features/receivable/actions';
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

type ReceivableFormData = z.infer<typeof createReceivableSchema>;

interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable?: {
    id: string;
    description: string;
    amount: number;
    expectedDate: Date;
    isReceived: boolean;
    receivedDate?: Date | null;
  };
}

export function ReceivableForm({ open, onOpenChange, receivable }: ReceivableFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(createReceivableSchema),
    defaultValues: receivable
      ? {
          description: receivable.description,
          amount: receivable.amount,
          expectedDate: receivable.expectedDate,
          isReceived: receivable.isReceived,
          receivedDate: receivable.receivedDate || undefined,
        }
      : {
          isReceived: false,
        },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isReceived = watch('isReceived');

  const onSubmit = async (data: ReceivableFormData) => {
    try {
      const result = receivable
        ? await updateReceivable(receivable.id, data)
        : await createReceivable(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        receivable ? 'Recebível atualizado com sucesso!' : 'Recebível criado com sucesso!'
      );
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar recebível');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{receivable ? 'Editar Recebível' : 'Novo Recebível'}</DialogTitle>
          <DialogDescription>
            {receivable
              ? 'Atualize as informações do recebível.'
              : 'Adicione um valor que você espera receber.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Reembolso, Venda, Devolução"
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
            <Label htmlFor="expectedDate">Data Prevista</Label>
            <Input
              id="expectedDate"
              type="date"
              {...register('expectedDate', {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
            />
            {errors.expectedDate && (
              <p className="text-sm text-red-600">{errors.expectedDate.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isReceived"
              type="checkbox"
              className="rounded border-gray-300"
              {...register('isReceived')}
            />
            <Label htmlFor="isReceived" className="font-normal cursor-pointer">
              Já foi recebido
            </Label>
          </div>

          {isReceived && (
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Data do Recebimento</Label>
              <Input
                id="receivedDate"
                type="date"
                {...register('receivedDate', {
                  setValueAs: (value) => (value ? new Date(value) : undefined),
                })}
              />
              {errors.receivedDate && (
                <p className="text-sm text-red-600">{errors.receivedDate.message}</p>
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
              {isSubmitting ? 'Salvando...' : receivable ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
