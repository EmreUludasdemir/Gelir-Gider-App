'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  EyeOff,
  Layers3,
  Plus,
  Radar,
  Receipt,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react'
import {
  createSubscription,
  deleteSubscription,
  DetectedSubscription,
  submitDetectedSubscriptionFeedback,
  updateSubscription,
} from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import { useSubscriptionSummary } from '@/lib/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { describeSubscriptionReason } from '@/lib/subscription-reasons'
import { formatCurrency, formatDate } from '@/lib/utils'

const CATEGORY_OPTIONS = CATEGORIES.filter((category) => category.type === 'expense' || category.type === 'both').map((category) => ({
  value: category.id,
  label: category.label,
}))

function getConfidenceBadge(score: number) {
  if (score >= 85) {
    return { label: 'Yuksek', tone: 'border-success/25 bg-success/10 text-success' }
  }
  if (score >= 65) {
    return { label: 'Orta', tone: 'border-warning/25 bg-warning/10 text-warning' }
  }
  return { label: 'Dusuk', tone: 'border-destructive/25 bg-destructive/10 text-destructive' }
}

function getFrequencyBadge(frequency: string) {
  if (frequency === 'weekly') {
    return { label: 'Haftalik', tone: 'border-primary/25 bg-primary/10 text-primary' }
  }
  if (frequency === 'yearly') {
    return { label: 'Yillik', tone: 'border-success/25 bg-success/10 text-success' }
  }
  return { label: 'Aylik', tone: 'border-warning/25 bg-warning/10 text-warning' }
}

export default function SubscriptionsPage() {
  const { data, error, isLoading, mutate } = useSubscriptionSummary()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    nextBillingDate: new Date().toISOString().slice(0, 10),
    categoryId: 'subscription',
    notes: '',
  })

  const detectedCount = data?.detectedSuggestions.length || 0
  const activeCount = data?.activeCount || 0

  const monthlyIntensity = useMemo(() => {
    if (!data) return 0
    return data.totalMonthly > 0 ? Math.round(data.totalMonthly / Math.max(activeCount, 1)) : 0
  }, [data, activeCount])

  const handleCreate = async () => {
    try {
      setSubmitting(true)

      const category = CATEGORIES.find((item) => item.id === form.categoryId)
      await createSubscription({
        name: form.name,
        amount: Number(form.amount),
        billingCycle: form.billingCycle as 'weekly' | 'monthly' | 'yearly',
        nextBillingDate: form.nextBillingDate,
        categoryId: category?.id || 'subscription',
        categoryLabel: category?.label || 'Abonelik',
        notes: form.notes,
      })

      setForm({
        name: '',
        amount: '',
        billingCycle: 'monthly',
        nextBillingDate: new Date().toISOString().slice(0, 10),
        categoryId: 'subscription',
        notes: '',
      })
      await mutate()
      showToast('Abonelik kaydi olusturuldu.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Abonelik kaydedilemedi.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmSuggestion = async (subscription: DetectedSubscription) => {
    try {
      setConfirmingId(subscription.id)
      await createSubscription({
        name: subscription.name,
        amount: subscription.amount,
        billingCycle: subscription.frequency,
        nextBillingDate: subscription.nextPayment.slice(0, 10),
        categoryId: 'subscription',
        categoryLabel: subscription.categoryLabel,
        notes: `Detected from recurring payments (${subscription.matchSource})`,
      })
      await submitDetectedSubscriptionFeedback(subscription.id, {
        status: 'confirmed',
        reasonCodes: subscription.reasonCodes,
      })
      await mutate()
      showToast('Abonelik onaylandi ve listeye eklendi.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Abonelik onaylanamadi.', 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleDismissSuggestion = async (subscription: DetectedSubscription) => {
    try {
      setDismissingId(subscription.id)
      await submitDetectedSubscriptionFeedback(subscription.id, {
        status: 'rejected',
        reasonCodes: subscription.reasonCodes,
      })
      await mutate()
      showToast('Tekrarli odeme onerisi reddedildi.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Oneri reddedilemedi.', 'error')
    } finally {
      setDismissingId(null)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateSubscription(id, { isActive: !isActive })
      await mutate()
      showToast(isActive ? 'Abonelik pasife alindi.' : 'Abonelik yeniden aktif edildi.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Durum guncellenemedi.', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscription(id)
      await mutate()
      showToast('Abonelik silindi.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Abonelik silinemedi.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-page-enter">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-[28px] border border-destructive/20 bg-destructive/10 p-6 text-center animate-page-enter">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-3 font-semibold text-destructive">Abonelik verileri yuklenemedi.</p>
        <p className="mt-1 text-sm text-muted-foreground">Lutfen sayfayi yenileyin veya daha sonra tekrar deneyin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-warning/[0.08] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="pointer-events-none absolute -right-14 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 rounded-full bg-warning/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Radar className="h-3.5 w-3.5" />
              Subscription Center
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">Abonelikleri tek merkezde yonet</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Kayitli abonelikleri kontrol et, tespit edilen tekrarli odemeleri tek tikla listeye al ve aylik yukunu guncel tut.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 xl:min-w-[280px]">
            <HeroMetric label="Aylik yuk" value={formatCurrency(data.totalMonthly)} icon={<Wallet className="h-4 w-4" />} />
            <HeroMetric label="Aktif abonelik" value={String(activeCount)} icon={<CreditCard className="h-4 w-4" />} />
            <HeroMetric label="Tespit adayi" value={String(detectedCount)} icon={<Sparkles className="h-4 w-4" />} tone="warning" />
          </div>
        </div>
      </section>

      {/* ═══════════════ FORM + QUICK SUMMARY ═══════════════ */}
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        {/* New subscription form */}
        <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Yeni abonelik ekle</h2>
              <p className="text-sm text-muted-foreground">Manuel olarak takip listesine ekleyin.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Input
              label="Abonelik adi"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Netflix, Spotify, iCloud..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Tutar"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
              <Select
                label="Periyot"
                value={form.billingCycle}
                onChange={(event) => setForm((current) => ({ ...current, billingCycle: event.target.value }))}
                options={[
                  { value: 'weekly', label: 'Haftalik' },
                  { value: 'monthly', label: 'Aylik' },
                  { value: 'yearly', label: 'Yillik' },
                ]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Sonraki odeme tarihi"
                type="date"
                value={form.nextBillingDate}
                onChange={(event) => setForm((current) => ({ ...current, nextBillingDate: event.target.value }))}
              />
              <Select
                label="Kategori"
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <Input
              label="Not"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Isterseniz iptal, paket veya kullanici notu ekleyin"
            />
            <Button onClick={() => void handleCreate()} loading={submitting} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Listeye ekle
            </Button>
          </div>
        </section>

        {/* Quick summary + Upcoming payments */}
        <div className="space-y-6">
          {/* Financial summary */}
          <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10">
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Finansal ozet</h2>
                <p className="text-sm text-muted-foreground">Abonelik bazli harcama baskisi.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-destructive/80">Yillik yuk</p>
                <p className="mt-2 text-xl font-display font-semibold text-destructive truncate">{formatCurrency(data.totalYearly)}</p>
              </div>
              <div className="rounded-[20px] border border-primary/20 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Ort. abonelik basina</p>
                <p className="mt-2 text-xl font-display font-semibold text-primary truncate">{formatCurrency(monthlyIntensity)}</p>
              </div>
              <div className="rounded-[20px] border border-warning/25 bg-warning/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-warning/80">Tasarruf firsati</p>
                <p className="mt-2 text-xl font-display font-semibold text-warning">{data.savingsOpportunities.length}</p>
              </div>
            </div>
          </section>

          {/* Upcoming payments */}
          <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10">
                <CalendarClock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Yaklasan odemeler</h2>
                <p className="text-sm text-muted-foreground">Onumuzdeki donemde beklenen tahsilatlar.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.upcomingPayments.length > 0 ? data.upcomingPayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 rounded-[20px] border border-border/70 bg-background/70 p-4 animate-list-item transition-colors hover:bg-muted/40"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning/10">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{payment.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-destructive">-{formatCurrency(payment.amount, payment.currency)}</span>
                </div>
              )) : (
                <div className="rounded-[20px] border border-border/70 bg-background/60 p-6 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Planlanan odeme bulunmuyor.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ═══════════════ DETECTED SUGGESTIONS ═══════════════ */}
      {data.detectedSuggestions.length > 0 && (
        <section className="rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">Tespit edilen tekrarli odemeler</h2>
                <p className="text-sm text-muted-foreground">Islem gecmisinizden otomatik olarak algilandi.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
              <Sparkles className="h-3.5 w-3.5" />
              {detectedCount} aday
            </span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {data.detectedSuggestions.map((subscription, index) => {
              const confidenceBadge = getConfidenceBadge(subscription.confidenceScore)
              const frequencyBadge = getFrequencyBadge(subscription.frequency)
              return (
                <div
                  key={subscription.id}
                  className="rounded-[24px] border border-border/70 bg-gradient-to-b from-background/90 to-background/60 p-5 transition-all hover:shadow-[0_12px_28px_rgba(15,76,92,0.1)] animate-list-item"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{subscription.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground truncate">{subscription.categoryLabel}</p>
                    </div>
                    <p className="flex-shrink-0 text-lg font-display font-bold text-foreground">{formatCurrency(subscription.amount)}</p>
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${frequencyBadge.tone}`}>
                      {frequencyBadge.label}
                    </span>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${confidenceBadge.tone}`}>
                      {confidenceBadge.label} · %{subscription.confidenceScore}
                    </span>
                    {subscription.matchSource === 'known' && (
                      <span className="inline-flex rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        Bilinen saglayici
                      </span>
                    )}
                  </div>

                  {/* Payment dates */}
                  <div className="mt-4 grid gap-2 grid-cols-2">
                    <div className="rounded-[16px] border border-border/60 bg-card/60 p-3">
                      <p className="text-xs text-muted-foreground">Son odeme</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{formatDate(subscription.lastPayment)}</p>
                    </div>
                    <div className="rounded-[16px] border border-border/60 bg-card/60 p-3">
                      <p className="text-xs text-muted-foreground">Sonraki tahmin</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{formatDate(subscription.nextPayment)}</p>
                    </div>
                  </div>

                  {/* Yearly total */}
                  <div className="mt-3 rounded-[16px] border border-border/60 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Yillik toplam</p>
                    <p className="mt-1 text-sm font-semibold text-destructive">{formatCurrency(subscription.totalSpentYear)}</p>
                  </div>

                  {/* Reason codes */}
                  <div className="mt-3 rounded-[16px] border border-primary/15 bg-primary/[0.04] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Neden onerildi?</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subscription.reasonCodes.slice(0, 4).map((reasonCode) => (
                        <span
                          key={`${subscription.id}-${reasonCode}`}
                          className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {describeSubscriptionReason(reasonCode)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void handleDismissSuggestion(subscription)}
                      loading={dismissingId === subscription.id}
                      className="flex-1 text-xs"
                    >
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                      Goz ardi et
                    </Button>
                    <Button
                      onClick={() => void handleConfirmSuggestion(subscription)}
                      loading={confirmingId === subscription.id}
                      className="flex-1 text-xs"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Onayla
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════ REGISTERED SUBSCRIPTIONS ═══════════════ */}
      <section className="rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10">
              <Layers3 className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground">Kayitli abonelikler</h2>
              <p className="text-sm text-muted-foreground">Aktif ve pasif tum abonelik kayitlari.</p>
            </div>
          </div>
          {data.subscriptions.length > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
              {data.subscriptions.filter((s) => s.isActive).length} aktif
            </span>
          )}
        </div>

        {data.subscriptions.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/60 p-8 text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 font-semibold text-foreground">Henuz kayitli abonelik yok</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tespit edilen onerilerden ekleyin veya yukaridaki formu kullanin.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {data.subscriptions.map((subscription, index) => (
              <div
                key={subscription.id}
                className={`rounded-[24px] border p-5 transition-all animate-list-item ${
                  subscription.isActive
                    ? 'border-border/70 bg-gradient-to-b from-background/90 to-background/60 hover:shadow-[0_12px_28px_rgba(15,76,92,0.1)]'
                    : 'border-border/50 bg-muted/30 opacity-75'
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{subscription.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground truncate">{subscription.categoryLabel}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                    subscription.isActive
                      ? 'border-success/25 bg-success/10 text-success'
                      : 'border-border/70 bg-muted/60 text-muted-foreground'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${subscription.isActive ? 'bg-success' : 'bg-muted-foreground'}`} />
                    {subscription.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* Cost breakdown */}
                <div className="mt-4 grid gap-2 grid-cols-2">
                  <div className="rounded-[16px] border border-border/60 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Aylik</p>
                    <p className="mt-1 text-sm font-semibold text-foreground truncate">{formatCurrency(subscription.monthlyCost)}</p>
                  </div>
                  <div className="rounded-[16px] border border-border/60 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Yillik</p>
                    <p className="mt-1 text-sm font-semibold text-foreground truncate">{formatCurrency(subscription.annualCost)}</p>
                  </div>
                </div>

                {/* Next billing */}
                <div className="mt-3 rounded-[16px] border border-border/60 bg-card/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Sonraki odeme</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{formatDate(subscription.nextBillingDate)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      subscription.daysUntilBilling <= 3
                        ? 'border-destructive/25 bg-destructive/10 text-destructive'
                        : subscription.daysUntilBilling <= 7
                          ? 'border-warning/25 bg-warning/10 text-warning'
                          : 'border-border/70 bg-background/80 text-muted-foreground'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {subscription.daysUntilBilling} gun
                    </span>
                  </div>
                </div>

                {/* Billing cycle badge */}
                <div className="mt-3 flex items-center gap-2">
                  {(() => {
                    const badge = getFrequencyBadge(subscription.billingCycle)
                    return (
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.tone}`}>
                        <RefreshCw className="mr-1.5 h-3 w-3" />
                        {badge.label}
                      </span>
                    )
                  })()}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleToggle(subscription.id, subscription.isActive)}
                    className="flex-1 text-xs"
                  >
                    {subscription.isActive ? 'Pasife al' : 'Aktif et'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleDelete(subscription.id)}
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    aria-label={`${subscription.name} aboneligini sil`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ═══════════════ HELPER COMPONENTS ═══════════════ */

function HeroMetric({ label, value, icon, tone = 'default' }: {
  label: string
  value: string
  icon: React.ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <div className={`rounded-[24px] border p-4 backdrop-blur-sm animate-scale-in ${
      tone === 'warning'
        ? 'border-warning/25 bg-warning/10'
        : 'border-border/70 bg-background/75'
    }`}>
      <div className="flex items-center gap-2">
        <span className={tone === 'warning' ? 'text-warning' : 'text-muted-foreground'}>{icon}</span>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-2 text-xl font-display font-semibold ${tone === 'warning' ? 'text-warning' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
