'use client'

import { useCallback, useMemo, useState } from 'react'
import { previewPdfImportBatch, UploadBatchPreview } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle, FileStack, ShieldCheck, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PdfUploadProps {
  onSuccess?: (result: UploadBatchPreview) => void | Promise<void>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

export function PdfUpload({ onSuccess }: PdfUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)

  const fileStats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    return {
      totalSize,
      totalSizeLabel: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
    }
  }, [files])

  const validateFiles = useCallback((incomingFiles: FileList | File[] | null) => {
    const selectedFiles = Array.from(incomingFiles || [])
    if (selectedFiles.length === 0) {
      return
    }

    const invalidFile = selectedFiles.find((file) => !file.name.toLowerCase().endsWith('.pdf'))
    if (invalidFile) {
      setError('Sadece PDF formatindaki banka ekstreleri desteklenir.')
      return
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFile) {
      setError(`"${oversizedFile.name}" 10MB sinirini asiyor.`)
      return
    }

    const nextFiles = [...files]
    selectedFiles.forEach((file) => {
      const exists = nextFiles.some(
        (candidate) => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified,
      )
      if (!exists) {
        nextFiles.push(file)
      }
    })

    setFiles(nextFiles)
    setError(null)
  }, [files])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateFiles(event.target.files)
    event.target.value = ''
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
    validateFiles(event.dataTransfer.files)
  }, [validateFiles])

  const resetSelection = () => {
    setFiles([])
    setUploadProgress(0)
    setProcessedCount(0)
    setError(null)
  }

  const removeFile = (fileToRemove: File) => {
    setFiles((current) => current.filter((file) => file !== fileToRemove))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setLoading(true)
    setError(null)
    setUploadProgress(6)
    setProcessedCount(0)

    try {
      const previewResult = await previewPdfImportBatch(files, (completed, total) => {
        setProcessedCount(completed)
        const progress = Math.min(100, Math.round((completed / total) * 92) + 8)
        setUploadProgress(progress)
      })

      setUploadProgress(100)
      await onSuccess?.(previewResult)
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
      setProcessedCount(0)
    } finally {
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
            Coklu PDF import istasyonu
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              Birden fazla ekstreyi tek kuyrukta preview et, toplu duzelt ve tek seferde kaydet.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
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
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="PDF dosyalari secin"
              disabled={loading}
            />

            <div className="pointer-events-none mx-auto flex max-w-md flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <FileStack className="h-7 w-7" />
              </span>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {files.length > 0
                  ? `${files.length} PDF kuyruga alindi`
                  : 'Bir veya birden fazla PDF dosyasini surukleyip birakin'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Her dosya icin ayri preview olusturulur. Duplicate olanlar otomatik ayiklanir.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kuyruktaki dosya</p>
              <p className="mt-2 text-2xl font-display font-semibold text-foreground">{files.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam boyut</p>
              <p className="mt-2 text-xl font-display font-semibold text-foreground">{fileStats.totalSizeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tahmini analiz</p>
              <p className="mt-2 text-xl font-display font-semibold text-primary">
                {files.length > 0 ? formatCurrency(files.length * 4800) : formatCurrency(0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Toplu importta tahmini islem hacmi sinyali</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Import kuyrugu</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dosyalari tek tek degil, ayni batch icinde preview edip toplu onaylayabilirsin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSelection}
                  disabled={loading}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tumunu temizle
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {files.map((file) => (
                  <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · parser review'a hazir
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Cikar
                    </button>
                  </div>
                ))}
              </div>

              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{processedCount}/{files.length} dosya preview edildi</span>
                    <span>%{uploadProgress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary via-success to-accent transition-all duration-200"
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
                Toplu review mantigi
              </p>
              <p className="mt-2">
                Her dosya icin ayri preview olusur. Dusuk guvenli satirlar dosya bazli duzenlenir ama toplu kayit butonu tek noktada kalir.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Analiz derinligi
              </p>
              <p className="mt-2">
                Batch import sonrasinda kategori baskisi, merchant yogunlugu, net akis ve confidence dagilimi ayni ekranda raporlanir.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              loading={loading}
              className="flex-1 sm:flex-none"
              data-testid="pdf-upload-submit"
            >
              {loading ? 'Batch preview hazirlaniyor...' : `${files.length || 0} PDF icin preview olustur`}
            </Button>
            {files.length > 0 && !loading && (
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

