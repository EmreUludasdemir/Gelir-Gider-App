'use client'

import { useCallback, useMemo, useState } from 'react'
import { getApiErrorMessage, previewPdfImportBatch, UploadBatchPreview } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle, FileStack, ShieldCheck, Sparkles, Trash2, UploadCloud, FileText, CheckCircle2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

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
      setError('Sadece PDF formatındaki banka ekstreleri desteklenir.')
      return
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFile) {
      setError(`"${oversizedFile.name}" 10MB sınırını aşıyor.`)
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
      setError(getApiErrorMessage(err, 'Upload failed'))
      setUploadProgress(0)
      setProcessedCount(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card data-testid="pdf-upload-card" className="animate-fade-in-soft overflow-hidden border-border/70 bg-card/75 dark:bg-card/45 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/[0.03] to-transparent py-5">
        <CardTitle className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <UploadCloud className="h-5.5 w-5.5" />
          </span>
          <div>
            <span className="font-display font-bold text-foreground">Çoklu PDF Import İstasyonu</span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Birden fazla ekstreyi tek kuyrukta analiz et, toplu düzelt ve tek seferde kaydet.
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "relative rounded-[24px] border-2 border-dashed px-6 py-11 text-center transition-all duration-300 group cursor-pointer",
              dragActive
                ? "border-primary bg-primary/8 shadow-[0_0_24px_rgba(15,76,92,0.15)]"
                : "border-border/70 bg-muted/15 hover:border-primary/40 hover:bg-primary/[0.02]"
            )}
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
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
              aria-label="PDF dosyaları seçin"
              disabled={loading}
            />

            <div className="pointer-events-none mx-auto flex max-w-md flex-col items-center">
              <span className={cn(
                "flex h-16 w-16 items-center justify-center rounded-3xl transition-transform duration-300",
                dragActive ? "bg-primary/20 text-primary scale-110" : "bg-primary/10 text-primary group-hover:scale-105"
              )}>
                <FileStack className="h-7 w-7" />
              </span>
              <p className="mt-5 text-base font-bold text-foreground">
                {files.length > 0
                  ? `${files.length} PDF kuyruğa alındı`
                  : 'PDF banka ekstrelerinizi buraya sürükleyin'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed max-w-xs mx-auto">
                Veya bilgisayarınızdan seçmek için tıklayın. Otomatik duplicate ayıklama aktiftir.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-background/50 dark:bg-card/30 p-4 transition-all hover:bg-background/85">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Kuyruktaki Dosya</p>
              <p className="mt-1.5 text-2xl font-display font-bold text-foreground">{files.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 dark:bg-card/30 p-4 transition-all hover:bg-background/85">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Toplam Boyut</p>
              <p className="mt-1.5 text-xl font-display font-bold text-foreground">{fileStats.totalSizeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 dark:bg-card/30 p-4 transition-all hover:bg-background/85">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Tahmini İşlem Hacmi</p>
              <p className="mt-1.5 text-xl font-display font-bold text-primary">
                {files.length > 0 ? formatCurrency(files.length * 4800) : formatCurrency(0)}
              </p>
            </div>
          </div>

          {/* Upload Queue List */}
          {files.length > 0 && (
            <div className="rounded-[20px] border border-border/50 bg-background/40 dark:bg-card/20 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] font-bold text-foreground">Import Kuyruğu</p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    Dosyalar tek bir grup halinde onaylanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSelection}
                  disabled={loading}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg hover:bg-muted"
                >
                  Tümünü Temizle
                </button>
              </div>

              <div className="grid gap-2.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {files.map((file) => (
                  <div 
                    key={`${file.name}-${file.lastModified}`} 
                    className="animate-list-item-soft flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/60 p-3.5 hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                          {(file.size / 1024).toFixed(1)} KB · işlenmeye hazır
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      disabled={loading}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all"
                      title="Kuyruktan çıkar"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>

              {loading && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{processedCount}/{files.length} dosya işlendi</span>
                    <span>%{uploadProgress}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-success to-accent transition-all duration-300 shadow-[0_0_8px_rgba(15,76,92,0.3)] animate-pulse-subtle"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Notes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/45 bg-muted/10 p-4 text-xs text-muted-foreground/90 leading-relaxed">
              <p className="inline-flex items-center gap-2 font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Güvenli Toplu Analiz
              </p>
              <p className="mt-2 text-muted-foreground/80">
                Tüm dosyalar backend tarafında parse edilir. Güvenlik skoru düşük olan işlemler listelenir ve kaydetmeden önce tek tek düzenlemenize imkan tanınır.
              </p>
            </div>
            <div className="rounded-2xl border border-border/45 bg-muted/10 p-4 text-xs text-muted-foreground/90 leading-relaxed">
              <p className="inline-flex items-center gap-2 font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Merchant & Kategori Baskısı
              </p>
              <p className="mt-2 text-muted-foreground/80">
                Toplu yükleme sonrasında AI algoritmaları, harcama yoğunluklarını ve kategorilere göre bütçe baskılarını anında hesaplayarak raporlar.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              loading={loading}
              className="flex-1 sm:flex-none btn-premium px-6 py-3 font-semibold text-white transition-all shadow-md"
              data-testid="pdf-upload-submit"
            >
              {loading ? 'Batch analiz yapılıyor...' : `${files.length || 0} PDF Ekstre Yükle ve Analiz Et`}
            </Button>
            {files.length > 0 && !loading && (
              <Button onClick={resetSelection} variant="outline" className="h-[46px] border-border/80 hover:bg-muted font-semibold text-foreground">
                Vazgeç
              </Button>
            )}
          </div>

          {error && (
            <div className="animate-inline-feedback rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


