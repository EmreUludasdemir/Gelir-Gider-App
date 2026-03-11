'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  ArrowRight,
  BadgePlus,
  CopyCheck,
  FileUp,
  PiggyBank,
  TrendingDown,
  WalletCards,
} from 'lucide-react'

interface QuickAction {
  href: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  accentClass: string
  surfaceClass: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/dashboard/transactions?type=income',
    title: 'Gelir ekle',
    description: 'Yeni maas, prim veya tahsilat gir',
    icon: BadgePlus,
    accentClass: 'text-success',
    surfaceClass: 'from-success/16 via-success/8 to-transparent',
  },
  {
    href: '/dashboard/transactions?type=expense',
    title: 'Gider kaydet',
    description: 'Harcamayi aninda isleyip kategori ata',
    icon: TrendingDown,
    accentClass: 'text-destructive',
    surfaceClass: 'from-destructive/16 via-destructive/8 to-transparent',
  },
  {
    href: '/dashboard/upload',
    title: 'PDF yukle',
    description: 'Ekstreyi iceri alip islem listesi olustur',
    icon: FileUp,
    accentClass: 'text-primary',
    surfaceClass: 'from-primary/18 via-primary/10 to-transparent',
  },
  {
    href: '/dashboard/goals',
    title: 'Hedef kur',
    description: 'Bir sonraki birikim hedefini olustur',
    icon: PiggyBank,
    accentClass: 'text-warning',
    surfaceClass: 'from-warning/20 via-warning/8 to-transparent',
  },
  {
    href: '/dashboard/budgets',
    title: 'Butce ayarla',
    description: 'Kategori limitlerini guncelle',
    icon: WalletCards,
    accentClass: 'text-sky-700 dark:text-sky-300',
    surfaceClass: 'from-sky-500/18 via-sky-500/8 to-transparent',
  },
  {
    href: '/dashboard/duplicates',
    title: 'Kopyalari temizle',
    description: 'Tekrarlanan kayitlari tek panelde coz',
    icon: CopyCheck,
    accentClass: 'text-teal-700 dark:text-teal-300',
    surfaceClass: 'from-teal-500/18 via-teal-500/8 to-transparent',
  },
]

export function QuickActionsGrid() {
  return (
    <section className="glass-card rounded-[28px] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">
            Hizli Islemler
          </p>
          <h3 className="mt-2 text-xl font-display font-semibold text-foreground">
            Bir sonraki finans aksiyonunu sec
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Giris, yukleme ve duzenleme akislari tek yerden erisilebilir durumda.
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          6 kisayol, mobil ve masaustu hizli kullanim icin optimize edildi.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_35px_rgba(15,76,92,0.12)]"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${action.surfaceClass} opacity-80`}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 ${action.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-base font-semibold text-foreground">{action.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
