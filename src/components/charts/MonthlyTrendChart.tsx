/* eslint-disable @typescript-eslint/no-explicit-any */
 
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip } from '../ui/chart';
import { cn } from '@/lib/utils';

function AdvancedTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={cn(
      "rounded-md border bg-background p-2 shadow-sm min-w-40 font-poppins"
    )}>
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-col gap-1">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-lexend text-xs font-semibold tabular-nums">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MonthlyTrendChartProps {
  data: {
    label: string;
    despesas: number;
  }[];
}

const chartConfig = {
  despesas: {
    label: 'Despesas',
    color: '#E7000B',
  },
} satisfies ChartConfig

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const filteredData = data.filter((item) => item.despesas > 0);
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-75 text-muted-foreground">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig}>
      <div className="w-full h-48 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <XAxis dataKey="label" stroke="#888888" fontSize={12} />
            <ChartTooltip
              cursor={false}
              content={AdvancedTooltipContent}
            />
            <Bar dataKey="despesas" fill="#E7000B" radius={[4, 4, 0, 0]} name="Despesas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}