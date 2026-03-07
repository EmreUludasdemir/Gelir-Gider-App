'use client'

import Link from 'next/link'
import { ArrowRight, CopyCheck, FileUp, ListChecks, Sparkles } from 'lucide-react'
import type { DashboardSummary } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface DashboardHeroProps {
  summary: DashboardSummary
}

function getHealthLabel(savingsRate: number) {
  if (savingsRate >= 20) return { label: 'Cok guclu', tone: 'text-success' }
  if (savingsRate >= 10) return { label: 'Dengeli', tone: 'text-primary' }
  if (savingsRate >= 0) return { label: 'Kirilgan', tone: 'text-warning' }
  return { label: 'Riskli', tone: 'text-destructive' }
}

export function DashboardHero({ summary }: DashboardHeroProps) {
  const income = Number(summary.totals.income || 0)
  const expense = Number(summary.totals.expense || 0)
  const balance = Number(summary.totals.balance || 0)

  const savingsRate = income > 0 ? (balance / income) * 100 : 0
  const expenseRatio = income > 0 ? (expense / income) * 100 : 0
  const health = getHealthLabel(savingsRate)

  const quickActions = [
    {
      href: '/dashboard/upload',
      title: 'PDF Yukle',
      description: 'Ekstreyi tek adimda isle',
      icon: FileUp,
    },
    {
      href: '/dashboard/transactions',
      title: 'Islem Merkezi',
      description: 'Tum islemleri filtrele ve duzenle',
      icon: ListChecks,
    },
    {
      href: '/dashboard/duplicates',
      title: 'Kopyalari Coz',
      description: 'Tekrarlanan kayitlari temizle',
      icon: CopyCheck,
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 md:p-8 shadow-[0_20px_50px_rgba(15,76,92,0.12)] backdrop-blur-xl animate-slide-up">
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Finans Nabzi
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-foreground md:text-3xl">
              Bu ayki para akisini netlestir
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Tasarruf orani, gider baskisi ve bakiye sinyalin tek panelde. Hemen aksiyon al.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-success/30 bg-success/10 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasarruf Orani</p>
              <p className={`mt-1 text-lg font-bold ${health.tone}`}>
                {savingsRate.toFixed(1)}%
              </p>
              <p className={`text-xs font-medium ${health.tone}`}>{health.label}</p>
            </div>

            <div className="rounded-2xl border border-warning/35 bg-warning/10 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Gider Baskisi</p>
              <p className="mt-1 text-lg font-bold text-warning">
                {expenseRatio.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Gelire gore gider yuklu</p>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Net Bakiye</p>
              <p className={`mt-1 text-lg font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balance))}
              </p>
              <p className="text-xs text-muted-foreground">
                Gelir {formatCurrency(income)} | Gider {formatCurrency(expense)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-border/70 bg-background/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_26px_rgba(15,76,92,0.16)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                </div>
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Ac
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
