'use client'

import { memo, CSSProperties } from 'react'

interface SkeletonPulseProps {
  className?: string
  style?: CSSProperties
}

const SkeletonPulse = ({ className = '', style }: SkeletonPulseProps) => (
  <div className={`animate-shimmer rounded ${className}`} style={style} />
)

export const StatCardSkeleton = memo(function StatCardSkeleton() {
  return (
    <div className="bg-card/70 dark:bg-card/45 rounded-2xl p-6 border border-border/70 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/30" />
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-9 w-9 rounded-xl" />
      </div>
      <SkeletonPulse className="h-8 w-40 mt-4.5" />
      <SkeletonPulse className="h-4.5 w-28 mt-2.5" />
    </div>
  )
})

export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="bg-card/70 dark:bg-card/45 rounded-2xl p-6 shadow-sm border border-border/70">
      <SkeletonPulse className="h-5 w-48 mb-6" />
      <div className="h-64 flex items-end justify-around gap-3 pt-4">
        {[...Array(7)].map((_, i) => (
          <SkeletonPulse
            key={i}
            className="w-full rounded-t-lg"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  )
})

export const TableSkeleton = memo(function TableSkeleton() {
  return (
    <div className="bg-card/70 dark:bg-card/45 rounded-2xl shadow-sm overflow-hidden border border-border/70">
      <div className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/[0.02] to-transparent">
        <SkeletonPulse className="h-5.5 w-36" />
      </div>
      <div className="p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonPulse className="h-9 w-20" />
            <SkeletonPulse className="h-9 flex-1" />
            <SkeletonPulse className="h-9 w-24" />
            <SkeletonPulse className="h-9 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
})

export const CategorySkeleton = memo(function CategorySkeleton() {
  return (
    <div className="bg-card/70 dark:bg-card/45 rounded-2xl p-6 shadow-sm border border-border/70">
      <SkeletonPulse className="h-5.5 w-36 mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonPulse className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4.5 w-32" />
              <SkeletonPulse className="h-2 w-full rounded-full" />
            </div>
            <SkeletonPulse className="h-4.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
})

export const AIInsightsSkeleton = memo(function AIInsightsSkeleton() {
  return (
    <div className="bg-card/75 dark:bg-card/45 rounded-2xl p-6 border border-border/70 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <SkeletonPulse className="h-11 w-11 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <SkeletonPulse className="h-5 w-40" />
          <SkeletonPulse className="h-3 w-64" />
        </div>
      </div>
      <div className="space-y-3.5">
        <div className="p-4 rounded-xl border border-border/40 space-y-2.5">
          <SkeletonPulse className="h-4.5 w-1/3" />
          <SkeletonPulse className="h-3.5 w-full" />
        </div>
        <div className="p-4 rounded-xl border border-border/40 space-y-2.5">
          <SkeletonPulse className="h-4.5 w-1/4" />
          <SkeletonPulse className="h-3.5 w-5/6" />
        </div>
      </div>
    </div>
  )
})

export const SmartInputSkeleton = memo(function SmartInputSkeleton() {
  return (
    <div className="bg-card/70 dark:bg-card/45 rounded-2xl p-4 shadow-sm border border-border/70">
      <SkeletonPulse className="h-12 w-full rounded-xl" />
    </div>
  )
})

export const DashboardSkeleton = {
  Stats: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  ),
  Chart: ChartSkeleton,
  Table: TableSkeleton,
  Categories: CategorySkeleton,
  AIInsights: AIInsightsSkeleton,
  SmartInput: SmartInputSkeleton,
}

export default DashboardSkeleton
