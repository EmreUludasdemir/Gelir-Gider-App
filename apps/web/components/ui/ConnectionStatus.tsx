'use client';

import { useRealtimeContext } from '@/contexts/RealtimeContext';

export function ConnectionStatus() {
  const { isConnected, error } = useRealtimeContext();

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm" title={`Hata: ${error}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="hidden sm:inline">Baglanti hatasi</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-yellow-500 text-sm" title="Baglaniyor...">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
        </span>
        <span className="hidden sm:inline">Baglaniyor</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-500 text-sm" title="Canli baglanti aktif">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-pulse" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="hidden sm:inline">Canli</span>
    </div>
  );
}

// Mini version for tight spaces
export function ConnectionStatusDot() {
  const { isConnected, error } = useRealtimeContext();

  const color = error ? 'bg-red-500' : isConnected ? 'bg-green-500' : 'bg-yellow-500';
  const title = error ? `Hata: ${error}` : isConnected ? 'Canli baglanti aktif' : 'Baglaniyor...';
  const pulseClass = !isConnected && !error ? 'animate-ping' : isConnected ? 'animate-pulse' : '';

  return (
    <span className="relative flex h-2 w-2" title={title}>
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 ${pulseClass}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}
