'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FilePenLine, Filter, RotateCcw, Save } from 'lucide-react'
import { ConfirmPdfUploadPayload, UploadPreview, UploadPreviewTransaction } from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PdfImportWorkbenchProps {
  preview: UploadPreview
  onConfirm: (payload: ConfirmPdfUploadPayload) => Promise<void>
  onDiscard: () => void
}

export function PdfImportWorkbench({ preview, onConfirm, onDiscard }: PdfImportWorkbenchProps) {
  const [rows, setRows] = useState<UploadPreviewTransaction[]>(preview.transactions)
  const [showOnlyLowConfidence, setShowOnlyLowConfidence] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRows(preview.transactions)
    setShowOnlyLowConfidence(false)
    setError(null)
  }, [preview])

  const filteredRows = useMemo(() => {
    if (!showOnlyLowConfidence) {
      return rows
    }
    return rows.filter((row) => Number(row.confidence || 0) < 70)
  }, [rows, showOnlyLowConfidence])

  const summary = useMemo(() => {
    const totalExpense = rows
      .filter((row) => row.type === 'expense')
      .reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0)
    const totalIncome = rows
      .filter((row) => row.type === 'income')
      .reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0)
    const lowConfidenceCount = rows.filter((row) => Number(row.confidence || 0) < 70).length

    return {
      totalExpense,
      totalIncome,
      lowConfidenceCount,
    }
  }, [rows])

  const handleRowChange = (
    id: string,
    key: keyof UploadPreviewTransaction,
    value: string | number | string[],
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row
        }

        if (key === 'categoryId') {
          const category = CATEGORIES.find((item) => item.id === value)
          return {
            ...row,
            categoryId: String(value),
            categoryLabel: category?.label || row.categoryLabel,
          }
        }

        return {
          ...row,
          [key]: value,
        }
      }),
    )
  }

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  const handleConfirm = async () => {
    if (rows.length === 0) {
      setError('Kaydetmeden once en az bir islem birakilmali.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onConfirm({
        filename: preview.filename,
        fileHash: preview.fileHash,
        fileSize: preview.fileSize,
        totalParsed: preview.totalParsed,
        transactions: rows,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  if (preview.duplicate) {
    return (
      <section className="rounded-[32px] border border-warning/25 bg-warning/10 p-6">
        <h2 className="text-2xl font-display font-semibold text-foreground">Bu dosya daha once gorulmus</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Duplicate korumasi devrede. Ayni kaydi tekrar acmiyoruz; mevcut PDF kayitlarini veya onceki review sonucunu kullanin.
        </p>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          {preview.errors.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onDiscard}>
            Yeni dosya sec
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section data-testid="pdf-import-workbench" className="space-y-6 rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <FilePenLine className="h-3.5 w-3.5" />
            Pre-save review
          </p>
          <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">Kaydetmeden once import satirlarini duzenle</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dusuk guvenli kayitlari kontrol et, gereksiz satirlari cikar ve kategori duzeltmelerini tamamla.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={showOnlyLowConfidence ? 'primary' : 'outline'}
            onClick={() => setShowOnlyLowConfidence((current) => !current)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showOnlyLowConfidence ? 'Tum satirlari goster' : 'Sadece dusuk guven'}
          </Button>
          <Button variant="outline" onClick={onDiscard}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Bastan basla
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-border/70 bg-background/75 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview satiri</p>
          <p className="mt-2 text-2xl font-display font-semibold text-foreground">{rows.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Toplam kaydedilecek satir</p>
        </div>
        <div className="rounded-[24px] border border-success/25 bg-success/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-success">Gelir</p>
          <p className="mt-2 text-xl font-semibold text-success">+{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-destructive">Gider</p>
          <p className="mt-2 text-xl font-semibold text-destructive">-{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-warning">Kontrol gerekli</p>
          <p className="mt-2 text-2xl font-display font-semibold text-warning">{summary.lowConfidenceCount}</p>
          <p className="mt-1 text-sm text-warning/90">Guven skoru 70 altindaki satirlar</p>
        </div>
      </div>

      {preview.errors.length > 0 && (
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Parser notlari
          </p>
          <div className="mt-3 space-y-2">
            {preview.errors.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredRows.map((row) => (
          <div key={row.id} className="rounded-[26px] border border-border/70 bg-background/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{row.description}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(row.date)} · {row.type === 'expense' ? 'Gider' : 'Gelir'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  Number(row.confidence || 0) >= 85
                    ? 'border-success/25 bg-success/10 text-success'
                    : Number(row.confidence || 0) >= 70
                      ? 'border-warning/25 bg-warning/10 text-warning'
                      : 'border-destructive/25 bg-destructive/10 text-destructive'
                }`}>
                  Guven %{Math.round(Number(row.confidence || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
                >
                  Satiri cikar
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Input
                label="Aciklama"
                value={row.description}
                onChange={(event) => handleRowChange(row.id, 'description', event.target.value)}
              />
              <Input
                label="Tarih"
                type="date"
                value={row.date.slice(0, 10)}
                onChange={(event) => handleRowChange(row.id, 'date', event.target.value)}
              />
              <Input
                label="Tutar"
                type="number"
                min="0"
                step="0.01"
                value={String(row.amount)}
                onChange={(event) => handleRowChange(row.id, 'amount', Number(event.target.value))}
              />
              <Select
                label="Tip"
                value={row.type}
                onChange={(event) => handleRowChange(row.id, 'type', event.target.value)}
                options={[
                  { value: 'expense', label: 'Gider' },
                  { value: 'income', label: 'Gelir' },
                ]}
              />
              <Select
                label="Kategori"
                value={row.categoryId}
                onChange={(event) => handleRowChange(row.id, 'categoryId', event.target.value)}
                options={CATEGORIES.filter((category) => category.type === row.type || category.type === 'both').map((category) => ({
                  value: category.id,
                  label: category.label,
                }))}
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        <p className="text-sm text-muted-foreground">
          {rows.length} satir kayda hazir. Kayit sonrasi dashboard ve PDF arsivi otomatik yenilenecek.
        </p>
        <Button onClick={handleConfirm} loading={saving} data-testid="pdf-import-confirm">
          <Save className="mr-2 h-4 w-4" />
          Kaydet ve importu tamamla
        </Button>
      </div>
    </section>
  )
}
