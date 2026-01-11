'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/Button'
import { SortField, SortOrder } from './hooks'

interface TransactionTableHeaderProps {
  title: string
  sortBy: SortField
  sortOrder: SortOrder
  selectedCount: number
  isDeleting: boolean
  onSort: (field: SortField) => void
  onBulkDelete: () => void
}

export const TransactionTableHeader = memo(function TransactionTableHeader({
  title,
  sortBy,
  sortOrder,
  selectedCount,
  isDeleting,
  onSort,
  onBulkDelete,
}: TransactionTableHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="flex gap-2">
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isDeleting ? 'Siliniyor...' : `Secilenleri Sil (${selectedCount})`}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSort('date')}
        >
          Tarih {sortBy === 'date' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSort('amount')}
        >
          Tutar {sortBy === 'amount' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
        </Button>
      </div>
    </div>
  )
})


