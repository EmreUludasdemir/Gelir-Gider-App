'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSummary } from '@/lib/hooks'
import { LayoutDashboard, ListChecks, FileUp, Target, MessageCircle } from 'lucide-react'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}

export default function Home() {
  const { data: summary } = useSummary()
  const totals = summary?.totals

  const income = useMemo(() => (totals ? formatCurrency(totals.income) : '--'), [totals])
  const expense = useMemo(() => (totals ? formatCurrency(totals.expense) : '--'), [totals])
  const balance = useMemo(() => (totals ? formatCurrency(totals.balance) : '--'), [totals])

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="space-y-6 animate-page-enter">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Finans ozeti
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-display text-foreground">Gelir-Gider Takip</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                Ana sayfa yalnizca arti ve eksi toplamlarini gosterir. Detaylar icin bolumlere gecin.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-card p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gelir</p>
                <p className="mt-3 text-3xl font-display text-success">{income}</p>
              </div>
              <div className="glass-card p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gider</p>
                <p className="mt-3 text-3xl font-display text-destructive">{expense}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam bakiye</p>
                <p className="text-xl font-semibold text-foreground">{balance}</p>
              </div>
              <Link
                href="/dashboard"
                className="ml-auto inline-flex items-center rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: 'Islemler',
                description: 'Arama, filtre ve kategori duzenleme',
                href: '/dashboard/transactions',
                icon: ListChecks,
              },
              {
                title: 'PDF Yukle',
                description: 'Ekstreleri yukleyip otomatik parse et',
                href: '/dashboard/upload',
                icon: FileUp,
              },
              {
                title: 'Tasarruf Hedefleri',
                description: 'Aylik hedef ve birikim takibi',
                href: '/dashboard/goals',
                icon: Target,
              },
              {
                title: 'Tasarruf Asistani',
                description: 'Sohbet ile tasarruf onerileri al',
                href: '/dashboard?assistant=open',
                icon: MessageCircle,
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

