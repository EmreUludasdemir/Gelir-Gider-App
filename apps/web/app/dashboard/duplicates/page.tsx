'use client'

import { useState } from 'react'
import { useDuplicateGroups, useRefreshAll } from '@/lib/hooks'
import { deleteTransaction, resolveDuplicateGroup } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

export default function DuplicateReviewPage() {
  const [lookbackDays, setLookbackDays] = useState(90)
  const [windowDays, setWindowDays] = useState(1)
  const [amountTolerance, setAmountTolerance] = useState(0)

  const { data: groups, error, isLoading, mutate } = useDuplicateGroups({
    days: lookbackDays,
    windowDays,
    amountTolerance,
  })
  const refreshAll = useRefreshAll()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const isBusy = Boolean(deletingId || resolvingId)

  const handleDelete = async (id: string) => {
    if (!confirm('Bu islemi silmek istediginize emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      await Promise.all([mutate(), refreshAll()])
    } finally {
      setDeletingId(null)
    }
  }

  const handleKeep = async (keepId: string, transactionIds: string[]) => {
    if (!confirm('Secilen islem korunacak, digerleri silinecek. Devam edilsin mi?')) return
    setResolvingId(keepId)
    try {
      await resolveDuplicateGroup(keepId, transactionIds)
      await Promise.all([mutate(), refreshAll()])
    } finally {
      setResolvingId(null)
    }
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
          Kopya islemler yuklenirken hata olustu. Backend servisi calisiyor mu?
        </p>
      </div>
    )
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kopya Inceleme</h1>
          <p className="text-muted-foreground mt-1">
            Ayni aciklama ve tutar ile 1 gun icinde tekrar eden islemler burada listelenir.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Su an kopya islem bulunamadi.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kopya Inceleme</h1>
        <p className="text-muted-foreground mt-1">
          Ayni aciklama ve tutar ile 1 gun icinde tekrar eden islemler burada listelenir.
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tarama Araligi"
            value={String(lookbackDays)}
            onChange={(e) => setLookbackDays(parseInt(e.target.value, 10))}
            options={[
              { value: '30', label: 'Son 30 gun' },
              { value: '90', label: 'Son 90 gun' },
              { value: '180', label: 'Son 180 gun' },
            ]}
          />
          <Select
            label="Gun Penceresi"
            value={String(windowDays)}
            onChange={(e) => setWindowDays(parseInt(e.target.value, 10))}
            options={[
              { value: '1', label: '1 gun' },
              { value: '2', label: '2 gun' },
              { value: '3', label: '3 gun' },
            ]}
          />
          <Input
            label="Tutar Toleransi"
            type="number"
            min="0"
            step="0.01"
            value={amountTolerance}
            onChange={(e) => setAmountTolerance(parseFloat(e.target.value || '0'))}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.map((group) => {
          const transactionIds = group.transactions.map((tx) => tx.id)
          const newest = group.transactions[group.transactions.length - 1]
          return (
          <Card key={group.id}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{group.description}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(group.dateFrom)} - {formatDate(group.dateTo)}
                </p>
                <p className="text-xs text-muted-foreground">{group.reason}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={group.type === 'income' ? 'success' : 'warning'}>
                  {group.type === 'income' ? 'Gelir' : 'Gider'}
                </Badge>
                <Badge variant="default">{group.count} islem</Badge>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(group.amount, group.currency)}
                </span>
                {newest && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isBusy}
                    onClick={() => handleKeep(newest.id, transactionIds)}
                  >
                    En yenisini koru
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="text-sm text-foreground">
                      {formatDate(tx.date)}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                      <span>{tx.categoryLabel}</span>
                      <span>•</span>
                      <span>{tx.source === 'pdf' ? 'PDF' : 'Manuel'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={tx.type === 'income' ? 'text-success' : 'text-destructive'}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount), tx.currency)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleKeep(tx.id, transactionIds)}
                    >
                      Koru
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isBusy}
                      onClick={() => handleDelete(tx.id)}
                    >
                      {deletingId === tx.id ? 'Siliniyor...' : 'Sil'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  )
}
