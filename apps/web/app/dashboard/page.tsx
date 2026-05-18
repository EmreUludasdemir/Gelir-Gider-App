'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRefreshAll, useSummary, useTransactions } from '@/lib/hooks'
import { getApiErrorMessage } from '@/lib/api'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardCommandCenter } from '@/components/dashboard/DashboardCommandCenter'
import { CashFlowForecastCard } from '@/components/dashboard/CashFlowForecastCard'
import { FinancialAnalysisBoard } from '@/components/dashboard/FinancialAnalysisBoard'
import { Spinner } from '@/components/ui/Spinner'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { useAuth } from '@/components/auth-provider'
import { useRealtimeRefresh } from '@/contexts/RealtimeContext'
import {
  DashboardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  CategorySkeleton,
  AIInsightsSkeleton,
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

const MonthlyComparison = dynamic(
  () => import('@/components/dashboard/MonthlyComparison').then(mod => ({ default: mod.MonthlyComparison })),
  { loading: () => <ChartSkeleton /> }
)

export default function DashboardPage() {
  const { loading: authLoading, user } = useAuth()
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSummary()
  const { data: transactions, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = useTransactions()
  const refreshAll = useRefreshAll()
  const { language } = usePreferences()
  const { t } = useTranslation(language)

  useRealtimeRefresh(() => {
    void refreshAll()
  }, [refreshAll])

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
    const errorMessage = getApiErrorMessage(summaryError || transactionsError, '');
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl" id="main-content">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-destructive mb-1">
              {language === 'tr' ? 'Veri yüklenemedi' : 'Failed to load data'}
            </h3>
            <p className="text-destructive/80 mb-3">
              {isNetworkError
                ? (language === 'tr' 
                    ? 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.' 
                    : 'Cannot connect to server. Check your internet connection.')
                : (language === 'tr'
                    ? 'Backend servisi çalışmıyor olabilir veya bir hata oluştu.'
                    : 'Backend service may be down or an error occurred.')}
            </p>
            <button
              onClick={() => {
                mutateSummary();
                mutateTransactions();
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              {language === 'tr' ? 'Tekrar Dene' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!summary || !transactions) {
    return (
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-warning">
          {language === 'tr'
            ? 'Dashboard verisi su an hazir degil. Lutfen yeniden deneyin.'
            : 'Dashboard data is currently unavailable. Please try again.'}
        </p>
      </div>
    )
  }

  const latestTransactionDate = transactions.length > 0 ? new Date(transactions[0].date) : undefined
  const isEmptyDashboard = transactions.length === 0 || summary.totals.transactionCount === 0

  if (isEmptyDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'tr'
              ? 'Ilk kaydi ekleyene kadar dashboard burada yonlendirme modunda kalir.'
              : 'Dashboard stays in setup mode until the first records arrive.'}
          </p>
        </div>

        <DashboardEmptyState />
      </div>
    )
  }

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

      <FinancialAnalysisBoard summary={summary} />

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

      <Suspense fallback={<ChartSkeleton />}>
        <MonthlyComparison
          previousMonth={{
            month: language === 'tr' ? 'Gecen Ay' : 'Last Month',
            income: summary.comparison.previousMonth.income,
            expense: summary.comparison.previousMonth.expense,
          }}
          currentMonth={{
            month: language === 'tr' ? 'Bu Ay' : 'This Month',
            income: summary.totals.income,
            expense: summary.totals.expense,
          }}
        />
      </Suspense>

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
          currentUserId={user?.id}
          onRefresh={mutateTransactions}
        />
      </Suspense>
    </div>
  )
}
