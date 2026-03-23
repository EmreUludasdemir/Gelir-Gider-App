'use client'

import { useState } from 'react'
import { ArrowUpDown, Download, Tag, Trash2, X } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { Input } from '@/components/ui/Input'
import type { TransactionType } from '@/lib/api'

interface BulkActionsBarProps {
  selectedCount: number
  onDelete?: () => void
  onCategorize?: (
    categoryId: string,
    categoryLabel: string,
    options?: { applyToSimilar?: boolean }
  ) => void
  onUpdateType?: (type: TransactionType) => void
  onUpdateTags?: (tags: string[]) => void
  onExport?: () => void
  onDeselect: () => void
  isDeleting?: boolean
  isCategorizing?: boolean
  isUpdatingType?: boolean
  isUpdatingTags?: boolean
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onCategorize,
  onUpdateType,
  onUpdateTags,
  onExport,
  onDeselect,
  isDeleting = false,
  isCategorizing = false,
  isUpdatingType = false,
  isUpdatingTags = false,
}: BulkActionsBarProps) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [applyToSimilar, setApplyToSimilar] = useState(false)
  const [tagValue, setTagValue] = useState('')

  if (selectedCount === 0) return null

  const isBusy = isDeleting || isCategorizing || isUpdatingType || isUpdatingTags

  const closeMenus = () => {
    setShowCategoryMenu(false)
    setShowTypeMenu(false)
    setShowTagMenu(false)
  }

  const handleCategorySelect = (categoryId: string, categoryLabel: string) => {
    onCategorize?.(categoryId, categoryLabel, { applyToSimilar })
    closeMenus()
    setApplyToSimilar(false)
  }

  const handleTypeSelect = (type: TransactionType) => {
    onUpdateType?.(type)
    closeMenus()
  }

  const handleTagsApply = () => {
    const tags = tagValue
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    onUpdateTags?.(tags)
    closeMenus()
    setTagValue('')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                closeMenus()
                onDeselect()
              }}
              className="rounded p-1 transition-colors hover:bg-muted"
              aria-label="Secimi kaldir"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} oge secildi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCategorize && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (isBusy) return
                    setShowCategoryMenu((current) => !current)
                    setShowTypeMenu(false)
                    setShowTagMenu(false)
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-muted/40 disabled:cursor-not-allowed"
                  data-testid="bulk-categorize-button"
                >
                  <Tag className="w-4 h-4" />
                  {isCategorizing ? 'Uygulaniyor...' : 'Kategorize Et'}
                </button>

                {showCategoryMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div className="absolute bottom-full right-0 z-20 mb-2 max-h-80 w-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                          Kategori Sec
                        </p>
                        <label className="mx-2 mb-2 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={applyToSimilar}
                            onChange={(event) => setApplyToSimilar(event.target.checked)}
                            className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary/30"
                            data-testid="bulk-apply-similar-toggle"
                          />
                          <span>
                            Ayni merchant / aciklama paterni tasiyan benzer islemleri de guncelle
                          </span>
                        </label>
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id, category.label)}
                            className="w-full rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-muted"
                            data-testid={`bulk-category-option-${category.id}`}
                          >
                            <span className="mr-3 text-lg">{category.emoji}</span>
                            <span>{category.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {onUpdateType && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (isBusy) return
                    setShowTypeMenu((current) => !current)
                    setShowCategoryMenu(false)
                    setShowTagMenu(false)
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-muted/40 disabled:cursor-not-allowed"
                  data-testid="bulk-type-button"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {isUpdatingType ? 'Guncelleniyor...' : 'Tur Degistir'}
                </button>

                {showTypeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div className="absolute bottom-full right-0 z-20 mb-2 w-44 rounded-lg border border-border bg-card shadow-lg">
                      <div className="p-1">
                        <button
                          onClick={() => handleTypeSelect('income')}
                          className="w-full rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-muted"
                          data-testid="bulk-type-option-income"
                        >
                          Gelir
                        </button>
                        <button
                          onClick={() => handleTypeSelect('expense')}
                          className="w-full rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-muted"
                          data-testid="bulk-type-option-expense"
                        >
                          Gider
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {onUpdateTags && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (isBusy) return
                    setShowTagMenu((current) => !current)
                    setShowCategoryMenu(false)
                    setShowTypeMenu(false)
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-muted/40 disabled:cursor-not-allowed"
                  data-testid="bulk-tags-button"
                >
                  <Tag className="w-4 h-4" />
                  {isUpdatingTags ? 'Kaydediliyor...' : 'Etiket Ayarla'}
                </button>

                {showTagMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div className="absolute bottom-full right-0 z-20 mb-2 w-80 rounded-lg border border-border bg-card p-3 shadow-lg">
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Etiketleri Uygula
                      </p>
                      <Input
                        value={tagValue}
                        onChange={(event) => setTagValue(event.target.value)}
                        placeholder="ornek: duzenlendi, mart, kira"
                        data-testid="bulk-tags-input"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Virgulle ayir. Bos birakip uygularsan secili islemlerin tum etiketleri temizlenir.
                      </p>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            closeMenus()
                            setTagValue('')
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-muted"
                        >
                          Vazgec
                        </button>
                        <button
                          onClick={handleTagsApply}
                          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                          data-testid="bulk-tags-apply-button"
                        >
                          Uygula
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-muted/40"
              >
                <Download className="w-4 h-4" />
                Disa Aktar
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
