import { db } from './dexie';

/**
 * Sync local IndexedDB data with backend
 * This function handles the offline-first sync logic
 */
export async function syncWithBackend() {
  try {
    // Check if online
    if (!navigator.onLine) {
      return;
    }

    // Get all unsynced records
    const unsyncedIncomes = await db.incomes.where('synced').equals(0).toArray();
    const unsyncedExpenses = await db.expenses.where('synced').equals(0).toArray();
    const unsyncedCategories = await db.categories.where('synced').equals(0).toArray();
    const unsyncedBudgets = await db.budgets.where('synced').equals(0).toArray();
    const unsyncedReceivables = await db.receivables.where('synced').equals(0).toArray();

    // Sync each entity type
    await syncEntities('incomes', unsyncedIncomes);
    await syncEntities('expenses', unsyncedExpenses);
    await syncEntities('categories', unsyncedCategories);
    await syncEntities('budgets', unsyncedBudgets);
    await syncEntities('receivables', unsyncedReceivables);
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

/**
 * Sync specific entity type with backend
 */
async function syncEntities(entityType: string, entities: unknown[]) {
  for (const entity of entities) {
    const typedEntity = entity as Record<string, unknown> & { id: string };
    try {
      const response = await fetch(`/api/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typedEntity),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync ${entityType}`);
      }

      const result = await response.json();

      // Mark as synced in local DB
      await ((db as unknown) as Record<string, { update: (id: string, data: unknown) => Promise<unknown> }>)[entityType].update(typedEntity.id, {
        synced: true,
        updatedAt: result.updatedAt || new Date(),
      });
    } catch (error) {
      console.error(`Failed to sync ${entityType} ${typedEntity.id}:`, error);
      // Continue with next entity even if one fails
    }
  }
}

/**
 * Pull latest data from backend
 * Used for conflict resolution based on updatedAt
 */
export async function pullFromBackend() {
  try {
    if (!navigator.onLine) {
      return;
    }

    const response = await fetch('/api/sync');
    
    if (!response.ok) {
      console.error('Failed to pull data from backend:', response.status);
      return; // Don't throw - sync is non-critical
    }

    const data = await response.json();

    // Check for error response
    if (data.error) {
      console.error('Sync error:', data.error);
      return;
    }

    // Update local DB with latest data, resolving conflicts by updatedAt
    await resolveConflictsAndUpdate(data);
  } catch (error) {
    console.error('Pull failed:', error);
    // Don't throw - sync is non-critical
  }
}

/**
 * Resolve conflicts based on updatedAt timestamp
 * Server data wins if it's newer
 */
async function resolveConflictsAndUpdate(serverData: {
  incomes?: Array<Record<string, unknown> & { id: string; updatedAt: string | Date }>;
  expenses?: Array<Record<string, unknown> & { id: string; updatedAt: string | Date }>;
  categories?: Array<Record<string, unknown> & { id: string; updatedAt: string | Date }>;
  budgets?: Array<Record<string, unknown> & { id: string; updatedAt: string | Date }>;
  receivables?: Array<Record<string, unknown> & { id: string; updatedAt: string | Date }>;
}) {
  // Handle each table separately to maintain type safety
  if (serverData.incomes) {
    for (const record of serverData.incomes) {
      await syncRecord(db.incomes, record, 'incomes');
    }
  }

  if (serverData.expenses) {
    for (const record of serverData.expenses) {
      await syncRecord(db.expenses, record, 'expenses');
    }
  }

  if (serverData.categories) {
    for (const record of serverData.categories) {
      await syncRecord(db.categories, record, 'categories');
    }
  }

  if (serverData.budgets) {
    for (const record of serverData.budgets) {
      await syncRecord(db.budgets, record, 'budgets');
    }
  }

  if (serverData.receivables) {
    for (const record of serverData.receivables) {
      await syncRecord(db.receivables, record, 'receivables');
    }
  }
}

/**
 * Sync a single record with conflict resolution
 */
async function syncRecord<T extends { id: string; updatedAt: Date; synced: boolean }>(
  table: { get: (id: string) => Promise<T | undefined>; add: (item: T) => Promise<string>; put: (item: T) => Promise<string> },
  record: Record<string, unknown> & { id: string; updatedAt: string | Date },
  tableName: string
) {
  try {
    const localRecord = await table.get(record.id);

    if (!localRecord) {
      // New record from server - add it
      await table.add({ ...record, synced: true, updatedAt: new Date(record.updatedAt) } as T);
    } else {
      // Conflict resolution: newer updatedAt wins
      const serverUpdatedAt = new Date(record.updatedAt);
      const localUpdatedAt = new Date(localRecord.updatedAt);

      if (serverUpdatedAt > localUpdatedAt) {
        // Server is newer, update local
        await table.put({ ...record, synced: true, updatedAt: serverUpdatedAt } as T);
      } else if (localUpdatedAt > serverUpdatedAt && !localRecord.synced) {
        // Local is newer and not synced, keep local (will be pushed later)
      } else {
        // Same timestamp or local is already synced, use server version
        await table.put({ ...record, synced: true, updatedAt: serverUpdatedAt } as T);
      }
    }
  } catch (error) {
    console.error(`Error syncing ${tableName} record ${record.id}:`, error);
    // Continue with next record
  }
}

/**
 * Setup automatic sync on network reconnection
 */
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    try {
      await syncWithBackend();
      await pullFromBackend();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  });

  // Also sync periodically if online (every 5 minutes)
  setInterval(async () => {
    if (navigator.onLine) {
      try {
        await pullFromBackend();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }
  }, 5 * 60 * 1000);
}
