'use client'

import { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'card'
  className?: string
}

// SVG Illustrations
export function WalletIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="140" rx="80" ry="12" className="fill-muted/30" />
      <rect x="40" y="40" width="120" height="80" rx="8" className="fill-primary/10 stroke-primary/40" strokeWidth="2" />
      <rect x="100" y="60" width="50" height="30" rx="4" className="fill-primary/20 stroke-primary/40" strokeWidth="2" />
      <circle cx="125" cy="75" r="8" className="fill-primary/40" />
      <path d="M50 60h40M50 75h30M50 90h35" className="stroke-primary/30" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="35" r="20" className="fill-success/20 stroke-success" strokeWidth="2" />
      <path d="M137 35l5 5 10-10" className="stroke-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChartIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="145" rx="80" ry="12" className="fill-muted/30" />
      <rect x="30" y="30" width="140" height="100" rx="6" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="50" y="90" width="20" height="30" rx="2" className="fill-primary/60" />
      <rect x="80" y="70" width="20" height="50" rx="2" className="fill-primary/80" />
      <rect x="110" y="50" width="20" height="70" rx="2" className="fill-primary" />
      <rect x="140" y="80" width="20" height="40" rx="2" className="fill-primary/40" />
      <path d="M40 45h120" className="stroke-border" strokeWidth="1" strokeDasharray="4 2" />
      <path d="M40 65h120" className="stroke-border" strokeWidth="1" strokeDasharray="4 2" />
      <path d="M40 85h120" className="stroke-border" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx="160" cy="25" r="15" className="fill-warning/20 stroke-warning" strokeWidth="2" />
      <path d="M155 25h10M160 20v10" className="stroke-warning" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SearchIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="145" rx="80" ry="12" className="fill-muted/30" />
      <circle cx="85" cy="70" r="40" className="fill-primary/5 stroke-primary/40" strokeWidth="3" />
      <circle cx="85" cy="70" r="25" className="stroke-primary/20" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M115 100l30 30" className="stroke-primary" strokeWidth="8" strokeLinecap="round" />
      <rect x="135" y="117" width="25" height="12" rx="6" className="fill-primary/80" transform="rotate(45 135 117)" />
      <path d="M75 60l5 5M95 60l-5 5M85 75v8" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TargetIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="145" rx="80" ry="12" className="fill-muted/30" />
      <circle cx="100" cy="70" r="50" className="fill-primary/5 stroke-primary/20" strokeWidth="2" />
      <circle cx="100" cy="70" r="35" className="fill-primary/10 stroke-primary/30" strokeWidth="2" />
      <circle cx="100" cy="70" r="20" className="fill-primary/20 stroke-primary/40" strokeWidth="2" />
      <circle cx="100" cy="70" r="8" className="fill-primary stroke-primary" strokeWidth="2" />
      <path d="M140 30l-35 35" className="stroke-destructive" strokeWidth="2" />
      <path d="M140 30l-8 2 6 6 2-8z" className="fill-destructive" />
      <path d="M105 70l5-5" className="stroke-destructive" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function FileIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="145" rx="80" ry="12" className="fill-muted/30" />
      <path d="M60 20h50l30 30v90a8 8 0 01-8 8H68a8 8 0 01-8-8V28a8 8 0 018-8z" className="fill-card stroke-border" strokeWidth="2" />
      <path d="M110 20v22a8 8 0 008 8h22" className="stroke-border" strokeWidth="2" />
      <path d="M75 70h50M75 90h40M75 110h45" className="stroke-muted-foreground/40" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="110" r="25" className="fill-success/20 stroke-success" strokeWidth="2" />
      <path d="M135 110l7 7 14-14" className="stroke-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BellIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="145" rx="80" ry="12" className="fill-muted/30" />
      <path d="M100 25c-25 0-45 20-45 45v30l-10 15h110l-10-15V70c0-25-20-45-45-45z" className="fill-primary/10 stroke-primary/40" strokeWidth="2" />
      <ellipse cx="100" cy="130" rx="12" ry="8" className="fill-primary/40" />
      <circle cx="100" cy="25" r="8" className="fill-primary" />
      <circle cx="145" cy="45" r="18" className="fill-destructive/20 stroke-destructive" strokeWidth="2">
        <animate attributeName="r" values="16;18;16" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="145" y="51" className="fill-destructive" fontSize="16" fontWeight="bold" textAnchor="middle">3</text>
    </svg>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = ''
}: EmptyStateProps) {
  const containerClasses = variant === 'card'
    ? 'bg-card border border-border rounded-xl shadow-sm'
    : ''

  return (
    <div className={`
      flex flex-col items-center justify-center py-12 px-6 text-center
      animate-fade-in ${containerClasses} ${className}
    `}>
      {icon && (
        <div className="mb-6 text-muted-foreground animate-float">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
