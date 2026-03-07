'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api-base'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/auth/email-verification/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error('Request failed')
      }

      setSubmitted(true)
    } catch {
      setError('Istek gonderilemedi. Lutfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_16px_40px_rgba(15,76,92,0.12)] backdrop-blur-sm">
        <div className="mb-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            E-posta Dogrulama
          </p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Dogrulama Linkini Yeniden Gonder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eger hesap varsa, dogrulama e-postasini tekrar gonderecegiz.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success font-medium">
              Talep alindi. Guvenlik nedeniyle hesap var/yok bilgisi paylasilmiyor.
            </p>
            <p className="text-sm text-muted-foreground">
              E-posta kutunu ve spam klasorunu kontrol et: <span className="font-semibold text-foreground">{email}</span>
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Giris ekranina don
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              E-posta
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="ornek@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-3"
            >
              {loading ? 'Gonderiliyor...' : 'Dogrulama E-postasi Gonder'}
            </button>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Girise geri don
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
