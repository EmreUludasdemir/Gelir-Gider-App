'use client'

import { CategorySummary } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { getCategoryColor } from '@/lib/categoryColors'

interface CategoryPieChartProps {
  categories: CategorySummary[]
}

export function CategoryPieChart({ categories }: CategoryPieChartProps) {
  const data = categories.map(cat => ({
    name: cat.categoryLabel,
    value: cat.total,
    percentage: cat.percentage,
    categoryId: cat.categoryId,
    color: getCategoryColor(cat.categoryId),
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium mb-1">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-gray-500">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

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
              label={(entry: any) => `${entry.percentage.toFixed(0)}%`}
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
}
