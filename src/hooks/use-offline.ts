'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/dexie';
import type { DBIncome, DBExpense } from '@/lib/db/dexie';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to use IndexedDB for offline-first income operations
 */
export function useOfflineIncomes() {
  const queryClient = useQueryClient();

  const saveOffline = useMutation({
    mutationFn: async (income: Omit<DBIncome, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
      const now = new Date();
      const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newIncome: DBIncome = {
        ...income,
        id,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };

      await db.incomes.add(newIncome);
      return newIncome;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });

  const updateOffline = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DBIncome> }) => {
      await db.incomes.update(id, {
        ...data,
        updatedAt: new Date(),
        synced: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });

  const deleteOffline = useMutation({
    mutationFn: async (id: string) => {
      await db.incomes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });

  return {
    saveOffline,
    updateOffline,
    deleteOffline,
  };
}

/**
 * Hook to use IndexedDB for offline-first expense operations
 */
export function useOfflineExpenses() {
  const queryClient = useQueryClient();

  const saveOffline = useMutation({
    mutationFn: async (expense: Omit<DBExpense, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
      const now = new Date();
      const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newExpense: DBExpense = {
        ...expense,
        id,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };

      await db.expenses.add(newExpense);
      return newExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateOffline = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DBExpense> }) => {
      await db.expenses.update(id, {
        ...data,
        updatedAt: new Date(),
        synced: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteOffline = useMutation({
    mutationFn: async (id: string) => {
      await db.expenses.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return {
    saveOffline,
    updateOffline,
    deleteOffline,
  };
}

/**
 * Hook to get offline data from IndexedDB
 */
export function useOfflineData<T>(
  tableName: 'incomes' | 'expenses' | 'categories' | 'budgets' | 'receivables',
  filter?: (item: T) => boolean,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const table = db[tableName];
        let items = await table.toArray() as unknown as T[];
        
        if (filter) {
          items = items.filter(filter);
        }
        
        setData(items);
      } catch (error) {
        console.error(`Error fetching offline ${tableName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    db[tableName].hook('creating', () => {
      fetchData();
    });

    db[tableName].hook('updating', () => {
      fetchData();
    });

    db[tableName].hook('deleting', () => {
      fetchData();
    });

    // Note: Dexie hooks are automatically managed
  }, [tableName, filter]);

  return { data, loading };
}

/**
 * Hook to check if there are unsynced changes
 */
export function useUnsyncedCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const checkUnsynced = async () => {
      try {
        const counts = await Promise.all([
          db.incomes.where('synced').equals(0).count(),
          db.expenses.where('synced').equals(0).count(),
          db.categories.where('synced').equals(0).count(),
          db.budgets.where('synced').equals(0).count(),
          db.receivables.where('synced').equals(0).count(),
        ]);

        setCount(counts.reduce((sum, c) => sum + c, 0));
      } catch (error) {
        console.error('Error checking unsynced count:', error);
      }
    };

    checkUnsynced();

    // Check every 10 seconds
    const interval = setInterval(checkUnsynced, 10000);

    return () => clearInterval(interval);
  }, []);

  return count;
}

/**
 * Hook to sync all offline data with backend
 */
export function useSync() {
  const queryClient = useQueryClient();

  const sync = useMutation({
    mutationFn: async () => {
      // Get all unsynced records
      const [incomes, expenses, categories, budgets, receivables] = await Promise.all([
        db.incomes.where('synced').equals(0).toArray(),
        db.expenses.where('synced').equals(0).toArray(),
        db.categories.where('synced').equals(0).toArray(),
        db.budgets.where('synced').equals(0).toArray(),
        db.receivables.where('synced').equals(0).toArray(),
      ]);

      // Sync each type
      const syncPromises = [];

      for (const income of incomes) {
        syncPromises.push(
          fetch('/api/incomes/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(income),
          }).then(() => db.incomes.update(income.id, { synced: true })),
        );
      }

      for (const expense of expenses) {
        syncPromises.push(
          fetch('/api/expenses/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
          }).then(() => db.expenses.update(expense.id, { synced: true })),
        );
      }

      for (const category of categories) {
        syncPromises.push(
          fetch('/api/categories/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category),
          }).then(() => db.categories.update(category.id, { synced: true })),
        );
      }

      for (const budget of budgets) {
        syncPromises.push(
          fetch('/api/budgets/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budget),
          }).then(() => db.budgets.update(budget.id, { synced: true })),
        );
      }

      for (const receivable of receivables) {
        syncPromises.push(
          fetch('/api/receivables/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receivable),
          }).then(() => db.receivables.update(receivable.id, { synced: true })),
        );
      }

      await Promise.all(syncPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return sync;
}
