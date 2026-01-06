/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Clock } from "lucide-react";

// Tipos de despesa
export type Expense = {
  amount: number;
  date: any;
  expense: {
    description: string;
    category: { name: string };
    status?: string;
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
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
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
    accessorKey: "expense.status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.expense?.status;
      if (!status) return "-";
      
      return status === "COMPLETED" ? (
        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm">
          <Check size={12} /> Pago
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-sm">
          <Clock size={12} /> Aguardando
        </span>
      );
    },
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
