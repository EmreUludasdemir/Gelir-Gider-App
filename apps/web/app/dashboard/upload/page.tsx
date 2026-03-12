'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileStack, ShieldCheck, Sparkles } from 'lucide-react'
import { PdfUpload } from '@/components/forms/PdfUpload'
import { confirmPdfImportBatch, UploadBatchPreview, UploadBatchResult } from '@/lib/api'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { PdfBatchWorkbench } from '@/components/dashboard/PdfBatchWorkbench'
import { PdfImportBatchReview } from '@/components/dashboard/PdfImportBatchReview'
import { useRefreshAll, useTransactions } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'

export default function UploadPage() {
  const router = useRouter()
  const refreshAll = useRefreshAll()
  const { data: pdfTransactions, mutate: refreshPdfTransactions } = useTransactions({
    source: 'pdf',
  })
  const [pendingBatchPreview, setPendingBatchPreview] = useState<UploadBatchPreview | null>(null)
  const [latestBatchResult, setLatestBatchResult] = useState<UploadBatchResult | null>(null)

  const pdfStats = useMemo(() => {
    const transactions = pdfTransactions ?? []
    const totalExpense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)
    const lowConfidence = transactions.filter((transaction) => Number(transaction.confidence || 0) < 70).length

    const dominantCategory = Object.values(
      transactions.reduce<Record<string, { label: string; total: number }>>((acc, transaction) => {
        const key = transaction.categoryId || transaction.categoryLabel
        const current = acc[key] || { label: transaction.categoryLabel, total: 0 }
        current.total += Math.abs(Number(transaction.amount || 0))
        acc[key] = current
        return acc
      }, {}),
    )
      .sort((left, right) => right.total - left.total)[0]

    return {
      count: transactions.length,
      totalExpense,
      totalIncome,
      lowConfidence,
      dominantCategory,
    }
  }, [pdfTransactions])

  const handleBatchPreviewReady = async (preview: UploadBatchPreview) => {
    setPendingBatchPreview(preview)
    setLatestBatchResult(null)
  }

  const handleConfirmImport = async (payloads: Parameters<typeof confirmPdfImportBatch>[0]) => {
    const batchResult = await confirmPdfImportBatch(payloads)
    setLatestBatchResult(batchResult)
    setPendingBatchPreview(null)

    if (batchResult.totalSaved > 0) {
      await Promise.all([refreshAll(), refreshPdfTransactions()])
      return
    }

    await refreshPdfTransactions()
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-success/[0.08] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-success/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Import Studio 2.0
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">Birden fazla PDF yukle, analiz et, tek hamlede yonet</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Yeni akista tek dosya yerine batch import odakta. Dosya kuyrugu, file-level review, merchant analizi ve kategori baskisi ayni workflow icine tasindi.
            </p>
          </div>

          <div className="grid min-w-[320px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="PDF islem" value={pdfStats.count.toString()} />
            <MetricCard label="PDF gelir" value={`+${formatCurrency(pdfStats.totalIncome)}`} />
            <MetricCard label="PDF gider" value={`-${formatCurrency(pdfStats.totalExpense)}`} />
            <MetricCard label="Dominant kategori" value={pdfStats.dominantCategory?.label || 'Veri yok'} tone="warning" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <PdfUpload onSuccess={handleBatchPreviewReady} />

        <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Operasyon Notlari
              </p>
              <h2 className="mt-3 text-xl font-display font-semibold text-foreground">Toplu import icin en mantikli akis</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Batch preview workbench'te dosya dosya duzeltmeleri tamamla, sonra toplu review ile hangi batch'in nasil bir iz biraktigini oku.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions?source=pdf')}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              PDF islemlerini ac
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <StepCard
              title="1. Batch preview olustur"
              body="Birden fazla dosya icin parser sonucu ayni queue icinde birikir. Duplicate olanlar ayiklanir."
            />
            <StepCard
              title="2. Dosya bazli editor kullan"
              body="Her PDF'i ayri satir editorunde duzelt, ama toplu kayit butonunu kaybetme."
            />
            <StepCard
              title="3. Batch analysis ile resmi gor"
              body="Kategori baskisi, merchant yogunlugu, net akis ve confidence karisimini dosya sinyalleriyle beraber oku."
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-semibold text-foreground">Canli arsiv sinyali</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Review bekleyen</p>
                <p className="mt-2 text-2xl font-display font-semibold text-warning">{pdfStats.lowConfidence}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Arsiv dominanti</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{pdfStats.dominantCategory?.label || 'Veri yok'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {pendingBatchPreview && (
        <PdfBatchWorkbench
          batch={pendingBatchPreview}
          onConfirm={handleConfirmImport}
          onDiscard={() => setPendingBatchPreview(null)}
        />
      )}

      {latestBatchResult && <PdfImportBatchReview result={latestBatchResult} />}

      {pdfTransactions && pdfTransactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">PDF arsivi ({pdfTransactions.length})</h2>
              <p className="text-sm text-muted-foreground">Daha once kaydedilmis PDF kaynakli islemleri tablo modunda yonetin.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-border/80 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              Dashboard'a don
            </button>
          </div>
          <TransactionTable
            transactions={pdfTransactions}
            title="PDF islemleri"
            onRefresh={refreshPdfTransactions}
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' }) {
  return (
    <div className={`rounded-[24px] border p-4 backdrop-blur-sm ${tone === 'warning' ? 'border-warning/25 bg-warning/10' : 'border-border/70 bg-background/75'}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-display font-semibold ${tone === 'warning' ? 'text-warning' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function StepCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

