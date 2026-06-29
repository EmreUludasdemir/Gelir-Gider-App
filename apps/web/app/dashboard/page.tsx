'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FileUp, ListOrdered, PieChart, Repeat, PlusCircle } from 'lucide-react'
import { 
  useSummary, 
  useTransactions, 
  useBudgetStatus, 
  useSubscriptionSummary,
  useDuplicateGroups
} from '@/lib/hooks'
import { getApiErrorMessage } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/components/auth-provider'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { Dashboard2Hero } from '@/components/dashboard/Dashboard2Hero'
import { Dashboard2KPIs } from '@/components/dashboard/Dashboard2KPIs'
import { Dashboard2BudgetPressure } from '@/components/dashboard/Dashboard2BudgetPressure'
import { Dashboard2SubscriptionSummary } from '@/components/dashboard/Dashboard2SubscriptionSummary'
import { DeterministicInsights } from '@/components/dashboard/DeterministicInsights'
import { TableSkeleton } from '@/components/skeletons'

const TransactionTable = dynamic(
  () => import('@/components/dashboard/transactions').then(mod => ({ default: mod.TransactionTable })),
  { loading: () => <TableSkeleton />, ssr: false }
)

function QuickActionCard({ href, icon: Icon, title, description }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { loading: authLoading, user } = useAuth()
  
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSummary()
  const { data: transactions, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = useTransactions()
  const { data: budgets, isLoading: budgetsLoading } = useBudgetStatus()
  const { data: subscriptionSummary, isLoading: subscriptionsLoading } = useSubscriptionSummary()
  const { data: duplicateGroups } = useDuplicateGroups()

  // Wait for auth to be ready
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Handle Loading
  const isLoading = summaryLoading || transactionsLoading || budgetsLoading || subscriptionsLoading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 w-full bg-muted rounded-[32px] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-[32px] animate-pulse" />
          <div className="h-64 bg-muted rounded-[32px] animate-pulse" />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  // Handle Error
  if (summaryError || transactionsError) {
    const errorMessage = getApiErrorMessage(summaryError || transactionsError, '')
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-destructive mb-1">Failed to load Dashboard</h3>
            <p className="text-destructive/80 mb-3">{errorMessage}</p>
            <button
              onClick={() => {
                mutateSummary()
                mutateTransactions()
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!summary || !transactions) {
    return null
  }

  const isEmptyDashboard = transactions.length === 0 || summary.totals.transactionCount === 0

  if (isEmptyDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your financial command center.
          </p>
        </div>
        <DashboardEmptyState />
      </div>
    )
  }

  // Derived Metrics for Dashboard 2.0
  const income = summary.totals.income
  const expense = summary.totals.expense
  const balance = summary.totals.balance
  const savingsRate = income > 0 ? (income - expense) / income : 0
  
  const totalBudgetLimit = budgets?.reduce((sum, b) => sum + b.limitAmount, 0) || 0
  const totalBudgetSpent = budgets?.reduce((sum, b) => sum + (b.spent || 0), 0) || 0
  const budgetUsage = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0
  const overbudgetCount = budgets?.filter(b => (b.spent || 0) > b.limitAmount).length || 0
  const riskyCategoriesCount = budgets?.filter(b => ((b.spent || 0) / b.limitAmount) >= 0.7).length || 0

  const monthlyRecurring = subscriptionSummary?.totalMonthly || 0
  const recurringLoad = expense > 0 ? monthlyRecurring / expense : 0
  const upcomingCount = subscriptionSummary?.upcomingPayments?.length || 0

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <Dashboard2Hero 
        summary={summary} 
        budgetUsage={budgetUsage} 
        overbudgetCount={overbudgetCount} 
      />

      <Dashboard2KPIs 
        income={income}
        expense={expense}
        balance={balance}
        savingsRate={savingsRate}
        budgetUsage={budgetUsage}
        recurringLoad={recurringLoad}
        upcomingCount={upcomingCount}
        riskyCategoriesCount={riskyCategoriesCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Dashboard2BudgetPressure budgets={budgets || []} />
          {subscriptionSummary && <Dashboard2SubscriptionSummary summary={subscriptionSummary} />}
        </div>
        <div>
          <DeterministicInsights 
            summary={summary} 
            transactions={transactions} 
            budgets={budgets || []} 
            duplicateGroups={duplicateGroups || []} 
          />
        </div>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard 
            href="/dashboard/upload" 
            icon={FileUp} 
            title="Import PDF" 
            description="Upload bank statements" 
          />
          <QuickActionCard 
            href="/dashboard/transactions" 
            icon={ListOrdered} 
            title="Transactions" 
            description="Review all records" 
          />
          <QuickActionCard 
            href="/dashboard/budgets" 
            icon={PieChart} 
            title="Budgets" 
            description="Manage category limits" 
          />
          <QuickActionCard 
            href="/dashboard/subscriptions" 
            icon={Repeat} 
            title="Subscriptions" 
            description="Manage recurring costs" 
          />
        </div>
      </div>

      <div className="pt-4">
        <Suspense fallback={<TableSkeleton />}>
          <TransactionTable
            transactions={transactions}
            title="Recent Activity"
            limit={10}
            currentUserId={user?.id}
            onRefresh={mutateTransactions}
          />
        </Suspense>
      </div>
    </div>
  )
}
