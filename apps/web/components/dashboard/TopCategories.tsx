'use client'

import { memo } from 'react'
import { CategorySummary } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

interface TopCategoriesProps {
  categories: CategorySummary[]
}

export const TopCategories = memo(function TopCategories({ categories }: TopCategoriesProps) {
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{t('top_categories')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={category.categoryId} className="animate-list-item" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {category.categoryLabel}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(category.total)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {category.transactionCount} {language === 'tr' ? 'işlem' : 'transactions'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              {language === 'tr' ? 'Henüz kategori verisi yok' : 'No category data yet'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})


