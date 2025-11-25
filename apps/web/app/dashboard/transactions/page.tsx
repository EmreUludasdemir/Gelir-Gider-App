'use client'

import { useState } from 'react'
import { useTransactions, useRefreshAll } from '@/lib/hooks'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { ManualTransactionForm } from '@/components/forms/ManualTransactionForm'
import { TransactionFilters } from '@/components/forms/TransactionFilters'
import { ExportButton } from '@/components/ui/ExportButton'
import { Spinner } from '@/components/ui/Spinner'

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { data: transactions, error, isLoading } = useTransactions(filters)
  const refreshAll = useRefreshAll()

  const handleSuccess = async () => {
    setShowForm(false)
    await refreshAll()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          Veri yüklenirken hata oluştu. Backend servisi çalışıyor mu?
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tüm İşlemler</h1>
          <p className="text-gray-600 mt-1">
            Toplam {transactions?.length || 0} işlem
          </p>
        </div>
        <div className="flex gap-2">
          {transactions && transactions.length > 0 && (
            <ExportButton transactions={transactions} />
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {showForm ? 'Formu Kapat' : '+ Yeni İşlem'}
          </button>
        </div>
      </div>

      <TransactionFilters
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {showForm && (
        <div className="max-w-2xl">
          <ManualTransactionForm onSuccess={handleSuccess} />
        </div>
      )}

      {transactions && transactions.length > 0 ? (
        <TransactionTable transactions={transactions} title="Tüm İşlemler" />
      ) : (
        <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">Henüz işlem yok. Yeni işlem ekleyin veya PDF yükleyin.</p>
        </div>
      )}
    </div>
  )
}
