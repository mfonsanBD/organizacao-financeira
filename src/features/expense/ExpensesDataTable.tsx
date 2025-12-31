/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

// Tipos de despesa
export type Expense = {
  amount: number;
  date: any;
  expense: {
    description: string;
    category: { name: string };
  } | null;
  createdBy: { name: string }
};

interface ExpensesDataTableProps {
  expenses: Expense[];
  loading?: boolean
}

const columns: ColumnDef<Expense>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString("pt-BR"),
  },
  {
    accessorKey: "expense.description",
    header: "Descrição",
    cell: ({ row }) => row.original.expense?.description ?? "-",
  },
  {
    accessorKey: "expense.category.name",
    header: "Categoria",
    cell: ({ row }) => row.original.expense?.category?.name ?? "-",
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) =>
      row.original.amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
  },
  {
    accessorKey: "createdBy.name",
    header: "Usuário",
    cell: ({ row }) => row.original.createdBy.name ?? "-",
  },
];

export function ExpensesDataTable({ expenses, loading }: ExpensesDataTableProps) {
  return <DataTable columns={columns} data={expenses} loading={loading} />
}
