'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Transaction } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { TransactionEditModal } from '@/components/forms/TransactionEditModal'
import { Pagination } from '@/components/ui/Pagination'
import { useTransactionSort, useTransactionSelection, usePagination, useTransactionSearch } from './hooks'
import { TransactionTableHeader } from './TransactionTableHeader'
import { TransactionTableRow } from './TransactionTableRow'
import { TransactionMobileCard } from './TransactionMobileCard'
import { TransactionEmptyState } from './TransactionEmptyState'

interface TransactionTableProps {
  transactions: Transaction[]
  title?: string
  limit?: number
  onRefresh?: () => void
  showPagination?: boolean
  showSearch?: boolean
  language?: 'tr' | 'en'
}

export function TransactionTable({
  transactions,
  title = 'Son Islemler',
  limit,
  onRefresh,
  showPagination = false,
  showSearch = false,
  language = 'tr',
}: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Search hook
  const {
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    highlightText,
    clearSearch,
    hasSearch,
  } = useTransactionSearch(transactions)

  // Sort the filtered transactions
  const { sortBy, sortOrder, sortedTransactions, handleSort } = useTransactionSort(filteredTransactions)

  // Apply limit if provided (for dashboard view)
  const limitedTransactions = useMemo(
    () => limit ? sortedTransactions.slice(0, limit) : sortedTransactions,
    [sortedTransactions, limit]
  )

  // Pagination (only if enabled and no limit)
  const pagination = usePagination(limitedTransactions, {
    initialPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  })

  const displayedTransactions = showPagination && !limit
    ? pagination.paginatedItems
    : limitedTransactions

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
        <div className="space-y-4">
          <TransactionTableHeader
            title={title}
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedCount={selectedIds.size}
            isDeleting={isDeleting}
            onSort={handleSort}
            onBulkDelete={handleBulkDelete}
          />

          {/* Inline Search */}
          {showSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'tr' ? 'İşlem ara... (açıklama, kategori, tutar)' : 'Search transactions...'}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {hasSearch && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Search results info */}
          {showSearch && hasSearch && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'tr'
                ? `"${searchTerm}" için ${filteredTransactions.length} sonuç bulundu`
                : `Found ${filteredTransactions.length} results for "${searchTerm}"`}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayedTransactions.length === 0 ? (
          <TransactionEmptyState />
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-700">
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
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {hasPdfTransactions && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={allPdfSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          title="Tum PDF islemlerini sec"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aciklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kaynak
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Islemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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

      {/* Pagination */}
      {showPagination && !limit && limitedTransactions.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          language={language}
        />
      )}

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
