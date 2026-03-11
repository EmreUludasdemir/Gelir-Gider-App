'use client'

import { useCallback, useState } from 'react'
import { uploadPdf, UploadResult } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle, FileStack, ShieldCheck, UploadCloud } from 'lucide-react'

interface PdfUploadProps {
  onSuccess?: (result: UploadResult) => void | Promise<void>
}

export function PdfUpload({ onSuccess }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      return
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Sadece PDF formatindaki banka ekstreleri desteklenir.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10MB sinirini asmamali.')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateFile(event.target.files?.[0] || null)
  }

  const handleDrag = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(event.type === 'dragenter' || event.type === 'dragover')
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    validateFile(event.dataTransfer.files?.[0] || null)
  }, [])

  const resetSelection = () => {
    setFile(null)
    setUploadProgress(0)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setUploadProgress(8)

    const progressInterval = window.setInterval(() => {
      setUploadProgress((current) => (current >= 88 ? current : current + 12))
    }, 180)

    try {
      const uploadResult = await uploadPdf(file)
      setUploadProgress(100)
      await onSuccess?.(uploadResult)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      window.clearInterval(progressInterval)
      setLoading(false)
    }
  }

  return (
    <Card data-testid="pdf-upload-card" className="overflow-hidden border-border/70 bg-card/85">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span>
            PDF ekstre yukle
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              Parser sonucu otomatik kaydedilir, ardindan kalite kontrol paneli acilir.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`relative rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-all ${
              dragActive
                ? 'border-primary/55 bg-primary/8'
                : 'border-border/70 bg-muted/20 hover:border-primary/35 hover:bg-primary/[0.03]'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="PDF dosyasi secin"
              disabled={loading}
            />

            <div className="pointer-events-none mx-auto flex max-w-md flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <FileStack className="h-7 w-7" />
              </span>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {file ? file.name : 'PDF dosyasini surukleyip birakin veya secmek icin tiklayin'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Destek: banka ekstrenizi PDF olarak yukleyin. Maksimum boyut 10MB.
              </p>
            </div>
          </div>

          {file && (
            <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB · parser kalite kontrolune hazir
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSelection}
                  disabled={loading}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Secimi temizle
                </button>
              </div>

              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Yukleniyor ve parse ediliyor</span>
                    <span>%{uploadProgress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                Kontrol mantigi
              </p>
              <p className="mt-2">
                Dusuk guvenli satirlar import sonrasi review panelinde ayri olarak isaretlenir.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-warning" />
                Duplicate korumasi
              </p>
              <p className="mt-2">
                Ayni PDF tekrar yuklenirse kayit olusturulmaz, bunun yerine aksiyon onerileri doner.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              loading={loading}
              className="flex-1 sm:flex-none"
              data-testid="pdf-upload-submit"
            >
              {loading ? 'Isleniyor...' : 'PDF yukle ve incelemeyi ac'}
            </Button>
            {file && !loading && (
              <Button onClick={resetSelection} variant="outline">
                Vazgec
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
