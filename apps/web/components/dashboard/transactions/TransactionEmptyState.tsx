'use client'

import { memo } from 'react'

export const TransactionEmptyState = memo(function TransactionEmptyState() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p className="text-lg mb-2">Henuz islem bulunmuyor</p>
      <p className="text-sm mt-1">Filtrelerinizi degistirmeyi deneyin</p>
    </div>
  )
})


