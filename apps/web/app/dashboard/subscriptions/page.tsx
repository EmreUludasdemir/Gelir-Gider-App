'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Layers3, Plus, Radar, Receipt, Trash2 } from 'lucide-react'
import {
  createSubscription,
  deleteSubscription,
  DetectedSubscription,
  updateSubscription,
} from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import { useSubscriptionSummary } from '@/lib/hooks'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const CATEGORY_OPTIONS = CATEGORIES.filter((category) => category.type === 'expense' || category.type === 'both').map((category) => ({
  value: category.id,
  label: category.label,
}))

export default function SubscriptionsPage() {
  const { data, error, isLoading, mutate } = useSubscriptionSummary()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
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

  const handleCreate = async (seed?: DetectedSubscription) => {
    try {
      setSubmitting(true)

      const category = CATEGORIES.find((item) => item.id === form.categoryId)
      await createSubscription({
        name: seed?.name || form.name,
        amount: seed?.amount || Number(form.amount),
        billingCycle: seed?.frequency || (form.billingCycle as 'weekly' | 'monthly' | 'yearly'),
        nextBillingDate: seed?.nextPayment?.slice(0, 10) || form.nextBillingDate,
        categoryId: category?.id || 'subscription',
        categoryLabel: seed?.categoryLabel || category?.label || 'Abonelik',
        notes: seed ? `Detected from recurring payments (${seed.matchSource})` : form.notes,
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
      showToast(seed ? 'Tespit edilen abonelik listeye eklendi.' : 'Abonelik kaydi olusturuldu.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Abonelik kaydedilemedi.', 'error')
    } finally {
      setSubmitting(false)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        Abonelik verileri yuklenemedi.
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aylik yuk</p>
              <p className="mt-2 text-xl font-display font-semibold text-foreground">{formatCurrency(data.totalMonthly)}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aktif abonelik</p>
              <p className="mt-2 text-2xl font-display font-semibold text-foreground">{activeCount}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tespit adayi</p>
              <p className="mt-2 text-2xl font-display font-semibold text-warning">{detectedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <CardTitle>Yeni abonelik ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={() => void handleCreate()} loading={submitting}>
              <Plus className="mr-2 h-4 w-4" />
              Listeye ekle
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hizli ozet</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Yillik yuk</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(data.totalYearly)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ortalama aylik</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(monthlyIntensity)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tasarruf firsati</p>
                <p className="mt-2 text-xl font-semibold text-warning">{data.savingsOpportunities.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yaklasan odemeler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingPayments.length > 0 ? data.upcomingPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{payment.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-destructive">-{formatCurrency(payment.amount, payment.currency)}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Planlanan odeme bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {data.detectedSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tespit edilen tekrarli odemeler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {data.detectedSuggestions.map((subscription) => (
              <div key={subscription.id} className="rounded-[24px] border border-border/70 bg-background/75 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{subscription.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {subscription.categoryLabel} · {subscription.frequency === 'monthly' ? 'Aylik' : subscription.frequency === 'weekly' ? 'Haftalik' : 'Yillik'}
                    </p>
                  </div>
                  <span className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                    {subscription.matchSource === 'known' ? 'Known match' : 'Pattern'}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Son odeme: {formatDate(subscription.lastPayment)}</p>
                  <p>Sonraki tahmin: {formatDate(subscription.nextPayment)}</p>
                  <p>Yillik toplam: {formatCurrency(subscription.totalSpentYear)}</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-foreground">{formatCurrency(subscription.amount)}</span>
                  <Button
                    variant="outline"
                    onClick={() => void handleCreate(subscription)}
                    loading={submitting}
                  >
                    Listeye al
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kayitli abonelikler</CardTitle>
        </CardHeader>
        <CardContent>
          {data.subscriptions.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-6 text-sm text-muted-foreground">
              Henuz kayitli abonelik yok. Detect edilen onerilerden ekleyin veya manuel formu kullanin.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
              {data.subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-[24px] border border-border/70 bg-background/75 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{subscription.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{subscription.categoryLabel}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${subscription.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {subscription.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aylik esitlik</p>
                      <p className="mt-1 font-semibold text-foreground">{formatCurrency(subscription.monthlyCost)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sonraki odeme</p>
                      <p className="mt-1 font-semibold text-foreground">{formatDate(subscription.nextBillingDate)}</p>
                      <p className="mt-1 text-muted-foreground">{subscription.daysUntilBilling} gun sonra</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void handleToggle(subscription.id, subscription.isActive)}>
                      {subscription.isActive ? 'Pasife al' : 'Aktif et'}
                    </Button>
                    <Button variant="outline" onClick={() => void handleDelete(subscription.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
