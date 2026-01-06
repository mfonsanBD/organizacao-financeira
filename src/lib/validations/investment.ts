import { z } from 'zod';

export const createInvestmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  type: z.enum(['DEPOSIT', 'WITHDRAW'], {
    required_error: 'Tipo é obrigatório',
  }),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
