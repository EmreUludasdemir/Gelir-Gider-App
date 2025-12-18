import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as db from '@/lib/database';
import { SyncService, getSyncService, SyncResult } from '@/lib/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineTransaction } from '@/lib/database';

const API_URL = 'http://192.168.1.100:3001'; // Same as AuthContext

interface OfflineContextType {
    isOffline: boolean;
    isInitialized: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: Date | null;
    transactions: OfflineTransaction[];

    // Actions
    refreshTransactions: () => Promise<void>;
    addTransaction: (transaction: Omit<OfflineTransaction, 'id' | 'createdAt' | 'updatedAt' | 'serverId' | 'synced' | 'pendingAction'>) => Promise<string>;
    updateTransaction: (id: string, updates: Partial<OfflineTransaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    syncNow: () => Promise<SyncResult>;
    clearLocalData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
    children: ReactNode;
    token: string | null;
}

export function OfflineProvider({ children, token }: OfflineProviderProps) {
    const { isOnline } = useNetworkStatus();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
    const [syncService, setSyncService] = useState<SyncService | null>(null);

    // Initialize database and sync service
    useEffect(() => {
        const initialize = async () => {
            try {
                await db.getDatabase();
                setSyncService(getSyncService(API_URL, token));
                await loadLocalData();
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize offline database:', error);
            }
        };
        initialize();
    }, []);

    // Update sync service token when it changes
    useEffect(() => {
        if (syncService) {
            syncService.setToken(token);
        }
    }, [token, syncService]);

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline && isInitialized && pendingCount > 0 && !isSyncing) {
            syncNow();
        }
    }, [isOnline, isInitialized, pendingCount]);

    const loadLocalData = useCallback(async () => {
        try {
            const [txs, pending, lastSync] = await Promise.all([
                db.getAllTransactions(),
                db.getSyncQueueCount(),
                db.getLastSyncTime(),
            ]);
            setTransactions(txs);
            setPendingCount(pending + txs.filter(t => !t.synced).length);
            setLastSyncTime(lastSync);
        } catch (error) {
            console.error('Failed to load local data:', error);
        }
    }, []);

    const refreshTransactions = useCallback(async () => {
        await loadLocalData();
    }, [loadLocalData]);

    const addTransaction = useCallback(async (
        transaction: Omit<OfflineTransaction, 'id' | 'createdAt' | 'updatedAt' | 'serverId' | 'synced' | 'pendingAction'>
    ): Promise<string> => {
        const id = await db.insertTransaction({
            ...transaction,
            serverId: null,
            synced: false,
            pendingAction: 'create',
        });

        await loadLocalData();
        return id;
    }, [loadLocalData]);

    const updateTransaction = useCallback(async (id: string, updates: Partial<OfflineTransaction>) => {
        const existing = await db.getTransactionById(id);
        if (!existing) {
            throw new Error('Transaction not found');
        }

        await db.updateTransaction(id, {
            ...updates,
            synced: false,
            pendingAction: existing.serverId ? 'update' : 'create',
        });

        await loadLocalData();
    }, [loadLocalData]);

    const deleteTransaction = useCallback(async (id: string) => {
        const existing = await db.getTransactionById(id);
        if (!existing) {
            throw new Error('Transaction not found');
        }

        if (existing.serverId) {
            // Mark for deletion (will be synced)
            await db.markTransactionForDeletion(id);
        } else {
            // Not synced yet, just delete locally
            await db.deleteTransaction(id);
        }

        await loadLocalData();
    }, [loadLocalData]);

    const syncNow = useCallback(async (): Promise<SyncResult> => {
        if (!syncService || !token) {
            return {
                success: false,
                syncedCount: 0,
                failedCount: 0,
                errors: ['Not authenticated'],
            };
        }

        if (isSyncing) {
            return {
                success: false,
                syncedCount: 0,
                failedCount: 0,
                errors: ['Sync already in progress'],
            };
        }

        setIsSyncing(true);
        try {
            const result = await syncService.fullSync();
            await loadLocalData();
            return result;
        } finally {
            setIsSyncing(false);
        }
    }, [syncService, token, isSyncing, loadLocalData]);

    const clearLocalData = useCallback(async () => {
        await db.clearAllData();
        await loadLocalData();
    }, [loadLocalData]);

    return (
        <OfflineContext.Provider
            value={{
                isOffline: !isOnline,
                isInitialized,
                isSyncing,
                pendingCount,
                lastSyncTime,
                transactions,
                refreshTransactions,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                syncNow,
                clearLocalData,
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
