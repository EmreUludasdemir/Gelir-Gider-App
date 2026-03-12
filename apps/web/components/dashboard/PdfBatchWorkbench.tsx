'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Filter,
  Layers3,
  PieChart,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react'
import {
  ConfirmPdfUploadPayload,
  UploadBatchPreview,
  UploadBatchPreviewItem,
  UploadPreviewTransaction,
} from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PdfBatchWorkbenchProps {
  batch: UploadBatchPreview
  onConfirm: (payloads: ConfirmPdfUploadPayload[]) => Promise<void>
  onDiscard: () => void
}

interface EditableBatchItem extends UploadBatchPreviewItem {
  preview: UploadBatchPreviewItem['preview']
}

export function PdfBatchWorkbench({ batch, onConfirm, onDiscard }: PdfBatchWorkbenchProps) {
  const [items, setItems] = useState<EditableBatchItem[]>(batch.items)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(batch.items[0]?.id ?? null)
  const [showOnlyLowConfidence, setShowOnlyLowConfidence] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems(batch.items)
    setSelectedItemId(batch.items[0]?.id ?? null)
    setShowOnlyLowConfidence(false)
    setError(null)
  }, [batch])

  const actionableItems = useMemo(
    () => items.filter((item) => !item.preview.duplicate && item.preview.transactions.length > 0),
    [items],
  )

  const activeItem = useMemo(() => {
    return items.find((item) => item.id === selectedItemId) || items[0] || null
  }, [items, selectedItemId])

  const activeRows = useMemo(() => {
    if (!activeItem) {
      return []
    }

    if (!showOnlyLowConfidence) {
      return activeItem.preview.transactions
    }

    return activeItem.preview.transactions.filter((row) => Number(row.confidence || 0) < 70)
  }, [activeItem, showOnlyLowConfidence])

  const batchAnalysis = useMemo(() => {
    const rows = actionableItems.flatMap((item) => item.preview.transactions)
    const expenses = rows.filter((row) => row.type === 'expense')
    const incomes = rows.filter((row) => row.type === 'income')
    const totalExpense = expenses.reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0)
    const totalIncome = incomes.reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0)
    const lowConfidenceCount = rows.filter((row) => Number(row.confidence || 0) < 70).length
    const avgConfidence = rows.length > 0
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.confidence || 0), 0) / rows.length)
      : 0

    const categoryTotals = Object.values(
      rows.reduce<Record<string, { label: string; total: number }>>((acc, row) => {
        const key = row.categoryId || row.categoryLabel
        const current = acc[key] || { label: row.categoryLabel, total: 0 }
        current.total += Math.abs(Number(row.amount || 0))
        acc[key] = current
        return acc
      }, {}),
    ).sort((left, right) => right.total - left.total)

    const merchantTotals = Object.values(
      rows.reduce<Record<string, { label: string; total: number }>>((acc, row) => {
        const key = row.description.toLowerCase()
        const current = acc[key] || { label: row.description, total: 0 }
        current.total += Math.abs(Number(row.amount || 0))
        acc[key] = current
        return acc
      }, {}),
    ).sort((left, right) => right.total - left.total)

    const highRiskRows = [...rows]
      .sort((left, right) => Number(left.confidence || 0) - Number(right.confidence || 0))
      .slice(0, 4)

    return {
      rowCount: rows.length,
      totalExpense,
      totalIncome,
      netImpact: totalIncome - totalExpense,
      lowConfidenceCount,
      avgConfidence,
      topCategories: categoryTotals.slice(0, 3),
      topMerchants: merchantTotals.slice(0, 3),
      highRiskRows,
    }
  }, [actionableItems])

  const handleRowChange = (
    itemId: string,
    rowId: string,
    key: keyof UploadPreviewTransaction,
    value: string | number | string[],
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        return {
          ...item,
          preview: {
            ...item.preview,
            transactions: item.preview.transactions.map((row) => {
              if (row.id !== rowId) {
                return row
              }

              if (key === 'categoryId') {
                const category = CATEGORIES.find((candidate) => candidate.id === value)
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
          },
        }
      }),
    )
  }

  const removeRow = (itemId: string, rowId: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        return {
          ...item,
          preview: {
            ...item.preview,
            transactions: item.preview.transactions.filter((row) => row.id !== rowId),
          },
        }
      }),
    )
  }

  const handleConfirm = async () => {
    const payloads = actionableItems.map((item) => ({
      filename: item.preview.filename,
      fileHash: item.preview.fileHash,
      fileSize: item.preview.fileSize,
      totalParsed: item.preview.totalParsed,
      transactions: item.preview.transactions,
    }))

    if (payloads.length === 0) {
      setError('Kaydedilecek uygun dosya bulunmuyor.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onConfirm(payloads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu import kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      data-testid="pdf-import-workbench"
      className="space-y-6 rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Batch Import Workbench
          </p>
          <h2 className="mt-3 text-2xl font-display font-semibold text-foreground">Birden fazla PDF'i tek akista duzenle ve kaydet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dosya bazli queue, satir bazli editor ve toplu analiz katmani ayni workbench icinde birlestirildi.
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
            Kuyrugu sifirla
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Dosya" value={items.length} tone="default" />
        <MetricCard label="Islenebilir" value={actionableItems.length} tone="success" />
        <MetricCard label="Duplicate" value={items.length - actionableItems.length} tone="warning" />
        <MetricCard label="Satir" value={batchAnalysis.rowCount} tone="default" />
        <MetricCard label="Review" value={batchAnalysis.lowConfidenceCount} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[26px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Dosya kuyru gu</h3>
                <p className="text-sm text-muted-foreground">Her PDF kendi kalite sinyali ve satir sayisiyla listelenir.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const isActive = item.id === activeItem?.id
                const rowCount = item.preview.transactions.length
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                      isActive
                        ? 'border-primary/35 bg-primary/10 shadow-[0_10px_24px_rgba(15,76,92,0.14)]'
                        : 'border-border/70 bg-card/70 hover:border-primary/25 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{item.preview.filename}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {rowCount} satir · {item.preview.lowConfidenceCount} review · {(item.preview.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.preview.duplicate
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : item.preview.lowConfidenceCount > 0
                            ? 'border-destructive/20 bg-destructive/10 text-destructive'
                            : 'border-success/25 bg-success/10 text-success'
                      }`}>
                        {item.preview.duplicate ? 'Duplicate' : item.preview.lowConfidenceCount > 0 ? 'Review' : 'Hazir'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Batch analizi</h3>
                <p className="text-sm text-muted-foreground">Toplu import oncesi veri baskisini oku.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-success/25 bg-success/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-success">Gelir etkisi</p>
                <p className="mt-2 text-xl font-semibold text-success">+{formatCurrency(batchAnalysis.totalIncome)}</p>
              </div>
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-destructive">Gider etkisi</p>
                <p className="mt-2 text-xl font-semibold text-destructive">-{formatCurrency(batchAnalysis.totalExpense)}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Net akis</p>
                <p className={`mt-2 text-xl font-semibold ${batchAnalysis.netImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {batchAnalysis.netImpact >= 0 ? '+' : '-'}{formatCurrency(Math.abs(batchAnalysis.netImpact))}
                </p>
              </div>
              <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-warning">Ortalama guven</p>
                <p className="mt-2 text-xl font-semibold text-warning">%{batchAnalysis.avgConfidence}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PieChart className="h-4 w-4 text-primary" />
                  Kategori baskisi
                </p>
                <div className="mt-3 space-y-3">
                  {batchAnalysis.topCategories.length > 0 ? batchAnalysis.topCategories.map((category) => (
                    <div key={category.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{category.label}</span>
                        <span className="text-muted-foreground">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary to-success"
                          style={{ width: `${batchAnalysis.topCategories[0]?.total ? Math.max((category.total / batchAnalysis.topCategories[0].total) * 100, 16) : 16}%` }}
                        />
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Kategori sinyali icin satir gerekli.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Merchant yogunlugu
                </p>
                <div className="mt-3 space-y-3">
                  {batchAnalysis.topMerchants.length > 0 ? batchAnalysis.topMerchants.map((merchant) => (
                    <div key={merchant.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{merchant.label}</span>
                      <span className="text-muted-foreground">{formatCurrency(merchant.total)}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Merchant sinyali icin satir gerekli.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeItem ? (
            activeItem.preview.duplicate ? (
              <div className="rounded-[26px] border border-warning/25 bg-warning/10 p-6">
                <h3 className="text-xl font-display font-semibold text-foreground">{activeItem.preview.filename}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bu dosya duplicate olarak isaretlendi. Kayda girmeyecek ama toplu queue icinde gorebilirsin.
                </p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {activeItem.preview.errors.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] border border-border/70 bg-background/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Secili dosya</p>
                    <h3 className="mt-2 text-xl font-display font-semibold text-foreground">{activeItem.preview.filename}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeItem.preview.transactions.length} satir · {activeItem.preview.lowConfidenceCount} kontrol gerektiren islem
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    %{Math.round(
                      activeItem.preview.transactions.length > 0
                        ? activeItem.preview.transactions.reduce((sum, row) => sum + Number(row.confidence || 0), 0) / activeItem.preview.transactions.length
                        : 0,
                    )} ortalama guven
                  </span>
                </div>

                {activeItem.preview.errors.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Parser notlari
                    </p>
                    <div className="mt-3 space-y-2">
                      {activeItem.preview.errors.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  {activeRows.map((row) => (
                    <div key={row.id} className="rounded-[24px] border border-border/70 bg-card/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{row.description}</p>
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
                            onClick={() => removeRow(activeItem.id, row.id)}
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
                          onChange={(event) => handleRowChange(activeItem.id, row.id, 'description', event.target.value)}
                        />
                        <Input
                          label="Tarih"
                          type="date"
                          value={row.date.slice(0, 10)}
                          onChange={(event) => handleRowChange(activeItem.id, row.id, 'date', event.target.value)}
                        />
                        <Input
                          label="Tutar"
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(row.amount)}
                          onChange={(event) => handleRowChange(activeItem.id, row.id, 'amount', Number(event.target.value))}
                        />
                        <Select
                          label="Tip"
                          value={row.type}
                          onChange={(event) => handleRowChange(activeItem.id, row.id, 'type', event.target.value)}
                          options={[
                            { value: 'expense', label: 'Gider' },
                            { value: 'income', label: 'Gelir' },
                          ]}
                        />
                        <Select
                          label="Kategori"
                          value={row.categoryId}
                          onChange={(event) => handleRowChange(activeItem.id, row.id, 'categoryId', event.target.value)}
                          options={CATEGORIES.filter((category) => category.type === row.type || category.type === 'both').map((category) => ({
                            value: category.id,
                            label: category.label,
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : null}

          {batchAnalysis.highRiskRows.length > 0 && (
            <div className="rounded-[26px] border border-destructive/20 bg-destructive/10 p-5">
              <p className="text-sm font-semibold text-foreground">En kirilgan confidence satirlari</p>
              <div className="mt-3 space-y-2">
                {batchAnalysis.highRiskRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{row.description}</span>
                      <span className="text-destructive">%{Math.round(Number(row.confidence || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        <p className="text-sm text-muted-foreground">
          {actionableItems.length} dosya ve {batchAnalysis.rowCount} satir kayda hazir. Duplicate dosyalar otomatik atlanacak.
        </p>
        <Button onClick={handleConfirm} loading={saving} data-testid="pdf-import-confirm">
          <Save className="mr-2 h-4 w-4" />
          Toplu importu kaydet
        </Button>
      </div>
    </section>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneClasses = {
    default: 'border-border/70 bg-background/75 text-foreground',
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

