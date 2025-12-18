'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceivableForm } from '@/features/receivable/components/ReceivableForm';
import { deleteReceivable, markAsReceived } from '@/features/receivable/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';

interface Receivable {
  id: string;
  description: string;
  amount: number;
  expectedDate: Date;
  isReceived: boolean;
  receivedDate?: Date | null;
}

interface ReceivableClientProps {
  receivables: Receivable[];
}

export function ReceivableClient({ receivables }: ReceivableClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | undefined>();

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recebível?')) return;

    const result = await deleteReceivable(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Recebível excluído com sucesso!');
      router.refresh();
    }
  };

  const handleMarkAsReceived = async (id: string) => {
    const result = await markAsReceived(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Marcado como recebido!');
      router.refresh();
    }
  };

  const handleEdit = (receivable: Receivable) => {
    setEditingReceivable(receivable);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingReceivable(undefined);
  };

  const totalReceived = receivables
    .filter((r) => r.isReceived)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = receivables
    .filter((r) => !r.isReceived)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalAmount = receivables.reduce((sum, r) => sum + r.amount, 0);

  const pending = receivables.filter((r) => !r.isReceived);
  const received = receivables.filter((r) => r.isReceived);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Valores a Receber</h1>
          <p className="text-muted-foreground">Gerencie seus recebíveis</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Recebível
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{receivables.length} itens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPending)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{pending.length} itens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalReceived)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{received.length} itens</p>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pendentes</h2>
          <div className="space-y-3">
            {pending.map((receivable) => (
              <Card key={receivable.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{receivable.description}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Previsto para:{' '}
                        {new Date(receivable.expectedDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-600 mr-4">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(receivable.amount)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMarkAsReceived(receivable.id)}
                        title="Marcar como recebido"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(receivable)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(receivable.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {received.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recebidos</h2>
          <div className="space-y-3">
            {received.map((receivable) => (
              <Card key={receivable.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{receivable.description}</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Recebido
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recebido em:{' '}
                        {receivable.receivedDate
                          ? new Date(receivable.receivedDate).toLocaleDateString('pt-BR')
                          : 'Data não informada'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600 mr-4">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(receivable.amount)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(receivable)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(receivable.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {receivables.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum recebível cadastrado. Clique em &quot;Novo Recebível&quot; para começar.
          </p>
        </Card>
      )}

      <ReceivableForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        receivable={editingReceivable}
      />
    </div>
  );
}
