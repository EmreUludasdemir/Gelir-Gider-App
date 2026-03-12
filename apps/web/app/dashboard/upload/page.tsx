'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileStack, ShieldCheck, Sparkles } from 'lucide-react'
import { PdfUpload } from '@/components/forms/PdfUpload'
import { confirmPdfImport, UploadPreview, UploadResult } from '@/lib/api'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { PdfImportReview } from '@/components/dashboard/PdfImportReview'
import { PdfImportWorkbench } from '@/components/dashboard/PdfImportWorkbench'
import { useRefreshAll, useTransactions } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'

export default function UploadPage() {
  const router = useRouter()
  const refreshAll = useRefreshAll()
  const { data: pdfTransactions, mutate: refreshPdfTransactions } = useTransactions({
    source: 'pdf',
  })
  const [pendingPreview, setPendingPreview] = useState<UploadPreview | null>(null)
  const [latestUploadResult, setLatestUploadResult] = useState<UploadResult | null>(null)

  const pdfStats = useMemo(() => {
    const transactions = pdfTransactions ?? []
    const totalExpense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0)

    const lowConfidence = transactions.filter((transaction) => Number(transaction.confidence || 0) < 70).length

    return {
      count: transactions.length,
      totalExpense,
      lowConfidence,
    }
  }, [pdfTransactions])

  const handlePreviewReady = async (preview: UploadPreview) => {
    setPendingPreview(preview)
    setLatestUploadResult(null)
  }

  const handleConfirmImport = async (payload: {
    filename: string
    fileHash: string
    fileSize: number
    totalParsed: number
    transactions: UploadPreview['transactions']
  }) => {
    const uploadResult = await confirmPdfImport(payload)
    setLatestUploadResult(uploadResult)
    setPendingPreview(null)

    if (uploadResult.totalSaved > 0) {
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
              Import Studio
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">PDF yukle, kaliteyi kontrol et, sonra yonet</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Bu ekran parser sonucunu sadece gostermek icin degil, import kalitesini okumak, dusuk guvenli satirlari ayiklamak ve PDF kayitlarini hizla duzenlemek icin hazirlandi.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PDF islem</p>
              <p className="mt-2 text-2xl font-display font-semibold text-foreground">{pdfStats.count}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PDF gider</p>
              <p className="mt-2 text-xl font-display font-semibold text-foreground">{formatCurrency(pdfStats.totalExpense)}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Review bekleyen</p>
              <p className="mt-2 text-2xl font-display font-semibold text-warning">{pdfStats.lowConfidence}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <PdfUpload onSuccess={handlePreviewReady} />

        <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Operasyon Notlari
              </p>
              <h2 className="mt-3 text-xl font-display font-semibold text-foreground">Import sonrasi en mantikli akisi izle</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Once preview workbench'te duzeltmeleri yap, sonra import review panelinden kayit kalitesini kontrol et.
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
            <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileStack className="h-4 w-4 text-primary" />
                1. Preview olustur
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Parser sonucu kaydedilmeden once satir bazli duzenleme akisi acilir.
              </p>
            </div>
            <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">2. Guven puani dusuk satirlari duzelt</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aciklama, tutar, tip ve kategori alanlarini import tamamlanmadan once guncelleyebilirsin.
              </p>
            </div>
            <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">3. Import review ile sonucu dogrula</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Kayit sonrasinda kalite skoru, parser notlari ve yeni eklenen satirlar ayrica raporlanir.
              </p>
            </div>
          </div>
        </section>
      </div>

      {pendingPreview && (
        <PdfImportWorkbench
          preview={pendingPreview}
          onConfirm={handleConfirmImport}
          onDiscard={() => setPendingPreview(null)}
        />
      )}

      {latestUploadResult && <PdfImportReview result={latestUploadResult} />}

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
