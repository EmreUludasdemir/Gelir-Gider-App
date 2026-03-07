'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, ShieldCheck, Check } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { getApiBaseUrl } from '@/lib/api-base'

type PasswordCheck = {
  minLength: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

function evaluatePassword(password: string): PasswordCheck {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const checks = useMemo(() => evaluatePassword(password), [password])
  const strengthScore = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  )
  const passwordStrongEnough = strengthScore >= 4

  const strengthLabel = useMemo(() => {
    if (!password) return 'Bos'
    if (strengthScore <= 2) return 'Zayif'
    if (strengthScore <= 4) return 'Orta'
    return 'Guclu'
  }, [password, strengthScore])

  const strengthColor = useMemo(() => {
    if (!password) return 'bg-muted'
    if (strengthScore <= 2) return 'bg-destructive'
    if (strengthScore <= 4) return 'bg-warning'
    return 'bg-success'
  }, [password, strengthScore])

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!passwordStrongEnough) {
      setError('Sifre gucu dusuk. En az 8 karakter, buyuk-kucuk harf, rakam ve ozel karakter kullanin.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Sifreler eslesmiyor.')
      setLoading(false)
      return
    }

    try {
      const apiBase = getApiBaseUrl()

      const registerRes = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}))
        throw new Error(data.message || 'Kayit basarisiz')
      }

      const loginRes = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!loginRes.ok) {
        router.push('/auth/login')
        return
      }

      const loginData = await loginRes.json()
      const token = loginData.accessToken || loginData.access_token
      if (!token) {
        throw new Error('Eksik token')
      }
      login(token, loginData.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayit basarisiz. Tekrar deneyin.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const rules = [
    { label: 'En az 8 karakter', ok: checks.minLength },
    { label: 'Buyuk harf', ok: checks.uppercase },
    { label: 'Kucuk harf', ok: checks.lowercase },
    { label: 'Rakam', ok: checks.number },
    { label: 'Ozel karakter (@$!%*?&)', ok: checks.special },
  ]

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-500 to-accent" />
        <div className="absolute top-1/4 -left-8 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-card/20 backdrop-blur-sm flex items-center justify-center mb-6">
              <span className="text-3xl font-display">TL</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Yeni Hesap Olustur</h1>
            <p className="text-xl text-white/80">
              Finans panelini kisisel hedeflerine gore sekillendir.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm">Guvenli kimlik dogrulama ve sifre kurallari</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Check className="h-5 w-5" />
              <p className="text-sm">Kayit sonrasi otomatik giris</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <span className="text-2xl text-white font-display">TL</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Gelir-Gider Takip</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Kayit Ol</h2>
            <p className="mt-2 text-muted-foreground">Dakikalar icinde hesabini ac ve basla.</p>
            <p className="mt-1 text-xs text-muted-foreground">Kayit sonrasinda e-posta dogrulama baglantisi gonderilir.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Ad Soyad"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Sifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
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

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sifre gucu</span>
                  <span className="font-medium text-foreground">{strengthLabel}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Sifre Tekrar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-12 pr-12 py-3 bg-muted/50 border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    passwordsMatch ? 'border-border' : 'border-destructive/50'
                  }`}
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

            <div className="rounded-xl border border-border bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Sifre Kurallari
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rules.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-xs inline-flex items-center gap-2 ${rule.ok ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${rule.ok ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                    {rule.label}
                  </p>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordsMatch || !passwordStrongEnough}
              className="btn-premium w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Hesap olusturuluyor...'
              ) : (
                <>
                  Hesap Olustur
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Zaten hesabin var mi? </span>
              <Link href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Giris Yap
              </Link>
            </div>

            <div className="text-center text-xs">
              <span className="text-muted-foreground">Dogrulama e-postasi gelmedi mi? </span>
              <Link href="/auth/resend-verification" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Tekrar gonder
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
