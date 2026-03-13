'use client'

import { useMemo } from 'react'
import { Activity, BadgePercent, Radar, Scissors, Target, TrendingUp, Waves } from 'lucide-react'
import { DashboardSummary } from '@/lib/api'
import { useBudgetStatus, useCashFlowForecast, useSubscriptionSummary } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'

interface FinancialAnalysisBoardProps {
  summary: DashboardSummary
}

export function FinancialAnalysisBoard({ summary }: FinancialAnalysisBoardProps) {
  const { data: cashFlow } = useCashFlowForecast(30)
  const { data: subscriptionSummary } = useSubscriptionSummary()
  const { data: budgetStatus } = useBudgetStatus()

  const analysis = useMemo(() => {
    const topCategory = summary.topCategories[0]
    const acceleratingCategory = summary.topCategories.find((category) => category.trend === 'up') || topCategory
    const budgetAlerts = (budgetStatus || []).filter((budget) => budget.status === 'warning' || budget.status === 'over')
    const subscriptionLoad = summary.totals.expense > 0 && subscriptionSummary
      ? (subscriptionSummary.totalMonthly / summary.totals.expense) * 100
      : 0
    const cutbackTarget = subscriptionSummary?.savingsOpportunities[0]
      ? {
          label: subscriptionSummary.savingsOpportunities[0].name,
          monthlyImpact: subscriptionSummary.savingsOpportunities[0].monthlyCost,
          reason: 'Recurring maliyeti en hizli azaltabilecek aday.',
        }
      : topCategory && topCategory.percentage >= 28
        ? {
            label: topCategory.categoryLabel,
            monthlyImpact: topCategory.total * 0.12,
            reason: 'Aylik gider dagiliminda baskin kategori oldugu icin once burada kismi kesinti aranabilir.',
          }
        : null

    return {
      topCategory,
      acceleratingCategory,
      budgetAlerts,
      subscriptionLoad,
      balanceBuffer: cashFlow ? cashFlow.projectedEndBalance - cashFlow.bufferTarget : null,
      expenseDelta: summary.comparison.changePercentage.expense,
      cutbackTarget,
    }
  }, [budgetStatus, cashFlow, subscriptionSummary, summary])

  return (
    <section
      data-testid="financial-analysis-board"
      className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-card via-background to-primary/[0.06] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]"
    >
      <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Radar className="h-3.5 w-3.5" />
              Analysis Deck
            </p>
            <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">Verinin anlattigi resmi daha net gor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Dashboard ozetini, recurring yukunu, butce baskisini ve 30 gunluk nakit akisini tek analiz duvarinda toplar.
            </p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-background/75 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aktif analiz sinyali</p>
            <p className="mt-2 text-2xl font-display font-semibold text-foreground">
              {(analysis.budgetAlerts.length > 0 ? 1 : 0) + (analysis.subscriptionLoad > 20 ? 1 : 0) + (cashFlow?.health === 'critical' ? 1 : 0) + (summary.topCategories.length > 0 ? 1 : 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          <InsightCard
            icon={Activity}
            label="Kategori baskisi"
            title={analysis.topCategory ? analysis.topCategory.categoryLabel : 'Veri bekleniyor'}
            body={analysis.topCategory ? `%${analysis.topCategory.percentage.toFixed(1)} pay ile en yuksek gider kategorisi.` : 'Gider dagilimi olusunca burada baskin kategori gorunur.'}
            accent={analysis.topCategory ? formatCurrency(analysis.topCategory.total) : '-'}
          />
          <InsightCard
            icon={Waves}
            label="Nakit tamponu"
            title={cashFlow ? (cashFlow.health === 'stable' ? 'Tampon guclu' : cashFlow.health === 'watch' ? 'Tampon daraliyor' : 'Tampon kritik') : 'Bekleniyor'}
            body={cashFlow ? `Ay sonu projeksiyonu ${formatCurrency(cashFlow.projectedEndBalance)} seviyesinde.` : 'Cash flow verisi geldikce otomatik hesaplanir.'}
            accent={analysis.balanceBuffer !== null ? `${analysis.balanceBuffer >= 0 ? '+' : '-'}${formatCurrency(Math.abs(analysis.balanceBuffer))}` : '-'}
          />
          <InsightCard
            icon={Target}
            label="Recurring yuk"
            title={subscriptionSummary ? `%${analysis.subscriptionLoad.toFixed(1)} gider payi` : 'Bekleniyor'}
            body={subscriptionSummary ? `${subscriptionSummary.activeCount} aktif abonelik toplam giderin bu kadarini yiyor.` : 'Abonelik merkezi senkron olunca burada recurring oran gorunur.'}
            accent={subscriptionSummary ? formatCurrency(subscriptionSummary.totalMonthly) : '-'}
          />
          <InsightCard
            icon={Radar}
            label="Butce baskisi"
            title={analysis.budgetAlerts.length > 0 ? `${analysis.budgetAlerts.length} kategori riskte` : 'Butce dengeli'}
            body={analysis.budgetAlerts.length > 0 ? analysis.budgetAlerts.map((budget) => budget.categoryLabel).slice(0, 2).join(', ') : 'Aktif butceler uyarı esigini asmamis gorunuyor.'}
            accent={analysis.budgetAlerts.length > 0 ? 'Aksiyon gerek' : 'Kontrol altinda'}
          />
          <InsightCard
            icon={TrendingUp}
            label="Harcama ivmesi"
            title={analysis.acceleratingCategory ? analysis.acceleratingCategory.categoryLabel : 'Veri bekleniyor'}
            body={
              analysis.acceleratingCategory
                ? analysis.acceleratingCategory.trend === 'up'
                  ? 'Trend sinyali yukari bakiyor; bu kategori yakindan izlenmeli.'
                  : `Aylik giderin %${analysis.acceleratingCategory.percentage.toFixed(1)} kadari burada toplaniyor.`
                : 'Kategori ivmesi icin daha fazla hareket gerekli.'
            }
            accent={`${analysis.expenseDelta >= 0 ? '+' : ''}%${analysis.expenseDelta.toFixed(1)}`}
          />
          <InsightCard
            icon={Scissors}
            label="Kesilebilecek alan"
            title={analysis.cutbackTarget ? analysis.cutbackTarget.label : 'Net aday yok'}
            body={analysis.cutbackTarget ? analysis.cutbackTarget.reason : 'Mevcut veri, dogrudan kesinti onerisi icin yeterince baskin bir alan gostermiyor.'}
            accent={analysis.cutbackTarget ? `Aylik potansiyel ${formatCurrency(analysis.cutbackTarget.monthlyImpact)}` : '-'}
          />
          <InsightCard
            icon={BadgePercent}
            label="Aydan aya fark"
            title={analysis.expenseDelta <= 0 ? 'Gider temposu kontrollu' : 'Gider temposu yukseliyor'}
            body={
              analysis.expenseDelta <= 0
                ? `Gecen aya gore gider degisimi ${analysis.expenseDelta.toFixed(1)}%.`
                : `Gecen aya gore giderler %${analysis.expenseDelta.toFixed(1)} artis egiliminde.`
            }
            accent={formatCurrency(summary.comparison.previousMonth.expense)}
          />
        </div>
      </div>
    </section>
  )
}

function InsightCard({
  icon: Icon,
  label,
  title,
  body,
  accent,
}: {
  icon: typeof Activity
  label: string
  title: string
  body: string
  accent: string
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background/75 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <p className="mt-4 text-sm font-semibold text-primary">{accent}</p>
    </div>
  )
}

