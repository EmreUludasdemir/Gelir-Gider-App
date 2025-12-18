import * as db from "./database";
import { OfflineTransaction, SyncQueueItem } from "./database";

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncService {
  private apiUrl: string;
  private token: string | null;
  private isSyncing: boolean = false;

  constructor(apiUrl: string, token: string | null) {
    this.apiUrl = apiUrl;
    this.token = token;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.token ? `Bearer ${this.token}` : "",
        ...options.headers,
      },
    });
    return response;
  }

  // Pull data from server to local database
  async pullFromServer(): Promise<{ count: number; error?: string }> {
    try {
      const response = await this.fetchWithAuth("/transactions");
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const serverTransactions = await response.json();

      // Map server transactions to local format
      const localTransactions: OfflineTransaction[] = serverTransactions.map(
        (tx: any) => ({
          id: tx.id, // Use server ID as local ID for synced items
          serverId: tx.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          categoryId: tx.categoryId,
          categoryLabel: tx.categoryLabel,
          date: tx.date,
          source: tx.source || "manual",
          tags: tx.tags || "",
          notes: tx.notes || null,
          synced: true,
          pendingAction: null,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        })
      );

      // Bulk insert/update local database
      await db.bulkInsertTransactions(localTransactions);
      await db.setLastSyncTime(new Date());

      return { count: localTransactions.length };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Pull from server failed:", errorMessage);
      return { count: 0, error: errorMessage };
    }
  }

  // Push local changes to server
  async pushToServer(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Sync already in progress"],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const unsyncedTransactions = await db.getUnsyncedTransactions();

      for (const tx of unsyncedTransactions) {
        try {
          await this.syncTransaction(tx);
          result.syncedCount++;
        } catch (error) {
          result.failedCount++;
          result.errors.push(
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }

      // Process sync queue
      await this.processSyncQueue(result);

      result.success = result.failedCount === 0;

      if (result.success) {
        await db.setLastSyncTime(new Date());
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncTransaction(tx: OfflineTransaction): Promise<void> {
    switch (tx.pendingAction) {
      case "create":
        await this.createTransactionOnServer(tx);
        break;
      case "update":
        await this.updateTransactionOnServer(tx);
        break;
      case "delete":
        await this.deleteTransactionOnServer(tx);
        break;
      default:
        // No pending action, just mark as synced
        if (!tx.synced && tx.serverId) {
          await db.markTransactionAsSynced(tx.id, tx.serverId);
        }
    }
  }

  private async createTransactionOnServer(
    tx: OfflineTransaction
  ): Promise<void> {
    const response = await this.fetchWithAuth("/transactions", {
      method: "POST",
      body: JSON.stringify({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        categoryLabel: tx.categoryLabel,
        date: tx.date,
        source: tx.source,
        tags: tx.tags,
        notes: tx.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.status}`);
    }

    const serverTx = await response.json();
    await db.markTransactionAsSynced(tx.id, serverTx.id);
  }

  private async updateTransactionOnServer(
    tx: OfflineTransaction
  ): Promise<void> {
    if (!tx.serverId) {
      throw new Error("Cannot update transaction without server ID");
    }

    const response = await this.fetchWithAuth(`/transactions/${tx.serverId}`, {
      method: "PATCH",
      body: JSON.stringify({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        categoryLabel: tx.categoryLabel,
        date: tx.date,
        tags: tx.tags,
        notes: tx.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.status}`);
    }

    await db.markTransactionAsSynced(tx.id, tx.serverId);
  }

  private async deleteTransactionOnServer(
    tx: OfflineTransaction
  ): Promise<void> {
    if (!tx.serverId) {
      // If no server ID, just delete locally
      await db.deleteTransaction(tx.id);
      return;
    }

    const response = await this.fetchWithAuth(`/transactions/${tx.serverId}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete transaction: ${response.status}`);
    }

    await db.deleteTransaction(tx.id);
  }

  private async processSyncQueue(result: SyncResult): Promise<void> {
    const queue = await db.getSyncQueue();

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRY_COUNT) {
        // Skip items that have exceeded retry limit
        continue;
      }

      try {
        await this.processSyncQueueItem(item);
        await db.removeSyncQueueItem(item.id);
        result.syncedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await db.updateSyncQueueItemError(item.id, errorMessage);
        result.failedCount++;
        result.errors.push(`Queue item ${item.id}: ${errorMessage}`);
      }
    }
  }

  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.entityType) {
      case "transaction":
        switch (item.action) {
          case "create":
            await this.fetchWithAuth("/transactions", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            break;
          case "update":
            await this.fetchWithAuth(`/transactions/${item.entityId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
            break;
          case "delete":
            await this.fetchWithAuth(`/transactions/${item.entityId}`, {
              method: "DELETE",
            });
            break;
        }
        break;
      // Add more entity types as needed
      default:
        console.warn(`Unknown entity type: ${item.entityType}`);
    }
  }

  // Full sync: pull then push
  async fullSync(): Promise<SyncResult> {
    const pullResult = await this.pullFromServer();

    if (pullResult.error) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [pullResult.error],
      };
    }

    const pushResult = await this.pushToServer();
    return {
      ...pushResult,
      syncedCount: pullResult.count + pushResult.syncedCount,
    };
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

export function getSyncService(
  apiUrl: string,
  token: string | null
): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(apiUrl, token);
  } else {
    syncServiceInstance.setToken(token);
  }
  return syncServiceInstance;
}
