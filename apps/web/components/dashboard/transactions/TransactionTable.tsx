'use client'

import { useState, useMemo } from 'react'
import { Transaction } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { TransactionEditModal } from '@/components/forms/TransactionEditModal'
import { useTransactionSort, useTransactionSelection } from './hooks'
import { TransactionTableHeader } from './TransactionTableHeader'
import { TransactionTableRow } from './TransactionTableRow'
import { TransactionMobileCard } from './TransactionMobileCard'
import { TransactionEmptyState } from './TransactionEmptyState'

interface TransactionTableProps {
  transactions: Transaction[]
  title?: string
  limit?: number
  onRefresh?: () => void
}

export function TransactionTable({
  transactions,
  title = 'Son Islemler',
  limit,
  onRefresh,
}: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const { sortBy, sortOrder, sortedTransactions, handleSort } = useTransactionSort(transactions)

  const displayedTransactions = useMemo(
    () => limit ? sortedTransactions.slice(0, limit) : sortedTransactions,
    [sortedTransactions, limit]
  )

  const {
    selectedIds,
    isDeleting,
    allPdfSelected,
    handleSelectAll,
    handleSelectOne,
    handleBulkDelete,
  } = useTransactionSelection(displayedTransactions, onRefresh)

  const hasPdfTransactions = useMemo(
    () => displayedTransactions.some(t => t.source === 'pdf'),
    [displayedTransactions]
  )

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleEditSuccess = () => {
    setEditingTransaction(null)
    onRefresh?.()
  }

  return (
    <Card>
      <CardHeader>
        <TransactionTableHeader
          title={title}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedCount={selectedIds.size}
          isDeleting={isDeleting}
          onSort={handleSort}
          onBulkDelete={handleBulkDelete}
        />
      </CardHeader>
      <CardContent className="p-0">
        {displayedTransactions.length === 0 ? (
          <TransactionEmptyState />
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-border">
              {displayedTransactions.map((transaction) => (
                <TransactionMobileCard
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedIds.has(transaction.id)}
                  hasPdfTransactions={hasPdfTransactions}
                  onSelect={handleSelectOne}
                  onEdit={handleEdit}
                />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {hasPdfTransactions && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={allPdfSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-border text-primary-600 focus:ring-primary/30"
                          title="Tum PDF islemlerini sec"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Aciklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Kaynak
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Islemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {displayedTransactions.map((transaction) => (
                    <TransactionTableRow
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedIds.has(transaction.id)}
                      hasPdfTransactions={hasPdfTransactions}
                      onSelect={handleSelectOne}
                      onEdit={handleEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  )
}


