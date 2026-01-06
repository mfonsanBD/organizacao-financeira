import Dexie, { Table } from 'dexie';

// IndexedDB schema - mirrors Prisma schema for offline-first
export interface DBUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBIncome {
  id: string;
  description: string;
  amount: number;
  paymentData: Date;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  paymentDate: Date;
  status: 'PENDING' | 'COMPLETED';
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DBNotification {
  id: string;
  userId: string;
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
  notifications!: Table<DBNotification>;

  constructor() {
    super('FinancialDB');
    
    this.version(1).stores({
      users: 'id, email, synced',
      incomes: 'id, synced',
      expenses: 'id, categoryId, paymentDate, synced',
      categories: 'id, synced',
      notifications: 'id, userId, isRead, synced, createdAt',
    });
  }
}

// Create singleton instance
export const db = new FinancialDB();
