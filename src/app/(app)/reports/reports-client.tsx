'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ExportButton } from '@/components/reports/ExportButton';
import { FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

type EntityType = 'incomes' | 'expenses' | 'budgets' | 'receivables' | 'categories';

export function ReportsClient() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(format(firstDayOfMonth, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(lastDayOfMonth, 'yyyy-MM-dd'));
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('expenses');

  const entities: { value: EntityType; label: string; description: string }[] = [
    {
      value: 'incomes',
      label: 'Receitas',
      description: 'Exportar todas as receitas (ativas e inativas)',
    },
    {
      value: 'expenses',
      label: 'Despesas',
      description: 'Exportar despesas do período selecionado',
    },
    {
      value: 'budgets',
      label: 'Orçamentos',
      description: 'Exportar orçamentos com gastos reais',
    },
    {
      value: 'receivables',
      label: 'Recebíveis',
      description: 'Exportar valores a receber',
    },
    {
      value: 'categories',
      label: 'Categorias',
      description: 'Exportar todas as categorias de despesas',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6" />
              <div>
                <CardTitle>Relatórios e Exportação</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Exporte seus dados financeiros em formato Excel
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              <strong>Período selecionado:</strong>{' '}
              {format(new Date(startDate), 'dd/MM/yyyy')} até{' '}
              {format(new Date(endDate), 'dd/MM/yyyy')}
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione o tipo de dados para exportar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {entities.map((entity) => (
                <label
                  key={entity.value}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedEntity === entity.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="entity"
                    value={entity.value}
                    checked={selectedEntity === entity.value}
                    onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{entity.label}</div>
                    <div className="text-sm text-muted-foreground">{entity.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão abaixo para exportar <strong>{entities.find(e => e.value === selectedEntity)?.label.toLowerCase()}</strong> em formato Excel (.xlsx)
              </p>
              <ExportButton
                entity={selectedEntity}
                startDate={new Date(startDate)}
                endDate={new Date(endDate)}
                filename={`${selectedEntity}_${format(new Date(startDate), 'yyyy-MM-dd')}_${format(new Date(endDate), 'yyyy-MM-dd')}.xlsx`}
              />
              <div className="text-xs text-muted-foreground text-center mt-2">
                <p>💡 O arquivo será baixado automaticamente após o processamento</p>
                <p className="mt-1">📊 Formato: Excel 2007+ (.xlsx)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-blue-600 text-2xl">ℹ️</div>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Informações sobre a exportação:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Os dados são filtrados pelo período selecionado (exceto Receitas e Categorias)</li>
                  <li>Valores monetários são formatados em Real Brasileiro (R$)</li>
                  <li>Datas são formatadas no padrão brasileiro (dd/MM/yyyy)</li>
                  <li>O arquivo pode ser aberto no Excel, Google Sheets ou LibreOffice</li>
                  <li>Apenas dados da sua família são incluídos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
