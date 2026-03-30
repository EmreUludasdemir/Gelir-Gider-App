'use client'

import { useCallback, useEffect, useRef } from 'react'
import { X, AlertTriangle, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }, [loading, onClose])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      buttonVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      buttonVariant: 'default' as const,
    },
    info: {
      icon: Info,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      buttonVariant: 'default' as const,
    },
  }

  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-card rounded-2xl shadow-2xl',
          'animate-modal-enter',
          'border border-border'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Kapat"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', styles.iconBg)}>
            <Icon className={cn('w-6 h-6', styles.iconColor)} />
          </div>

          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className="text-xl font-semibold text-center text-foreground mb-2"
          >
            {title}
          </h2>

          {/* Description */}
          <p
            id="confirm-dialog-description"
            className="text-sm text-muted-foreground text-center mb-6"
          >
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              ref={confirmButtonRef}
              variant={styles.buttonVariant}
              onClick={onConfirm}
              loading={loading}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
