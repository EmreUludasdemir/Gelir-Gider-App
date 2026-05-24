'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Loader2,
  PiggyBank,
  ReceiptText,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { ActionFeedItem } from '@/lib/api'
import { useActionFeed } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'

const priorityStyles = {
  critical: 'border-destructive/25 bg-destructive/10 text-destructive',
  high: 'border-warning/25 bg-warning/10 text-warning',
  medium: 'border-primary/25 bg-primary/10 text-primary',
  low: 'border-success/25 bg-success/10 text-success',
} as const

const priorityLabels = {
  critical: 'Kritik',
  high: 'Yuksek',
  medium: 'Orta',
  low: 'Dusuk',
} as const

const typeIcons: Record<ActionFeedItem['type'], LucideIcon> = {
  cash_flow: Waves,
  budget: ClipboardList,
  bill: ReceiptText,
  subscription: CreditCard,
  savings: PiggyBank,
}

export function DashboardActionFeed() {
  const { data, isLoading } = useActionFeed()

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-border/70 bg-card/82 p-6">
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  const topItems = data.items.slice(0, 5)

  return (
    <section
      className="overflow-hidden rounded-[28px] border border-border/70 bg-card/82 shadow-[0_18px_36px_rgba(15,76,92,0.1)]"
      data-testid="dashboard-action-feed"
    >
      <div className="border-b border-border/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <AlertTriangle className="h-3.5 w-3.5" />
              Action Feed
            </p>
            <h2 className="mt-3 text-xl font-display font-semibold text-foreground">Oncelikli hamleler</h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Dikkat skoru</p>
            <p className="mt-1 text-2xl font-display font-semibold text-foreground">{data.attentionScore}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {topItems.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-5">
            {topItems.map((item) => (
              <ActionFeedCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[116px] items-center gap-3 rounded-2xl border border-success/25 bg-success/10 p-4 text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">Acil aksiyon gorunmuyor.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function ActionFeedCard({ item }: { item: ActionFeedItem }) {
  const Icon = typeIcons[item.type]

  return (
    <Link
      href={item.href}
      className="group flex min-h-[172px] flex-col justify-between rounded-2xl border border-border/70 bg-background/72 p-4 transition-colors hover:border-primary/35 hover:bg-background"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[item.priority]}`}>
            {priorityLabels[item.priority]}
          </span>
        </div>
        <h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-5 text-foreground">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {item.impactAmount !== undefined ? formatCurrency(item.impactAmount) : '-'}
          </span>
          {item.dueDate && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatDate(item.dueDate)}</span>
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Ac
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
