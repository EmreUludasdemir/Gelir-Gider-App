'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  language?: 'tr' | 'en'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

// i18n labels for ErrorBoundary
const errorLabels = {
  tr: {
    title: 'Bir Hata Oluştu',
    description: 'Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenilemeyi deneyin.',
    unknownError: 'Bilinmeyen hata',
    tryAgain: 'Tekrar Dene',
    homePage: 'Ana Sayfa',
    errorDetails: 'Hata Detayları',
    error: 'Hata',
    stack: 'Stack',
    componentStack: 'Bileşen Stack',
    contactSupport: 'Sorun devam ederse, lütfen destek ekibiyle iletişime geçin.',
    devMode: '(Geliştirme modu - Detaylı hatalar gösteriliyor)',
  },
  en: {
    title: 'An Error Occurred',
    description: 'Sorry, something went wrong. Please try refreshing the page.',
    unknownError: 'Unknown error',
    tryAgain: 'Try Again',
    homePage: 'Home',
    errorDetails: 'Error Details',
    error: 'Error',
    stack: 'Stack',
    componentStack: 'Component Stack',
    contactSupport: 'If the problem persists, please contact our support team.',
    devMode: '(Development mode - Detailed errors shown)',
  },
}

// Helper to detect browser language
function getPreferredLanguage(): 'tr' | 'en' {
  if (typeof window === 'undefined') return 'tr'
  
  // Check localStorage first (user preference)
  try {
    const stored = localStorage.getItem('preferences')
    if (stored) {
      const prefs = JSON.parse(stored)
      if (prefs.language === 'tr' || prefs.language === 'en') {
        return prefs.language
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  // Fall back to browser language
  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('tr') ? 'tr' : 'en'
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Determine language (prop > localStorage > browser)
      const lang = this.props.language || getPreferredLanguage()
      const t = errorLabels[lang]

      // Default error UI
      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-muted/40 p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6">
            {/* Icon & Title */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold text-foreground text-center mb-2">
              {t.title}
            </h1>

            <p className="text-muted-foreground text-center mb-6">
              {t.description}
            </p>

            {/* Error Message */}
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 break-words">
                  {this.state.error.message || t.unknownError}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                {t.tryAgain}
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                {t.homePage}
              </button>
            </div>

            {/* Error Details Toggle */}
            {this.state.errorInfo && (
              <div className="border-t border-border pt-4">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-expanded={this.state.showDetails}
                >
                  <span>{t.errorDetails}</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-muted/40 rounded border border-border overflow-auto max-h-64">
                    <div className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words">
                      <div className="mb-2">
                        <strong>{t.error}:</strong> {this.state.error?.toString()}
                      </div>
                      {this.state.error?.stack && (
                        <div className="mb-2">
                          <strong>{t.stack}:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto">{this.state.error.stack}</pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong>{t.componentStack}:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Environment Info */}
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
              <p>
                {t.contactSupport}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-1 text-orange-600 dark:text-orange-400">
                  {t.devMode}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}


