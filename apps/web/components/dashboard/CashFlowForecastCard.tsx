'use client'

import { AlertTriangle, ArrowRight, CalendarClock, Loader2, Wallet2 } from 'lucide-react'
import { useCashFlowForecast } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'

const healthStyles = {
  stable: 'border-success/25 bg-success/10 text-success',
  watch: 'border-warning/25 bg-warning/10 text-warning',
  critical: 'border-destructive/25 bg-destructive/10 text-destructive',
} as const

export function CashFlowForecastCard() {
  const { data, isLoading } = useCashFlowForecast(30)

  if (isLoading) {
    return (
      <div className="glass-card rounded-[28px] p-6">
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="glass-card rounded-[28px] overflow-hidden" data-testid="cash-flow-forecast-card">
      <div className="border-b border-border/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <CalendarClock className="h-3.5 w-3.5" />
              Cash Flow Forecast
            </p>
            <h3 className="mt-3 text-xl font-display font-semibold text-foreground">Ay sonu nakit akis tahmini</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bekleyen faturalar, aktif abonelikler ve gunluk harcama hizi birlestirilir.
            </p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${healthStyles[data.health]}`}>
            {data.health === 'stable' ? 'Dengeli' : data.health === 'watch' ? 'Izleme gerek' : 'Kritik baski'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mevcut net</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(data.currentBalance)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Planli cikis</p>
            <p className="mt-2 text-xl font-semibold text-destructive">-{formatCurrency(data.committedExpenses)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Degisken tahmin</p>
            <p className="mt-2 text-xl font-semibold text-warning">-{formatCurrency(data.projectedVariableExpenses)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ay sonu projeksiyonu</p>
            <p className={`mt-2 text-xl font-semibold ${data.projectedEndBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {data.projectedEndBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(data.projectedEndBalance))}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-border/70 bg-background/75 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Yaklasan taahhutler</p>
                <p className="text-sm text-muted-foreground">Ilk 6 odeme veya abonelik yenilemesi.</p>
              </div>
              <Wallet2 className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 space-y-3">
              {data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border/70 bg-card/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{event.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.categoryLabel} · {formatDate(event.dueDate)} · {event.source === 'bill' ? 'Fatura' : 'Abonelik'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-destructive">-{formatCurrency(event.amount, event.currency)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Onumuzdeki 30 gun icin planli odeme gorunmuyor.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/75 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold text-foreground">Likidite sinyali</p>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gunluk gider hizi</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(data.averageDailyExpense)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Guvenli tampon</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(data.bufferTarget)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Runway</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {data.runwayDays === null ? 'Hesaplanamiyor' : `${data.runwayDays} gun`}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
                {data.health === 'stable'
                  ? 'Projeksiyon tampon seviyesinin ustunde. Mevcut hiz korunabilir.'
                  : data.health === 'watch'
                    ? 'Ay sonu tamponu zayif. Esnek harcamalari kisman mantikli olur.'
                    : 'Projeksiyon negatifte. Fatura ve abonelik cikislari icin acil aksiyon gerek.'}
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Detaylar otomatik 60 saniyede yenilenir
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
