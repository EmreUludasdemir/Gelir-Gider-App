'use client'

import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

type StatType = 'income' | 'expense' | 'balance' | 'savings' | 'default'

interface StatCardProps {
  title: string
  value: number
  currency?: string
  change?: number
  type?: StatType
  icon?: 'up' | 'down' | 'wallet' | 'savings' | 'card'
  format?: 'currency' | 'number'
}

const iconMap = {
  up: TrendingUp,
  down: TrendingDown,
  wallet: Wallet,
  savings: PiggyBank,
  card: CreditCard,
}

const typeStyles: Record<StatType, { bg: string; iconBg: string; iconColor: string }> = {
  income: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-100 dark:border-emerald-900/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  expense: {
    bg: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-rose-100 dark:border-rose-900/50',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  balance: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  savings: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-100 dark:border-amber-900/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  default: {
    bg: 'bg-card border-border',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
}

export const StatCard = memo(function StatCard({
  title,
  value,
  currency = 'TRY',
  change,
  type,
  icon,
  format = 'currency'
}: StatCardProps) {
  const formattedValue = useMemo(() => {
    if (format === 'number') {
      return value.toLocaleString('tr-TR')
    }
    return formatCurrency(value, currency)
  }, [value, currency, format])

  // Determine type from icon if not provided
  const cardType: StatType = type || (icon === 'up' ? 'income' : icon === 'down' ? 'expense' : icon === 'wallet' ? 'balance' : 'default')
  const styles = typeStyles[cardType]
  const IconComponent = icon ? iconMap[icon] : null

  return (
    <Card className={`${styles.bg} border hover:shadow-lg transition-all duration-200 overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground truncate">
              {formattedValue}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                change > 0 ? 'text-emerald-600 dark:text-emerald-400' : change < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
              }`}>
                {change > 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : change < 0 ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : null}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal text-xs ml-1">vs geçen ay</span>
              </div>
            )}
          </div>
          {IconComponent && (
            <div className={`${styles.iconBg} ${styles.iconColor} p-3 rounded-xl`}>
              <IconComponent className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
