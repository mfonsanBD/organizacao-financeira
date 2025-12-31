/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Pie, PieChart } from 'recharts';


import { ChartContainer, ChartLegend, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload.payload;
  return (
    <div className={cn(
      "rounded-md border bg-background p-2 shadow-sm min-w-32 font-poppins"
    )}>
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Despesas
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="text-xs text-muted-foreground">{entry.category}</span>
        </span>
        <span className="font-lexend text-xs font-semibold tabular-nums">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Number(entry.value) || 0)}
        </span>
      </div>
    </div>
  );
}

function CustomLegendContent({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.payload.fill }}
          />
          <span className="text-xs text-muted-foreground font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ExpensesByCategoryChartProps {
  data: {
    name: string;
    value: number;
    color?: string | null;
  }[];
}

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-75 text-muted-foreground">
        Nenhuma despesa para exibir
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    category: item.name,
    value: item.value,
    fill: item.color || `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  const chartConfig = chartData.reduce<ChartConfig>(
    (acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      };
      return acc;
    },
    {
      value: {
        label: 'Despesas',
      },
    }
  );

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-80"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={CustomPieTooltip}
        />

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="category"
          innerRadius={60}
          strokeWidth={5}
        />

        <ChartLegend
          content={CustomLegendContent}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/2 *:justify-center flex-row"
        />
      </PieChart>
    </ChartContainer>
  );
}
