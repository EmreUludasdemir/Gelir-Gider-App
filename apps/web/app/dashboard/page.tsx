'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSummary, useTransactions } from '@/lib/hooks'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { DashboardCommandCenter } from '@/components/dashboard/DashboardCommandCenter'
import { CashFlowForecastCard } from '@/components/dashboard/CashFlowForecastCard'
import { Spinner } from '@/components/ui/Spinner'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { useAuth } from '@/components/auth-provider'
import {
  DashboardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  CategorySkeleton,
  AIInsightsSkeleton,
  SmartInputSkeleton,
} from '@/components/skeletons'

// Lazy load heavy components for better initial load performance
const TransactionTable = dynamic(
  () => import('@/components/dashboard/transactions').then(mod => ({ default: mod.TransactionTable })),
  { loading: () => <TableSkeleton />, ssr: false }
)

const AIInsights = dynamic(
  () => import('@/components/dashboard/AIInsights').then(mod => ({ default: mod.AIInsights })),
  { loading: () => <AIInsightsSkeleton />, ssr: false }
)

const WeeklyTrendChart = dynamic(
  () => import('@/components/dashboard/WeeklyTrendChart').then(mod => ({ default: mod.WeeklyTrendChart })),
  { loading: () => <ChartSkeleton /> }
)

const MonthlyTrendChart = dynamic(
  () => import('@/components/dashboard/TrendChart').then(mod => ({ default: mod.TrendChart })),
  { loading: () => <ChartSkeleton /> }
)

const CategoryPieChart = dynamic(
  () => import('@/components/dashboard/CategoryPieChart').then(mod => ({ default: mod.CategoryPieChart })),
  { loading: () => <ChartSkeleton /> }
)

const TopCategories = dynamic(
  () => import('@/components/dashboard/TopCategories').then(mod => ({ default: mod.TopCategories })),
  { loading: () => <CategorySkeleton /> }
)

const RecurringPayments = dynamic(
  () => import('@/components/dashboard/RecurringPayments').then(mod => ({ default: mod.RecurringPayments })),
  { loading: () => <CategorySkeleton /> }
)

const SmartTransactionInput = dynamic(
  () => import('@/components/forms/SmartTransactionInput').then(mod => ({ default: mod.SmartTransactionInput })),
  { loading: () => <SmartInputSkeleton />, ssr: false }
)

export default function DashboardPage() {
  const { loading: authLoading } = useAuth()
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSummary()
  const { data: transactions, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = useTransactions()
  const { language } = usePreferences()
  const { t } = useTranslation(language)

  const handleTransactionAdded = () => {
    mutateSummary()
    mutateTransactions()
  }

  // Wait for auth to be ready before showing data
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (summaryLoading || transactionsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded mt-2 animate-pulse" />
        </div>
        <SmartInputSkeleton />
        <DashboardSkeleton.Stats />
        <AIInsightsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategorySkeleton />
          <CategorySkeleton />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (summaryError || transactionsError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">
          {language === 'tr'
            ? 'Veri yuklenirken hata olustu. Backend servisi calisiyor mu?'
            : 'Error loading data. Is the backend service running?'}
        </p>
      </div>
    )
  }

  if (!summary || !transactions) {
    return null
  }

  const latestTransactionDate = transactions.length > 0 ? new Date(transactions[0].date) : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
        <p className="text-muted-foreground mt-1">
          {summary.period.month} {summary.period.year} - {t('overview')}
        </p>
      </div>

      <DashboardHero summary={summary} />

      <DashboardCommandCenter />

      <CashFlowForecastCard />

      {/* Smart Transaction Input - Lazy loaded */}
      <Suspense fallback={<SmartInputSkeleton />}>
        <SmartTransactionInput onSuccess={handleTransactionAdded} />
      </Suspense>

      {/* Stat Cards - Not lazy loaded (critical for LCP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t('income')}
          value={summary.totals.income}
          change={summary.comparison.changePercentage.income}
          icon="up"
        />
        <StatCard
          title={t('expense')}
          value={summary.totals.expense}
          change={summary.comparison.changePercentage.expense}
          icon="down"
        />
        <StatCard
          title={t('balance')}
          value={summary.totals.balance}
          icon="wallet"
        />
      </div>

      {/* AI Insights - Lazy loaded */}
      <Suspense fallback={<AIInsightsSkeleton />}>
        <AIInsights />
      </Suspense>

      {/* Charts - Lazy loaded */}
      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyTrendChart transactions={transactions} months={12} baseDate={latestTransactionDate} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <WeeklyTrendChart data={summary.weeklyTrend} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <CategoryPieChart categories={summary.topCategories} />
        </Suspense>
      </div>

      {/* Top Categories and Recurring Payments - Lazy loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CategorySkeleton />}>
          <TopCategories categories={summary.topCategories} />
        </Suspense>
        <Suspense fallback={<CategorySkeleton />}>
          <RecurringPayments payments={summary.recurringPayments} />
        </Suspense>
      </div>

      {/* Recent Transactions - Lazy loaded */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionTable
          transactions={transactions}
          title={t('recent_transactions')}
          limit={10}
          onRefresh={mutateTransactions}
        />
      </Suspense>
    </div>
  )
}

