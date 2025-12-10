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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">
              {formatValue()}
            </p>
            {change !== undefined && (
              <p className={`text-sm mt-1 ${getChangeColor(change)}`}>
                {getChangeIcon(change)} {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </p>
            )}
          </div>
          {icon && <div className="text-3xl md:text-4xl ml-2 md:ml-4 flex-shrink-0">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
