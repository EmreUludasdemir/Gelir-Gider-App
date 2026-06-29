import { DashboardSummary } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Dashboard2HeroProps {
  summary: DashboardSummary
  budgetUsage: number // 0 to 1
  overbudgetCount: number
}

export function Dashboard2Hero({ summary, budgetUsage, overbudgetCount }: Dashboard2HeroProps) {
  const isHealthy = summary.totals.income >= summary.totals.expense && overbudgetCount === 0
  const isWarning = summary.totals.income < summary.totals.expense || overbudgetCount > 0
  const isCritical = overbudgetCount > 2 || budgetUsage > 1

  let statusText = 'Your finances are stable.'
  let statusColor = 'text-success'
  let bgBadge = 'bg-success/10 border-success/20 text-success'

  if (isCritical) {
    statusText = `Attention: ${overbudgetCount} budget categories are over limit.`
    statusColor = 'text-destructive'
    bgBadge = 'bg-destructive/10 border-destructive/20 text-destructive'
  } else if (isWarning) {
    if (overbudgetCount > 0) {
      statusText = `${overbudgetCount} categories need your attention soon.`
    } else {
      statusText = 'You are spending more than your income this month.'
    }
    statusColor = 'text-warning'
    bgBadge = 'bg-warning/10 border-warning/20 text-warning'
  }

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card/60 p-8 shadow-sm backdrop-blur-xl md:p-10">
      <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {summary.period.month} {summary.period.year}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bgBadge}`}>
              {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Healthy'}
            </span>
          </div>
          
          <div>
            <h2 className="text-5xl font-display font-bold tracking-tight text-foreground sm:text-6xl">
              {formatCurrency(summary.totals.balance)}
            </h2>
            <p className="mt-2 text-lg font-medium text-muted-foreground">Net Balance</p>
          </div>
        </div>

        <div className="max-w-xs md:text-right">
          <p className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Smart Pattern Detection
          </p>
        </div>
      </div>
      
      {/* Decorative background gradient */}
      <div className="absolute -right-20 -top-20 z-0 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
      <div className={`absolute -bottom-20 -left-20 z-0 h-64 w-64 rounded-full blur-[80px] ${isCritical ? 'bg-destructive/5' : isWarning ? 'bg-warning/5' : 'bg-success/5'}`} />
    </section>
  )
}
