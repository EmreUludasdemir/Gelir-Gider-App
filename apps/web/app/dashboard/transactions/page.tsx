'use client'

import { useEffect, useMemo, useState } from 'react'
import { Keyboard } from 'lucide-react'
import { useTransactions, useRefreshAll, useDuplicateGroups } from '@/lib/hooks'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { SimilarTransactionClusters } from '@/components/dashboard/transactions/SimilarTransactionClusters'
import { TransactionInsightsPanel } from '@/components/dashboard/transactions/TransactionInsightsPanel'
import { ManualTransactionForm } from '@/components/forms/ManualTransactionForm'
import { TransactionFilters } from '@/components/forms/TransactionFilters'
import { ExportButton } from '@/components/ui/ExportButton'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useRealtimeRefresh } from '@/contexts/RealtimeContext'
import { useAuth } from '@/components/auth-provider'

const SEARCH_INPUT_ID = 'transactions-search-input'

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  return (
    element.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  )
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { data: transactions, error, isLoading, mutate: mutateTransactions } = useTransactions(filters)
  const { data: duplicateGroups } = useDuplicateGroups({ days: 90, windowDays: 1, amountTolerance: 0 })
  const refreshAll = useRefreshAll()

  useRealtimeRefresh(() => {
    void mutateTransactions()
  }, [mutateTransactions])

  const duplicateIds = useMemo(() => {
    if (!duplicateGroups) return new Set<string>()
    return new Set(duplicateGroups.flatMap((group) => group.transactions.map((tx) => tx.id)))
  }, [duplicateGroups])
  const duplicateCount = duplicateIds.size

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById(SEARCH_INPUT_ID)?.focus()
        return
      }

      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape' && showForm) {
          setShowForm(false)
        }
        return
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setShowForm((prev) => !prev)
      }

      if (event.key === '/' || event.key.toLowerCase() === 'f') {
        event.preventDefault()
        document.getElementById(SEARCH_INPUT_ID)?.focus()
      }

      if (event.key === 'Escape' && showForm) {
        event.preventDefault()
        setShowForm(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm])

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
            data-testid="add-transaction-toggle"
          >
            {showForm ? 'Formu Kapat' : '+ Yeni İşlem'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm">
        <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <Keyboard className="h-3.5 w-3.5 text-primary" />
          Kısayollar:
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-foreground">N</span> yeni işlem
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-foreground">/</span> filtre arama
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-foreground">Ctrl/Cmd + K</span> arama odakla
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-foreground">Esc</span> form kapat
        </p>
      </div>

      {transactions && transactions.length > 0 && (
        <TransactionInsightsPanel
          transactions={transactions}
          duplicateCount={duplicateCount}
        />
      )}

      {transactions && transactions.length > 0 && (
        <SimilarTransactionClusters
          transactions={transactions}
          onApplied={async () => {
            await mutateTransactions()
          }}
        />
      )}

      <TransactionFilters
        searchInputId={SEARCH_INPUT_ID}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {showForm && (
        <div className="max-w-2xl">
          <ManualTransactionForm onSuccess={handleSuccess} />
        </div>
      )}

      {transactions && transactions.length > 0 ? (
        <TransactionTable
          transactions={transactions}
          title="Tüm İşlemler"
          currentUserId={user?.id}
          duplicateIds={duplicateIds}
          onRefresh={mutateTransactions}
        />
      ) : (
        <div className="p-8 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">Henüz işlem yok. Yeni işlem ekleyin veya PDF yükleyin.</p>
        </div>
      )}
    </div>
  )
}
