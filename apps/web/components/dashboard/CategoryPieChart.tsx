'use client'

import { memo, useMemo } from 'react'
import { CategorySummary } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { getCategoryColor } from '@/lib/categoryColors'

interface CategoryPieChartProps {
  categories: CategorySummary[]
}

interface ChartDataItem {
  name: string
  value: number
  percentage: number
  categoryId: string
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartDataItem }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    return (
      <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)}
        </p>
        <p className="text-sm text-muted-foreground">
          {data.percentage.toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}

export const CategoryPieChart = memo(function CategoryPieChart({ categories }: CategoryPieChartProps) {
  const data = useMemo(() => categories.map(cat => ({
    name: cat.categoryLabel,
    value: cat.total,
    percentage: cat.percentage,
    categoryId: cat.categoryId,
    color: getCategoryColor(cat.categoryId),
  })), [categories])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Harcama Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: PieLabelRenderProps) => {
                const entry = props as unknown as ChartDataItem
                return `${entry.percentage.toFixed(0)}%`
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})


