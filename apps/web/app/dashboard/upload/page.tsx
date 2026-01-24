'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PdfUpload } from '@/components/forms/PdfUpload'
import { UploadResult } from '@/lib/api'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { PdfUploadSummary } from '@/components/dashboard/PdfUploadSummary'
import { useRefreshAll } from '@/lib/hooks'
import { usePreferences } from '@/lib/PreferencesContext'

export default function UploadPage() {
  const router = useRouter()
  const [result, setResult] = useState<UploadResult | null>(null)
  const refreshAll = useRefreshAll()
  const { language } = usePreferences()

  const handleSuccess = async (uploadResult: UploadResult) => {
    setResult(uploadResult)
    await refreshAll()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {language === 'tr' ? 'PDF Yükleme' : 'Upload PDF'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {language === 'tr'
            ? 'Banka ekstrenizi yükleyin, otomatik olarak parse edin'
            : 'Upload your bank statement for automatic parsing'}
        </p>
      </div>

      <div className="max-w-2xl">
        <PdfUpload onSuccess={handleSuccess} />
      </div>

      {result && result.transactions.length > 0 && (
        <div className="space-y-6">
          {/* Summary Card */}
          <PdfUploadSummary
            transactions={result.transactions}
            filename={result.filename}
            language={language}
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {language === 'tr'
                ? `Parse Edilen İşlemler (${result.transactions.length})`
                : `Parsed Transactions (${result.transactions.length})`}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/statements')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {language === 'tr' ? 'Aylık Ekstreler' : 'Monthly Statements'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {language === 'tr' ? "Dashboard'a Git" : 'Go to Dashboard'}
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <TransactionTable
            transactions={result.transactions}
            title={language === 'tr' ? 'Yeni Eklenen İşlemler' : 'Newly Added Transactions'}
            showPagination
            showSearch
            language={language}
          />
        </div>
      )}
    </div>
  )
}
