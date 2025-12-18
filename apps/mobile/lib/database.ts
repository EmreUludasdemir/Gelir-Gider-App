import * as SQLite from "expo-sqlite";

// Types
export interface OfflineTransaction {
  id: string;
  serverId: string | null;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  categoryLabel: string;
  date: string;
  source: string;
  tags: string;
  notes: string | null;
  synced: boolean;
  pendingAction: "create" | "update" | "delete" | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: number;
  action: "create" | "update" | "delete";
  entityType: "transaction" | "budget" | "goal";
  entityId: string;
  payload: string; // JSON string
  createdAt: string;
  retryCount: number;
  lastError: string | null;
}

export interface UserCache {
  key: string;
  value: string;
}

// Database singleton
let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("gelir_gider_offline.db");
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  // Create transactions table
  await database.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            serverId TEXT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            categoryId TEXT NOT NULL,
            categoryLabel TEXT NOT NULL,
            date TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'manual',
            tags TEXT DEFAULT '',
            notes TEXT,
            synced INTEGER NOT NULL DEFAULT 0,
            pendingAction TEXT CHECK(pendingAction IN ('create', 'update', 'delete', NULL)),
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_pendingAction ON transactions(pendingAction);
    `);

  // Create sync queue table
  await database.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
            entityType TEXT NOT NULL,
            entityId TEXT NOT NULL,
            payload TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            retryCount INTEGER NOT NULL DEFAULT 0,
            lastError TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sync_queue_entityType ON sync_queue(entityType);
    `);

  // Create user cache table
  await database.execAsync(`
        CREATE TABLE IF NOT EXISTS user_cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

  // Create last sync timestamp table
  await database.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
}

// ============ Transaction CRUD Operations ============

export async function getAllTransactions(): Promise<OfflineTransaction[]> {
  const database = await getDatabase();
  const results = await database.getAllAsync<any>(
    `SELECT * FROM transactions WHERE pendingAction != 'delete' OR pendingAction IS NULL ORDER BY date DESC`
  );
  return results.map(mapDbToTransaction);
}

export async function getTransactionById(
  id: string
): Promise<OfflineTransaction | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<any>(
    `SELECT * FROM transactions WHERE id = ?`,
    [id]
  );
  return result ? mapDbToTransaction(result) : null;
}

export async function insertTransaction(
  transaction: Omit<OfflineTransaction, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const database = await getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO transactions (id, serverId, description, amount, type, categoryId, categoryLabel, date, source, tags, notes, synced, pendingAction, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      transaction.serverId,
      transaction.description,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
      transaction.categoryLabel,
      transaction.date,
      transaction.source,
      transaction.tags,
      transaction.notes,
      transaction.synced ? 1 : 0,
      transaction.pendingAction,
      now,
      now,
    ]
  );

  return id;
}

export async function updateTransaction(
  id: string,
  updates: Partial<OfflineTransaction>
): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "id" && key !== "createdAt") {
      setClauses.push(`${key} = ?`);
      values.push(key === "synced" ? (value ? 1 : 0) : value);
    }
  });

  setClauses.push("updatedAt = ?");
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE transactions SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
}

export async function markTransactionForDeletion(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE transactions SET pendingAction = 'delete', synced = 0, updatedAt = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

export async function getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
  const database = await getDatabase();
  const results = await database.getAllAsync<any>(
    `SELECT * FROM transactions WHERE synced = 0`
  );
  return results.map(mapDbToTransaction);
}

export async function markTransactionAsSynced(
  id: string,
  serverId: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE transactions SET synced = 1, serverId = ?, pendingAction = NULL, updatedAt = ? WHERE id = ?`,
    [serverId, new Date().toISOString(), id]
  );
}

// ============ Sync Queue Operations ============

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount" | "lastError">
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO sync_queue (action, entityType, entityId, payload) VALUES (?, ?, ?, ?)`,
    [item.action, item.entityType, item.entityId, item.payload]
  );
  return result.lastInsertRowId;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = await getDatabase();
  return database.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue ORDER BY createdAt ASC`
  );
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

export async function updateSyncQueueItemError(
  id: number,
  error: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE sync_queue SET retryCount = retryCount + 1, lastError = ? WHERE id = ?`,
    [error, id]
  );
}

export async function getSyncQueueCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue`
  );
  return result?.count || 0;
}

// ============ User Cache Operations ============

export async function getCacheValue(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<UserCache>(
    `SELECT value FROM user_cache WHERE key = ?`,
    [key]
  );
  return result?.value || null;
}

export async function setCacheValue(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO user_cache (key, value, updatedAt) VALUES (?, ?, ?)`,
    [key, value, new Date().toISOString()]
  );
}

export async function deleteCacheValue(key: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM user_cache WHERE key = ?`, [key]);
}

// ============ Sync Metadata Operations ============

export async function getLastSyncTime(): Promise<Date | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_metadata WHERE key = 'lastSyncTime'`
  );
  return result ? new Date(result.value) : null;
}

export async function setLastSyncTime(date: Date): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('lastSyncTime', ?)`,
    [date.toISOString()]
  );
}

// ============ Bulk Operations ============

export async function bulkInsertTransactions(
  transactions: OfflineTransaction[]
): Promise<void> {
  const database = await getDatabase();

  await database.execAsync("BEGIN TRANSACTION");
  try {
    for (const tx of transactions) {
      await database.runAsync(
        `INSERT OR REPLACE INTO transactions (id, serverId, description, amount, type, categoryId, categoryLabel, date, source, tags, notes, synced, pendingAction, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.serverId,
          tx.description,
          tx.amount,
          tx.type,
          tx.categoryId,
          tx.categoryLabel,
          tx.date,
          tx.source,
          tx.tags,
          tx.notes,
          tx.synced ? 1 : 0,
          tx.pendingAction,
          tx.createdAt,
          tx.updatedAt,
        ]
      );
    }
    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK");
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
        DELETE FROM transactions;
        DELETE FROM sync_queue;
        DELETE FROM user_cache;
        DELETE FROM sync_metadata;
    `);
}

// ============ Helper Functions ============

function mapDbToTransaction(row: any): OfflineTransaction {
  return {
    id: row.id,
    serverId: row.serverId,
    description: row.description,
    amount: row.amount,
    type: row.type,
    categoryId: row.categoryId,
    categoryLabel: row.categoryLabel,
    date: row.date,
    source: row.source,
    tags: row.tags || "",
    notes: row.notes,
    synced: row.synced === 1,
    pendingAction: row.pendingAction,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
