'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MonthlyData {
  month: string
  income: number
  expense: number
  savings?: number
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[]
  currency?: string
}

export function MonthlyComparisonChart({ data, currency = 'TRY' }: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      savings: item.income - item.expense,
    }))
  }, [data])

  const comparison = useMemo(() => {
    if (chartData.length < 2) return null

    const current = chartData[chartData.length - 1]
    const previous = chartData[chartData.length - 2]

    const incomeChange = ((current.income - previous.income) / previous.income) * 100
    const expenseChange = ((current.expense - previous.expense) / previous.expense) * 100
    const savingsChange = ((current.savings! - previous.savings!) / Math.abs(previous.savings!)) * 100

    return {
      income: {
        value: incomeChange,
        trend: incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'same',
      },
      expense: {
        value: expenseChange,
        trend: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'same',
      },
      savings: {
        value: savingsChange,
        trend: savingsChange > 0 ? 'up' : savingsChange < 0 ? 'down' : 'same',
      },
    }
  }, [chartData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value)
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'same' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Aylık Karşılaştırma</h3>

      {comparison && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Gelir</span>
              <TrendIcon trend={comparison.income.trend} />
            </div>
            <p className="text-xs text-gray-500">
              {comparison.income.value > 0 ? '+' : ''}
              {comparison.income.value.toFixed(1)}% vs geçen ay
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Gider</span>
              <TrendIcon trend={comparison.expense.trend} />
            </div>
            <p className="text-xs text-gray-500">
              {comparison.expense.value > 0 ? '+' : ''}
              {comparison.expense.value.toFixed(1)}% vs geçen ay
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Tasarruf</span>
              <TrendIcon trend={comparison.savings.trend} />
            </div>
            <p className="text-xs text-gray-500">
              {comparison.savings.value > 0 ? '+' : ''}
              {comparison.savings.value.toFixed(1)}% vs geçen ay
            </p>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#374151' }}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Gelir" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[4, 4, 0, 0]} />
          <Bar dataKey="savings" fill="#3b82f6" name="Tasarruf" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Toplam Gelir</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(chartData.reduce((sum, item) => sum + item.income, 0))}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Toplam Gider</p>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(chartData.reduce((sum, item) => sum + item.expense, 0))}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Net Tasarruf</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrency(chartData.reduce((sum, item) => sum + item.savings!, 0))}
          </p>
        </div>
      </div>
    </div>
  )
}
