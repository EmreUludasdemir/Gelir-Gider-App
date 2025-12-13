'use client'

import { useSummary, useTransactions } from '@/lib/hooks'
import { StatCard } from '@/components/dashboard/StatCard'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { TopCategories } from '@/components/dashboard/TopCategories'
import { RecurringPayments } from '@/components/dashboard/RecurringPayments'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { Spinner } from '@/components/ui/Spinner'
import { SmartTransactionInput } from '@/components/forms/SmartTransactionInput'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

export default function DashboardPage() {
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSummary()
  const { data: transactions, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = useTransactions()
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)

  const handleTransactionAdded = () => {
    mutateSummary()
    mutateTransactions()
  }

  if (summaryLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (summaryError || transactionsError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          {language === 'tr' 
            ? 'Veri yüklenirken hata oluştu. Backend servisi çalışıyor mu?' 
            : 'Error loading data. Is the backend service running?'}
        </p>
      </div>
    )
  }

  if (!summary || !transactions) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {summary.period.month} {summary.period.year} - {t('overview')}
        </p>
      </div>

      {/* Smart Transaction Input */}
      <SmartTransactionInput onSuccess={handleTransactionAdded} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t('income')}
          value={summary.totals.income}
          change={summary.comparison.changePercentage.income}
          icon="📈"
        />
        <StatCard
          title={t('expense')}
          value={summary.totals.expense}
          change={summary.comparison.changePercentage.expense}
          icon="📉"
        />
        <StatCard
          title={t('balance')}
          value={summary.totals.balance}
          icon="💰"
        />
      </div>

      {/* AI Insights */}
      <AIInsights />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyTrendChart data={summary.weeklyTrend} />
        <CategoryPieChart categories={summary.topCategories} />
      </div>

      {/* Top Categories and Recurring Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCategories categories={summary.topCategories} />
        <RecurringPayments payments={summary.recurringPayments} />
      </div>

      {/* Recent Transactions */}
      <TransactionTable
        transactions={transactions}
        title={t('recent_transactions')}
        limit={10}
      />
    </div>
  )
}

