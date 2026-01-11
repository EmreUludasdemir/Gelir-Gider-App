'use client'

import { memo, useMemo } from 'react'
import { formatCurrency, getChangeIcon, getChangeColor } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  currency?: string
  change?: number
  icon?: 'up' | 'down' | 'wallet' | string
  format?: 'currency' | 'number'
}

const iconMap: Record<string, React.ReactNode> = {
  up: (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    </div>
  ),
  down: (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    </div>
  ),
  wallet: (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    </div>
  ),
}

export const StatCard = memo(function StatCard({
  title,
  value,
  currency = 'TRY',
  change,
  icon,
  format = 'currency'
}: StatCardProps) {
  const formattedValue = useMemo(() => {
    if (format === 'number') {
      return value.toLocaleString('tr-TR')
    }
    return formatCurrency(value, currency)
  }, [value, currency, format])

  const cardClass = useMemo(() => {
    if (icon === 'up') return 'stat-card-income'
    if (icon === 'down') return 'stat-card-expense'
    return 'stat-card'
  }, [icon])

  const renderIcon = () => {
    if (!icon) return null
    if (iconMap[icon]) return iconMap[icon]
    return <div className="text-3xl md:text-4xl">{icon}</div>
  }

  return (
    <div className={`${cardClass} hover-lift group cursor-default`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground truncate">
            {formattedValue}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${getChangeColor(change)}`}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-current/10">
                {getChangeIcon(change)}
              </span>
              <span>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs ml-1">vs Ã¶nceki ay</span>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
          {renderIcon()}
        </div>
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: icon === 'up'
            ? 'radial-gradient(circle, #10b981 0%, transparent 70%)'
            : icon === 'down'
              ? 'radial-gradient(circle, #f43f5e 0%, transparent 70%)'
              : 'radial-gradient(circle, #0f4c5c 0%, transparent 70%)'
        }}
      />
    </div>
  )
})


