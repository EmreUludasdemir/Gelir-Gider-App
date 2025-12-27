'use client'

import { useState, useCallback, useMemo } from 'react'
import { Transaction, deleteTransaction } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export interface UseTransactionSelectionReturn {
  selectedIds: Set<string>
  isDeleting: boolean
  allPdfSelected: boolean
  handleSelectAll: (checked: boolean) => void
  handleSelectOne: (id: string, checked: boolean) => void
  handleBulkDelete: () => Promise<void>
  clearSelection: () => void
}

export function useTransactionSelection(
  transactions: Transaction[],
  onRefresh?: () => void
): UseTransactionSelectionReturn {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

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
      onRefresh?.()
    } catch (error) {
      showToast('Islemler silinirken bir hata olustu', 'error')
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds, onRefresh, showToast])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    isDeleting,
    allPdfSelected,
    handleSelectAll,
    handleSelectOne,
    handleBulkDelete,
    clearSelection,
  }
}
