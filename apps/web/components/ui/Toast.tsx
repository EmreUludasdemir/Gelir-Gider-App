'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  isPaused?: boolean
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const pauseToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isPaused: true } : t))
  }, [])

  const resumeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isPaused: false } : t))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Accessible toast container with aria-live */}
      <div 
        className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm"
        role="region"
        aria-label="Bildirimler"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => dismissToast(toast.id)}
            onPause={() => pauseToast(toast.id)}
            onResume={() => resumeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
  onPause: () => void
  onResume: () => void
}

function ToastItem({ toast, onDismiss, onPause, onResume }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingTimeRef = useRef(toast.duration || 4000)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    const startTimer = () => {
      startTimeRef.current = Date.now()
      timerRef.current = setTimeout(() => {
        onDismiss()
      }, remainingTimeRef.current)
    }

    if (!toast.isPaused) {
      startTimer()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [toast.isPaused, onDismiss])

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      remainingTimeRef.current = remainingTimeRef.current - (Date.now() - startTimeRef.current)
    }
    onPause()
  }

  const handleMouseLeave = () => {
    onResume()
  }

  const variants = {
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-primary text-primary-foreground',
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in',
        'border border-white/10 backdrop-blur-sm',
        variants[toast.type]
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">{icons[toast.type]}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Bildirimi kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}


