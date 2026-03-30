'use client'

import Link from 'next/link'
import { ArrowRight, FileUp, LineChart, WalletCards } from 'lucide-react'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

export function DashboardEmptyState() {
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  
  const labels = language === 'tr' ? {
    badge: 'İlk kurulum',
    title: 'Dashboard\'ı doldurmak için ilk finans kaydını ekle',
    description: 'PDF ekstre yükleyebilir veya manuel işlem ekleyebilirsin. İlk veri geldiği anda grafikler, karşılaştırmalar ve analiz kartları otomatik açılır.',
    pdfTitle: 'PDF ile başla',
    pdfBody: 'Bir veya birden fazla banka ekstresi yükle, preview et ve toplu onayla.',
    pdfCta: 'Import Studio\'yu aç',
    manualTitle: 'Manuel işlem ekle',
    manualBody: 'Gelir veya gider kaydını hızlıca oluştur, kategori ve not ekle.',
    manualCta: 'İşlem merkezine git',
    goalTitle: 'Hedef kur',
    goalBody: 'Tasarruf hedefine erken başlarsan dashboard daha anlamlı sinyaller üretir.',
    goalCta: 'Hedefleri aç',
  } : {
    badge: 'First Setup',
    title: 'Add your first financial record to fill the Dashboard',
    description: 'You can upload a PDF statement or add a manual transaction. Once the first data arrives, charts, comparisons and analysis cards will automatically appear.',
    pdfTitle: 'Start with PDF',
    pdfBody: 'Upload one or more bank statements, preview and bulk approve.',
    pdfCta: 'Open Import Studio',
    manualTitle: 'Add manual transaction',
    manualBody: 'Quickly create an income or expense record, add category and notes.',
    manualCta: 'Go to Transaction Center',
    goalTitle: 'Set a goal',
    goalBody: 'If you start your savings goal early, dashboard will generate more meaningful signals.',
    goalCta: 'Open Goals',
  }
  
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-card via-background to-accent/10 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)] animate-fade-in">
      <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {labels.badge}
          </p>
          <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">
            {labels.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {labels.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            href="/dashboard/upload"
            icon={FileUp}
            title={labels.pdfTitle}
            body={labels.pdfBody}
            cta={labels.pdfCta}
          />
          <ActionCard
            href="/dashboard/transactions"
            icon={WalletCards}
            title={labels.manualTitle}
            body={labels.manualBody}
            cta={labels.manualCta}
          />
          <ActionCard
            href="/dashboard/goals"
            icon={LineChart}
            title={labels.goalTitle}
            body={labels.goalBody}
            cta={labels.goalCta}
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
      className="group rounded-[24px] border border-border/70 bg-background/75 p-5 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_32px_rgba(15,76,92,0.12)] animate-scale-in"
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
