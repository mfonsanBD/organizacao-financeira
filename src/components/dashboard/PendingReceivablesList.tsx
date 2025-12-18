'use client';

import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingReceivablesListProps {
  receivables: {
    id: string;
    description: string;
    amount: number;
    expectedDate: Date;
  }[];
}

export function PendingReceivablesList({ receivables }: PendingReceivablesListProps) {
  if (receivables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-50 text-muted-foreground">
        <FileText className="h-12 w-12 mb-2 opacity-50" />
        <p>Nenhum valor a receber pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {receivables.slice(0, 5).map((receivable) => {
        const isOverdue = new Date(receivable.expectedDate) < new Date();
        const formattedDate = format(new Date(receivable.expectedDate), 'dd/MMM/yyyy', {
          locale: ptBR,
        });

        return (
          <div
            key={receivable.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{receivable.description}</p>
              <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                {isOverdue ? 'Atrasado - ' : ''}
                {formattedDate}
              </p>
            </div>
            <div className="ml-4 text-right">
              <p className="font-semibold text-teal-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(receivable.amount)}
              </p>
            </div>
          </div>
        );
      })}

      {receivables.length > 5 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          +{receivables.length - 5} recebíveis não exibidos
        </p>
      )}
    </div>
  );
}
