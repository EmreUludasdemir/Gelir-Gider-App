'use client'

import { memo, CSSProperties } from 'react'

interface SkeletonPulseProps {
  className?: string
  style?: CSSProperties
}

const SkeletonPulse = ({ className = '', style }: SkeletonPulseProps) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} style={style} />
)

export const StatCardSkeleton = memo(function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-4 w-20" />
        <SkeletonPulse className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonPulse className="h-8 w-32 mt-3" />
      <SkeletonPulse className="h-4 w-24 mt-2" />
    </div>
  )
})

export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <SkeletonPulse className="h-6 w-40 mb-4" />
      <div className="h-64 flex items-end justify-around gap-2">
        {[...Array(7)].map((_, i) => (
          <SkeletonPulse
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  )
})

export const TableSkeleton = memo(function TableSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
      <div className="p-4 border-b border-border">
        <SkeletonPulse className="h-6 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonPulse className="h-10 w-24" />
            <SkeletonPulse className="h-10 flex-1" />
            <SkeletonPulse className="h-10 w-20" />
            <SkeletonPulse className="h-10 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
})

export const CategorySkeleton = memo(function CategorySkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <SkeletonPulse className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonPulse className="h-8 w-8 rounded" />
            <div className="flex-1">
              <SkeletonPulse className="h-4 w-24 mb-1" />
              <SkeletonPulse className="h-2 w-full rounded-full" />
            </div>
            <SkeletonPulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
})

export const AIInsightsSkeleton = memo(function AIInsightsSkeleton() {
  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent/30 rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonPulse className="h-6 w-6 rounded-full" />
        <SkeletonPulse className="h-6 w-32" />
      </div>
      <div className="space-y-2">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-4 w-5/6" />
      </div>
    </div>
  )
})

export const SmartInputSkeleton = memo(function SmartInputSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <SkeletonPulse className="h-12 w-full rounded-lg" />
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

