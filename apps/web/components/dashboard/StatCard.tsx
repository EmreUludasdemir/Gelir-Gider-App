'use client'

import { memo, useMemo } from 'react'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { cn } from '@/lib/utils'


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

function getChangeColor(change: number): string {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

function getChangeIcon(change: number): React.ReactNode {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '→'
}

export const StatCard = memo(function StatCard({
  title,
  value,
  currency = 'TRY',
  change,
  icon,
  format = 'currency'
}: StatCardProps) {
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  
  const formattedValue = useMemo(() => {
    if (format === 'number') {
      return value.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')
    }
    return formatCurrency(value)
  }, [value, format, formatCurrency, language])

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
    <div className={cn(
      cardClass,
      "hover-lift group cursor-default relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
      "border border-border/70 hover:border-primary/30",
      "bg-card/70 dark:bg-card/45 backdrop-blur-xl",
      "shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
      "hover:shadow-[0_20px_40px_rgba(15,76,92,0.08)] dark:hover:shadow-[0_20px_40px_rgba(15,76,92,0.15)]",
      "animate-scale-in"
    )}>
      {/* Visual top border indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2",
        icon === 'up' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
        icon === 'down' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
        'bg-gradient-to-r from-primary-400 to-primary-600'
      )} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground/80 mb-2.5 uppercase tracking-[0.12em]">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight truncate tabular-nums">
            {formattedValue}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md",
                change > 0 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : change < 0 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                  : 'bg-muted/40 border-muted/50 text-muted-foreground'
              )}>
                <span>{getChangeIcon(change)}</span>
                <span>{Math.abs(change).toFixed(1)}%</span>
              </span>
              <span className="text-[11px] text-muted-foreground/90 font-medium">
                {language === 'tr' ? 'geçen aya göre' : 'vs last month'}
              </span>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          {renderIcon()}
        </div>
      </div>

      {/* Modern Gradient glow effect when hovered */}
      <div 
        className={cn(
          "absolute -bottom-24 -right-24 w-48 h-48 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none blur-3xl",
          icon === 'up' ? 'bg-emerald-500' :
          icon === 'down' ? 'bg-rose-500' :
          'bg-primary'
        )}
      />
    </div>
  )
})



