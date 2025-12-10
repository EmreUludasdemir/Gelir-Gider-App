'use client'

import { useState } from 'react'
import { uploadPdf, UploadResult } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface PdfUploadProps {
  onSuccess?: (result: UploadResult) => void
}

export function PdfUpload({ onSuccess }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const uploadResult = await uploadPdf(file)
      setResult(uploadResult)
      onSuccess?.(uploadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Ekstre Yükle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="pdf-file-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banka Ekstresi PDF Dosyası
            </label>
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 dark:file:bg-primary-900 file:text-primary-700 dark:file:text-primary-300
                hover:file:bg-primary-100 dark:hover:file:bg-primary-800
                file:cursor-pointer file:transition-colors"
              aria-label="PDF dosyası seçin"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Seçilen dosya: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            loading={loading}
            className="w-full"
          >
            {loading ? 'Yükleniyor...' : 'PDF Yükle ve Parse Et'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sonuçlar</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>✅ Parse edilen: {result.totalParsed} işlem</li>
                <li>💾 Kaydedilen: {result.totalSaved} işlem</li>
                <li>⚠️ Düşük güven: {result.lowConfidenceCount} işlem</li>
              </ul>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Hatalar:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
