import { SubscriptionSummary } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowRight, Repeat, Search, TrendingDown, CalendarClock } from 'lucide-react'
import Link from 'next/link'

interface Dashboard2SubscriptionSummaryProps {
  summary: SubscriptionSummary
}

export function Dashboard2SubscriptionSummary({ summary }: Dashboard2SubscriptionSummaryProps) {
  if (!summary) return null

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Subscriptions</h3>
          <p className="text-sm text-muted-foreground">Monthly Recurring Summary</p>
        </div>
        <Link href="/dashboard/subscriptions" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Review <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col rounded-2xl bg-primary/5 p-4 border border-primary/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
            <Repeat className="h-3.5 w-3.5" /> Total Monthly
          </span>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalMonthly)}</span>
        </div>
        
        <div className="flex flex-col rounded-2xl bg-muted/30 p-4 border border-border/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
            <Search className="h-3.5 w-3.5" /> Suspected
          </span>
          <span className="text-2xl font-bold text-foreground">
            {summary.detectedSuggestions.length}
          </span>
        </div>
      </div>

      {summary.upcomingPayments.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" /> Upcoming Payments
          </h4>
          <div className="space-y-2">
            {summary.upcomingPayments.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{formatDate(p.date)}</p>
                </div>
                <span className="font-semibold shrink-0">{formatCurrency(p.amount, p.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.savingsOpportunities?.length > 0 && (
        <div className="mt-2 rounded-xl bg-success/10 p-3 border border-success/20 flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">Savings Found</p>
            <p className="text-xs text-success/80">You have {summary.savingsOpportunities.length} opportunit{summary.savingsOpportunities.length > 1 ? 'ies' : 'y'} to save money.</p>
          </div>
        </div>
      )}
    </div>
  )
}
