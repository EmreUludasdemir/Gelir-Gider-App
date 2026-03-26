'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { getRealtimeBaseUrl } from '@/lib/api-base';

interface RealtimeConfig {
  enabled: boolean;
  token?: string | null;
  showToasts?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTransactionCreated?: (data: TransactionEvent) => void;
  onTransactionUpdated?: (data: TransactionEvent) => void;
  onTransactionDeleted?: (data: { id: string }) => void;
  onTransactionNeedsReview?: (data: ReviewEvent) => void;
  onBudgetAlert?: (data: BudgetAlert) => void;
  onBudgetUpdated?: (data: BudgetUpdate) => void;
  onBillReminder?: (data: BillReminder) => void;
  onSavingsMilestone?: (data: SavingsMilestone) => void;
  onSavingsUpdated?: (data: SavingsUpdate) => void;
  onSyncCompleted?: (data: SyncResult) => void;
  onHouseholdUpdated?: (data: HouseholdEvent) => void;
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

interface ReviewEvent {
  transactionId: string;
  householdId?: string;
  ownerUserId?: string;
  reviewerUserId?: string;
  needsReview: boolean;
}

interface HouseholdEvent {
  householdId: string;
  event: string;
  [key: string]: unknown;
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
    if (!config.enabled) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setError(null);
      return;
    }

    const apiUrl = getRealtimeBaseUrl();
    const socket = io(`${apiUrl}/realtime`, {
      auth: config.token ? { token: config.token } : undefined,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

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

    const showToasts = config.showToasts ?? true;

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(amount);
    };

    socket.on('transaction:created', (message: RealtimeMessage<TransactionEvent>) => {
      config.onTransactionCreated?.(message.data);
      if (showToasts) {
        const { data } = message;
        toast.success(
          data.type === 'income' ? 'Yeni Gelir Eklendi' : 'Yeni Gider Eklendi',
          { description: `${data.description}: ${formatAmount(data.amount)}` }
        );
      }
    });

    socket.on('transaction:updated', (message: RealtimeMessage<TransactionEvent>) => {
      config.onTransactionUpdated?.(message.data);
      if (showToasts) {
        toast.info('Islem Guncellendi', {
          description: message.data.description,
        });
      }
    });

    socket.on('transaction:deleted', (message: RealtimeMessage<{ id: string }>) => {
      config.onTransactionDeleted?.(message.data);
      if (showToasts) {
        toast.info('Islem Silindi');
      }
    });

    socket.on('transaction:needs-review', (message: RealtimeMessage<ReviewEvent>) => {
      config.onTransactionNeedsReview?.(message.data);
      if (showToasts) {
        toast.warning('Islem inceleme bekliyor', {
          description: 'Household review gerektiren yeni bir islem geldi.',
        });
      }
    });

    socket.on('budget:alert', (message: RealtimeMessage<BudgetAlert>) => {
      config.onBudgetAlert?.(message.data);
      if (showToasts) {
        const { data } = message;
        if (data.percentage >= 100) {
          toast.error('Butce Asildi!', {
            description: `${data.categoryName}: ${formatAmount(data.spent)} / ${formatAmount(data.limit)}`,
          });
        } else {
          toast.warning('Butce Uyarisi', {
            description: `${data.categoryName} butcesinin %${Math.round(data.percentage)}'i kullanildi`,
          });
        }
      }
    });

    socket.on('budget:updated', (message: RealtimeMessage<BudgetUpdate>) => {
      config.onBudgetUpdated?.(message.data);
    });

    socket.on('bill:reminder', (message: RealtimeMessage<BillReminder>) => {
      config.onBillReminder?.(message.data);
    });

    socket.on('savings:milestone', (message: RealtimeMessage<SavingsMilestone>) => {
      config.onSavingsMilestone?.(message.data);
    });

    socket.on('savings:updated', (message: RealtimeMessage<SavingsUpdate>) => {
      config.onSavingsUpdated?.(message.data);
    });

    socket.on('sync:completed', (message: RealtimeMessage<SyncResult>) => {
      config.onSyncCompleted?.(message.data);
    });

    socket.on('household:updated', (message: RealtimeMessage<HouseholdEvent>) => {
      config.onHouseholdUpdated?.(message.data);
      if (showToasts) {
        toast.info('Household guncellendi');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [config.enabled, config.onBillReminder, config.onBudgetAlert, config.onBudgetUpdated, config.onConnect, config.onDisconnect, config.onHouseholdUpdated, config.onSavingsMilestone, config.onSavingsUpdated, config.onSyncCompleted, config.onTransactionCreated, config.onTransactionDeleted, config.onTransactionNeedsReview, config.onTransactionUpdated, config.showToasts, config.token]);

  const subscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('subscribe', { channels });
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('unsubscribe', { channels });
  }, []);

  const ping = useCallback(() => {
    return new Promise<number>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Realtime socket is not connected'));
        return;
      }

      const start = Date.now();
      socketRef.current.emit('ping', {}, () => {
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

export function useRealtimeStatus(enabled: boolean, token?: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const apiUrl = getRealtimeBaseUrl();
    const socket = io(`${apiUrl}/realtime`, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [enabled, token]);

  return isConnected;
}
