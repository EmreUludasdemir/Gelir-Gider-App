'use client'

import { useState, useCallback, useMemo } from 'react'
import { bulkCategorizeTransactions, bulkUpdateTransactions, deleteTransaction, Transaction, TransactionType } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export interface UseTransactionSelectionReturn {
  selectedIds: Set<string>
  isDeleting: boolean
  isCategorizing: boolean
  isUpdatingType: boolean
  isUpdatingTags: boolean
  allPdfSelected: boolean
  handleSelectAll: (checked: boolean) => void
  handleSelectOne: (id: string, checked: boolean) => void
  handleBulkDelete: () => Promise<void>
  handleBulkCategorize: (
    categoryId: string,
    categoryLabel: string,
    options?: { applyToSimilar?: boolean }
  ) => Promise<void>
  handleBulkTypeUpdate: (type: TransactionType) => Promise<void>
  handleBulkTagsUpdate: (tags: string[]) => Promise<void>
  clearSelection: () => void
}

export function useTransactionSelection(
  transactions: Transaction[],
  onRefresh?: () => void | Promise<void>
): UseTransactionSelectionReturn {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [isUpdatingType, setIsUpdatingType] = useState(false)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)

  const pdfTransactions = useMemo(
    () => transactions.filter(t => t.source === 'pdf'),
    [transactions]
  )

  const allPdfSelected = useMemo(
    () => pdfTransactions.length > 0 && pdfTransactions.every(t => selectedIds.has(t.id)),
    [pdfTransactions, selectedIds]
  )

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pdfTransactions.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }, [pdfTransactions])

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    const confirmMsg = `${selectedIds.size} adet PDF islemini silmek istediginize emin misiniz?`
    if (!confirm(confirmMsg)) return

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteTransaction(id))
      await Promise.all(deletePromises)

      showToast(`${selectedIds.size} islem basariyla silindi`, 'success')
      setSelectedIds(new Set())
      await onRefresh?.()
    } catch (error) {
      showToast('Islemler silinirken bir hata olustu', 'error')
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds, onRefresh, showToast])

  const handleBulkCategorize = useCallback(async (
    categoryId: string,
    categoryLabel: string,
    options?: { applyToSimilar?: boolean },
  ) => {
    if (selectedIds.size === 0) return

    setIsCategorizing(true)
    try {
      const transactionIds = Array.from(selectedIds)
      const result = await bulkCategorizeTransactions(
        transactionIds,
        categoryId,
        categoryLabel,
        options,
      )

      const similarCopy =
        options?.applyToSimilar && result.matchedSimilar > 0
          ? ` (${result.matchedSimilar} benzer kayit dahil)`
          : ''

      showToast(
        `${result.updated} islem ${categoryLabel} kategorisine tasindi${similarCopy}`,
        'success',
      )
      setSelectedIds(new Set())
      await onRefresh?.()
    } catch (error) {
      showToast('Toplu kategorileme sirasinda hata olustu', 'error')
      console.error('Bulk categorize error:', error)
    } finally {
      setIsCategorizing(false)
    }
  }, [selectedIds, onRefresh, showToast])

  const handleBulkTypeUpdate = useCallback(async (type: TransactionType) => {
    if (selectedIds.size === 0) return

    setIsUpdatingType(true)
    try {
      const transactionIds = Array.from(selectedIds)
      const result = await bulkUpdateTransactions({
        transactionIds,
        type,
      })

      showToast(
        `${result.updated} islem ${type === 'income' ? 'gelir' : 'gider'} tipine tasindi`,
        'success',
      )
      setSelectedIds(new Set())
      await onRefresh?.()
    } catch (error) {
      showToast('Toplu tur guncelleme sirasinda hata olustu', 'error')
      console.error('Bulk type update error:', error)
    } finally {
      setIsUpdatingType(false)
    }
  }, [selectedIds, onRefresh, showToast])

  const handleBulkTagsUpdate = useCallback(async (tags: string[]) => {
    if (selectedIds.size === 0) return

    setIsUpdatingTags(true)
    try {
      const transactionIds = Array.from(selectedIds)
      const sanitizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
      const result = await bulkUpdateTransactions({
        transactionIds,
        tags: sanitizedTags,
      })

      const tagCopy =
        sanitizedTags.length > 0
          ? `Etiketler: ${sanitizedTags.join(', ')}`
          : 'Tum etiketler temizlendi'

      showToast(`${result.updated} islem guncellendi. ${tagCopy}`, 'success')
      setSelectedIds(new Set())
      await onRefresh?.()
    } catch (error) {
      showToast('Toplu etiket guncelleme sirasinda hata olustu', 'error')
      console.error('Bulk tags update error:', error)
    } finally {
      setIsUpdatingTags(false)
    }
  }, [selectedIds, onRefresh, showToast])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    isDeleting,
    isCategorizing,
    isUpdatingType,
    isUpdatingTags,
    allPdfSelected,
    handleSelectAll,
    handleSelectOne,
    handleBulkDelete,
    handleBulkCategorize,
    handleBulkTypeUpdate,
    handleBulkTagsUpdate,
    clearSelection,
  }
}
