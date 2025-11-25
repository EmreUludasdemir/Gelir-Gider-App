'use client'

import { useSummary, useTransactions } from '@/lib/hooks'
import { StatCard } from '@/components/dashboard/StatCard'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { TopCategories } from '@/components/dashboard/TopCategories'
import { RecurringPayments } from '@/components/dashboard/RecurringPayments'
import { Spinner } from '@/components/ui/Spinner'

export default function DashboardPage() {
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useSummary()
  const { data: transactions, error: transactionsError, isLoading: transactionsLoading } = useTransactions()

  if (summaryLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (summaryError || transactionsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          Veri yüklenirken hata oluştu. Backend servisi çalışıyor mu?
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {summary.period.month} {summary.period.year} - Finansal Özet
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Gelir"
          value={summary.totals.income}
          change={summary.comparison.changePercentage.income}
          icon="📈"
        />
        <StatCard
          title="Gider"
          value={summary.totals.expense}
          change={summary.comparison.changePercentage.expense}
          icon="📉"
        />
        <StatCard
          title="Bakiye"
          value={summary.totals.balance}
          icon="💰"
        />
      </div>

      {/* Top Categories and Recurring Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCategories categories={summary.topCategories} />
        <RecurringPayments payments={summary.recurringPayments} />
      </div>

      {/* Recent Transactions */}
      <TransactionTable
        transactions={transactions}
        title="Son İşlemler"
        limit={10}
      />
    </div>
  )
}
