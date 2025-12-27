'use client'

import { useState, useMemo, useCallback } from 'react'
import { Transaction } from '@/lib/api'

export type SortField = 'date' | 'amount'
export type SortOrder = 'asc' | 'desc'

export interface UseTransactionSortReturn {
  sortBy: SortField
  sortOrder: SortOrder
  sortedTransactions: Transaction[]
  handleSort: (field: SortField) => void
}

export function useTransactionSort(transactions: Transaction[]): UseTransactionSortReturn {
  const [sortBy, setSortBy] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date)
      } else {
        comparison = Math.abs(a.amount) - Math.abs(b.amount)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [transactions, sortBy, sortOrder])

  const handleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }, [sortBy])

  return {
    sortBy,
    sortOrder,
    sortedTransactions,
    handleSort,
  }
}
