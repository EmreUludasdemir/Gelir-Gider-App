'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Layers3,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { UploadResult } from '@/lib/api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

interface PdfImportReviewProps {
  result: UploadResult
}

function confidenceTone(confidence: number) {
  if (confidence >= 85) return 'border-success/25 bg-success/10 text-success'
  if (confidence >= 70) return 'border-warning/25 bg-warning/10 text-warning'
  return 'border-destructive/25 bg-destructive/10 text-destructive'
}

export function PdfImportReview({ result }: PdfImportReviewProps) {
  const summary = useMemo(() => {
    const transactions = result.transactions ?? []
    const expenses = transactions.filter((transaction) => transaction.type === 'expense')
    const incomes = transactions.filter((transaction) => transaction.type === 'income')
    const totalExpense = expenses.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const totalIncome = incomes.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const avgConfidence =
      transactions.length > 0
        ? Math.round(
            transactions.reduce((sum, transaction) => sum + Number(transaction.confidence || 0), 0) /
              transactions.length,
          )
        : 0

    const lowConfidence = [...transactions]
      .filter((transaction) => Number(transaction.confidence || 0) < 70)
      .sort((left, right) => Number(left.confidence || 0) - Number(right.confidence || 0))

    const topCategories = Object.values(
      transactions.reduce<Record<string, { label: string; total: number }>>((acc, transaction) => {
        const key = transaction.categoryId || transaction.categoryLabel
        const current = acc[key] || { label: transaction.categoryLabel, total: 0 }
        current.total += Math.abs(Number(transaction.amount || 0))
        acc[key] = current
        return acc
      }, {}),
    )
      .sort((left, right) => right.total - left.total)
      .slice(0, 3)

    const healthScore =
      result.totalParsed > 0
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (result.totalSaved / result.totalParsed) * 70 +
                  ((result.totalParsed - result.lowConfidenceCount) / result.totalParsed) * 30,
              ),
            ),
          )
        : 0

    return {
      transactions,
      totalExpense,
      totalIncome,
      avgConfidence,
      lowConfidence,
      topCategories,
      healthScore,
    }
  }, [result])

  const statusTitle = result.duplicate
    ? 'Ayni ekstre daha once islenmis gorunuyor'
    : result.success
      ? 'Import review hazir'
      : 'Import akisinda dikkat gerektiren nokta var'

  const statusBody = result.duplicate
    ? 'Sistem tekrar kayit acmadi. Mevcut veriyi kullanabilir veya yeni dosya ile devam edebilirsiniz.'
    : result.success
      ? 'Kaydedilen islemler kalite paneline ayrildi. Simdi dusuk guvenli satirlari ve kategori dagilimini kontrol edebilirsiniz.'
      : 'Parser cikisi geldiginde kritik noktalar burada listelenir.'

  return (
    <section
      data-testid="pdf-import-review"
      className="space-y-6 rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-background to-success/[0.08] p-6">
        <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-0 h-32 w-32 rounded-full bg-success/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Import Review
            </p>
            <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">{statusTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusBody}</p>
          </div>

          <div className="min-w-[220px] rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Import kalitesi</p>
            <p className="mt-2 text-3xl font-display font-bold text-foreground">%{summary.healthScore}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ortalama guven skoru %{summary.avgConfidence} · {result.lowConfidenceCount} satir kontrol bekliyor
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Parse edilen</p>
          <p className="mt-3 text-2xl font-display font-semibold text-foreground">{result.totalParsed}</p>
          <p className="mt-1 text-sm text-muted-foreground">Parser tarafindan yakalanan toplam satir</p>
        </div>
        <div className="rounded-[24px] border border-success/25 bg-success/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-success">Kaydedilen</p>
          <p className="mt-3 text-2xl font-display font-semibold text-success">{result.totalSaved}</p>
          <p className="mt-1 text-sm text-success/90">Sisteme eklenen islem adedi</p>
        </div>
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-warning">Kontrol gerekli</p>
          <p className="mt-3 text-2xl font-display font-semibold text-warning">{result.lowConfidenceCount}</p>
          <p className="mt-1 text-sm text-warning/90">Kategori veya aciklama gozden gecirilebilir</p>
        </div>
        <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kayit dengesi</p>
          <p className="mt-3 text-2xl font-display font-semibold text-foreground">
            %{result.totalParsed > 0 ? Math.round((result.totalSaved / result.totalParsed) * 100) : 0}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Kayit/parsing verim orani</p>
        </div>
      </div>

      {result.suggestions && result.suggestions.length > 0 && (
        <div className="rounded-[24px] border border-border/70 bg-muted/20 p-5">
          <div className="flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-warning" />
            <div>
              <h3 className="font-semibold text-foreground">Onerilen sonraki adimlar</h3>
              <p className="text-sm text-muted-foreground">Duplicate veya parser kararsizligi durumunda izlenecek en guvenli akis.</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {result.suggestions.map((suggestion, index) => (
              <li key={`${suggestion}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!result.duplicate && summary.lowConfidence.length > 0 && (
        <div className="rounded-[24px] border border-warning/20 bg-warning/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Kontrol gerektiren satirlar</h3>
              <p className="text-sm text-muted-foreground">
                Once en dusuk guvenli kayitlari gozden gecirin. Her satir sizi filtrelenmis islem ekranina goturur.
              </p>
            </div>
            <Link
              href="/dashboard/transactions?source=pdf"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Tum PDF islemlerini ac
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {summary.lowConfidence.slice(0, 5).map((transaction) => (
              <Link
                key={transaction.id}
                href={`/dashboard/transactions?source=pdf&search=${encodeURIComponent(transaction.description)}`}
                className="rounded-[22px] border border-border/70 bg-background/85 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{transaction.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {transaction.categoryLabel} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        confidenceTone(Number(transaction.confidence || 0)),
                      )}
                    >
                      Guven %{Math.round(Number(transaction.confidence || 0))}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(Math.abs(Number(transaction.amount || 0)), transaction.currency)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Import snapshot</h3>
              <p className="text-sm text-muted-foreground">Tek seferde finansal akis, kategori yogunlugu ve risk cebi.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam gelir</p>
              <p className="mt-2 text-xl font-semibold text-success">+{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam gider</p>
              <p className="mt-2 text-xl font-semibold text-destructive">-{formatCurrency(summary.totalExpense)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">En yogun kategoriler</p>
            <div className="mt-3 space-y-3">
              {summary.topCategories.length > 0 ? (
                summary.topCategories.map((category) => (
                  <div key={category.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{category.label}</span>
                      <span className="text-muted-foreground">{formatCurrency(category.total)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-success"
                        style={{
                          width: `${summary.topCategories[0]?.total ? Math.max((category.total / summary.topCategories[0].total) * 100, 16) : 16}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Kategori dagilimi gormek icin kayitli satir gerekli.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Yeni eklenen islemler</h3>
                <p className="text-sm text-muted-foreground">Son importtan gelen kayitlar burada hizli bir grid olarak tutulur.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {summary.transactions.length > 0 ? (
                summary.transactions.slice(0, 6).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-[20px] border border-border/70 bg-card/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {transaction.categoryLabel} · {formatDate(transaction.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          confidenceTone(Number(transaction.confidence || 0)),
                        )}
                      >
                        %{Math.round(Number(transaction.confidence || 0))}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1 text-muted-foreground">
                        <Receipt className="h-3.5 w-3.5" />
                        {transaction.source.toUpperCase()}
                      </span>
                      <span className={transaction.type === 'expense' ? 'font-semibold text-destructive' : 'font-semibold text-success'}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(Math.abs(Number(transaction.amount || 0)), transaction.currency)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Bu importta listelenecek yeni islem olusmadi.</p>
              )}
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-[24px] border border-destructive/20 bg-destructive/10 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-semibold text-foreground">Import notlari</h3>
                  <p className="text-sm text-muted-foreground">Parser veya kayit adiminda olusan uyarilar.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {result.errors.map((error, index) => (
                  <div key={`${error}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/transactions?source=pdf"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,76,92,0.22)] transition-transform hover:-translate-y-0.5"
        >
          <CheckCircle2 className="h-4 w-4" />
          PDF islemlerini yonet
        </Link>
        <Link
          href="/dashboard/transactions"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
        >
          Tum islemlere git
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
        >
          Dashboard'a don
        </Link>
      </div>
    </section>
  )
}
