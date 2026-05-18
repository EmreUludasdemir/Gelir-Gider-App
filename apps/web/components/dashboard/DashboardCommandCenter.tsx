'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PiggyBank,
  Receipt,
  ShieldCheck,
} from 'lucide-react'
import { markBillAsPaid } from '@/lib/api'
import { useBudgetStatus, useSavingsGoals } from '@/lib/hooks'
import { useUpcomingBillsQuery } from '@/lib/react-query-hooks'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { BudgetAlerts } from './BudgetAlerts'
import { FinancialHealthCard } from './FinancialHealthCard'
import { QuickActionsGrid } from './QuickActionsGrid'
import { SavingsGoalWidget } from './SavingsGoalWidget'
import { UpcomingBillsWidget } from './UpcomingBillsWidget'

function LoadingCard() {
  return (
    <div className="rounded-[24px] border border-border/60 bg-card/80 p-4">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-8 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
    </div>
  )
}

function WidgetLoadingCard() {
  return (
    <div className="rounded-[24px] border border-border/60 bg-card/80 p-6">
      <div className="h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-5 space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    </div>
  )
}

export function DashboardCommandCenter() {
  const router = useRouter()
  const { showToast } = useToast()
  const { data: budgetsData, error: budgetsError, isLoading: budgetsLoading, mutate: mutateBudgets } = useBudgetStatus()
  const { data: goalsData, error: goalsError, isLoading: goalsLoading } = useSavingsGoals()
  const { data: billsData, isError: billsError, isLoading: billsLoading, refetch: refetchBills } = useUpcomingBillsQuery(14)
  const [payingBillId, setPayingBillId] = useState<string | null>(null)
  const budgets = useMemo(() => budgetsData ?? [], [budgetsData])
  const goals = useMemo(() => goalsData ?? [], [goalsData])
  const bills = useMemo(() => billsData ?? [], [billsData])
  const initialLoading =
    (!budgetsData && !budgetsError) ||
    (!goalsData && !goalsError) ||
    (!billsData && !billsError)

  const budgetAlerts = useMemo(
    () =>
      budgets
        .filter((budget) => Number(budget.percentage || 0) >= 80)
        .map((budget) => ({
          id: budget.id,
          categoryLabel: budget.categoryLabel,
          spent: Number(budget.spent || 0),
          limit: Number(budget.limitAmount || 0),
          percentage: Number(budget.percentage || 0),
        })),
    [budgets],
  )

  const billSummary = useMemo(() => {
    const unpaidBills = bills.filter((bill) => !bill.isPaid)
    const total = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
    const dueSoon = unpaidBills.filter((bill) => {
      const diff = Math.ceil(
        (new Date(bill.dueDate).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
      )
      return diff <= 3
    }).length

    return {
      unpaidCount: unpaidBills.length,
      dueSoon,
      total,
    }
  }, [bills])

  const goalSummary = useMemo(() => {
    const activeGoals = goals.filter((goal) => !goal.isCompleted)
    const totalTarget = activeGoals.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0)
    const totalCurrent = activeGoals.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0)
    const avgProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

    return {
      activeCount: activeGoals.length,
      completedCount: goals.filter((goal) => goal.isCompleted).length,
      avgProgress,
      totalCurrent,
    }
  }, [goals])

  const focusCards = [
    {
      href: '/dashboard/budgets',
      eyebrow: 'Butce riski',
      value: `${budgetAlerts.length}`,
      caption: budgetAlerts.length > 0 ? 'kategori esik uzerinde' : 'risk sinyali yok',
      detail:
        budgetAlerts.length > 0
          ? `${budgetAlerts.filter((budget) => budget.percentage >= 100).length} kategori limit asti`
          : 'Harcamalar planla uyumlu gidiyor',
      icon: AlertTriangle,
      tone: 'from-warning/20 via-warning/8 to-transparent text-warning',
    },
    {
      href: '/dashboard/transactions?type=expense',
      eyebrow: 'Odeme takvimi',
      value: formatCurrency(billSummary.total || 0),
      caption: `${billSummary.unpaidCount} bekleyen odeme`,
      detail:
        billSummary.dueSoon > 0
          ? `${billSummary.dueSoon} odeme 3 gun icinde`
          : 'Acil odeme baskisi gorunmuyor',
      icon: Receipt,
      tone: 'from-primary/18 via-primary/8 to-transparent text-primary',
    },
    {
      href: '/dashboard/goals',
      eyebrow: 'Hedef hizi',
      value: `%${Math.round(goalSummary.avgProgress)}`,
      caption: `${goalSummary.activeCount} aktif hedef`,
      detail:
        goalSummary.activeCount > 0
          ? `${formatCurrency(goalSummary.totalCurrent)} birikim aktive edildi`
          : 'Yeni bir hedef olusturulabilir',
      icon: PiggyBank,
      tone: 'from-success/18 via-success/8 to-transparent text-success',
    },
  ]

  const handleMarkBillPaid = async (billId: string) => {
    try {
      setPayingBillId(billId)
      await markBillAsPaid(billId)
      await Promise.all([refetchBills(), mutateBudgets()])
      showToast('Fatura odendi olarak isaretlendi.', 'success')
    } catch {
      showToast('Fatura guncellenemedi. Tekrar deneyin.', 'error')
    } finally {
      setPayingBillId(null)
    }
  }

  return (
    <section className="space-y-6" data-testid="dashboard-command-center">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <QuickActionsGrid />

        <section className="glass-card rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Komuta Paneli
              </p>
              <h3 className="mt-3 text-xl font-display font-semibold text-foreground">
                Bugunun odak noktalarini tek bakista gor
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Butce sapmasi, odeme baskisi ve hedef hizi ayni satirda izlenir.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tamamlanan hedef</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{goalSummary.completedCount}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {initialLoading || budgetsLoading || goalsLoading || billsLoading
              ? Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
              : focusCards.map((card) => {
                  const Icon = card.icon

                  return (
                    <Link
                      key={card.eyebrow}
                      href={card.href}
                      className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/85 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_36px_rgba(15,76,92,0.12)]"
                    >
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.tone} opacity-90`} />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                              {card.eyebrow}
                            </p>
                            <p className="mt-3 text-2xl font-display font-bold text-foreground">{card.value}</p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/75">
                            <Icon className="h-5 w-5 text-foreground" />
                          </div>
                        </div>

                        <p className="mt-3 text-sm font-medium text-foreground">{card.caption}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>

                        <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          Detaylari ac
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
          </div>
        </section>
      </div>

      {budgetAlerts.length > 0 && <BudgetAlerts budgets={budgetAlerts} />}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FinancialHealthCard />

        <div className="grid gap-6">
          {initialLoading ? (
            <>
              <WidgetLoadingCard />
              <WidgetLoadingCard />
            </>
          ) : (
            <>
              <UpcomingBillsWidget
                bills={bills}
                onBillClick={(bill) => router.push(`/dashboard/transactions?search=${encodeURIComponent(bill.name)}`)}
                onPayBill={payingBillId ? undefined : handleMarkBillPaid}
              />
              <SavingsGoalWidget
                goals={goals.map((goal) => ({
                  id: goal.id,
                  name: goal.name,
                  targetAmount: goal.targetAmount,
                  currentAmount: goal.currentAmount,
                  currency: 'TRY',
                  targetDate: goal.deadline,
                  isCompleted: goal.isCompleted,
                }))}
                onAddGoal={() => router.push('/dashboard/goals')}
                onGoalClick={() => router.push('/dashboard/goals')}
              />
            </>
          )}
        </div>
      </div>

      {payingBillId && (
        <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Fatura durumu guncelleniyor...
        </div>
      )}
    </section>
  )
}
