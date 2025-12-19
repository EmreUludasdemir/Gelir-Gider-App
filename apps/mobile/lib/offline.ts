import * as SQLite from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
interface PendingOperation {
  id: string;
  type: "create" | "update" | "delete";
  entity: "transaction" | "savingsGoal" | "budget";
  data: any;
  timestamp: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

// Database setup
const DB_NAME = "gelir_gider_offline.db";

class OfflineService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isOnline: boolean = true;
  private pendingQueue: PendingOperation[] = [];

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);

    // Create tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        accountId TEXT DEFAULT 'default',
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'TRY',
        source TEXT DEFAULT 'manual',
        type TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        categoryLabel TEXT NOT NULL,
        confidence REAL DEFAULT 100,
        tags TEXT DEFAULT '[]',
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS pending_operations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);
    `);

    // Load pending operations
    const pendingRows = await this.db.getAllAsync<any>(
      "SELECT * FROM pending_operations"
    );
    this.pendingQueue = pendingRows.map((row) => ({
      ...row,
      data: JSON.parse(row.data),
    }));

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  // Check if online
  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // Save transaction locally
  async saveTransaction(transaction: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const synced = this.isOnline ? 1 : 0;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO transactions 
       (id, userId, accountId, date, description, amount, currency, source, type, 
        categoryId, categoryLabel, confidence, tags, notes, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.userId,
        transaction.accountId || "default",
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.currency || "TRY",
        transaction.source || "manual",
        transaction.type,
        transaction.categoryId,
        transaction.categoryLabel,
        transaction.confidence || 100,
        JSON.stringify(transaction.tags || []),
        transaction.notes || null,
        transaction.createdAt || new Date().toISOString(),
        transaction.updatedAt || new Date().toISOString(),
        synced,
      ]
    );

    if (!this.isOnline) {
      await this.addPendingOperation("create", "transaction", transaction);
    }
  }

  // Get all local transactions
  async getTransactions(userId: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rows = await this.db.getAllAsync<any>(
      "SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC",
      [userId]
    );

    return rows.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
    }));
  }

  // Delete transaction locally
  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);

    if (!this.isOnline) {
      await this.addPendingOperation("delete", "transaction", { id });
    }
  }

  // Add pending operation
  private async addPendingOperation(
    type: "create" | "update" | "delete",
    entity: "transaction" | "savingsGoal" | "budget",
    data: any
  ): Promise<void> {
    if (!this.db) return;

    const operation: PendingOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
    };

    await this.db.runAsync(
      "INSERT INTO pending_operations (id, type, entity, data, timestamp) VALUES (?, ?, ?, ?, ?)",
      [
        operation.id,
        operation.type,
        operation.entity,
        JSON.stringify(operation.data),
        operation.timestamp,
      ]
    );

    this.pendingQueue.push(operation);
  }

  // Sync pending operations when back online
  async syncPendingOperations(): Promise<SyncResult> {
    if (!this.isOnline || this.pendingQueue.length === 0) {
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    const token = await AsyncStorage.getItem("auth_token");
    if (!token) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ["No auth token"],
      };
    }

    const apiUrl =
      (await AsyncStorage.getItem("api_url")) || "http://localhost:3001";
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const operation of [...this.pendingQueue]) {
      try {
        let endpoint = "";
        let method = "POST";
        let body: any = operation.data;

        switch (operation.entity) {
          case "transaction":
            endpoint = "/transactions";
            if (operation.type === "delete") {
              endpoint = `/transactions/${operation.data.id}`;
              method = "DELETE";
              body = null;
            } else if (operation.type === "update") {
              endpoint = `/transactions/${operation.data.id}`;
              method = "PATCH";
            } else {
              endpoint = "/transactions/manual";
            }
            break;
        }

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          // Remove from pending queue
          await this.removePendingOperation(operation.id);
          synced++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`${operation.entity}/${operation.type}: ${error.message}`);
      }
    }

    return { success: failed === 0, synced, failed, errors };
  }

  private async removePendingOperation(id: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync("DELETE FROM pending_operations WHERE id = ?", [id]);
    this.pendingQueue = this.pendingQueue.filter((op) => op.id !== id);
  }

  // Get pending operations count
  getPendingCount(): number {
    return this.pendingQueue.length;
  }

  // Clear all local data
  async clearLocalData(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM pending_operations;
    `);
    this.pendingQueue = [];
  }

  // Full sync from server
  async fullSync(userId: string, token: string): Promise<void> {
    if (!this.isOnline || !this.db) return;

    const apiUrl =
      (await AsyncStorage.getItem("api_url")) || "http://localhost:3001";

    try {
      const response = await fetch(`${apiUrl}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const transactions = await response.json();

        // Clear local and insert fresh
        await this.db.runAsync("DELETE FROM transactions WHERE userId = ?", [
          userId,
        ]);

        for (const tx of transactions) {
          await this.saveTransaction({ ...tx, synced: 1 });
        }
      }
    } catch (error) {
      console.error("Full sync failed:", error);
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
