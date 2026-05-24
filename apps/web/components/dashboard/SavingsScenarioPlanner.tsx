'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Gauge,
  PiggyBank,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { DashboardSummary } from '@/lib/api'
import { useCashFlowForecast, useSubscriptionSummary } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'

interface SavingsScenarioPlannerProps {
  summary: DashboardSummary
}

export function SavingsScenarioPlanner({ summary }: SavingsScenarioPlannerProps) {
  const { data: cashFlow } = useCashFlowForecast(30)
  const { data: subscriptionSummary } = useSubscriptionSummary()
  const topCategory = summary.topCategories[0]
  const defaultRecurringCut = subscriptionSummary?.savingsOpportunities[0]?.monthlyCost || 0
  const [categoryCutPercent, setCategoryCutPercent] = useState(10)
  const [recurringCutAmount, setRecurringCutAmount] = useState(defaultRecurringCut)
  const [oneTimeBoost, setOneTimeBoost] = useState(0)

  useEffect(() => {
    if (recurringCutAmount === 0 && defaultRecurringCut > 0) {
      setRecurringCutAmount(defaultRecurringCut)
    }
  }, [defaultRecurringCut, recurringCutAmount])

  const scenario = useMemo(() => {
    const categoryImpact = topCategory ? (topCategory.total * categoryCutPercent) / 100 : 0
    const monthlyRecurringPool = subscriptionSummary?.totalMonthly || summary.recurringPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    )
    const recurringImpact = Math.min(
      Math.max(recurringCutAmount, 0),
      Math.max(monthlyRecurringPool, 0),
    )
    const monthlyImpact = categoryImpact + recurringImpact
    const projectedEndBalance = cashFlow?.projectedEndBalance ?? summary.totals.balance
    const improvedEndBalance = projectedEndBalance + monthlyImpact + Math.max(oneTimeBoost, 0)
    const bufferTarget = cashFlow?.bufferTarget ?? Math.max(summary.totals.expense * 0.35, 0)
    const bufferGap = Math.max(bufferTarget - projectedEndBalance, 0)
    const bufferCoverage = bufferGap > 0 ? Math.min(((monthlyImpact + oneTimeBoost) / bufferGap) * 100, 100) : 100
    const runwayGain = cashFlow?.averageDailyExpense
      ? Math.floor((monthlyImpact + Math.max(oneTimeBoost, 0)) / cashFlow.averageDailyExpense)
      : null

    return {
      categoryImpact,
      recurringImpact,
      monthlyImpact,
      projectedEndBalance,
      improvedEndBalance,
      bufferTarget,
      bufferGap,
      bufferCoverage,
      runwayGain,
    }
  }, [
    cashFlow,
    categoryCutPercent,
    oneTimeBoost,
    recurringCutAmount,
    subscriptionSummary,
    summary.recurringPayments,
    summary.totals.balance,
    summary.totals.expense,
    topCategory,
  ])

  const recurringMax = Math.max(
    subscriptionSummary?.totalMonthly || 0,
    defaultRecurringCut,
    summary.recurringPayments.reduce((sum, payment) => sum + payment.amount, 0),
    500,
  )

  const resetScenario = () => {
    setCategoryCutPercent(10)
    setRecurringCutAmount(defaultRecurringCut)
    setOneTimeBoost(0)
  }

  return (
    <section
      className="overflow-hidden rounded-[28px] border border-border/70 bg-card/82 shadow-[0_18px_36px_rgba(15,76,92,0.1)]"
      data-testid="savings-scenario-planner"
    >
      <div className="border-b border-border/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-success">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Scenario Lab
            </p>
            <h2 className="mt-3 text-xl font-display font-semibold text-foreground">Tasarruf senaryosu</h2>
          </div>

          <button
            type="button"
            onClick={resetScenario}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-border/70 bg-background/75 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" />
            Sifirla
          </button>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 border-b border-border/70 p-5 xl:border-b-0 xl:border-r">
          <ScenarioControl
            icon={Scissors}
            title={topCategory ? topCategory.categoryLabel : 'Kategori'}
            value={`%${categoryCutPercent}`}
            min={0}
            max={30}
            step={1}
            rangeValue={categoryCutPercent}
            onRangeChange={setCategoryCutPercent}
            metric={formatCurrency(scenario.categoryImpact)}
          />

          <ScenarioControl
            icon={WalletCards}
            title="Recurring azaltma"
            value={formatCurrency(recurringCutAmount)}
            min={0}
            max={recurringMax}
            step={Math.max(Math.round(recurringMax / 100), 10)}
            rangeValue={recurringCutAmount}
            onRangeChange={setRecurringCutAmount}
            metric={formatCurrency(scenario.recurringImpact)}
          />

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PiggyBank className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Tek seferlik tampon</p>
                  <p className="text-xs text-muted-foreground">Opsiyonel</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-primary">{formatCurrency(oneTimeBoost)}</p>
            </div>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={oneTimeBoost}
              onChange={(event) => setOneTimeBoost(Number(event.target.value) || 0)}
              className="mt-4 h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ScenarioMetric
              icon={PiggyBank}
              label="Aylik etki"
              value={formatCurrency(scenario.monthlyImpact)}
              tone="success"
            />
            <ScenarioMetric
              icon={CalendarDays}
              label="Ay sonu"
              value={`${scenario.improvedEndBalance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(scenario.improvedEndBalance))}`}
              tone={scenario.improvedEndBalance >= 0 ? 'success' : 'danger'}
            />
            <ScenarioMetric
              icon={Gauge}
              label="Runway"
              value={scenario.runwayGain === null ? '-' : `+${scenario.runwayGain} gun`}
              tone="primary"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tampon kapsama</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hedef {formatCurrency(scenario.bufferTarget)}
                </p>
              </div>
              <p className="text-sm font-semibold text-primary">
                %{Math.round(scenario.bufferCoverage)}
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${scenario.bufferCoverage}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Simdiki projeksiyon" value={formatCurrency(scenario.projectedEndBalance)} />
              <MiniMetric label="Tampon acigi" value={formatCurrency(scenario.bufferGap)} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/dashboard/transactions?type=expense"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Harcamalara git
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard/subscriptions"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary"
            >
              Aboneliklere git
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScenarioControl({
  icon: Icon,
  title,
  value,
  min,
  max,
  step,
  rangeValue,
  onRangeChange,
  metric,
}: {
  icon: LucideIcon
  title: string
  value: string
  min: number
  max: number
  step: number
  rangeValue: number
  onRangeChange: (value: number) => void
  metric: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{metric}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-primary">{value}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={rangeValue}
        onChange={(event) => onRangeChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  )
}

function ScenarioMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'primary' | 'success' | 'danger'
}) {
  const toneClass = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    danger: 'text-destructive bg-destructive/10',
  }[tone]

  return (
    <div className="min-h-[128px] rounded-2xl border border-border/70 bg-background/70 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-display font-semibold text-foreground">{value}</p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
