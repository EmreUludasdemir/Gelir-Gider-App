'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ApiError, getApiErrorMessage } from '@/lib/api'

interface DashboardErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }, [error])

  const requestId =
    (ApiError.isApiError(error) && error.requestId) ||
    error.requestId ||
    undefined

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-soft px-4 py-10">
      <div className="rounded-3xl border border-border/70 bg-card/85 p-8 shadow-[0_24px_48px_rgba(15,76,92,0.12)]">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-2xl font-display font-semibold text-foreground">
          Dashboard verisi yuklenemedi
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {getApiErrorMessage(error, 'Dashboard gecici olarak kullanilamiyor.')}
        </p>
        {requestId && (
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Request ID: {requestId}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Yeniden yukle
        </button>
      </div>
    </div>
  )
}
