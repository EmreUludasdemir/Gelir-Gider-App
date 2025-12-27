'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  onOnlineStatusChange,
  savePendingTransaction,
  getPendingTransactions,
  getPendingCount,
  cacheData,
  getCachedData,
  cacheTransactions,
  getCachedTransactions,
  initDB,
} from '@/lib/offlineStorage';

interface UseOfflineOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOffline(options: UseOfflineOptions = {}) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize
    setOnline(isOnline());

    // Init IndexedDB
    initDB()
      .then(() => {
        setIsReady(true);
        refreshPendingCount();
      })
      .catch(console.error);

    // Listen for online/offline events
    const cleanup = onOnlineStatusChange((status) => {
      setOnline(status);

      if (status) {
        options.onOnline?.();
        // Trigger sync when back online
        syncPendingTransactions();
      } else {
        options.onOffline?.();
      }
    });

    return cleanup;
  }, [options.onOnline, options.onOffline]);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  const saveOfflineTransaction = useCallback(
    async (transaction: {
      description: string;
      amount: number;
      type: 'income' | 'expense';
      categoryId: string;
      date: string;
    }) => {
      await savePendingTransaction(transaction);
      await refreshPendingCount();
    },
    [refreshPendingCount]
  );

  const syncPendingTransactions = useCallback(async () => {
    if (!isOnline()) return;

    const pending = await getPendingTransactions();
    if (pending.length === 0) return;

    // Trigger service worker sync
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-transactions');
    }

    await refreshPendingCount();
  }, [refreshPendingCount]);

  return {
    online,
    pendingCount,
    isReady,
    saveOfflineTransaction,
    syncPendingTransactions,
    refreshPendingCount,
    // Cache utilities
    cacheData,
    getCachedData,
    cacheTransactions,
    getCachedTransactions,
  };
}

// Hook for service worker registration
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setIsRegistered(true);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  }, []);

  const update = useCallback(() => {
    if (registration) {
      registration.update();
    }
  }, [registration]);

  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    isRegistered,
    registration,
    updateAvailable,
    update,
    skipWaiting,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    setPermission(Notification.permission);

    // Check existing subscription
    navigator.serviceWorker?.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
      });
    });
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    setSubscription(sub);
    return sub;
  }, [permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
