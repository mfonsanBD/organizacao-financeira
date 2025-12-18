import Dexie, { Table } from 'dexie';

// IndexedDB schema - mirrors Prisma schema for offline-first
export interface DBUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  familyId: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBIncome {
  id: string;
  description: string;
  amount: number;
  dueDate: number;
  familyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  familyId: string;
  paymentDate: Date;
  isRecurring: boolean;
  recurrence?: 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBCategory {
  id: string;
  name: string;
  color?: string;
  familyId: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBBudget {
  id: string;
  categoryId: string;
  familyId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBReceivable {
  id: string;
  description: string;
  amount: number;
  expectedDate: Date;
  receivedDate?: Date;
  familyId: string;
  isReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBNotification {
  id: string;
  userId: string;
  familyId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

// Dexie database class
export class FinancialDB extends Dexie {
  users!: Table<DBUser>;
  incomes!: Table<DBIncome>;
  expenses!: Table<DBExpense>;
  categories!: Table<DBCategory>;
  budgets!: Table<DBBudget>;
  receivables!: Table<DBReceivable>;
  notifications!: Table<DBNotification>;

  constructor() {
    super('FinancialDB');
    
    this.version(1).stores({
      users: 'id, email, familyId, synced',
      incomes: 'id, familyId, synced, isActive',
      expenses: 'id, familyId, categoryId, paymentDate, synced',
      categories: 'id, familyId, synced',
      budgets: 'id, familyId, categoryId, [familyId+categoryId+month+year], synced',
      receivables: 'id, familyId, expectedDate, synced, isReceived',
      notifications: 'id, userId, familyId, isRead, synced, createdAt',
    });
  }
}

// Create singleton instance
export const db = new FinancialDB();
