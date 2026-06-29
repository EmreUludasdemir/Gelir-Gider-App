'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  Filter,
  Layers3,
  PieChart,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Tags,
  Trash2,
  X,
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

type ReviewLevel = 'safe' | 'review' | 'suspicious'

interface RowInsight {
  level: ReviewLevel
  label: 'Guvenli' | 'Incele' | 'Supheli'
  score: number
  reasons: string[]
  merchantKey: string
  suggestedCategoryId?: string
  suggestedCategoryLabel?: string
}

interface CategorySuggestionGroup {
  merchantKey: string
  categoryId: string
  categoryLabel: string
  matchCount: number
  rowIds: string[]
}

const CATEGORY_RULES: Array<{
  matchers: RegExp[]
  categoryId: string
}> = [
  { matchers: [/migros/i, /\ba101\b/i, /\bbim\b/i, /sok market/i, /market/i], categoryId: 'market' },
  { matchers: [/istanbulkart/i, /metro/i, /opet/i, /shell/i, /moov/i, /taksi/i], categoryId: 'transport' },
  { matchers: [/spotify/i, /netflix/i, /icloud/i, /youtube premium/i, /disney/i], categoryId: 'subscription' },
  { matchers: [/yemeksepeti/i, /getir yemek/i, /trendyol yemek/i, /burger king/i, /starbucks/i], categoryId: 'restaurant' },
  { matchers: [/elektrik/i, /internet/i, /su faturasi/i, /dogalgaz/i], categoryId: 'utilities' },
  { matchers: [/kira/i, /rent/i], categoryId: 'rent' },
  { matchers: [/maas/i, /salary/i, /freelance/i, /odemesi/i], categoryId: 'salary' },
]

function normalizeMerchantKey(description: string) {
  return description
    .toLowerCase()
    .replace(/[0-9]/g, ' ')
    .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ')
}

function getSuggestionForDescription(description: string) {
  const rule = CATEGORY_RULES.find((candidate) =>
    candidate.matchers.some((matcher) => matcher.test(description)),
  )

  if (!rule) {
    return null
  }

  const category = CATEGORIES.find((candidate) => candidate.id === rule.categoryId)
  if (!category) {
    return null
  }

  return {
    categoryId: category.id,
    categoryLabel: category.label,
  }
}

function getReviewTone(level: ReviewLevel) {
  if (level === 'suspicious') {
    return 'border-destructive/25 bg-destructive/10 text-destructive'
  }

  if (level === 'review') {
    return 'border-warning/25 bg-warning/10 text-warning'
  }

  return 'border-success/25 bg-success/10 text-success'
}

function buildRowInsights(rows: UploadPreviewTransaction[]) {
  const expenseAmounts = rows
    .filter((row) => row.type === 'expense')
    .map((row) => Math.abs(Number(row.amount || 0)))
    .sort((left, right) => left - right)

  const expenseMedian = expenseAmounts.length > 0
    ? expenseAmounts[Math.floor(expenseAmounts.length / 2)]
    : 0

  const duplicateKeys = rows.reduce<Record<string, number>>((acc, row) => {
    const key = `${row.date.slice(0, 10)}-${normalizeMerchantKey(row.description)}-${row.type}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return rows.reduce<Record<string, RowInsight>>((acc, row) => {
    const reasons: string[] = []
    const confidence = Number(row.confidence || 0)
    const merchantKey = normalizeMerchantKey(row.description)
    const duplicateKey = `${row.date.slice(0, 10)}-${merchantKey}-${row.type}`
    const selectedCategory = CATEGORIES.find((candidate) => candidate.id === row.categoryId)
    const suggestion = getSuggestionForDescription(row.description)
    const absoluteAmount = Math.abs(Number(row.amount || 0))

    if (confidence < 60) {
      reasons.push('Parser guveni kritik seviyede')
    } else if (confidence < 75) {
      reasons.push('Parser guveni inceleme gerektiriyor')
    }

    if (
      expenseMedian > 0 &&
      row.type === 'expense' &&
      absoluteAmount > expenseMedian * 2.5 &&
      absoluteAmount > 1000
    ) {
      reasons.push('Tutar dosya medyanina gore belirgin sekilde yuksek')
    }

    if (duplicateKeys[duplicateKey] > 1) {
      reasons.push('Ayni gun benzer merchant tekrari bulundu')
    }

    if (
      selectedCategory &&
      ((row.type === 'income' && selectedCategory.type === 'expense') ||
        (row.type === 'expense' && selectedCategory.type === 'income'))
    ) {
      reasons.push('Tip ve kategori birbiriyle uyusmuyor')
    }

    if (suggestion && suggestion.categoryId !== row.categoryId) {
      reasons.push(`Merchant paterni ${suggestion.categoryLabel} kategorisini oneriyor`)
    }

    const level: ReviewLevel = reasons.some((reason) =>
      reason.includes('kritik') ||
      reason.includes('uyusmuyor') ||
      reason.includes('belirgin'),
    )
      ? 'suspicious'
      : reasons.length > 0
        ? 'review'
        : 'safe'

    acc[row.id] = {
      level,
      label: level === 'suspicious' ? 'Supheli' : level === 'review' ? 'Incele' : 'Guvenli',
      score:
        level === 'suspicious'
          ? Math.max(80, 100 - confidence)
          : level === 'review'
            ? Math.max(45, 85 - confidence)
            : Math.max(12, 40 - confidence / 4),
      reasons,
      merchantKey,
      suggestedCategoryId: suggestion?.categoryId,
      suggestedCategoryLabel: suggestion?.categoryLabel,
    }

    return acc
  }, {})
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 85) {
    return { label: 'High', tone: 'border-success/25 bg-success/10 text-success' }
  }
  if (confidence >= 70) {
    return { label: 'Medium', tone: 'border-warning/25 bg-warning/10 text-warning' }
  }
  return { label: 'Low', tone: 'border-destructive/25 bg-destructive/10 text-destructive' }
}

export function PdfBatchWorkbench({ batch, onConfirm, onDiscard }: PdfBatchWorkbenchProps) {
  const [items, setItems] = useState<EditableBatchItem[]>(batch.items)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(batch.items[0]?.id ?? null)
  const [showOnlyLowConfidence, setShowOnlyLowConfidence] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set())
  const [bulkCategoryId, setBulkCategoryId] = useState('')

  useEffect(() => {
    setItems(batch.items)
    setSelectedItemId(batch.items[0]?.id ?? null)
    setShowOnlyLowConfidence(false)
    setError(null)
    setSelectedRowIds(new Set())
    setBulkCategoryId('')
  }, [batch])

  const actionableItems = useMemo(
    () =>
      items.filter(
        (item) => item.preview.success && !item.preview.duplicate && item.preview.transactions.length > 0,
      ),
    [items],
  )

  const activeItem = useMemo(() => {
    return items.find((item) => item.id === selectedItemId) || items[0] || null
  }, [items, selectedItemId])

  const itemInsights = useMemo(
    () =>
      items.reduce<Record<string, Record<string, RowInsight>>>((acc, item) => {
        acc[item.id] = buildRowInsights(item.preview.transactions)
        return acc
      }, {}),
    [items],
  )

  const activeRows = useMemo(() => {
    if (!activeItem) {
      return []
    }

    if (!showOnlyLowConfidence) {
      return activeItem.preview.transactions
    }

    return activeItem.preview.transactions.filter((row) => {
      const insight = itemInsights[activeItem.id]?.[row.id]
      return Number(row.confidence || 0) < 70 || insight?.level !== 'safe'
    })
  }, [activeItem, itemInsights, showOnlyLowConfidence])

  const activeSuggestionGroups = useMemo<CategorySuggestionGroup[]>(() => {
    if (!activeItem) {
      return []
    }

    const grouped = activeItem.preview.transactions.reduce<Record<string, CategorySuggestionGroup>>((acc, row) => {
      const insight = itemInsights[activeItem.id]?.[row.id]
      if (!insight?.suggestedCategoryId || !insight.merchantKey) {
        return acc
      }

      const key = `${insight.merchantKey}-${insight.suggestedCategoryId}`
      const current = acc[key] || {
        merchantKey: insight.merchantKey,
        categoryId: insight.suggestedCategoryId,
        categoryLabel: insight.suggestedCategoryLabel || row.categoryLabel,
        matchCount: 0,
        rowIds: [],
      }

      current.matchCount += 1
      current.rowIds.push(row.id)
      acc[key] = current
      return acc
    }, {})

    return Object.values(grouped)
      .sort((left, right) => right.matchCount - left.matchCount)
      .slice(0, 4)
  }, [activeItem, itemInsights])

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
      .sort((left, right) => {
        const leftInsight = actionableItems
          .map((item) => itemInsights[item.id]?.[left.id])
          .find(Boolean)
        const rightInsight = actionableItems
          .map((item) => itemInsights[item.id]?.[right.id])
          .find(Boolean)

        const riskDelta = Number(rightInsight?.score || 0) - Number(leftInsight?.score || 0)
        if (riskDelta !== 0) {
          return riskDelta
        }

        return Number(left.confidence || 0) - Number(right.confidence || 0)
      })
      .slice(0, 4)

    const suspiciousCount = rows.filter((row) =>
      actionableItems.some((item) => itemInsights[item.id]?.[row.id]?.level === 'suspicious'),
    ).length

    const reviewCount = rows.filter((row) =>
      actionableItems.some((item) => {
        const level = itemInsights[item.id]?.[row.id]?.level
        return level === 'review' || level === 'suspicious'
      }),
    ).length

    return {
      rowCount: rows.length,
      totalExpense,
      totalIncome,
      netImpact: totalIncome - totalExpense,
      lowConfidenceCount,
      reviewCount,
      suspiciousCount,
      avgConfidence,
      topCategories: categoryTotals.slice(0, 3),
      topMerchants: merchantTotals.slice(0, 3),
      highRiskRows,
    }
  }, [actionableItems, itemInsights])

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

  const toggleRowSelection = (rowId: string) => {
    setSelectedRowIds((current) => {
      const next = new Set(current)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!activeItem) return
    const visibleIds = activeRows.map((row) => row.id)
    const allSelected = visibleIds.every((id) => selectedRowIds.has(id))
    if (allSelected) {
      setSelectedRowIds((current) => {
        const next = new Set(current)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedRowIds((current) => {
        const next = new Set(current)
        visibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const removeSelectedRows = () => {
    if (!activeItem || selectedRowIds.size === 0) return
    setItems((current) =>
      current.map((item) => {
        if (item.id !== activeItem.id) return item
        return {
          ...item,
          preview: {
            ...item.preview,
            transactions: item.preview.transactions.filter((row) => !selectedRowIds.has(row.id)),
          },
        }
      }),
    )
    setSelectedRowIds(new Set())
  }

  const applyCategoryToSelected = () => {
    if (!activeItem || selectedRowIds.size === 0 || !bulkCategoryId) return
    const category = CATEGORIES.find((candidate) => candidate.id === bulkCategoryId)
    if (!category) return
    setItems((current) =>
      current.map((item) => {
        if (item.id !== activeItem.id) return item
        return {
          ...item,
          preview: {
            ...item.preview,
            transactions: item.preview.transactions.map((row) => {
              if (!selectedRowIds.has(row.id)) return row
              return { ...row, categoryId: bulkCategoryId, categoryLabel: category.label }
            }),
          },
        }
      }),
    )
    setBulkCategoryId('')
  }

  const applySuggestedCategory = (itemId: string, merchantKey: string, categoryId: string) => {
    const category = CATEGORIES.find((candidate) => candidate.id === categoryId)
    if (!category) {
      return
    }

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
              const insight = itemInsights[item.id]?.[row.id]
              if (insight?.merchantKey !== merchantKey) {
                return row
              }

              return {
                ...row,
                categoryId,
                categoryLabel: category.label,
              }
            }),
          },
        }
      }),
    )
  }

  const allVisibleSelected = activeRows.length > 0 && activeRows.every((row) => selectedRowIds.has(row.id))
  const someVisibleSelected = activeRows.some((row) => selectedRowIds.has(row.id))
  const selectedCount = activeRows.filter((row) => selectedRowIds.has(row.id)).length

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
        <MetricCard label="Duplicate" value={batch.duplicateFiles} tone="warning" />
        <MetricCard label="Hata" value={batch.errorFiles} tone="danger" />
        <MetricCard label="Supheli" value={batchAnalysis.suspiciousCount} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[26px] border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Dosya kuyrugu</h3>
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
                        !item.preview.success && !item.preview.duplicate
                          ? 'border-destructive/25 bg-destructive/10 text-destructive'
                          : item.preview.duplicate
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : item.preview.lowConfidenceCount > 0
                            ? 'border-destructive/20 bg-destructive/10 text-destructive'
                            : 'border-success/25 bg-success/10 text-success'
                      }`}>
                        {!item.preview.success && !item.preview.duplicate
                          ? 'Hata'
                          : item.preview.duplicate
                            ? 'Duplicate'
                            : item.preview.lowConfidenceCount > 0
                              ? 'Review'
                              : 'Hazir'}
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
            !activeItem.preview.success ? (
              <div className="rounded-[26px] border border-destructive/20 bg-destructive/10 p-6">
                <h3 className="text-xl font-display font-semibold text-foreground">{activeItem.preview.filename}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bu dosya parser tarafinda hata verdi. Queue icinde tutuluyor ama toplu kayit aksiyonuna dahil edilmeyecek.
                </p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {activeItem.preview.errors?.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] border border-border/70 bg-background/80 p-5">
                {activeItem.preview.duplicate && (
                  <div className="mb-5 rounded-2xl border border-warning/25 bg-warning/10 p-4">
                    <p className="text-sm font-semibold text-warning">
                      ⚠️ Olası Çift Kayıt (Duplicate) Uyarısı
                    </p>
                    <div className="mt-2 space-y-2 text-xs text-muted-foreground/90">
                      {activeItem.preview.errors?.map((item, index) => (
                        <div key={`dup-err-${index}`}>{item}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Secili dosya</p>
                    <h3 className="mt-2 text-xl font-display font-semibold text-foreground">{activeItem.preview.filename}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeItem.preview.transactions.length} satir · {activeItem.preview.lowConfidenceCount} kontrol gerektiren islem
                    </p>
                  </div>
                  {(() => {
                    const avgConf = activeItem.preview.transactions.length > 0
                      ? Math.round(activeItem.preview.transactions.reduce((sum, row) => sum + Number(row.confidence || 0), 0) / activeItem.preview.transactions.length)
                      : 0
                    const badge = getConfidenceBadge(avgConf)
                    return (
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                        {badge.label} · %{avgConf}
                      </span>
                    )
                  })()}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-success/25 bg-success/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-success">Guvenli</p>
                    <p className="mt-2 text-2xl font-display font-semibold text-success">
                      {activeItem.preview.transactions.filter((row) => itemInsights[activeItem.id]?.[row.id]?.level === 'safe').length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-warning">Incele</p>
                    <p className="mt-2 text-2xl font-display font-semibold text-warning">
                      {activeItem.preview.transactions.filter((row) => itemInsights[activeItem.id]?.[row.id]?.level === 'review').length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-destructive">Supheli</p>
                    <p className="mt-2 text-2xl font-display font-semibold text-destructive">
                      {activeItem.preview.transactions.filter((row) => itemInsights[activeItem.id]?.[row.id]?.level === 'suspicious').length}
                    </p>
                  </div>
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

                {activeSuggestionGroups.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <p className="text-sm font-semibold text-foreground">Akilli kategori hamleleri</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ayni merchant paterni icin onerilen kategoriyi tek tikla tum eslesen satirlara uygula.
                    </p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {activeSuggestionGroups.map((group) => (
                        <div key={`${group.merchantKey}-${group.categoryId}`} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{group.merchantKey}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {group.matchCount} satir icin {group.categoryLabel} oneriliyor
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => applySuggestedCategory(activeItem.id, group.merchantKey, group.categoryId)}
                            >
                              Uygula
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Select All Row */}
                <div className="mt-4 flex items-center gap-3 px-1">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={allVisibleSelected ? 'Tumunu kaldir' : 'Tumunu sec'}
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="h-4.5 w-4.5 text-primary" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                    {allVisibleSelected ? 'Secimi kaldir' : `Tumunu sec (${activeRows.length})`}
                  </button>
                  {someVisibleSelected && (
                    <span className="text-xs text-muted-foreground">
                      {selectedCount} satir secili
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-4">
                  {activeRows.map((row) => (
                    <div key={row.id} className={`rounded-[24px] border p-4 transition-all ${selectedRowIds.has(row.id) ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20' : 'border-border/70 bg-card/70'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleRowSelection(row.id)}
                            className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            aria-label={selectedRowIds.has(row.id) ? 'Secimi kaldir' : 'Satiri sec'}
                          >
                            {selectedRowIds.has(row.id) ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <p className="font-semibold text-foreground">{row.description}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatDate(row.date)} · {row.type === 'expense' ? 'Gider' : 'Gelir'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              getReviewTone(itemInsights[activeItem.id]?.[row.id]?.level || 'safe')
                            }`}
                          >
                            {itemInsights[activeItem.id]?.[row.id]?.label || 'Guvenli'}
                          </span>
                          {(() => {
                            const conf = Number(row.confidence || 0)
                            const badge = getConfidenceBadge(conf)
                            return (
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                                {badge.label} · %{Math.round(conf)}
                              </span>
                            )
                          })()}
                          <button
                            type="button"
                            onClick={() => removeRow(activeItem.id, row.id)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cikar
                          </button>
                        </div>
                      </div>

                      {itemInsights[activeItem.id]?.[row.id]?.reasons.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {itemInsights[activeItem.id]?.[row.id]?.reasons.map((reason) => (
                            <span
                              key={`${row.id}-${reason}`}
                              className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {itemInsights[activeItem.id]?.[row.id]?.suggestedCategoryId &&
                        itemInsights[activeItem.id]?.[row.id]?.suggestedCategoryId !== row.categoryId && (
                          <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm">
                            <p className="font-semibold text-foreground">
                              Oneri: {itemInsights[activeItem.id]?.[row.id]?.suggestedCategoryLabel}
                            </p>
                            <button
                              type="button"
                              className="mt-2 font-semibold text-primary transition-colors hover:text-primary/80"
                              onClick={() =>
                                handleRowChange(
                                  activeItem.id,
                                  row.id,
                                  'categoryId',
                                  itemInsights[activeItem.id]?.[row.id]?.suggestedCategoryId || row.categoryId,
                                )
                              }
                            >
                              Bu satira uygula
                            </button>
                          </div>
                        )}

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
                      <span className="text-destructive">
                        {Object.values(itemInsights)
                          .map((insights) => insights[row.id]?.label)
                          .find(Boolean) || `%${Math.round(Number(row.confidence || 0))}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-20 mx-auto max-w-3xl animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card/95 dark:bg-card/80 backdrop-blur-xl p-4 shadow-[0_16px_40px_rgba(15,76,92,0.18)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <CheckSquare className="h-3.5 w-3.5" />
                {selectedCount} satir secili
              </span>
              <button
                type="button"
                onClick={() => setSelectedRowIds(new Set())}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Secimi temizle
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-2 py-1">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <select
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                  className="bg-transparent text-sm font-medium text-foreground outline-none min-w-[120px]"
                  aria-label="Toplu kategori sec"
                >
                  <option value="">Kategori sec...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                onClick={applyCategoryToSelected}
                disabled={!bulkCategoryId}
                className="h-9 text-xs font-semibold"
              >
                Kategori uygula
              </Button>
              <Button
                variant="outline"
                onClick={removeSelectedRows}
                className="h-9 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Secilenleri cikar
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Footer CTA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/60 p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {actionableItems.length} dosya · {batchAnalysis.rowCount} satir kayda hazir
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Duplicate ve hatali dosyalar otomatik atlanacak.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onDiscard} className="font-semibold">
            <X className="mr-2 h-4 w-4" />
            Iptal et
          </Button>
          <Button onClick={handleConfirm} loading={saving} data-testid="pdf-import-confirm" className="btn-premium font-semibold shadow-md">
            <Save className="mr-2 h-4 w-4" />
            Importu onayla
          </Button>
        </div>
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

