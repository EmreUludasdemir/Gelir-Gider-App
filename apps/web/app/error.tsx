'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ApiError, getApiErrorMessage } from '@/lib/api'

interface AppErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: AppErrorProps) {
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
    <html>
      <body>
        <main className="min-h-screen bg-background px-4 py-12">
          <div className="mx-auto flex max-w-xl animate-fade-in-soft flex-col rounded-3xl border border-border/70 bg-card/85 p-8 shadow-[0_24px_48px_rgba(15,76,92,0.12)]">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-6 text-3xl font-display font-semibold text-foreground">
              Bir hata oluştu
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getApiErrorMessage(error, 'Sayfa beklenmeyen bir hata nedeniyle yüklenemedi.')}
            </p>
            {requestId && (
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Request ID: {requestId}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Tekrar dene
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Dashboard'a don
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
