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
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

export default function UploadPage() {
  const router = useRouter()
  const refreshAll = useRefreshAll()
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
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

  // i18n labels
  const labels = language === 'tr' ? {
    badge: 'Import Studio 2.0',
    title: 'Birden fazla PDF yükle, analiz et, tek hamlede yönet',
    subtitle: 'Yeni akışta tek dosya yerine batch import odakta. Dosya kuyruğu, file-level review, merchant analizi ve kategori baskısı aynı workflow içine taşındı.',
    pdfTransaction: 'PDF işlem',
    pdfIncome: 'PDF gelir',
    pdfExpense: 'PDF gider',
    dominantCategory: 'Dominant kategori',
    noData: 'Veri yok',
    operationNotes: 'Operasyon Notları',
    bestFlow: 'Toplu import için en mantıklı akış',
    flowDesc: 'Batch preview workbench\'te dosya dosya düzeltmeleri tamamla, sonra toplu review ile hangi batch\'in nasıl bir iz bıraktığını oku.',
    openPdfTransactions: 'PDF işlemlerini aç',
    step1Title: '1. Batch preview oluştur',
    step1Body: 'Birden fazla dosya için parser sonucu aynı queue içinde birikir. Duplicate olanlar ayıklanır.',
    step2Title: '2. Dosya bazlı editor kullan',
    step2Body: 'Her PDF\'i ayrı satır editöründe düzelt, ama toplu kayıt butonunu kaybetme.',
    step3Title: '3. Batch analysis ile resmi gör',
    step3Body: 'Kategori baskısı, merchant yoğunluğu, net akış ve confidence karışımını dosya sinyalleriyle beraber oku.',
    liveArchiveSignal: 'Canlı arşiv sinyali',
    awaitingReview: 'Review bekleyen',
    archiveDominant: 'Arşiv dominantı',
    pdfArchive: 'PDF arşivi',
    pdfArchiveDesc: 'Daha önce kaydedilmiş PDF kaynaklı işlemleri tablo modunda yönetin.',
    backToDashboard: 'Dashboard\'a dön',
    pdfTransactions: 'PDF işlemleri',
  } : {
    badge: 'Import Studio 2.0',
    title: 'Upload multiple PDFs, analyze, manage in one step',
    subtitle: 'New flow focuses on batch import instead of single files. File queue, file-level review, merchant analysis and category pressure moved into the same workflow.',
    pdfTransaction: 'PDF transactions',
    pdfIncome: 'PDF income',
    pdfExpense: 'PDF expense',
    dominantCategory: 'Dominant category',
    noData: 'No data',
    operationNotes: 'Operation Notes',
    bestFlow: 'Best flow for batch import',
    flowDesc: 'Complete file-by-file edits in the batch preview workbench, then read which batch left what trace with bulk review.',
    openPdfTransactions: 'Open PDF transactions',
    step1Title: '1. Create batch preview',
    step1Body: 'Parser results for multiple files accumulate in the same queue. Duplicates are filtered.',
    step2Title: '2. Use file-based editor',
    step2Body: 'Edit each PDF in a separate row editor, but don\'t lose the bulk save button.',
    step3Title: '3. See the picture with batch analysis',
    step3Body: 'Read category pressure, merchant density, net flow and confidence mix together with file signals.',
    liveArchiveSignal: 'Live archive signal',
    awaitingReview: 'Awaiting review',
    archiveDominant: 'Archive dominant',
    pdfArchive: 'PDF archive',
    pdfArchiveDesc: 'Manage previously saved PDF-sourced transactions in table mode.',
    backToDashboard: 'Back to Dashboard',
    pdfTransactions: 'PDF transactions',
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-success/[0.08] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-success/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {labels.badge}
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">{labels.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {labels.subtitle}
            </p>
          </div>

          <div className="grid min-w-[320px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={labels.pdfTransaction} value={pdfStats.count.toString()} />
            <MetricCard label={labels.pdfIncome} value={`+${formatCurrency(pdfStats.totalIncome)}`} />
            <MetricCard label={labels.pdfExpense} value={`-${formatCurrency(pdfStats.totalExpense)}`} />
            <MetricCard label={labels.dominantCategory} value={pdfStats.dominantCategory?.label || labels.noData} tone="warning" />
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
                {labels.operationNotes}
              </p>
              <h2 className="mt-3 text-xl font-display font-semibold text-foreground">{labels.bestFlow}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {labels.flowDesc}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions?source=pdf')}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              {labels.openPdfTransactions}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <StepCard title={labels.step1Title} body={labels.step1Body} />
            <StepCard title={labels.step2Title} body={labels.step2Body} />
            <StepCard title={labels.step3Title} body={labels.step3Body} />
          </div>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-semibold text-foreground">{labels.liveArchiveSignal}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{labels.awaitingReview}</p>
                <p className="mt-2 text-2xl font-display font-semibold text-warning">{pdfStats.lowConfidence}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{labels.archiveDominant}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{pdfStats.dominantCategory?.label || labels.noData}</p>
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
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{labels.pdfArchive} ({pdfTransactions.length})</h2>
              <p className="text-sm text-muted-foreground">{labels.pdfArchiveDesc}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-border/80 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              {labels.backToDashboard}
            </button>
          </div>
          <TransactionTable
            transactions={pdfTransactions}
            title={labels.pdfTransactions}
            onRefresh={refreshPdfTransactions}
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' }) {
  return (
    <div className={`rounded-[24px] border p-4 backdrop-blur-sm animate-scale-in ${tone === 'warning' ? 'border-warning/25 bg-warning/10' : 'border-border/70 bg-background/75'}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-display font-semibold ${tone === 'warning' ? 'text-warning' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function StepCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-background/70 p-4 animate-list-item">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

