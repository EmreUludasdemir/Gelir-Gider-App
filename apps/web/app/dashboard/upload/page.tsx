'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PdfUpload } from '@/components/forms/PdfUpload'
import { UploadResult } from '@/lib/api'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { useRefreshAll } from '@/lib/hooks'

export default function UploadPage() {
  const router = useRouter()
  const [result, setResult] = useState<UploadResult | null>(null)
  const refreshAll = useRefreshAll()

  const handleSuccess = async (uploadResult: UploadResult) => {
    setResult(uploadResult)
    await refreshAll()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PDF Yükleme</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Banka ekstrenizi yükleyin, otomatik olarak parse edin
        </p>
      </div>

      <div className="max-w-2xl">
        <PdfUpload onSuccess={handleSuccess} />
      </div>

      {result && result.transactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Parse Edilen İşlemler ({result.transactions.length})
            </h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Dashboard'a Git
            </button>
          </div>
          <TransactionTable
            transactions={result.transactions}
            title="Yeni Eklenen İşlemler"
          />
        </div>
      )}
    </div>
  )
}
