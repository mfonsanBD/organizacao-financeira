'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserForm } from '@/features/user/components/UserForm';
import { deleteUser } from '@/features/user/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, AlertTriangle, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: Date;
}

interface UsersClientProps {
  users: User[];
  currentUserId: string;
}

export function UsersClient({ users, currentUserId }: UsersClientProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteUser(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Usuário excluído com sucesso!');
      router.refresh();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingUser(undefined);
  };

  const admins = users.filter((u) => u.role === 'ADMIN');
  const members = users.filter((u) => u.role === 'MEMBER');

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">Gerencie os membros da família</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">
                {users.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">membros cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">
                {admins.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">com acesso completo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">
                {members.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">com acesso padrão</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {users.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum usuário cadastrado. Clique em &quot;Novo Usuário&quot; para começar.
              </p>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className={`py-4 md:py-6 ${user.id === currentUserId ? 'border-teal-500 border-2' : ''}`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {user.id === currentUserId && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                            Você
                          </span>
                        )}
                        {user.role === 'ADMIN' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Administrador
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-start mt-2 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        <span>Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar usuário</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDeleteDialog(user)}
                                disabled={user.id === currentUserId}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {user.id === currentUserId 
                                  ? 'Você não pode excluir sua própria conta' 
                                  : 'Excluir usuário'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <UserForm open={formOpen} onOpenChange={handleCloseForm} user={editingUser} />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="pt-2">
                Você está prestes a excluir o usuário:
              </DialogDescription>
            </DialogHeader>
            
            {userToDelete && (
              <div className="py-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="font-semibold text-gray-900">{userToDelete.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Email:</span>
                    <span className="font-medium">{userToDelete.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Função:</span>
                    <span className="font-medium">
                      {userToDelete.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-4">
                  <strong>Atenção:</strong> Esta ação não poderá ser desfeita. O usuário será permanentemente removido do sistema e perderá acesso a todas as funcionalidades.
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
                onClick={() => userToDelete && handleDelete(userToDelete.id)}
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
