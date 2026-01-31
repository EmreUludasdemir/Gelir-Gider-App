'use client'

import { useState } from 'react'
import { useTransactions, useRefreshAll } from '@/lib/hooks'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { ManualTransactionForm } from '@/components/forms/ManualTransactionForm'
import { TransactionFilters } from '@/components/forms/TransactionFilters'
import { ExportButton } from '@/components/ui/ExportButton'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'

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
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">
          Veri yüklenirken hata oluştu. Backend servisi çalışıyor mu?
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tüm İşlemler</h1>
          <p className="text-muted-foreground mt-1">
            Toplam {transactions?.length || 0} işlem
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {transactions && transactions.length > 0 && (
            <ExportButton transactions={transactions} />
          )}
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="primary"
          >
            {showForm ? 'Formu Kapat' : '+ Yeni İşlem'}
          </Button>
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
        <div className="p-8 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">Henüz işlem yok. Yeni işlem ekleyin veya PDF yükleyin.</p>
        </div>
      )}
    </div>
  )
}

