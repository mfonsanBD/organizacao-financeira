'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportToExcel } from '@/features/report/actions';
import { toast } from 'sonner';

interface ExportButtonProps {
  entity: 'expenses' | 'incomes' | 'budgets' | 'receivables' | 'categories';
  startDate?: Date;
  endDate?: Date;
  filename?: string;
}

export function ExportButton({ entity, startDate, endDate, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Map entity type to export type
      const typeMap: Record<typeof entity, 'expenses' | 'incomes' | 'budgets' | 'receivables' | 'complete'> = {
        expenses: 'expenses',
        incomes: 'incomes',
        budgets: 'budgets',
        receivables: 'receivables',
        categories: 'complete', // Categories export as complete report
      };

      const result = await exportToExcel({
        type: typeMap[entity],
        startDate,
        endDate,
      });

      if (result.success && result.data) {
        // Convert base64 to blob and download
        const blob = base64ToBlob(result.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || result.filename || 'relatorio.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Relatório exportado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size="lg"
      className="min-w-50"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </>
      )}
    </Button>
  );
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}
