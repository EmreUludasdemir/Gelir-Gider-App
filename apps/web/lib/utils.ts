import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return formatted
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date))
}

export function getChangeIcon(change: number): string {
  if (change > 0) return '📈'
  if (change < 0) return '📉'
  return '➖'
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-destructive'
  return 'text-muted-foreground'
}
