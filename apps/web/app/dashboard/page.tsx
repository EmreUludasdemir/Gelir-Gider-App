'use client'

import { useState, useMemo } from 'react'
import { useSummary, useTransactions } from '@/lib/hooks'
import { StatCard } from '@/components/dashboard/StatCard'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { TopCategories } from '@/components/dashboard/TopCategories'
import { RecurringPayments } from '@/components/dashboard/RecurringPayments'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { MonthlyComparison } from '@/components/dashboard/MonthlyComparison'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { TransactionFilters } from '@/components/forms/TransactionFilters'
import { Select } from '@/components/ui/Select'
import { ExportButton } from '@/components/ui/ExportButton'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSummary(selectedMonth ? { dateFrom: `${selectedMonth}-01` } : undefined)
  const { data: allTransactions, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = useTransactions()
  
  const handleRefresh = () => {
    mutateTransactions()
    mutateSummary()
  }
  
  // Filter transactions based on selected filters
  const transactions = useMemo(() => {
    if (!allTransactions) return []
    
    let filtered = [...allTransactions]
    
    if (filters.type) {
      filtered = filtered.filter(tx => tx.type === filters.type)
    }
    
    if (filters.categoryId) {
      filtered = filtered.filter(tx => tx.categoryId === filters.categoryId)
    }
    
    if (filters.source) {
      filtered = filtered.filter(tx => tx.source === filters.source)
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => tx.date >= filters.dateFrom)
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(tx => tx.date <= filters.dateTo)
    }
    
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount)
      filtered = filtered.filter(tx => Math.abs(tx.amount) >= min)
    }
    
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount)
      filtered = filtered.filter(tx => Math.abs(tx.amount) <= max)
    }
    
    return filtered
  }, [allTransactions, filters])

  // Generate month options (last 12 months) - Move before conditional returns
  const monthOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
      options.push({ value, label })
    }
    return options
  }, [])

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { income: 0, expense: 0, balance: 0, count: 0 }
    }
    
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    
    const expense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    
    return {
      income,
      expense,
      balance: income - expense,
      count: transactions.length
    }
  }, [transactions])

  if (summaryLoading || transactionsLoading) {
    return <DashboardSkeleton />
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

  if (!summary) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {selectedMonth ? `${monthOptions.find(o => o.value === selectedMonth)?.label} - Finansal Özet` : 'Aralık 2025 - Finansal Özet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton 
            transactions={transactions} 
            filename={`gelir-gider-${selectedMonth}`}
          />
          <div className="w-64">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Stat Cards - Show filtered stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Gelir"
          value={filteredStats.income}
          icon="📈"
        />
        <StatCard
          title="Gider"
          value={filteredStats.expense}
          icon="📉"
        />
        <StatCard
          title="Bakiye"
          value={filteredStats.balance}
          icon="💰"
        />
        <StatCard
          title="İşlem Sayısı"
          value={filteredStats.count}
          icon="📊"
          format="number"
        />
      </div>

      {/* Charts - Show overall summary */}
      {summary && (
        <>
          {/* Trend Chart */}
          {allTransactions && allTransactions.length > 0 && (
            <TrendChart transactions={allTransactions} months={6} />
          )}

          {/* Monthly Comparison */}
          <MonthlyComparison 
            currentMonth={{
              income: summary.totals.income,
              expense: summary.totals.expense,
              month: summary.period.month
            }}
            previousMonth={{
              income: summary.comparison.previousMonth.income,
              expense: summary.comparison.previousMonth.expense,
              month: 'Önceki Ay'
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyTrendChart data={summary.weeklyTrend} />
            <CategoryPieChart categories={summary.topCategories} />
          </div>

          {/* Top Categories and Recurring Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopCategories categories={summary.topCategories} />
            <RecurringPayments payments={summary.recurringPayments} />
          </div>
        </>
      )}

      {/* Filtered Transactions */}
      <TransactionTable
        transactions={transactions}
        title={`İşlemler (${transactions.length})`}
        limit={50}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
