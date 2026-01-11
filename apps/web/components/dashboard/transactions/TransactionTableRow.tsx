'use client'

import { memo } from 'react'
import { Transaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getCategoryColor } from './utils'

interface TransactionTableRowProps {
  transaction: Transaction
  isSelected: boolean
  hasPdfTransactions: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (transaction: Transaction) => void
}

export const TransactionTableRow = memo(function TransactionTableRow({
  transaction,
  isSelected,
  hasPdfTransactions,
  onSelect,
  onEdit,
}: TransactionTableRowProps) {
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      {hasPdfTransactions && (
        <td className="px-4 py-4 text-center">
          {transaction.source === 'pdf' ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(transaction.id, e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary/30"
              aria-label="Islemi sec"
            />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        <div className="max-w-md" title={transaction.description}>
          {transaction.description}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.categoryId)}`}>
          {transaction.categoryLabel}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
        <Badge variant={transaction.type === 'income' ? 'success' : 'default'}>
          {transaction.type === 'income' ? 'Gelir' : 'Gider'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
        <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
        <Badge variant={transaction.source === 'pdf' ? 'success' : 'default'}>
          {transaction.source === 'pdf' ? 'PDF' : 'Manuel'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(transaction)}
        >
          Duzenle
        </Button>
      </td>
    </tr>
  )
})


