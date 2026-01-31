'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyComparisonProps {
  currentMonth: {
    income: number
    expense: number
    month: string
  }
  previousMonth: {
    income: number
    expense: number
    month: string
  }
}

export function MonthlyComparison({ currentMonth, previousMonth }: MonthlyComparisonProps) {
  const data = [
    {
      name: previousMonth.month,
      Gelir: previousMonth.income,
      Gider: previousMonth.expense,
      Bakiye: previousMonth.income - previousMonth.expense,
    },
    {
      name: currentMonth.month,
      Gelir: currentMonth.income,
      Gider: currentMonth.expense,
      Bakiye: currentMonth.income - currentMonth.expense,
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
          <p className="font-medium mb-2">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${
              entry.name === 'Gelir' ? 'text-green-600' : 
              entry.name === 'Gider' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate changes
  const incomeChange = currentMonth.income - previousMonth.income
  const expenseChange = currentMonth.expense - previousMonth.expense
  const incomeChangePercent = previousMonth.income > 0 
    ? ((incomeChange / previousMonth.income) * 100).toFixed(1) 
    : '0'
  const expenseChangePercent = previousMonth.expense > 0 
    ? ((expenseChange / previousMonth.expense) * 100).toFixed(1) 
    : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aylık Karşılaştırma</CardTitle>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Gelir Değişimi</p>
            <p className={`font-semibold ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {incomeChange >= 0 ? '+' : ''}{formatCurrency(incomeChange)} ({incomeChange >= 0 ? '+' : ''}{incomeChangePercent}%)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Gider Değişimi</p>
            <p className={`font-semibold ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {expenseChange >= 0 ? '+' : ''}{formatCurrency(expenseChange)} ({expenseChange >= 0 ? '+' : ''}{expenseChangePercent}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Gelir" fill="#10b981" />
            <Bar dataKey="Gider" fill="#ef4444" />
            <Bar dataKey="Bakiye" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


