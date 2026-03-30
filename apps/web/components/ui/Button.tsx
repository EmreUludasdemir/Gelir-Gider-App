import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'destructive' | 'default'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}, ref) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]'

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-[0_10px_22px_rgba(15,76,92,0.24)] hover:from-primary-700 hover:to-primary-600 hover:shadow-[0_14px_30px_rgba(15,76,92,0.3)]',
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-foreground hover:bg-muted shadow-sm',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost: 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    outline: 'border border-border/80 bg-card/60 text-foreground hover:bg-muted/60 backdrop-blur-sm',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
})


