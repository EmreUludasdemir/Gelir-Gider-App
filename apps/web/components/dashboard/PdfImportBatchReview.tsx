'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, FileBarChart2, Layers3, Sparkles, Wallet } from 'lucide-react'
import { UploadBatchResult } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface PdfImportBatchReviewProps {
  result: UploadBatchResult
}

export function PdfImportBatchReview({ result }: PdfImportBatchReviewProps) {
  const analysis = useMemo(() => {
    const transactions = result.transactions
    const expenses = transactions.filter((transaction) => transaction.type === 'expense')
    const incomes = transactions.filter((transaction) => transaction.type === 'income')
    const totalExpense = expenses.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const totalIncome = incomes.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const avgConfidence = transactions.length > 0
      ? Math.round(transactions.reduce((sum, transaction) => sum + Number(transaction.confidence || 0), 0) / transactions.length)
      : 0

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
      .slice(0, 4)

    const topMerchants = Object.values(
      transactions.reduce<Record<string, { label: string; total: number }>>((acc, transaction) => {
        const key = transaction.description.toLowerCase()
        const current = acc[key] || { label: transaction.description, total: 0 }
        current.total += Math.abs(Number(transaction.amount || 0))
        acc[key] = current
        return acc
      }, {}),
    )
      .sort((left, right) => right.total - left.total)
      .slice(0, 4)

    const healthScore = result.totalParsed > 0
      ? Math.max(0, Math.min(100, Math.round((result.totalSaved / result.totalParsed) * 65 + ((result.totalParsed - result.lowConfidenceCount) / result.totalParsed) * 35)))
      : 0

    return {
      totalExpense,
      totalIncome,
      netImpact: totalIncome - totalExpense,
      avgConfidence,
      topCategories,
      topMerchants,
      healthScore,
    }
  }, [result])

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
              <Sparkles className="h-3.5 w-3.5" />
              Batch Import Review
            </p>
            <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">Toplu import review hazir</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Birden fazla PDF icin net akis, merchant yogunlugu, kategori baskisi ve dosya bazli kalite sinyalleri tek ekranda toplandi.
            </p>
          </div>

          <div className="min-w-[220px] rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Batch kalite skoru</p>
            <p className="mt-2 text-3xl font-display font-bold text-foreground">%{analysis.healthScore}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.totalFiles} dosya · %{analysis.avgConfidence} ortalama guven · {result.lowConfidenceCount} review satiri
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Dosya" value={result.totalFiles} tone="default" />
        <StatCard label="Kaydedilen" value={result.processedFiles} tone="success" />
        <StatCard label="Duplicate" value={result.duplicateFiles} tone="warning" />
        <StatCard label="Satir" value={result.totalSaved} tone="default" />
        <StatCard label="Review" value={result.lowConfidenceCount} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Toplu import snapshot</h3>
                <p className="text-sm text-muted-foreground">Ayni batch icinde olusan toplam finansal etki.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-success/25 bg-success/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-success">Gelir</p>
                <p className="mt-2 text-xl font-semibold text-success">+{formatCurrency(analysis.totalIncome)}</p>
              </div>
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-destructive">Gider</p>
                <p className="mt-2 text-xl font-semibold text-destructive">-{formatCurrency(analysis.totalExpense)}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Net</p>
                <p className={`mt-2 text-xl font-semibold ${analysis.netImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {analysis.netImpact >= 0 ? '+' : '-'}{formatCurrency(Math.abs(analysis.netImpact))}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Kategori ve merchant analizi</h3>
                <p className="text-sm text-muted-foreground">Hangi kategori ve aciklamalar batch'i domine etti.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <p className="text-sm font-semibold text-foreground">Kategori baskisi</p>
                <div className="mt-3 space-y-3">
                  {analysis.topCategories.map((category) => (
                    <div key={category.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{category.label}</span>
                        <span className="text-muted-foreground">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary to-success"
                          style={{ width: `${analysis.topCategories[0]?.total ? Math.max((category.total / analysis.topCategories[0].total) * 100, 16) : 16}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <p className="text-sm font-semibold text-foreground">Merchant yogunlugu</p>
                <div className="mt-3 space-y-3">
                  {analysis.topMerchants.map((merchant) => (
                    <div key={merchant.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{merchant.label}</span>
                      <span className="text-muted-foreground">{formatCurrency(merchant.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-3">
              <FileBarChart2 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Dosya bazli kalite sinyali</h3>
                <p className="text-sm text-muted-foreground">Her PDF'in import sonucu ayri gorunur.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {result.fileResults.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-border/70 bg-card/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.filename}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.result.totalSaved}/{item.result.totalParsed} satir kaydedildi · {item.result.lowConfidenceCount} review
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      item.result.duplicate
                        ? 'border-warning/25 bg-warning/10 text-warning'
                        : item.result.success
                          ? 'border-success/25 bg-success/10 text-success'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
                    }`}>
                      {item.result.duplicate ? 'Duplicate' : item.result.success ? 'Kaydedildi' : 'Hata'}
                    </span>
                  </div>
                  {item.result.errors.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {item.result.errors.map((error, index) => (
                        <div key={`${item.id}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
        >
          Yeni batch ac
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneClasses = {
    default: 'border-border/70 bg-background/70 text-foreground',
    success: 'border-success/25 bg-success/10 text-success',
    warning: 'border-warning/25 bg-warning/10 text-warning',
    danger: 'border-destructive/20 bg-destructive/10 text-destructive',
  }

  return (
    <div className={`rounded-[24px] border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-display font-semibold">{value}</p>
    </div>
  )
}

