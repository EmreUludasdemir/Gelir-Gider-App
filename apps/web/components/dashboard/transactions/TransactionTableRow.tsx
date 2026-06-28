'use client'

import { memo } from 'react'
import { Transaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getCategoryColor } from './utils'
import { FileUp, Pencil, ShieldAlert, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionTableRowProps {
  transaction: Transaction
  currentUserId?: string
  isSelected: boolean
  hasPdfTransactions: boolean
  isDuplicate: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (transaction: Transaction) => void
}

export const TransactionTableRow = memo(function TransactionTableRow({
  transaction,
  currentUserId,
  isSelected,
  hasPdfTransactions,
  isDuplicate,
  onSelect,
  onEdit,
}: TransactionTableRowProps) {
  const canEdit = !transaction.ownerUserId || transaction.ownerUserId === currentUserId

  return (
    <tr className={cn(
      "border-b border-border/40 hover:bg-muted/40 transition-colors duration-200",
      isSelected && "bg-primary/5 hover:bg-primary/8"
    )}>
      {hasPdfTransactions && (
        <td className="px-4 py-4 text-center">
          {transaction.source === 'pdf' && canEdit ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(transaction.id, e.target.checked)}
              className="rounded-md border-border/70 text-primary-600 bg-card/60 focus:ring-primary/20 transition-all cursor-pointer"
              aria-label="İşlemi seç"
            />
          ) : (
            <span className="text-muted-foreground/35 select-none">-</span>
          )}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-muted-foreground/80">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        <div className="max-w-md" title={transaction.description}>
          <div className="font-semibold tracking-tight text-foreground/90">{transaction.description}</div>
          
          {(transaction.ownerName || transaction.reviewerName || transaction.needsReview) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {transaction.ownerName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/40">
                  <User className="w-3 h-3" />
                  {transaction.ownerName}
                </span>
              )}
              {transaction.reviewerName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Users className="w-3 h-3" />
                  {transaction.reviewerName}
                </span>
              )}
              {transaction.needsReview && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="w-3 h-3" />
                  İnceleme Gerekli
                </span>
              )}
            </div>
          )}

          {transaction.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {transaction.tags.map((tag) => (
                <span
                  key={`${transaction.id}-${tag}`}
                  className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:text-primary-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
          getCategoryColor(transaction.categoryId) || "bg-muted text-foreground"
        )}>
          {transaction.categoryLabel}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-center font-bold">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md border",
          transaction.type === 'income' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-muted border-border text-muted-foreground"
        )}>
          {transaction.type === 'income' ? 'Gelir' : 'Gider'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold tabular-nums">
        <span className={transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-center font-bold">
        <div className="inline-flex items-center gap-1.5 justify-center">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border",
            transaction.source === 'pdf' 
              ? "bg-primary/10 border-primary/20 text-primary-700 dark:text-primary-400" 
              : "bg-muted border-border text-muted-foreground"
          )}>
            {transaction.source === 'pdf' && <FileUp className="w-3 h-3" />}
            {transaction.source === 'pdf' ? 'PDF' : 'Manuel'}
          </span>
          {isDuplicate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/25">
              Kopya
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
        <Button
          size="sm"
          variant="outline"
          className="font-bold inline-flex items-center gap-1.5 h-8 border-border/70 hover:border-primary/30"
          disabled={!canEdit}
          onClick={() => onEdit(transaction)}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only text-[11px]">{canEdit ? 'Düzenle' : 'Salt Okunur'}</span>
        </Button>
      </td>
    </tr>
  )
})
