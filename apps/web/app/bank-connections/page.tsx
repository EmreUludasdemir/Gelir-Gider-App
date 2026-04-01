'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import BankConnectionCard from '@/components/bank/BankConnectionCard'
import { getApiErrorMessage, parseApiErrorResponse } from '@/lib/api'
import { isBankConnectionsDemoEnabled } from '@/lib/feature-flags'

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
  reauthRequiredAt?: string
  isActive: boolean
  isDemoProvider?: boolean
}

interface AvailableBank {
  code: string
  name: string
  isDemo?: boolean
}

interface StartConnectionPayload {
  bankCode: string
  bankName?: string
  accountNumber?: string
  accountName?: string
}

export default function BankConnectionsPage() {
  const { fetchWithAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const processedCallbackRef = useRef<string | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [availableBanks, setAvailableBanks] = useState<AvailableBank[]>([])
  const [loading, setLoading] = useState(true)
  const [processingCallback, setProcessingCallback] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const bankCode = searchParams.get('bankCode')
  const callbackState = searchParams.get('state')
  const callbackCode = searchParams.get('code')
  const providerError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description') || ''

  const loadData = useCallback(async () => {
    try {
      const [connectionsResponse, banksResponse] = await Promise.all([
        fetchWithAuth('/bank-connections'),
        fetchWithAuth('/bank-connections/banks'),
      ])

      if (!connectionsResponse.ok) {
        throw await parseApiErrorResponse(connectionsResponse, '/bank-connections')
      }

      if (!banksResponse.ok) {
        throw await parseApiErrorResponse(banksResponse, '/bank-connections/banks')
      }

      const [connectionsData, banksData] = await Promise.all([
        connectionsResponse.json(),
        banksResponse.json(),
      ])

      setConnections(connectionsData)
      setAvailableBanks(banksData)
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, 'Banka bağlantıları yüklenirken hata oluştu.')
      )
    } finally {
      setLoading(false)
    }
  }, [fetchWithAuth])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!bankCode || !callbackState || (!callbackCode && !providerError)) {
      return
    }

    const callbackKey = [
      bankCode,
      callbackState,
      callbackCode || providerError || '',
      errorDescription,
    ].join(':')

    if (processedCallbackRef.current === callbackKey) {
      return
    }

    processedCallbackRef.current = callbackKey
    let cancelled = false

    const processCallback = async () => {
      setProcessingCallback(true)
      setError(null)

      try {
        const callbackQuery = new URLSearchParams()
        callbackQuery.set('bankCode', bankCode)
        callbackQuery.set('state', callbackState)
        if (callbackCode) callbackQuery.set('code', callbackCode)
        if (providerError) callbackQuery.set('error', providerError)
        if (errorDescription) callbackQuery.set('error_description', errorDescription)

        const response = await fetchWithAuth(
          `/bank-connections/connect/callback?${callbackQuery.toString()}`
        )

        if (!response.ok) {
          throw await parseApiErrorResponse(response, '/bank-connections/connect/callback')
        }

        const callbackConnection = (await response.json()) as BankConnection

        if (cancelled) {
          return
        }

        setConnections((current) => {
          const next = current.filter((connection) => connection.id !== callbackConnection.id)
          return [callbackConnection, ...next]
        })
        setLoading(false)
        setSuccessMessage('Banka bağlantısı doğrulandı.')
        router.replace('/bank-connections')
        void loadData()
      } catch (callbackError) {
        if (cancelled) {
          return
        }

        setError(getApiErrorMessage(callbackError, 'Banka callback işlemi başarısız.'))
        router.replace('/bank-connections')
      } finally {
        if (!cancelled) {
          setProcessingCallback(false)
        }
      }
    }

    void processCallback()

    return () => {
      cancelled = true
    }
  }, [
    bankCode,
    callbackCode,
    callbackState,
    errorDescription,
    fetchWithAuth,
    loadData,
    providerError,
    router,
  ])

  const visibleBanks = useMemo(
    () => availableBanks.filter((bank) => isBankConnectionsDemoEnabled || !bank.isDemo),
    [availableBanks]
  )

  const startConnection = useCallback(
    async (payload: StartConnectionPayload) => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const response = await fetchWithAuth('/bank-connections/connect/start', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw await parseApiErrorResponse(response, '/bank-connections/connect/start')
        }

        const data = await response.json()
        window.location.assign(data.redirectUrl)
      } catch (startError) {
        setError(getApiErrorMessage(startError, 'Banka izin akışı başlatılamadı.'))
      } finally {
        setSubmitting(false)
      }
    },
    [fetchWithAuth]
  )

  const handleAddConnection = async (event: React.FormEvent) => {
    event.preventDefault()

    const selectedBank = visibleBanks.find((bank) => bank.code === formData.bankCode)
    await startConnection({
      bankCode: formData.bankCode,
      bankName: selectedBank?.name || formData.bankCode,
      accountNumber: formData.accountNumber || undefined,
      accountName: formData.accountName || undefined,
    })
  }

  const handleReconnect = async (connectionId: string) => {
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetchWithAuth(`/bank-connections/${connectionId}/reconnect`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw await parseApiErrorResponse(
          response,
          `/bank-connections/${connectionId}/reconnect`
        )
      }

      const data = await response.json()
      window.location.assign(data.redirectUrl)
    } catch (reconnectError) {
      setError(getApiErrorMessage(reconnectError, 'Yeniden doğrulama başlatılamadı.'))
    }
  }

  const handleSync = async (connectionId: string) => {
    try {
      setError(null)
      setSuccessMessage(null)

      const response = await fetchWithAuth(`/bank-connections/${connectionId}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw await parseApiErrorResponse(response, `/bank-connections/${connectionId}/sync`)
      }

      setSuccessMessage('Banka hareketleri güncellendi.')
      await loadData()
    } catch (syncError) {
      setError(getApiErrorMessage(syncError, 'Senkronizasyon başarısız.'))
    }
  }

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Bu banka bağlantısını silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      setError(null)
      setSuccessMessage(null)

      const response = await fetchWithAuth(`/bank-connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw await parseApiErrorResponse(response, `/bank-connections/${connectionId}`)
      }

      setSuccessMessage('Banka bağlantısı silindi.')
      await loadData()
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Bağlantı silinirken hata oluştu.'))
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 animate-fade-in-soft">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="space-y-2 animate-slide-up-soft">
          <h1 className="text-2xl font-bold text-foreground">Banka Bağlantıları</h1>
          <p className="text-muted-foreground">
            Open Banking izin akışı ile banka hesaplarınızı bağlayın ve senkron
            durumunu takip edin.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 motion-safe:transition-[transform,background-color] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Banka Ekle
        </button>
      </div>

      {(loading || processingCallback) && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground animate-inline-feedback">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600" />
          {processingCallback
            ? 'Banka bağlantısı doğrulanıyor...'
            : 'Banka bağlantıları yükleniyor...'}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive animate-inline-feedback">
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
            aria-label="Hata mesajını kapat"
          >
            ×
          </button>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-success animate-inline-feedback">
          <button
            onClick={() => setSuccessMessage(null)}
            className="float-right font-bold"
            aria-label="Başarı mesajını kapat"
          >
            ×
          </button>
          {successMessage}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in-soft">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl animate-scale-in-soft">
            <h2 className="mb-4 text-xl font-semibold">Yeni Banka Bağlantısı</h2>
            <form onSubmit={handleAddConnection}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Banka Seçin
                  </label>
                  <select
                    value={formData.bankCode}
                    onChange={(event) => {
                      const selected = visibleBanks.find(
                        (bank) => bank.code === event.target.value
                      )
                      setFormData((current) => ({
                        ...current,
                        bankCode: event.target.value,
                        bankName: selected?.name || '',
                      }))
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Banka seçin...</option>
                    {visibleBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Hesap Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="TR00 0000..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Hesap Adı
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        accountName: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="Ana Hesap"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted/40"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!formData.bankCode || submitting}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {submitting ? 'Başlatılıyor...' : 'İzin Akışını Başlat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {connections.length === 0 ? (
        loading ? (
          <div className="rounded-xl bg-muted/40 py-12 text-center text-muted-foreground">
            Banka bağlantıları yükleniyor...
          </div>
        ) : (
          <div className="rounded-xl bg-muted/40 py-12 text-center animate-fade-in-soft">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Henüz banka bağlantısı yok
            </h3>
            <p className="mb-4 text-muted-foreground">
              Banka hesabınızı bağlayarak işlemlerinizi otomatik olarak içe
              aktarabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 motion-safe:transition-[transform,background-color] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              İlk Banka Bağlantısını Ekle
            </button>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <BankConnectionCard
              key={connection.id}
              connection={connection}
              onSync={() => handleSync(connection.id)}
              onReconnect={() => handleReconnect(connection.id)}
              onDelete={() => handleDelete(connection.id)}
            />
          ))}
        </div>
      )}

      {isBankConnectionsDemoEnabled && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 animate-fade-in-soft">
          <div className="flex gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900">Demo Mod</h4>
              <p className="mt-1 text-sm text-blue-700">
                Demo sağlayıcı ve otomatik callback akışı sadece feature flag açıkken
                görünür.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
