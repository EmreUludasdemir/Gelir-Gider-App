'use client'

import { useState, useMemo, useCallback } from 'react'
import { Transaction } from '@/lib/api'

interface SearchResult {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredTransactions: Transaction[]
  highlightText: (text: string) => React.ReactNode
  clearSearch: () => void
  hasSearch: boolean
}

export function useTransactionSearch(transactions: Transaction[]): SearchResult {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions

    const term = searchTerm.toLowerCase().trim()
    return transactions.filter((tx) => {
      return (
        tx.description.toLowerCase().includes(term) ||
        tx.categoryLabel.toLowerCase().includes(term) ||
        tx.amount.toString().includes(term) ||
        tx.date.includes(term)
      )
    })
  }, [transactions, searchTerm])

  const highlightText = useCallback(
    (text: string): React.ReactNode => {
      if (!searchTerm.trim()) return text

      const term = searchTerm.toLowerCase().trim()
      const index = text.toLowerCase().indexOf(term)

      if (index === -1) return text

      const before = text.slice(0, index)
      const match = text.slice(index, index + term.length)
      const after = text.slice(index + term.length)

      return (
        <>
          {before}
          <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {match}
          </mark>
          {after}
        </>
      )
    },
    [searchTerm]
  )

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    highlightText,
    clearSearch,
    hasSearch: searchTerm.trim().length > 0,
  }
}
