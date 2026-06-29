import { Budget } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Dashboard2BudgetPressureProps {
  budgets: Budget[]
}

export function Dashboard2BudgetPressure({ budgets }: Dashboard2BudgetPressureProps) {
  if (budgets.length === 0) {
    return null
  }

  const enrichedBudgets = budgets.map(b => ({
    ...b,
    usage: (b.spent || 0) / b.limitAmount
  })).sort((a, b) => b.usage - a.usage)

  const safeCount = enrichedBudgets.filter(b => b.usage < 0.7).length
  const watchCount = enrichedBudgets.filter(b => b.usage >= 0.7 && b.usage <= 1).length
  const overCount = enrichedBudgets.filter(b => b.usage > 1).length

  const topRisks = enrichedBudgets.slice(0, 3).filter(b => b.usage >= 0.7)

  let recommendation = "All your budgets are looking safe. Keep up the good work!"
  if (overCount > 0) {
    recommendation = `You have ${overCount} categor${overCount > 1 ? 'ies' : 'y'} over budget. Consider reducing spending in ${topRisks[0]?.categoryLabel} immediately.`
  } else if (watchCount > 0) {
    recommendation = `${topRisks[0]?.categoryLabel} is at ${(topRisks[0]?.usage * 100).toFixed(0)}% of its limit. Slow down spending here to stay within budget.`
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Budget Pressure</h3>
          <p className="text-sm text-muted-foreground">{recommendation}</p>
        </div>
        <Link href="/dashboard/budgets" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Manage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-success/10 p-4 border border-success/20">
          <CheckCircle2 className="h-6 w-6 text-success mb-2" />
          <span className="text-2xl font-bold text-success">{safeCount}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-success/80">Safe</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-warning/10 p-4 border border-warning/20">
          <AlertTriangle className="h-6 w-6 text-warning mb-2" />
          <span className="text-2xl font-bold text-warning">{watchCount}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-warning/80">Watch</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-destructive/10 p-4 border border-destructive/20">
          <AlertCircle className="h-6 w-6 text-destructive mb-2" />
          <span className="text-2xl font-bold text-destructive">{overCount}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-destructive/80">Over</span>
        </div>
      </div>

      {topRisks.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Risks</h4>
          {topRisks.map(b => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <span className="text-2xl shrink-0">📊</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{b.categoryLabel}</p>
                  <p className="text-xs text-muted-foreground truncate">{formatCurrency(b.spent || 0)} of {formatCurrency(b.limitAmount)}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${b.usage > 1 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  {(b.usage * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
