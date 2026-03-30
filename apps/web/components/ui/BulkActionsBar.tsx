'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ArrowUpDown, Download, Tag, Trash2, X } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { Input } from '@/components/ui/Input'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
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

// Hook for keyboard navigation in dropdown menus
function useKeyboardNavigation(
  isOpen: boolean,
  onClose: () => void,
  itemCount: number,
  onSelect: (index: number) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0)
    } else {
      setFocusedIndex(-1)
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => (prev + 1) % itemCount)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev - 1 + itemCount) % itemCount)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) {
          onSelect(focusedIndex)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab':
        onClose()
        break
    }
  }, [isOpen, itemCount, focusedIndex, onSelect, onClose])

  return { focusedIndex, handleKeyDown, setFocusedIndex }
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
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [applyToSimilar, setApplyToSimilar] = useState(false)
  const [tagValue, setTagValue] = useState('')
  
  const categoryButtonRef = useRef<HTMLButtonElement>(null)
  const typeButtonRef = useRef<HTMLButtonElement>(null)
  const tagButtonRef = useRef<HTMLButtonElement>(null)

  // i18n labels
  const labels = language === 'tr' ? {
    itemsSelected: 'öğe seçildi',
    categorize: 'Kategorize Et',
    categorizing: 'Uygulanıyor...',
    selectCategory: 'Kategori Seç',
    applySimilar: 'Aynı merchant / açıklama paterni taşıyan benzer işlemleri de güncelle',
    changeType: 'Tür Değiştir',
    updating: 'Güncelleniyor...',
    income: 'Gelir',
    expense: 'Gider',
    setTags: 'Etiket Ayarla',
    saving: 'Kaydediliyor...',
    applyTags: 'Etiketleri Uygula',
    tagsPlaceholder: 'örnek: düzenlendi, mart, kira',
    tagsHelp: 'Virgülle ayır. Boş bırakıp uygularsan seçili işlemlerin tüm etiketleri temizlenir.',
    cancel: 'Vazgeç',
    apply: 'Uygula',
    export: 'Dışa Aktar',
    delete: 'Sil',
    deleting: 'Siliniyor...',
    clearSelection: 'Seçimi kaldır',
  } : {
    itemsSelected: 'items selected',
    categorize: 'Categorize',
    categorizing: 'Applying...',
    selectCategory: 'Select Category',
    applySimilar: 'Also update similar transactions with the same merchant/description pattern',
    changeType: 'Change Type',
    updating: 'Updating...',
    income: 'Income',
    expense: 'Expense',
    setTags: 'Set Tags',
    saving: 'Saving...',
    applyTags: 'Apply Tags',
    tagsPlaceholder: 'e.g., edited, march, rent',
    tagsHelp: 'Separate with commas. Leave empty and apply to clear all tags from selected items.',
    cancel: 'Cancel',
    apply: 'Apply',
    export: 'Export',
    delete: 'Delete',
    deleting: 'Deleting...',
    clearSelection: 'Clear selection',
  }

  // Category keyboard navigation
  const { 
    focusedIndex: categoryFocusedIndex, 
    handleKeyDown: handleCategoryKeyDown 
  } = useKeyboardNavigation(
    showCategoryMenu,
    () => {
      setShowCategoryMenu(false)
      categoryButtonRef.current?.focus()
    },
    CATEGORIES.length,
    (index) => {
      const category = CATEGORIES[index]
      handleCategorySelect(category.id, category.label)
    }
  )

  // Type menu keyboard navigation
  const typeOptions: TransactionType[] = ['income', 'expense']
  const { 
    focusedIndex: typeFocusedIndex, 
    handleKeyDown: handleTypeKeyDown 
  } = useKeyboardNavigation(
    showTypeMenu,
    () => {
      setShowTypeMenu(false)
      typeButtonRef.current?.focus()
    },
    typeOptions.length,
    (index) => handleTypeSelect(typeOptions[index])
  )

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
    categoryButtonRef.current?.focus()
  }

  const handleTypeSelect = (type: TransactionType) => {
    onUpdateType?.(type)
    closeMenus()
    typeButtonRef.current?.focus()
  }

  const handleTagsApply = () => {
    const tags = tagValue
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    onUpdateTags?.(tags)
    closeMenus()
    setTagValue('')
    tagButtonRef.current?.focus()
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg animate-slide-up"
      role="toolbar"
      aria-label={language === 'tr' ? 'Toplu işlem araçları' : 'Bulk action tools'}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                closeMenus()
                onDeselect()
              }}
              className="rounded p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={labels.clearSelection}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {labels.itemsSelected}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCategorize && (
              <div className="relative">
                <button
                  ref={categoryButtonRef}
                  onClick={() => {
                    if (isBusy) return
                    setShowCategoryMenu((current) => !current)
                    setShowTypeMenu(false)
                    setShowTagMenu(false)
                  }}
                  onKeyDown={handleCategoryKeyDown}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="bulk-categorize-button"
                  aria-expanded={showCategoryMenu}
                  aria-haspopup="listbox"
                >
                  <Tag className="w-4 h-4" />
                  {isCategorizing ? labels.categorizing : labels.categorize}
                </button>

                {showCategoryMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div 
                      className="absolute bottom-full right-0 z-20 mb-2 max-h-80 w-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
                      role="listbox"
                      aria-label={labels.selectCategory}
                      onKeyDown={handleCategoryKeyDown}
                    >
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                          {labels.selectCategory}
                        </p>
                        <label className="mx-2 mb-2 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={applyToSimilar}
                            onChange={(event) => setApplyToSimilar(event.target.checked)}
                            className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary/30"
                            data-testid="bulk-apply-similar-toggle"
                          />
                          <span>{labels.applySimilar}</span>
                        </label>
                        {CATEGORIES.map((category, index) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id, category.label)}
                            className={`w-full rounded px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted ${
                              categoryFocusedIndex === index ? 'bg-muted ring-2 ring-primary/50' : ''
                            }`}
                            data-testid={`bulk-category-option-${category.id}`}
                            role="option"
                            aria-selected={categoryFocusedIndex === index}
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
                  ref={typeButtonRef}
                  onClick={() => {
                    if (isBusy) return
                    setShowTypeMenu((current) => !current)
                    setShowCategoryMenu(false)
                    setShowTagMenu(false)
                  }}
                  onKeyDown={handleTypeKeyDown}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="bulk-type-button"
                  aria-expanded={showTypeMenu}
                  aria-haspopup="listbox"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {isUpdatingType ? labels.updating : labels.changeType}
                </button>

                {showTypeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div 
                      className="absolute bottom-full right-0 z-20 mb-2 w-44 rounded-lg border border-border bg-card shadow-lg"
                      role="listbox"
                      onKeyDown={handleTypeKeyDown}
                    >
                      <div className="p-1">
                        <button
                          onClick={() => handleTypeSelect('income')}
                          className={`w-full rounded px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted ${
                            typeFocusedIndex === 0 ? 'bg-muted ring-2 ring-primary/50' : ''
                          }`}
                          data-testid="bulk-type-option-income"
                          role="option"
                          aria-selected={typeFocusedIndex === 0}
                        >
                          {labels.income}
                        </button>
                        <button
                          onClick={() => handleTypeSelect('expense')}
                          className={`w-full rounded px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted ${
                            typeFocusedIndex === 1 ? 'bg-muted ring-2 ring-primary/50' : ''
                          }`}
                          data-testid="bulk-type-option-expense"
                          role="option"
                          aria-selected={typeFocusedIndex === 1}
                        >
                          {labels.expense}
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
                  ref={tagButtonRef}
                  onClick={() => {
                    if (isBusy) return
                    setShowTagMenu((current) => !current)
                    setShowCategoryMenu(false)
                    setShowTypeMenu(false)
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="bulk-tags-button"
                  aria-expanded={showTagMenu}
                  aria-haspopup="dialog"
                >
                  <Tag className="w-4 h-4" />
                  {isUpdatingTags ? labels.saving : labels.setTags}
                </button>

                {showTagMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenus} />
                    <div 
                      className="absolute bottom-full right-0 z-20 mb-2 w-80 rounded-lg border border-border bg-card p-3 shadow-lg"
                      role="dialog"
                      aria-label={labels.applyTags}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          closeMenus()
                          tagButtonRef.current?.focus()
                        }
                      }}
                    >
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        {labels.applyTags}
                      </p>
                      <Input
                        value={tagValue}
                        onChange={(event) => setTagValue(event.target.value)}
                        placeholder={labels.tagsPlaceholder}
                        data-testid="bulk-tags-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleTagsApply()
                          }
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {labels.tagsHelp}
                      </p>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            closeMenus()
                            setTagValue('')
                            tagButtonRef.current?.focus()
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {labels.cancel}
                        </button>
                        <button
                          onClick={handleTagsApply}
                          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          data-testid="bulk-tags-apply-button"
                        >
                          {labels.apply}
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
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Download className="w-4 h-4" />
                {labels.export}
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? labels.deleting : labels.delete}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
