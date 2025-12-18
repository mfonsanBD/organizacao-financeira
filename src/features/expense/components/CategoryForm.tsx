'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema } from '@/lib/validations/financial';
import { createCategory, updateCategory } from '@/features/expense/actions';
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

type CategoryFormData = z.infer<typeof createCategorySchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: {
    id: string;
    name: string;
    color?: string | null;
  };
}

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
    },
  });

  // Update form when category changes or dialog opens
  useEffect(() => {
    if (open) {
      if (category) {
        reset({
          name: category.name,
          color: category.color || '#3b82f6',
        });
      } else {
        reset({
          name: '',
          color: '#3b82f6',
        });
      }
    }
  }, [category, open, reset]);

  const colorValue = watch('color');

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const result = category
        ? await updateCategory(category.id, data)
        : await createCategory(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(category ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {category
              ? 'Atualize as informações da categoria.'
              : 'Crie uma nova categoria para organizar suas despesas.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação, Transporte, Saúde"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor (opcional)</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                className="h-10 w-20 cursor-pointer"
                value={colorValue || '#3b82f6'}
                onChange={(e) => setValue('color', e.target.value)}
              />
              <Input
                type="text"
                placeholder="#3b82f6"
                value={colorValue || ''}
                onChange={(e) => setValue('color', e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha uma cor para identificar facilmente esta categoria
            </p>
            {errors.color && <p className="text-sm text-red-600">{errors.color.message}</p>}
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
              {isSubmitting ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
