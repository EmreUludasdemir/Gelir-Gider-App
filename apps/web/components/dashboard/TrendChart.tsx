'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Transaction } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface TrendChartProps {
  transactions: Transaction[]
  months?: number
  baseDate?: Date | string
}

export function TrendChart({ transactions, months = 6, baseDate }: TrendChartProps) {
  const chartData = useMemo(() => {
    // Son N ay için veri hazırla
    const anchor = baseDate ? new Date(baseDate) : new Date()
    const now = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const data: Array<{
      month: string
      income: number
      expense: number
      balance: number
    }> = []

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = targetDate.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })

      // Bu aya ait işlemleri filtrele
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === targetDate.getFullYear() &&
               tDate.getMonth() === targetDate.getMonth()
      })

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      data.push({
        month: monthName,
        income,
        expense,
        balance: income - expense
      })
    }

    return data
  }, [transactions, months, baseDate])

  const formatTooltipValue = (value: number | string | Array<number | string>) => {
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return formatCurrency(numValue, 'TRY')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gelir-Gider Trendi (Son {months} Ay)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="month" 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value) || 0, 'TRY')}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '0.5rem'
              }}
              labelStyle={{ color: 'var(--tooltip-text, #111827)' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Gelir"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Gider"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Net"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


