import { cn } from '@/lib/utils'
import { useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, required, id: providedId, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = providedId || generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 border border-border rounded-xl',
          'bg-card text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'disabled:bg-muted/40 disabled:cursor-not-allowed',
          'transition-all duration-200',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={cn(
          error && errorId,
          hint && !error && hintId
        ) || undefined}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-destructive flex items-center gap-1" role="alert">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}


