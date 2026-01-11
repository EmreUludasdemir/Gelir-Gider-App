'use client';

import { useOffline, useServiceWorker } from '@/hooks/useOffline';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { online, pendingCount } = useOffline();
  const { updateAvailable, skipWaiting } = useServiceWorker();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show indicator when offline or has pending items
    setShow(!online || pendingCount > 0);
  }, [online, pendingCount]);

  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-primary text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
        <span className="text-sm">Yeni gÃ¼ncelleme mevcut!</span>
        <button
          onClick={skipWaiting}
          className="bg-card/20 hover:bg-card/30 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          GÃ¼ncelle
        </button>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up ${
        online ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-700 text-white'
      }`}
    >
      {!online ? (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <span className="text-sm font-medium">Ã‡evrimdÄ±ÅŸÄ±sÄ±nÄ±z</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-sm font-medium">
            {pendingCount} iÅŸlem bekliyor...
          </span>
        </>
      )}
    </div>
  );
}

export function OfflineBanner() {
  const { online, pendingCount, syncPendingTransactions } = useOffline();

  if (online && pendingCount === 0) return null;

  return (
    <div
      className={`w-full px-4 py-2 text-sm text-center ${
        online ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-800 text-white'
      }`}
    >
      {!online ? (
        <span>
          ğŸ“¡ Ã‡evrimdÄ±ÅŸÄ± moddasÄ±nÄ±z. Ä°ÅŸlemleriniz baÄŸlantÄ± geldiÄŸinde
          senkronize edilecek.
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span>{pendingCount} iÅŸlem senkronize ediliyor...</span>
          <button
            onClick={syncPendingTransactions}
            className="underline hover:no-underline"
          >
            Åimdi Senkronize Et
          </button>
        </span>
      )}
    </div>
  );
}


