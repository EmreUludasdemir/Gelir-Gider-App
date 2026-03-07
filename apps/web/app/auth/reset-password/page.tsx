'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api-base'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const hasToken = token.length > 0

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const passwordsMatch = useMemo(
    () => confirmPassword.length === 0 || password === confirmPassword,
    [password, confirmPassword]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!hasToken) {
      setError('Gecersiz sifirlama baglantisi.')
      return
    }

    if (!passwordsMatch) {
      setError('Sifreler eslesmiyor.')
      return
    }

    setLoading(true)

    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      if (!res.ok) {
        throw new Error('Reset failed')
      }

      setDone(true)
    } catch {
      setError('Sifre sifirlama basarisiz. Baglanti suresi dolmus olabilir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_16px_40px_rgba(15,76,92,0.12)] backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-foreground">Yeni Sifre Belirle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guvenli bir sifre sec ve hesaba tekrar giris yap.
        </p>

        {!hasToken ? (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">Gecersiz baglanti. Sifre sifirlama talebini tekrar olustur.</p>
          </div>
        ) : done ? (
          <div className="mt-6 space-y-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success font-medium">Sifre basariyla guncellendi.</p>
            <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary/80">
              Giris ekranina don
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Yeni Sifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Yeni Sifre (Tekrar)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-2 text-sm text-destructive">Sifreler eslesmiyor.</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="btn-premium w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guncelleniyor...' : 'Sifreyi Guncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
