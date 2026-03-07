import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 text-card-foreground shadow-[0_10px_28px_rgba(15,76,92,0.08)] backdrop-blur-sm transition-all duration-200 hover:shadow-[0_18px_36px_rgba(15,76,92,0.12)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-border/70 bg-gradient-to-r from-primary/[0.04] to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}


