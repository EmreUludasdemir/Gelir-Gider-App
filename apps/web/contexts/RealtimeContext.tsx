'use client';

import { createContext, useContext, useCallback, ReactNode, useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';

interface TransactionEvent {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryLabel: string;
}

interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  error: string | null;
  lastTransactionEvent: TransactionEvent | null;
  lastBudgetAlert: BudgetAlert | null;
  refreshTrigger: number;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  error: null,
  lastTransactionEvent: null,
  lastBudgetAlert: null,
  refreshTrigger: 0,
  subscribe: () => {},
  unsubscribe: () => {},
});

export const useRealtimeContext = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { isAuthenticated } = useAuth();
  const [lastTransactionEvent, setLastTransactionEvent] = useState<TransactionEvent | null>(null);
  const [lastBudgetAlert, setLastBudgetAlert] = useState<BudgetAlert | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleTransactionCreated = useCallback((data: TransactionEvent) => {
    setLastTransactionEvent(data);
    triggerRefresh();
  }, [triggerRefresh]);

  const handleTransactionUpdated = useCallback((data: TransactionEvent) => {
    setLastTransactionEvent(data);
    triggerRefresh();
  }, [triggerRefresh]);

  const handleTransactionDeleted = useCallback(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  const handleBudgetAlert = useCallback((data: BudgetAlert) => {
    setLastBudgetAlert(data);
  }, []);

  const handleBudgetUpdated = useCallback(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  const handleSavingsUpdated = useCallback(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  const handleSavingsMilestone = useCallback((data: { name: string; percentage: number }) => {
    toast.success('Tasarruf Hedefinde Yeni Adim!', {
      description: `"${data.name}" hedefinde %${Math.round(data.percentage)} tamamlandi`,
    });
    triggerRefresh();
  }, [triggerRefresh]);

  const handleSyncCompleted = useCallback((data: { source: string; imported: number }) => {
    toast.success('Senkronizasyon Tamamlandi', {
      description: `${data.source}: ${data.imported} islem aktarildi`,
    });
    triggerRefresh();
  }, [triggerRefresh]);

  const { isConnected, error, subscribe, unsubscribe } = useRealtime({
    enabled: isAuthenticated,
    showToasts: true,
    onTransactionCreated: handleTransactionCreated,
    onTransactionUpdated: handleTransactionUpdated,
    onTransactionDeleted: handleTransactionDeleted,
    onBudgetAlert: handleBudgetAlert,
    onBudgetUpdated: handleBudgetUpdated,
    onSavingsUpdated: handleSavingsUpdated,
    onSavingsMilestone: handleSavingsMilestone,
    onSyncCompleted: handleSyncCompleted,
  });

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        error,
        lastTransactionEvent,
        lastBudgetAlert,
        refreshTrigger,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeRefresh(callback: () => void, deps: unknown[] = []) {
  const { refreshTrigger } = useRealtimeContext();

  useEffect(() => {
    if (refreshTrigger > 0) {
      callback();
    }
  }, [refreshTrigger, ...deps]);
}
