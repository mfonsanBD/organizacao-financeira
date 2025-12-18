'use client';

import { AlertTriangle, AlertCircle } from 'lucide-react';

interface BudgetAlert {
  id: string;
  categoryName: string;
  categoryColor: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-50 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
        <p>Nenhum alerta de orçamento</p>
        <p className="text-sm">Seus gastos estão sob controle!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isExceeded = alert.percentage > 100;
        const colorClass = isExceeded ? 'text-red-600' : 'text-amber-600';
        const bgClass = isExceeded ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${bgClass} transition-colors`}
          >
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${colorClass} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: alert.categoryColor }}
                />
                <p className="font-medium">{alert.categoryName}</p>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Gasto:{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(alert.spent)}{' '}
                  de{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(alert.limit)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${isExceeded ? 'bg-red-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  />
                </div>
                <p className={`text-sm font-semibold ${colorClass}`}>
                  {alert.percentage.toFixed(0)}% do orçamento
                  {isExceeded && ' - EXCEDIDO!'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
