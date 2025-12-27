'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealtimeConfig {
  token: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTransactionCreated?: (data: TransactionEvent) => void;
  onTransactionUpdated?: (data: TransactionEvent) => void;
  onTransactionDeleted?: (data: { id: string }) => void;
  onBudgetAlert?: (data: BudgetAlert) => void;
  onBudgetUpdated?: (data: BudgetUpdate) => void;
  onBillReminder?: (data: BillReminder) => void;
  onSavingsMilestone?: (data: SavingsMilestone) => void;
  onSavingsUpdated?: (data: SavingsUpdate) => void;
  onSyncCompleted?: (data: SyncResult) => void;
}

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

interface BudgetUpdate {
  id: string;
  spent: number;
  percentage: number;
}

interface BillReminder {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

interface SavingsMilestone {
  id: string;
  name: string;
  percentage: number;
  currentAmount: number;
  targetAmount: number;
}

interface SavingsUpdate {
  id: string;
  currentAmount: number;
  percentage: number;
}

interface SyncResult {
  source: string;
  imported: number;
  timestamp: string;
}

interface RealtimeMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

export function useRealtime(config: RealtimeConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!config.token) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/realtime`, {
      auth: { token: config.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      config.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      config.onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    // Transaction events
    socket.on('transaction:created', (message: RealtimeMessage<TransactionEvent>) => {
      config.onTransactionCreated?.(message.data);
    });

    socket.on('transaction:updated', (message: RealtimeMessage<TransactionEvent>) => {
      config.onTransactionUpdated?.(message.data);
    });

    socket.on('transaction:deleted', (message: RealtimeMessage<{ id: string }>) => {
      config.onTransactionDeleted?.(message.data);
    });

    // Budget events
    socket.on('budget:alert', (message: RealtimeMessage<BudgetAlert>) => {
      config.onBudgetAlert?.(message.data);
    });

    socket.on('budget:updated', (message: RealtimeMessage<BudgetUpdate>) => {
      config.onBudgetUpdated?.(message.data);
    });

    // Bill events
    socket.on('bill:reminder', (message: RealtimeMessage<BillReminder>) => {
      config.onBillReminder?.(message.data);
    });

    // Savings events
    socket.on('savings:milestone', (message: RealtimeMessage<SavingsMilestone>) => {
      config.onSavingsMilestone?.(message.data);
    });

    socket.on('savings:updated', (message: RealtimeMessage<SavingsUpdate>) => {
      config.onSavingsUpdated?.(message.data);
    });

    // Sync events
    socket.on('sync:completed', (message: RealtimeMessage<SyncResult>) => {
      config.onSyncCompleted?.(message.data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [config.token]);

  const subscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('subscribe', { channels });
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('unsubscribe', { channels });
  }, []);

  const ping = useCallback(() => {
    return new Promise<number>((resolve) => {
      const start = Date.now();
      socketRef.current?.emit('ping', {}, () => {
        resolve(Date.now() - start);
      });
    });
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    ping,
    socket: socketRef.current,
  };
}

// Simpler hook for just connection status
export function useRealtimeStatus(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return isConnected;
}
