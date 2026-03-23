'use client'

import { useMemo, useState } from 'react'
import { Layers3, Sparkles } from 'lucide-react'
import { bulkUpdateTransactions, type Transaction } from '@/lib/api'
import { CATEGORIES, getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { buildSimilarTransactionClusters, getCategoryColor } from './utils'

interface SimilarTransactionClustersProps {
  transactions: Transaction[]
  onApplied?: () => void | Promise<void>
}

export function SimilarTransactionClusters({
  transactions,
  onApplied,
}: SimilarTransactionClustersProps) {
  const { showToast } = useToast()
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({})
  const [applyingClusterId, setApplyingClusterId] = useState<string | null>(null)

  const clusters = useMemo(
    () => buildSimilarTransactionClusters(transactions),
    [transactions],
  )

  if (clusters.length === 0) {
    return null
  }

  const handleApply = async (clusterId: string) => {
    const cluster = clusters.find((item) => item.id === clusterId)
    if (!cluster) {
      return
    }

    const categoryId = selectedCategories[cluster.id] || cluster.suggestedCategoryId
    const category = getCategoryById(categoryId)

    if (!category) {
      showToast('Kategori secilemedi', 'error')
      return
    }

    try {
      setApplyingClusterId(cluster.id)
      const result = await bulkUpdateTransactions({
        transactionIds: cluster.transactionIds,
        categoryId: category.id,
        categoryLabel: category.label,
      })

      showToast(
        `${result.updated} benzer islem ${category.label} kategorisine alindi`,
        'success',
      )
      await onApplied?.()
    } catch (error) {
      showToast('Benzer islemler guncellenemedi', 'error')
      console.error('Similar cluster update error:', error)
    } finally {
      setApplyingClusterId(null)
    }
  }

  return (
    <section
      className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_16px_40px_rgba(15,76,92,0.12)] backdrop-blur-xl"
      data-testid="similar-cluster-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Benzer Islem Onerileri
          </p>
          <h2 className="mt-2 text-xl font-display font-bold text-foreground">
            Tek duzeltmeyle kume bazli kategorile
          </h2>
          <p className="text-sm text-muted-foreground">
            Ayni merchant veya aciklama paternini tasiyan islemleri tek aksiyonda duzenle.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Aksiyon Bekleyen Kume</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{clusters.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {clusters.map((cluster) => {
          const selectedCategoryId =
            selectedCategories[cluster.id] || cluster.suggestedCategoryId
          const allowedCategories = CATEGORIES.filter(
            (category) => category.type === cluster.type || category.type === 'both',
          )

          return (
            <div
              key={cluster.id}
              className="rounded-[24px] border border-border/70 bg-background/70 p-5"
              data-testid={`similar-cluster-card-${cluster.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Layers3 className="h-3.5 w-3.5" />
                    {cluster.count} kayit
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{cluster.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Toplam hacim: {formatCurrency(cluster.totalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Onerilen</p>
                  <p className="mt-1 font-semibold text-foreground">{cluster.suggestedCategoryLabel}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {cluster.categories.map((category) => (
                  <span
                    key={`${cluster.id}-${category.categoryId}`}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(category.categoryId)}`}
                  >
                    {category.categoryLabel} · {category.count}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ornek Aciklamalar</p>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {cluster.sampleDescriptions.map((description) => (
                    <li key={`${cluster.id}-${description}`}>{description}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-0 flex-1">
                  <Select
                    label="Kume Kategorisi"
                    value={selectedCategoryId}
                    onChange={(event) =>
                      setSelectedCategories((current) => ({
                        ...current,
                        [cluster.id]: event.target.value,
                      }))
                    }
                  >
                    {allowedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={() => void handleApply(cluster.id)}
                  loading={applyingClusterId === cluster.id}
                  data-testid={`similar-cluster-apply-${cluster.id}`}
                >
                  Tumunu {getCategoryById(selectedCategoryId)?.label || cluster.suggestedCategoryLabel} yap
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
