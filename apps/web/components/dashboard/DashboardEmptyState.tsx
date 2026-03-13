'use client'

import Link from 'next/link'
import { ArrowRight, FileUp, LineChart, WalletCards } from 'lucide-react'

export function DashboardEmptyState() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-card via-background to-accent/10 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
      <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Ilk kurulum
          </p>
          <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">
            Dashboard'i doldurmak icin ilk finans kaydini ekle
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            PDF ekstre yukleyebilir veya manuel islem ekleyebilirsin. Ilk veri geldigi anda grafikler,
            karsilastirmalar ve analiz kartlari otomatik acilir.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            href="/dashboard/upload"
            icon={FileUp}
            title="PDF ile basla"
            body="Bir veya birden fazla banka ekstresi yukle, preview et ve toplu onayla."
            cta="Import Studio'yu ac"
          />
          <ActionCard
            href="/dashboard/transactions"
            icon={WalletCards}
            title="Manuel islem ekle"
            body="Gelir veya gider kaydini hizlica olustur, kategori ve not ekle."
            cta="Islem merkezine git"
          />
          <ActionCard
            href="/dashboard/goals"
            icon={LineChart}
            title="Hedef kur"
            body="Tasarruf hedefine erken baslarsan dashboard daha anlamli sinyaller uretir."
            cta="Hedefleri ac"
          />
        </div>
      </div>
    </section>
  )
}

function ActionCard({
  href,
  icon: Icon,
  title,
  body,
  cta,
}: {
  href: string
  icon: typeof FileUp
  title: string
  body: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-border/70 bg-background/75 p-5 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_32px_rgba(15,76,92,0.12)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
