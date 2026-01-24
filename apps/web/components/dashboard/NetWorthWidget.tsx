'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Receipt,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
} from 'lucide-react'
import { usePreferences } from '@/lib/PreferencesContext'

interface AssetItem {
  id: string
  name: string
  type: 'savings_goal' | 'receivable'
  amount: number
  currency: string
  icon?: string
}

interface LiabilityItem {
  id: string
  name: string
  type: 'debt' | 'bill'
  amount: number
  currency: string
  dueDate?: string
}

interface NetWorthData {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  currency: string
  assets: {
    savingsGoals: number
    receivables: number
    items: AssetItem[]
  }
  liabilities: {
    debts: number
    unpaidBills: number
    items: LiabilityItem[]
  }
  history: {
    date: string
    netWorth: number
  }[]
  change: {
    amount: number
    percentage: number
    period: string
  }
}

function useToken() {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])
  return token
}

const createFetcher = (token: string | null) => async (url: string) => {
  if (!token) throw new Error('No token')
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const response = await fetch(`${apiUrl}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export function NetWorthWidget() {
  const { language, currency } = usePreferences()
  const [expanded, setExpanded] = useState(false)
  const token = useToken()

  const { data, isLoading } = useSWR<NetWorthData>(
    token ? `/analytics/networth?language=${language}` : null,
    createFetcher(token),
    { refreshInterval: 5 * 60 * 1000 }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const isPositive = data.netWorth >= 0
  const changePositive = data.change.amount >= 0

  // Mini sparkline from history
  const historyValues = data.history.map((h) => h.netWorth)
  const minVal = Math.min(...historyValues)
  const maxVal = Math.max(...historyValues)
  const range = maxVal - minVal || 1

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <Wallet className={`w-5 h-5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {language === 'tr' ? 'Net Değer' : 'Net Worth'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'tr' ? 'Toplam finansal durumunuz' : 'Your total financial status'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Value */}
      <div className="p-4">
        <div className="text-center mb-4">
          <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(data.netWorth)}
          </p>
          <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${changePositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {changePositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {changePositive ? '+' : ''}{formatCurrency(data.change.amount)} ({data.change.percentage}%)
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              {language === 'tr' ? data.change.period : 'last month'}
            </span>
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="flex items-end gap-0.5 h-8 mb-4">
          {data.history.map((h, idx) => {
            const height = ((h.netWorth - minVal) / range) * 100
            const isLast = idx === data.history.length - 1
            return (
              <div
                key={h.date}
                className="flex-1 relative"
              >
                <div
                  className={`absolute bottom-0 w-full rounded-t transition-all ${
                    isLast
                      ? isPositive ? 'bg-emerald-500' : 'bg-red-500'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
              </div>
            )
          })}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'tr' ? 'Varlıklar' : 'Assets'}
              </span>
            </div>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(data.totalAssets)}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'tr' ? 'Yükümlülükler' : 'Liabilities'}
              </span>
            </div>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              {formatCurrency(data.totalLiabilities)}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
          {/* Assets Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              {language === 'tr' ? 'Varlıklar' : 'Assets'}
            </h4>
            <div className="space-y-2">
              {data.assets.items.length > 0 ? (
                data.assets.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'savings_goal' ? (
                        <span className="text-lg">{item.icon || '🎯'}</span>
                      ) : (
                        <Users className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {language === 'tr' ? 'Henüz varlık yok' : 'No assets yet'}
                </p>
              )}
            </div>
          </div>

          {/* Liabilities Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              {language === 'tr' ? 'Yükümlülükler' : 'Liabilities'}
            </h4>
            <div className="space-y-2">
              {data.liabilities.items.length > 0 ? (
                data.liabilities.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'debt' ? (
                        <Users className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Receipt className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                        {item.dueDate && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({new Date(item.dueDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {language === 'tr' ? 'Yükümlülük yok' : 'No liabilities'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'tr' ? 'Tasarruflar' : 'Savings'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.assets.savingsGoals)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'tr' ? 'Alacaklar' : 'Receivables'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.assets.receivables)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
