/**
 * Global type definitions
 * 
 * Shared types across the application
 */

export type Role = 'ADMIN' | 'MEMBER';

export type TransactionType = 'INCOME' | 'EXPENSE';

export type RecurrenceType = 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  familyId: string;
}
