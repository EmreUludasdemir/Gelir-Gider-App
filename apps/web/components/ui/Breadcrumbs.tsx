'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('mb-4', className)}
    >
      <ol className="flex items-center gap-1.5 text-sm flex-wrap" role="list">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
            aria-label="Ana sayfa"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">Dashboard</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1" aria-hidden="true" />
              
              {isLast ? (
                <span
                  className="flex items-center gap-1.5 font-medium text-foreground px-1.5"
                  aria-current="page"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
