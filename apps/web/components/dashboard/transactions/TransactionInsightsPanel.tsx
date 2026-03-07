'use client'

import { useMemo } from 'react'
import { BarChart3, Copy, TrendingDown, TrendingUp } from 'lucide-react'
import { Transaction } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface TransactionInsightsPanelProps {
  transactions: Transaction[]
  duplicateCount: number
}

interface CategoryStats {
  label: string
  total: number
}

function inRange(date: Date, from: Date, to: Date) {
  return date >= from && date <= to
}

export function TransactionInsightsPanel({
  transactions,
  duplicateCount,
}: TransactionInsightsPanelProps) {
  const { showToast } = useToast()

  const insights = useMemo(() => {
    const enriched = transactions.map((tx) => ({
      ...tx,
      absAmount: Math.abs(Number(tx.amount || 0)),
      parsedDate: new Date(tx.date),
    }))

    const incomes = enriched.filter((tx) => tx.type === 'income')
    const expenses = enriched.filter((tx) => tx.type === 'expense')

    const totalIncome = incomes.reduce((sum, tx) => sum + tx.absAmount, 0)
    const totalExpense = expenses.reduce((sum, tx) => sum + tx.absAmount, 0)
    const net = totalIncome - totalExpense
    const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0

    const largestExpense = expenses.reduce<typeof expenses[number] | null>(
      (max, tx) => (max === null || tx.absAmount > max.absAmount ? tx : max),
      null,
    )

    const categoryMap = expenses.reduce((acc, tx) => {
      const current = acc.get(tx.categoryLabel) || 0
      acc.set(tx.categoryLabel, current + tx.absAmount)
      return acc
    }, new Map<string, number>())

    const topCategory: CategoryStats | null =
      categoryMap.size > 0
        ? Array.from(categoryMap.entries())
            .map(([label, total]) => ({ label, total }))
            .sort((a, b) => b.total - a.total)[0]
        : null

    const now =
      enriched.length > 0
        ? new Date(Math.max(...enriched.map((tx) => tx.parsedDate.getTime())))
        : new Date()

    const last30Start = new Date(now)
    last30Start.setDate(last30Start.getDate() - 29)

    const prev30End = new Date(last30Start)
    prev30End.setDate(prev30End.getDate() - 1)

    const prev30Start = new Date(prev30End)
    prev30Start.setDate(prev30Start.getDate() - 29)

    const last30Expense = expenses
      .filter((tx) => inRange(tx.parsedDate, last30Start, now))
      .reduce((sum, tx) => sum + tx.absAmount, 0)

    const prev30Expense = expenses
      .filter((tx) => inRange(tx.parsedDate, prev30Start, prev30End))
      .reduce((sum, tx) => sum + tx.absAmount, 0)

    const expenseTrend =
      prev30Expense > 0
        ? ((last30Expense - prev30Expense) / prev30Expense) * 100
        : 0

    const trendDirection = expenseTrend <= 0 ? 'up' : 'down'

    return {
      totalIncome,
      totalExpense,
      net,
      averageExpense,
      largestExpense,
      topCategory,
      last30Expense,
      prev30Expense,
      expenseTrend,
      trendDirection,
      transactionCount: transactions.length,
    }
  }, [transactions])

  const summaryText = useMemo(() => {
    const pieces = [
      `Islem Ozeti`,
      `Toplam islem: ${insights.transactionCount}`,
      `Gelir: ${formatCurrency(insights.totalIncome)}`,
      `Gider: ${formatCurrency(insights.totalExpense)}`,
      `Net: ${insights.net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(insights.net))}`,
      `Ortalama gider: ${formatCurrency(insights.averageExpense)}`,
      `Kopya islem: ${duplicateCount}`,
    ]

    if (insights.topCategory) {
      pieces.push(`En yuksek kategori: ${insights.topCategory.label} (${formatCurrency(insights.topCategory.total)})`)
    }
    if (insights.largestExpense) {
      pieces.push(`En buyuk gider: ${insights.largestExpense.description} (${formatCurrency(insights.largestExpense.absAmount)})`)
    }

    return pieces.join('\n')
  }, [duplicateCount, insights])

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      showToast('Finans ozeti panoya kopyalandi', 'success')
    } catch {
      showToast('Ozet kopyalanamadi', 'error')
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_16px_40px_rgba(15,76,92,0.12)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-16 right-10 h-36 w-36 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              Akilli Islem Ozeti
            </p>
            <h2 className="mt-2 text-xl font-display font-bold text-foreground">
              Islem akisini anlik takip et
            </h2>
            <p className="text-sm text-muted-foreground">
              Gelir-gider dengesini, trendi ve kritik sinyalleri tek panelde gor.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copySummary}>
            <Copy className="mr-2 h-4 w-4" />
            Ozeti Kopyala
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-success/35 bg-success/10 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gelir</p>
            <p className="mt-1 text-lg font-bold text-success">{formatCurrency(insights.totalIncome)}</p>
          </div>
          <div className="rounded-2xl border border-destructive/35 bg-destructive/10 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gider</p>
            <p className="mt-1 text-lg font-bold text-destructive">{formatCurrency(insights.totalExpense)}</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Net Durum</p>
            <p className={`mt-1 text-lg font-bold ${insights.net >= 0 ? 'text-success' : 'text-destructive'}`}>
              {insights.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(insights.net))}
            </p>
          </div>
          <div className="rounded-2xl border border-warning/35 bg-warning/10 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ortalama Gider</p>
            <p className="mt-1 text-lg font-bold text-warning">{formatCurrency(insights.averageExpense)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">30 Gunluk Gider Trendi</p>
            <div className="mt-2 flex items-center gap-2">
              {insights.trendDirection === 'up' ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <p className={`text-lg font-bold ${insights.expenseTrend <= 0 ? 'text-success' : 'text-destructive'}`}>
                {insights.expenseTrend > 0 ? '+' : ''}{insights.expenseTrend.toFixed(1)}%
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Son 30 gun: {formatCurrency(insights.last30Expense)} | Onceki 30 gun: {formatCurrency(insights.prev30Expense)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">En Yuksek Kategori</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {insights.topCategory?.label || 'Veri yok'}
            </p>
            <p className="text-sm text-primary">
              {insights.topCategory ? formatCurrency(insights.topCategory.total) : '-'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Risk Sinyali</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {insights.largestExpense?.description || 'Veri yok'}
            </p>
            <p className="text-sm text-destructive">
              {insights.largestExpense ? formatCurrency(insights.largestExpense.absAmount) : '-'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Kopya supheli islem: {duplicateCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
