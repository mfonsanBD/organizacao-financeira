import { db } from './dexie';

/**
 * Sync local IndexedDB data with backend
 * This function handles the offline-first sync logic
 */
export async function syncWithBackend() {
  try {
    // Check if online
    if (!navigator.onLine) {
      console.log('Offline - sync postponed');
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

    console.log('Sync completed successfully');
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
export async function pullFromBackend(familyId: string) {
  try {
    if (!navigator.onLine) {
      console.log('Offline - pull postponed');
      return;
    }

    const response = await fetch(`/api/sync?familyId=${familyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to pull data from backend');
    }

    const data = await response.json();

    // Update local DB with latest data, resolving conflicts by updatedAt
    await resolveConflictsAndUpdate(data);

    console.log('Pull completed successfully');
  } catch (error) {
    console.error('Pull failed:', error);
    throw error;
  }
}

/**
 * Resolve conflicts based on updatedAt timestamp
 * Server data wins if it's newer
 */
async function resolveConflictsAndUpdate(serverData: Record<string, unknown[]>) {
  for (const [table, records] of Object.entries(serverData)) {
    const typedRecords = records as Array<Record<string, unknown> & { id: string; updatedAt: string }>;
    for (const record of typedRecords) {
      const localRecord = await ((db as unknown) as Record<string, { get: (id: string) => Promise<Record<string, unknown> & { updatedAt: Date; synced: boolean } | undefined> }>)[table].get(record.id);

      if (!localRecord) {
        // New record from server
        await ((db as unknown) as Record<string, { add: (data: unknown) => Promise<unknown> }>)[table].add({ ...record, synced: true });
      } else {
        // Conflict resolution: newer updatedAt wins
        const serverUpdatedAt = new Date(record.updatedAt);
        const localUpdatedAt = new Date(localRecord.updatedAt);

        if (serverUpdatedAt > localUpdatedAt) {
          // Server is newer, update local
          await ((db as unknown) as Record<string, { put: (data: unknown) => Promise<unknown> }>)[table].put({ ...record, synced: true });
        } else if (localUpdatedAt > serverUpdatedAt && !localRecord.synced) {
          // Local is newer and not synced, keep local
          console.log(`Keeping local version of ${table} ${record.id}`);
        } else {
          // Same timestamp or local is already synced, use server
          await ((db as unknown) as Record<string, { put: (data: unknown) => Promise<unknown> }>)[table].put({ ...record, synced: true });
        }
      }
    }
  }
}

/**
 * Setup automatic sync on network reconnection
 */
export function setupAutoSync(familyId: string) {
  window.addEventListener('online', async () => {
    console.log('Network reconnected - starting sync');
    try {
      await syncWithBackend();
      await pullFromBackend(familyId);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  });

  // Also sync periodically if online (every 5 minutes)
  setInterval(async () => {
    if (navigator.onLine) {
      try {
        await pullFromBackend(familyId);
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }
  }, 5 * 60 * 1000);
}
