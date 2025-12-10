'use client'

import { useState } from 'react'
import { Transaction, deleteTransaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TransactionEditModal } from '@/components/forms/TransactionEditModal'
import { useToast } from '@/components/ui/Toast'

interface TransactionTableProps {
  transactions: Transaction[]
  title?: string
  limit?: number
  onRefresh?: () => void
}

export function TransactionTable({ transactions, title = 'Son İşlemler', limit, onRefresh }: TransactionTableProps) {
  const { showToast } = useToast()
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'date') {
      comparison = a.date.localeCompare(b.date)
    } else {
      comparison = Math.abs(a.amount) - Math.abs(b.amount)
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
  
  const displayedTransactions = limit ? sortedTransactions.slice(0, limit) : sortedTransactions

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      salary: 'bg-green-100 text-green-800',
      freelance: 'bg-blue-100 text-blue-800',
      investment: 'bg-purple-100 text-purple-800',
      market: 'bg-orange-100 text-orange-800',
      restaurant: 'bg-red-100 text-red-800',
      transport: 'bg-indigo-100 text-indigo-800',
      subscription: 'bg-pink-100 text-pink-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      health: 'bg-teal-100 text-teal-800',
      shopping: 'bg-cyan-100 text-cyan-800',
      education: 'bg-lime-100 text-lime-800',
      entertainment: 'bg-fuchsia-100 text-fuchsia-800',
      rent: 'bg-rose-100 text-rose-800',
      transfer: 'bg-gray-100 text-gray-800',
      atm: 'bg-slate-100 text-slate-800',
      insurance: 'bg-amber-100 text-amber-800',
      other: 'bg-neutral-100 text-neutral-800',
    }
    return colors[categoryId] || 'bg-gray-100 text-gray-800'
  }

  const pdfTransactions = displayedTransactions.filter(t => t.source === 'pdf')
  const hasPdfTransactions = pdfTransactions.length > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pdfTransactions.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmMsg = `${selectedIds.size} adet PDF işlemini silmek istediğinize emin misiniz?`
    if (!confirm(confirmMsg)) return

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteTransaction(id))
      await Promise.all(deletePromises)
      
      showToast('success', `${selectedIds.size} işlem başarıyla silindi`)
      setSelectedIds(new Set())
      onRefresh?.()
    } catch (error) {
      showToast('error', 'İşlemler silinirken bir hata oluştu')
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const allPdfSelected = hasPdfTransactions && pdfTransactions.every(t => selectedIds.has(t.id))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? '⏳ Siliniyor...' : `🗑️ Seçilenleri Sil (${selectedIds.size})`}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('date')}
          >
            Tarih {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('amount')}
          >
            Tutar {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">📭</p>
            <p>Henüz işlem bulunmuyor</p>
            <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {displayedTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {hasPdfTransactions && transaction.source === 'pdf' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={(e) => handleSelectOne(transaction.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label="İşlemi seç"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          {transaction.source === 'pdf' ? '📄' : '✍️'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTransaction(transaction)}
                        >
                          ✏️
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
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
                        title="Tüm PDF işlemlerini seç"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Açıklama
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
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {displayedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {hasPdfTransactions && (
                      <td className="px-4 py-4 text-center">
                        {transaction.source === 'pdf' ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={(e) => handleSelectOne(transaction.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label="İşlemi seç"
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
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
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <Badge variant={transaction.source === 'pdf' ? 'success' : 'default'}>
                        {transaction.source === 'pdf' ? '📄 PDF' : '✍️ Manuel'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        ✏️ Düzenle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </CardContent>

      {/* Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            onRefresh?.()
          }}
        />
      )}
    </Card>
  )
}
