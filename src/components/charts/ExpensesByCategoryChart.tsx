'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpensesByCategoryChartProps {
  data: {
    name: string;
    value: number;
    color?: string | null;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-75 text-muted-foreground">
        Nenhuma despesa para exibir
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: item.color || COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Number(value) || 0)
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
