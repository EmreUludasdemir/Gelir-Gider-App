'use client'

import { useState, useMemo } from 'react'
import { useTransactions } from '@/lib/hooks'
import { usePreferences } from '@/lib/PreferencesContext'
import { Spinner } from '@/components/ui/Spinner'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Wallet,
} from 'lucide-react'
import { Transaction } from '@/lib/api'

interface MonthlyStatement {
  month: number
  year: number
  label: string
  income: number
  expense: number
  balance: number
  transactionCount: number
  topCategories: { name: string; amount: number }[]
  transactions: Transaction[]
}

export default function StatementsPage() {
  const { data: transactions, isLoading, error } = useTransactions()
  const { language, currency } = usePreferences()
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  const statements = useMemo(() => {
    if (!transactions) return []

    // Group transactions by month
    const monthlyData: Record<string, Transaction[]> = {}

    transactions.forEach((tx) => {
      const date = new Date(tx.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[key]) monthlyData[key] = []
      monthlyData[key].push(tx)
    })

    // Calculate monthly statements
    const result: MonthlyStatement[] = Object.entries(monthlyData)
      .map(([key, txs]) => {
        const [year, month] = key.split('-').map(Number)
        const date = new Date(year, month - 1, 1)

        const income = txs
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const expense = txs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        // Top categories
        const categoryTotals: Record<string, number> = {}
        txs
          .filter((t) => t.type === 'expense')
          .forEach((t) => {
            const cat = t.categoryLabel || 'Diğer'
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount)
          })

        const topCategories = Object.entries(categoryTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        return {
          month,
          year,
          label: date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            year: 'numeric',
            month: 'long',
          }),
          income,
          expense,
          balance: income - expense,
          transactionCount: txs.length,
          topCategories,
          transactions: txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    return result
  }, [transactions, language])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const toggleExpand = (key: string) => {
    setExpandedMonth(expandedMonth === key ? null : key)
  }

  // Calculate totals
  const totals = useMemo(() => {
    return statements.reduce(
      (acc, s) => ({
        income: acc.income + s.income,
        expense: acc.expense + s.expense,
        balance: acc.balance + s.balance,
        transactions: acc.transactions + s.transactionCount,
      }),
      { income: 0, expense: 0, balance: 0, transactions: 0 }
    )
  }, [statements])

  const t = {
    tr: {
      title: 'Aylık Ekstreler',
      subtitle: 'Ay bazında gelir-gider özetiniz',
      totalIncome: 'Toplam Gelir',
      totalExpense: 'Toplam Gider',
      netBalance: 'Net Bakiye',
      transactions: 'işlem',
      topCategories: 'En Çok Harcanan',
      noData: 'Henüz işlem verisi yok',
      loadError: 'Veri yüklenirken hata oluştu',
    },
    en: {
      title: 'Monthly Statements',
      subtitle: 'Your monthly income-expense summary',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      netBalance: 'Net Balance',
      transactions: 'transactions',
      topCategories: 'Top Categories',
      noData: 'No transaction data yet',
      loadError: 'Error loading data',
    },
  }[language]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{t.loadError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'tr' ? 'Toplam Ay' : 'Total Months'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statements.length}</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalIncome}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(totals.income)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalExpense}</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totals.expense)}
          </p>
        </div>

        <div className={`rounded-xl p-4 border ${
          totals.balance >= 0
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className={`w-5 h-5 ${totals.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.netBalance}</span>
          </div>
          <p className={`text-2xl font-bold ${
            totals.balance >= 0
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      {/* Monthly Statements List */}
      {statements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {statements.map((statement) => {
            const key = `${statement.year}-${statement.month}`
            const isExpanded = expandedMonth === key

            return (
              <div
                key={key}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Statement Header */}
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {statement.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statement.transactionCount} {t.transactions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(statement.income)}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        -{formatCurrency(statement.expense)}
                      </p>
                    </div>
                    <div className={`text-right min-w-[100px] ${
                      statement.balance >= 0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      <p className="font-bold">
                        {statement.balance >= 0 ? '+' : ''}{formatCurrency(statement.balance)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalIncome}</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(statement.income)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalExpense}</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(statement.expense)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.netBalance}</p>
                          <p className={`text-lg font-bold ${
                            statement.balance >= 0 ? 'text-blue-600' : 'text-amber-600'
                          }`}>
                            {formatCurrency(statement.balance)}
                          </p>
                        </div>
                      </div>

                      {/* Top Categories */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {t.topCategories}
                        </h4>
                        <div className="space-y-1">
                          {statement.topCategories.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(cat.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {language === 'tr' ? 'Son İşlemler' : 'Recent Transactions'}
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {statement.transactions.slice(0, 10).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {tx.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(tx.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')} • {tx.categoryLabel}
                              </p>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                tx.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
