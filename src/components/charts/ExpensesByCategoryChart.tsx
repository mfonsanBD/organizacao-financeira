'use client';

import { Pie, PieChart } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

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
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value) || 0)
              }
            />
          }
        />

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="category"
          innerRadius={70}
          outerRadius={110}
          strokeWidth={2}
        />

        <ChartLegend
          content={<ChartLegendContent nameKey="category" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/2 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
