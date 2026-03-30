'use client'

import { memo } from 'react'
import { usePreferences } from '@/lib/PreferencesContext'
import { EmptyState, SearchIllustration } from '@/components/ui/EmptyState'

export const TransactionEmptyState = memo(function TransactionEmptyState() {
  const { language } = usePreferences()
  
  return (
    <EmptyState
      icon={<SearchIllustration className="w-32 h-32" />}
      title={language === 'tr' ? 'Henüz işlem bulunmuyor' : 'No transactions found'}
      description={language === 'tr' 
        ? 'Filtrelerinizi değiştirmeyi deneyin veya yeni bir işlem ekleyin.'
        : 'Try changing your filters or add a new transaction.'}
      className="py-12"
    />
  )
})


