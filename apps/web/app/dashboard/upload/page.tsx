'use client'

import { useRouter } from 'next/navigation'
import { PdfUpload } from '@/components/forms/PdfUpload'
import { UploadResult } from '@/lib/api'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { useRefreshAll, useTransactions } from '@/lib/hooks'

export default function UploadPage() {
  const router = useRouter()
  const refreshAll = useRefreshAll()
  const { data: pdfTransactions, mutate: refreshPdfTransactions } = useTransactions({
    source: 'pdf',
  })

  const handleSuccess = async (uploadResult: UploadResult) => {
    await Promise.all([
      refreshAll(),
      refreshPdfTransactions(),
    ])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">PDF YÃ¼kleme</h1>
        <p className="text-muted-foreground dark:text-gray-400 mt-1">
          Banka ekstrenizi yÃ¼kleyin, otomatik olarak parse edin
        </p>
      </div>

      <div className="max-w-2xl">
        <PdfUpload onSuccess={handleSuccess} />
      </div>

      {pdfTransactions && pdfTransactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">
              PDF Islemleri ({pdfTransactions.length})
            </h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Dashboard'a Git
            </button>
          </div>
          <TransactionTable
            transactions={pdfTransactions}
            title="PDF Islemleri"
            onRefresh={refreshPdfTransactions}
          />
        </div>
      )}
    </div>
  )
}

