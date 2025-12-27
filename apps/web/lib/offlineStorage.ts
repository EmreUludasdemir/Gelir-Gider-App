/**
 * IndexedDB wrapper for offline data storage
 */

const DB_NAME = 'GelirGiderDB';
const DB_VERSION = 2;

interface OfflineTransaction {
  id?: number;
  data: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: string;
    date: string;
  };
  createdAt: string;
  synced: boolean;
}

interface CacheEntry<T> {
  key: string;
  data: T;
  expiry: number;
}

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Pending transactions store
      if (!db.objectStoreNames.contains('pending-transactions')) {
        db.createObjectStore('pending-transactions', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }

      // Transactions cache for offline viewing
      if (!db.objectStoreNames.contains('transactions-cache')) {
        const txStore = db.createObjectStore('transactions-cache', {
          keyPath: 'id',
        });
        txStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
}

// ==================== Pending Transactions ====================

export async function savePendingTransaction(
  transaction: OfflineTransaction['data']
): Promise<number> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readwrite');
    const store = tx.objectStore('pending-transactions');

    const request = store.add({
      data: transaction,
      createdAt: new Date().toISOString(),
      synced: false,
    });

    request.onsuccess = () => {
      // Request background sync if available
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as any).sync.register('sync-transactions');
        });
      }
      resolve(request.result as number);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPendingTransactions(): Promise<OfflineTransaction[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readonly');
    const store = tx.objectStore('pending-transactions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingTransaction(id: number): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readwrite');
    const store = tx.objectStore('pending-transactions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readonly');
    const store = tx.objectStore('pending-transactions');
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Cache ====================

export async function cacheData<T>(
  key: string,
  data: T,
  ttlMs: number = 3600000 // 1 hour default
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');

    const request = store.put({
      key,
      data,
      expiry: Date.now() + ttlMs,
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as CacheEntry<T> | undefined;

      if (!result) {
        resolve(null);
        return;
      }

      // Check if expired
      if (result.expiry < Date.now()) {
        // Delete expired entry
        clearCacheEntry(key);
        resolve(null);
        return;
      }

      resolve(result.data);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function clearCacheEntry(key: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearExpiredCache(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('expiry');
    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// ==================== Transactions Cache ====================

export async function cacheTransactions(transactions: any[]): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions-cache', 'readwrite');
    const store = tx.objectStore('transactions-cache');

    // Clear existing and add new
    store.clear();

    for (const transaction of transactions) {
      store.put(transaction);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedTransactions(): Promise<any[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions-cache', 'readonly');
    const store = tx.objectStore('transactions-cache');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Utilities ====================

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
