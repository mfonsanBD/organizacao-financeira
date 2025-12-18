'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUser, updateUser } from '@/features/user/actions';
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
import { useEffect } from 'react';
import { User } from '@prisma/client';

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
  };
}

export function UserForm({ open, onOpenChange, user }: UserFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  });

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
          password: '', // Don't show password when editing
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'MEMBER',
        });
      }
    }
  }, [user, open, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      const submitData: UserFormData = {
        name: data.name,
        email: data.email,
        role: data.role,
      };

      // Only include password if it's provided (for edits, it's optional)
      if (data.password && data.password.trim() !== '') {
        submitData.password = data.password;
      } else if (!user) {
        // Password is required for new users
        toast.error('Senha é obrigatória para novos usuários');
        return;
      }

      const result = user?.id
        ? await updateUser(user.id, submitData)
        : await createUser(submitData as Pick<User, 'name' | 'email' | 'password' | 'role'>);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(user ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar usuário');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Atualize as informações do usuário.'
              : 'Adicione um novo membro à família.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {user && <span className="text-xs text-muted-foreground">(deixe em branco para manter a atual)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={user ? 'Digite apenas se quiser alterar' : 'Mínimo 6 caracteres'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              onValueChange={(value) => setValue('role', value as 'ADMIN' | 'MEMBER')}
              defaultValue={user?.role || 'MEMBER'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Membro</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Administradores podem gerenciar usuários e ter acesso total ao sistema.
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
              {isSubmitting ? 'Salvando...' : user ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
