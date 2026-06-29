import { formatCurrency } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, Wallet, Percent, PieChart, Repeat, AlertTriangle, Calendar } from 'lucide-react'

interface Dashboard2KPIsProps {
  income: number
  expense: number
  balance: number
  savingsRate: number
  budgetUsage: number
  recurringLoad: number
  upcomingCount: number
  riskyCategoriesCount: number
}

function KPICard({ title, value, subtitle, icon: Icon, tone = 'default' }: any) {
  const tones = {
    default: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    danger: 'text-destructive bg-destructive/10 border-destructive/20',
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone as keyof typeof tones]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

export function Dashboard2KPIs(props: Dashboard2KPIsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Income"
        value={formatCurrency(props.income)}
        icon={ArrowUpIcon}
        tone="success"
      />
      <KPICard
        title="Expenses"
        value={formatCurrency(props.expense)}
        icon={ArrowDownIcon}
        tone="danger"
      />
      <KPICard
        title="Net Balance"
        value={formatCurrency(props.balance)}
        icon={Wallet}
        tone={props.balance >= 0 ? 'success' : 'danger'}
      />
      <KPICard
        title="Savings Rate"
        value={`${(props.savingsRate * 100).toFixed(1)}%`}
        subtitle="of total income"
        icon={Percent}
        tone={props.savingsRate >= 0.2 ? 'success' : props.savingsRate > 0 ? 'default' : 'danger'}
      />
      
      <KPICard
        title="Budget Usage"
        value={`${(props.budgetUsage * 100).toFixed(1)}%`}
        icon={PieChart}
        tone={props.budgetUsage > 1 ? 'danger' : props.budgetUsage > 0.8 ? 'warning' : 'success'}
      />
      <KPICard
        title="Recurring Load"
        value={`${(props.recurringLoad * 100).toFixed(1)}%`}
        subtitle="of monthly expenses"
        icon={Repeat}
        tone={props.recurringLoad > 0.5 ? 'warning' : 'default'}
      />
      <KPICard
        title="Upcoming Bills"
        value={props.upcomingCount.toString()}
        icon={Calendar}
        tone="default"
      />
      <KPICard
        title="Risky Budgets"
        value={props.riskyCategoriesCount.toString()}
        subtitle=">= 70% usage"
        icon={AlertTriangle}
        tone={props.riskyCategoriesCount > 0 ? 'warning' : 'success'}
      />
    </div>
  )
}
