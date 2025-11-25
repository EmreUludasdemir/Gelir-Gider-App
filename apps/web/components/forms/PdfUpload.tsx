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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banka Ekstresi PDF Dosyası
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h4 className="font-semibold text-gray-900 mb-2">Sonuçlar</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Parse edilen: {result.totalParsed} işlem</li>
                <li>💾 Kaydedilen: {result.totalSaved} işlem</li>
                <li>⚠️ Düşük güven: {result.lowConfidenceCount} işlem</li>
              </ul>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900 mb-1">Hatalar:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
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
