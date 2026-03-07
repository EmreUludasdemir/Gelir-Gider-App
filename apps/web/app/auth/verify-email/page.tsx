'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/api-base'

type VerifyState = 'idle' | 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState<VerifyState>('idle')
  const [message, setMessage] = useState('')

  const hasToken = useMemo(() => token.length > 0, [token])

  useEffect(() => {
    const verify = async () => {
      if (!hasToken) {
        setState('error')
        setMessage('Dogrulama baglantisi gecersiz.')
        return
      }

      setState('loading')

      try {
        const apiBase = getApiBaseUrl()
        const res = await fetch(`${apiBase}/auth/email-verification/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          throw new Error('Verify failed')
        }

        const data = await res.json().catch(() => ({}))
        setState('success')
        setMessage(data.message || 'E-posta dogrulama tamamlandi.')
      } catch {
        setState('error')
        setMessage('Dogrulama baglantisi gecersiz veya suresi dolmus olabilir.')
      }
    }

    verify()
  }, [hasToken, token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_16px_40px_rgba(15,76,92,0.12)] backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-foreground">E-posta Dogrulama</h1>

        {state === 'loading' && (
          <p className="mt-4 text-sm text-muted-foreground">Dogrulama yapiliyor...</p>
        )}

        {state === 'success' && (
          <div className="mt-6 space-y-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success font-medium">{message}</p>
            <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary/80">
              Giris ekranina git
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6 space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{message}</p>
            <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary/80">
              Giris ekranina don
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
