'use client'

import { memo } from 'react'
import { CategorySummary } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface TopCategoriesProps {
  categories: CategorySummary[]
}

export const TopCategories = memo(function TopCategories({ categories }: TopCategoriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>En Çok Harcanan Kategoriler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.categoryId}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {category.categoryLabel}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(category.total)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {category.transactionCount} işlem
                </span>
                <span className="text-xs text-gray-500">
                  {category.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
