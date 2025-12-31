/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
function AdvancedTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  // Calcula o total (superavit ou deficit)
  let total = 0;
  let receitas = 0;
  let despesas = 0;
  payload.forEach((entry: any) => {
    if (entry.dataKey === 'receitas') receitas = Number(entry.value) || 0;
    if (entry.dataKey === 'despesas') despesas = Number(entry.value) || 0;
  });
  total = receitas - despesas;

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
      <div className={cn(
        "mt-2 pt-2 border-t text-xs font-semibold flex justify-between",
        total < 0 ? 'text-red-600' : total === 0 ? 'text-zinc-500' : 'text-teal-700'
      )}>
        <span>Total:</span>
        <span>
          {total < 0 ? '- ' : ''}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Math.abs(total))}
        </span>
      </div>
    </div>
  );
}

interface MonthlyTrendChartProps {
  data: {
    label: string;
    receitas: number;
    despesas: number;
  }[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-75 text-muted-foreground">
        Nenhum dado para exibir
      </div>
    );
  }

  const chartConfig = {
    receitas: {
      label: 'Receitas',
      color: '#009689',
    },
    despesas: {
      label: 'Despesas',
      color: '#E7000B',
    },
  } satisfies ChartConfig;

  return (
    <Card className="bg-white border border-gray-100">
      <CardHeader className="border-b border-gray-100 pb-4!">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Tendência no Período
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#009689" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#009689" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E7000B" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#E7000B" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />

            <ChartTooltip
              cursor={false}
              content={AdvancedTooltipContent}
            />

            <Area
              dataKey="receitas"
              name="Receitas"
              type="monotone"
              fill="url(#fillReceitas)"
              stroke="var(--color-receitas)"
              strokeWidth={2}
              dot={false}
            />

            <Area
              dataKey="despesas"
              name="Despesas"
              type="monotone"
              fill="url(#fillDespesas)"
              stroke="var(--color-despesas)"
              strokeWidth={2}
              dot={false}
            />

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
