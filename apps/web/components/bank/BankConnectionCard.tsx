'use client'

import { useState } from 'react'

interface BankConnection {
  id: string
  bankCode: string
  bankName: string
  accountNumber?: string
  accountName?: string
  accountType: string
  expiresAt?: string
  lastSyncAt?: string
  lastSyncStatus?: string
  lifecycleState?: 'pending_consent' | 'connected' | 'reauth_required' | 'failed'
  syncError?: string
  errorReason?: string
  providerErrorCode?: string
  lastConsentAt?: string
  isActive: boolean
}

interface BankConnectionCardProps {
  connection: BankConnection
  onSync: () => void
  onReconnect: () => void
  onDelete: () => void
}

const bankLogos: Record<string, string> = {
  mock: 'BANK',
  garanti: 'GAR',
  isbank: 'IS',
  akbank: 'AK',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Henüz senkronize edilmedi'
  const date = new Date(dateStr)
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLifecycleBadge(connection: BankConnection) {
  switch (connection.lifecycleState) {
    case 'connected':
      return {
        label: 'Bağlı',
        className: 'bg-success/15 text-success',
      }
    case 'pending_consent':
      return {
        label: 'Onay Bekliyor',
        className: 'bg-warning/20 text-warning-foreground',
      }
    case 'reauth_required':
      return {
        label: 'Reauth Gerekli',
        className: 'bg-destructive/15 text-destructive',
      }
    case 'failed':
      return {
        label: 'Hatalı',
        className: 'bg-destructive/15 text-destructive',
      }
    default:
      return {
        label: 'Durum Bekleniyor',
        className: 'bg-muted text-muted-foreground',
      }
  }
}

function getSyncBadge(connection: BankConnection) {
  switch (connection.lastSyncStatus) {
    case 'success':
      return {
        label: 'Sync Başarılı',
        className: 'bg-success/15 text-success',
      }
    case 'failed':
      return {
        label: 'Sync Hatası',
        className: 'bg-destructive/15 text-destructive',
      }
    case 'reauth_required':
      return {
        label: 'Sync için Reauth',
        className: 'bg-destructive/15 text-destructive',
      }
    default:
      return {
        label: 'Sync Bekliyor',
        className: 'bg-warning/20 text-warning-foreground',
      }
  }
}

export default function BankConnectionCard({
  connection,
  onSync,
  onReconnect,
  onDelete,
}: BankConnectionCardProps) {
  const [syncing, setSyncing] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  const lifecycleBadge = getLifecycleBadge(connection)
  const syncBadge = getSyncBadge(connection)
  const requiresReauth = connection.lifecycleState === 'reauth_required'

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync()
    } finally {
      setSyncing(false)
    }
  }

  const handleReconnect = async () => {
    setReconnecting(true)
    try {
      await onReconnect()
    } finally {
      setReconnecting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
            {bankLogos[connection.bankCode] || 'BANK'}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{connection.bankName}</h3>
              <p className="text-sm text-muted-foreground">
                {connection.accountName || 'Hesap'}
                {connection.accountNumber ? ` • ${connection.accountNumber}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${lifecycleBadge.className}`}>
                {lifecycleBadge.label}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${syncBadge.className}`}>
                {syncBadge.label}
              </span>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>Son sync: {formatDate(connection.lastSyncAt)}</p>
              <p>Son onay: {formatDate(connection.lastConsentAt)}</p>
              {connection.expiresAt && <p>Token bitişi: {formatDate(connection.expiresAt)}</p>}
              {connection.errorReason && (
                <p className="text-destructive md:col-span-2">
                  Hata nedeni: {connection.errorReason}
                  {connection.providerErrorCode ? ` (${connection.providerErrorCode})` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {requiresReauth ? (
            <button
              onClick={handleReconnect}
              disabled={reconnecting}
              className="rounded-lg bg-warning px-3 py-2 text-sm font-medium text-warning-foreground transition-colors hover:bg-warning/90 disabled:opacity-60"
            >
              {reconnecting ? 'Başlatılıyor...' : 'Yeniden Doğrula'}
            </button>
          ) : (
            <button
              onClick={handleSync}
              disabled={syncing || connection.lifecycleState !== 'connected'}
              className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? 'Senkronize ediliyor...' : 'Senkronize Et'}
            </button>
          )}

          <button
            onClick={onDelete}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Bağlantıyı Sil"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
