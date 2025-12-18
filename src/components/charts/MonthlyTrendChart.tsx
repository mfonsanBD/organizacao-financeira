'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTrendChartProps {
  data: {
    month: string;
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
            }).format(value)
          }
        />
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Number(value) || 0)
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="receitas"
          stroke="#00C49F"
          strokeWidth={2}
          name="Receitas"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="despesas"
          stroke="#FF8042"
          strokeWidth={2}
          name="Despesas"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
