'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface FilterState {
  type?: string
  categoryId?: string
  source?: string
  dateFrom?: string
  dateTo?: string
  month?: string
  minAmount?: string
  maxAmount?: string
  search?: string
}

interface TransactionFiltersProps {
  onFilterChange: (filters: Record<string, string>) => void
  onReset: () => void
}

const CATEGORIES = [
  { value: '', label: 'Tüm Kategoriler' },
  { value: 'salary', label: 'Maaş' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Yatırım Geliri' },
  { value: 'market', label: 'Market' },
  { value: 'restaurant', label: 'Yemek' },
  { value: 'transport', label: 'Ulaşım' },
  { value: 'subscription', label: 'Abonelik' },
  { value: 'utilities', label: 'Faturalar' },
  { value: 'health', label: 'Sağlık' },
  { value: 'shopping', label: 'Alışveriş' },
  { value: 'education', label: 'Eğitim' },
  { value: 'entertainment', label: 'Eğlence' },
  { value: 'rent', label: 'Kira' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'atm', label: 'ATM' },
  { value: 'insurance', label: 'Sigorta' },
  { value: 'charity', label: 'Bağış' },
  { value: 'personal_care', label: 'Kişisel Bakım' },
  { value: 'pet', label: 'Evcil Hayvan' },
  { value: 'other', label: 'Diğer' },
]

// Get list of months for selection
const getMonthOptions = () => {
  const months = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    months.push({ value, label })
  }
  
  return [{ value: '', label: 'Tüm Aylar' }, ...months]
}

export function TransactionFilters({ onFilterChange, onReset }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Remove empty values
    const cleanFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
      if (v && v !== '') acc[k] = v
      return acc
    }, {} as Record<string, string>)

    onFilterChange(cleanFilters)
  }

  const handleReset = () => {
    setFilters({})
    onReset()
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="text-sm text-gray-600">
                  {activeFilterCount} aktif filtre
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Gizle' : 'Göster'}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Arama"
                  placeholder="Açıklama ara..."
                  value={filters.search || ''}
                  onChange={(e) => handleChange('search', e.target.value)}
                />

                <Select
                  label="Tip"
                  value={filters.type || ''}
                  onChange={(e) => handleChange('type', e.target.value)}
                  options={[
                    { value: '', label: 'Tümü' },
                    { value: 'income', label: 'Gelir' },
                    { value: 'expense', label: 'Gider' },
                  ]}
                />

                <Select
                  label="Kategori"
                  value={filters.categoryId || ''}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  options={CATEGORIES}
                />

                <Select
                  label="Kaynak"
                  value={filters.source || ''}
                  onChange={(e) => handleChange('source', e.target.value)}
                  options={[
                    { value: '', label: 'Tümü' },
                    { value: 'manual', label: 'Manuel' },
                    { value: 'pdf', label: 'PDF' },
                  ]}
                />

                <Select
                  label="Ay Seçimi"
                  value={filters.month || ''}
                  onChange={(e) => {
                    const month = e.target.value
                    if (month) {
                      // Set date range for selected month
                      const [year, monthNum] = month.split('-')
                      const firstDay = `${year}-${monthNum}-01`
                      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0)
                        .toISOString()
                        .split('T')[0]
                      
                      setFilters({
                        ...filters,
                        month,
                        dateFrom: firstDay,
                        dateTo: lastDay
                      })
                      
                      onFilterChange({
                        ...filters,
                        month,
                        dateFrom: firstDay,
                        dateTo: lastDay
                      })
                    } else {
                      handleChange('month', '')
                    }
                  }}
                  options={getMonthOptions()}
                />

                <Input
                  label="Başlangıç Tarihi"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => {
                    handleChange('dateFrom', e.target.value)
                    // Clear month selection if custom date is set
                    if (filters.month) {
                      setFilters({ ...filters, month: '', dateFrom: e.target.value })
                    }
                  }}
                />

                <Input
                  label="Bitiş Tarihi"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => {
                    handleChange('dateTo', e.target.value)
                    // Clear month selection if custom date is set
                    if (filters.month) {
                      setFilters({ ...filters, month: '', dateTo: e.target.value })
                    }
                  }}
                />

                <Input
                  label="Min Tutar (₺)"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                />

                <Input
                  label="Max Tutar (₺)"
                  type="number"
                  placeholder="999999"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                />
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={handleReset}>
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
