import { z } from 'zod';

// Income validation schemas
export const createIncomeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  isActive: z.boolean().optional().default(true),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;

// Expense validation schemas
export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  paymentDate: z.date(),
  isRecurring: z.boolean().optional().default(false),
  recurrence: z.enum(['MONTHLY', 'YEARLY', 'CUSTOM']).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Budget validation schemas
export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  month: z.number().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().min(2020, 'Ano inválido'),
});

export const updateBudgetSchema = createBudgetSchema.partial().omit({
  categoryId: true,
  month: true,
  year: true,
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Receivable validation schemas
export const createReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  expectedDate: z.date(),
  receivedDate: z.date().optional(),
  isReceived: z.boolean().optional().default(false),
});

export const updateReceivableSchema = createReceivableSchema.partial();

export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type UpdateReceivableInput = z.infer<typeof updateReceivableSchema>;
