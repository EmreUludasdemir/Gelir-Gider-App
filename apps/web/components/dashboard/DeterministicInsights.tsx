import { DashboardSummary, Transaction, Budget, DuplicateGroup } from '@/lib/api'
import { AlertCircle, TrendingUp, TrendingDown, PieChart, Info, Wallet, Layers, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Insight {
  id: string
  title: string
  explanation: string
  severity: 'positive' | 'info' | 'warning' | 'critical'
  actionLabel?: string
  actionUrl?: string
  icon: any
}

interface DeterministicInsightsProps {
  summary: DashboardSummary
  transactions: Transaction[]
  budgets: Budget[]
  duplicateGroups: DuplicateGroup[]
}

export function DeterministicInsights({ summary, transactions, budgets, duplicateGroups }: DeterministicInsightsProps) {
  const insights: Insight[] = []

  // 1. Spending increased compared to previous period
  if (summary.comparison.changePercentage.expense > 15) {
    insights.push({
      id: 'spending-increase',
      title: 'Spending Increased',
      explanation: `Your expenses are ${summary.comparison.changePercentage.expense.toFixed(0)}% higher than the previous period.`,
      severity: 'warning',
      actionLabel: 'Review Transactions',
      actionUrl: '/dashboard/transactions',
      icon: TrendingUp
    })
  } else if (summary.comparison.changePercentage.expense < -10) {
    insights.push({
      id: 'spending-decrease',
      title: 'Great Job Saving!',
      explanation: `Your expenses are ${Math.abs(summary.comparison.changePercentage.expense).toFixed(0)}% lower than the previous period.`,
      severity: 'positive',
      icon: TrendingDown
    })
  }

  // 2. Positive savings rate detected
  const income = summary.totals.income
  const expense = summary.totals.expense
  const savingsRate = income > 0 ? (income - expense) / income : 0
  if (savingsRate > 0.15) {
    insights.push({
      id: 'high-savings',
      title: 'Positive Savings Rate Detected',
      explanation: `You are saving ${(savingsRate * 100).toFixed(0)}% of your income this month.`,
      severity: 'positive',
      icon: ShieldCheck
    })
  }

  // 3. This category is close to its budget & No budget exists
  let closeCount = 0
  budgets.forEach(b => {
    const usage = (b.spent || 0) / b.limitAmount
    if (usage >= 0.85 && usage <= 1.0) {
      closeCount++
      if (closeCount <= 2) {
        insights.push({
          id: `budget-close-${b.id}`,
          title: 'Category Near Limit',
          explanation: `${b.categoryLabel} is at ${(usage * 100).toFixed(0)}% of its budget limit.`,
          severity: 'warning',
          actionLabel: 'Manage Budgets',
          actionUrl: '/dashboard/budgets',
          icon: PieChart
        })
      }
    }
  })

  // 4. No budget exists for a high-spend category
  const topExpenseCats = summary.topCategories.filter(c => c.total > 0)
  for (const cat of topExpenseCats) {
    const hasBudget = budgets.some(b => b.categoryId === cat.categoryId)
    if (!hasBudget && cat.total > 1000) { // Arbitrary high threshold
      insights.push({
        id: `no-budget-${cat.categoryId}`,
        title: 'High Spend, No Budget',
        explanation: `You spent a lot on ${cat.categoryLabel} but don't have a budget set for it.`,
        severity: 'info',
        actionLabel: 'Create Budget',
        actionUrl: '/dashboard/budgets',
        icon: Wallet
      })
      break // only show one
    }
  }

  // 5. Possible duplicate transactions found
  const activeDups = duplicateGroups?.filter(g => g.transactions.length > 1) || []
  if (activeDups.length > 0) {
    insights.push({
      id: 'duplicates-found',
      title: 'Possible Duplicate Transactions',
      explanation: `We detected ${activeDups.length} groups of similar transactions that might be duplicates.`,
      severity: 'warning',
      actionLabel: 'Review Duplicates',
      actionUrl: '/dashboard/duplicates',
      icon: Layers
    })
  }

  // 6. Uncategorized transactions need review
  const uncategorizedCount = transactions.filter(t => !t.categoryId || t.categoryId === 'uncategorized' || t.categoryLabel === 'Uncategorized').length
  if (uncategorizedCount > 0) {
    insights.push({
      id: 'uncategorized',
      title: 'Uncategorized Transactions',
      explanation: `You have ${uncategorizedCount} transaction${uncategorizedCount > 1 ? 's' : ''} missing a category. Categorizing them improves your reports.`,
      severity: 'info',
      actionLabel: 'Review Transactions',
      actionUrl: '/dashboard/transactions',
      icon: Info
    })
  }

  // 7. Large transaction detected
  if (transactions.length > 0 && expense > 0) {
    const avgTransaction = expense / Math.max(1, transactions.length)
    const largeTx = transactions.find(t => t.type === 'expense' && t.amount > avgTransaction * 4 && t.amount > 500)
    if (largeTx) {
      insights.push({
        id: `large-tx-${largeTx.id}`,
        title: 'Large Transaction Detected',
        explanation: `A large expense of ${largeTx.amount} was recorded at ${largeTx.description}.`,
        severity: 'info',
        actionLabel: 'View Details',
        actionUrl: '/dashboard/transactions',
        icon: AlertCircle
      })
    }
  }

  const toneClasses = {
    positive: 'bg-success/5 border-success/20',
    info: 'bg-primary/5 border-primary/20',
    warning: 'bg-warning/5 border-warning/20',
    critical: 'bg-destructive/5 border-destructive/20',
  }
  
  const iconTones = {
    positive: 'text-success bg-success/10',
    info: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    critical: 'text-destructive bg-destructive/10',
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-foreground">Smart Insights</h3>
        <p className="text-sm text-muted-foreground">Automatic pattern detection based on your data</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.slice(0, 6).map(insight => {
          const Icon = insight.icon
          return (
            <div key={insight.id} className={`flex flex-col justify-between rounded-2xl border p-4 ${toneClasses[insight.severity]}`}>
              <div>
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconTones[insight.severity]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.explanation}</p>
                  </div>
                </div>
              </div>
              
              {(insight.actionLabel && insight.actionUrl) && (
                <div className="mt-4 flex justify-end">
                  <Link href={insight.actionUrl} className="text-xs font-semibold hover:underline">
                    {insight.actionLabel} &rarr;
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
