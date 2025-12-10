'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency, getChangeIcon, getChangeColor } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  currency?: string
  change?: number
  icon?: string
  format?: 'currency' | 'number'
}

export function StatCard({ 
  title, 
  value, 
  currency = 'TRY', 
  change, 
  icon,
  format = 'currency'
}: StatCardProps) {
  const formatValue = () => {
    if (format === 'number') {
      return value.toLocaleString('tr-TR')
    }
    return formatCurrency(value, currency)
  }

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue()}
            </p>
            {change !== undefined && (
              <p className={`text-sm mt-1 ${getChangeColor(change)}`}>
                {getChangeIcon(change)} {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </p>
            )}
          </div>
          {icon && <div className="text-4xl ml-4">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
