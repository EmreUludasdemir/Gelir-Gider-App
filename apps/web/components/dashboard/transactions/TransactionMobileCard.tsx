'use client'

import { memo } from 'react'
import { Transaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getCategoryColor } from './utils'

interface TransactionMobileCardProps {
  transaction: Transaction
  isSelected: boolean
  hasPdfTransactions: boolean
  isDuplicate: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (transaction: Transaction) => void
}

export const TransactionMobileCard = memo(function TransactionMobileCard({
  transaction,
  isSelected,
  hasPdfTransactions,
  isDuplicate,
  onSelect,
  onEdit,
}: TransactionMobileCardProps) {
  return (
    <div className="p-4 transition-colors hover:bg-primary/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {hasPdfTransactions && transaction.source === 'pdf' && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(transaction.id, e.target.checked)}
                className="rounded border-border text-primary-600 focus:ring-primary/30"
                aria-label="Islemi sec"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {transaction.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.categoryId)}`}>
              {transaction.categoryLabel}
            </span>
            <Badge variant={transaction.type === 'income' ? 'success' : 'default'}>
              {transaction.type === 'income' ? 'Gelir' : 'Gider'}
            </Badge>
            <Badge variant={transaction.source === 'pdf' ? 'success' : 'default'}>
              {transaction.source === 'pdf' ? 'PDF' : 'Manuel'}
            </Badge>
            {isDuplicate && (
              <Badge variant="warning">Kopya</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="font-semibold"
              onClick={() => onEdit(transaction)}
            >
              Duzenle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})


