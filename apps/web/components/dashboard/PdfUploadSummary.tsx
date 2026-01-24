'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Transaction } from '@/lib/api'

interface PdfSummaryProps {
  transactions: Transaction[]
  filename: string
  language?: 'tr' | 'en'
}

export function PdfUploadSummary({ transactions, filename, language = 'tr' }: PdfSummaryProps) {
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const balance = income - expense

    // Group by category
    const categoryTotals: Record<string, { amount: number; count: number }> = {}
    transactions.forEach((t) => {
      const cat = t.categoryLabel || 'Diğer'
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 }
      }
      categoryTotals[cat].amount += Math.abs(t.amount)
      categoryTotals[cat].count++
    })

    const topCategories = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Date range
    const dates = transactions.map((t) => new Date(t.date).getTime())
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null

    return {
      income,
      expense,
      balance,
      transactionCount: transactions.length,
      incomeCount: transactions.filter((t) => t.type === 'income').length,
      expenseCount: transactions.filter((t) => t.type === 'expense').length,
      topCategories,
      dateRange: { start: minDate, end: maxDate },
    }
  }, [transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const t = {
    tr: {
      title: 'Ekstre Özeti',
      file: 'Dosya',
      period: 'Dönem',
      totalIncome: 'Toplam Gelir',
      totalExpense: 'Toplam Gider',
      balance: 'Net Bakiye',
      transactions: 'işlem',
      topCategories: 'En Çok Harcanan Kategoriler',
      success: 'Başarıyla yüklendi',
    },
    en: {
      title: 'Statement Summary',
      file: 'File',
      period: 'Period',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      balance: 'Net Balance',
      transactions: 'transactions',
      topCategories: 'Top Spending Categories',
      success: 'Successfully uploaded',
    },
  }[language]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t.title}</h2>
            <p className="text-emerald-100 text-sm">{t.success}</p>
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{t.file}: <span className="font-medium text-gray-900 dark:text-white">{filename}</span></span>
          </div>
          {summary.dateRange.start && summary.dateRange.end && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{t.period}: <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(summary.dateRange.start)} - {formatDate(summary.dateRange.end)}
              </span></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalIncome}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(summary.income)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary.incomeCount} {t.transactions}
          </p>
        </div>

        {/* Expense */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalExpense}</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(summary.expense)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary.expenseCount} {t.transactions}
          </p>
        </div>

        {/* Balance */}
        <div className={`rounded-xl p-4 ${
          summary.balance >= 0
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className={`w-5 h-5 ${
              summary.balance >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.balance}</span>
          </div>
          <p className={`text-2xl font-bold ${
            summary.balance >= 0
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
          </p>
          {summary.balance < 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              <span>{language === 'tr' ? 'Negatif bakiye' : 'Negative balance'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      {summary.topCategories.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t.topCategories}
          </h3>
          <div className="space-y-2">
            {summary.topCategories.map((cat, idx) => {
              const percentage = (cat.amount / summary.expense) * 100
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-sm w-6 text-gray-500">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
