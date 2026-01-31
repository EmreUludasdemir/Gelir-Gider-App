'use client'

import { useState, useCallback } from 'react'
import { uploadPdf, UploadResult } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

interface EnhancedPdfUploadProps {
  onSuccess?: (result: UploadResult) => void
}

export function EnhancedPdfUpload({ onSuccess }: EnhancedPdfUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Lütfen sadece PDF dosyası seçin')
      return
    }

    const sizeMB = selectedFile.size / (1024 * 1024)
    if (sizeMB > 10) {
      setError('Dosya boyutu 10MB\'dan küçük olmalı')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    handleFileChange(selectedFile || null)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileChange(droppedFile)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const uploadResult = await uploadPdf(file)
      setUploadProgress(100)
      setResult(uploadResult)
      onSuccess?.(uploadResult)

      // Auto-clear file after successful upload
      setTimeout(() => {
        setFile(null)
        setUploadProgress(0)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız')
      setUploadProgress(0)
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📄 PDF Ekstre Yükle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-border hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="pdf-file-input"
              accept=".pdf"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />

            <div className="pointer-events-none">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {file
                  ? `Seçilen: ${file.name}`
                  : 'PDF dosyasını sürükleyip bırakın veya tıklayarak seçin'}
              </p>
              <p className="text-sm text-muted-foreground">
                Maksimum dosya boyutu: 10MB
              </p>
            </div>
          </div>

          {/* File Info */}
          {file && !loading && (
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Yükleniyor ve parse ediliyor...</span>
                <span className="font-medium text-primary-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              loading={loading}
              className="flex-1"
            >
              {loading ? 'İşleniyor...' : 'Yükle ve Parse Et'}
            </Button>
            {file && !loading && (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="px-6"
              >
                İptal
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-xl">⚠ï¸</span>
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-1">Hata</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-green-600 text-xl">✓</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Başarılı! {result.totalSaved} işlem eklendi
                  </h4>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-card p-2 rounded">
                      <p className="text-xs text-muted-foreground">Parse Edilen</p>
                      <p className="text-lg font-bold text-foreground">
                        {result.totalParsed}
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded">
                      <p className="text-xs text-muted-foreground">Kaydedilen</p>
                      <p className="text-lg font-bold text-green-600">
                        {result.totalSaved}
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded">
                      <p className="text-xs text-muted-foreground">Düşük Güven</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {result.lowConfidenceCount}
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded">
                      <p className="text-xs text-muted-foreground">Hata</p>
                      <p className="text-lg font-bold text-red-600">
                        {result.errors.length}
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-yellow-800 mb-1">
                        ⚠ï¸ {result.errors.length} hata oluştu (detaylar)
                      </summary>
                      <ul className="text-xs text-gray-700 space-y-1 mt-2 max-h-32 overflow-y-auto pl-4">
                        {result.errors.map((err, idx) => (
                          <li key={idx} className="list-disc">
                            {err}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => window.location.href = '/dashboard/transactions'}
                  variant="outline"
                  className="flex-1 text-sm"
                >
                  İşlemleri Görüntüle →
                </Button>
                {result.lowConfidenceCount > 0 && (
                  <Button
                    onClick={() => window.location.href = '/dashboard/transactions?filter=low-confidence'}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    Düşük Güvenli İşlemler →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>İpucu:</strong> Banka ekstrenizi PDF olarak kaydedin ve buraya yükleyin.</p>
            <p>
              ✅ Desteklenen bankalar: Garanti BBVA, Ziraat, İş Bankası, Akbank,
              Yapı Kredi, QNB Finansbank ve daha fazlası
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

