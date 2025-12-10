'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface TransactionTableProps {
  transactions: Transaction[]
  title?: string
  limit?: number
}

export function TransactionTable({ transactions, title = 'Son İşlemler', limit }: TransactionTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
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
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">📭</p>
            <p>Henüz işlem bulunmuyor</p>
            <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kaynak
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
