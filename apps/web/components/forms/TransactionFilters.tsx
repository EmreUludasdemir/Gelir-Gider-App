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
  searchInputId?: string
  onFilterChange: (filters: Record<string, string>) => void
  onReset: () => void
}

const CATEGORIES = [
  { value: '', label: 'Tum Kategoriler' },
  { value: 'salary', label: 'Maas' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Yatirim Geliri' },
  { value: 'market', label: 'Market' },
  { value: 'restaurant', label: 'Yemek' },
  { value: 'transport', label: 'Ulasim' },
  { value: 'subscription', label: 'Abonelik' },
  { value: 'utilities', label: 'Faturalar' },
  { value: 'health', label: 'Saglik' },
  { value: 'shopping', label: 'Alisveris' },
  { value: 'education', label: 'Egitim' },
  { value: 'entertainment', label: 'Eglence' },
  { value: 'rent', label: 'Kira' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'atm', label: 'ATM' },
  { value: 'insurance', label: 'Sigorta' },
  { value: 'charity', label: 'Bagis' },
  { value: 'personal_care', label: 'Kisisel Bakim' },
  { value: 'pet', label: 'Evcil Hayvan' },
  { value: 'other', label: 'Diger' },
]

const getMonthOptions = () => {
  const months = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    months.push({ value, label })
  }

  return [{ value: '', label: 'Tum Aylar' }, ...months]
}

const formatDateInput = (date: Date) => date.toISOString().split('T')[0]

export function TransactionFilters({ searchInputId, onFilterChange, onReset }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null)

  const buildCleanFilters = (nextFilters: FilterState) =>
    Object.entries(nextFilters).reduce((acc, [k, v]) => {
      if (v && v !== '') acc[k] = v
      return acc
    }, {} as Record<string, string>)

  const applyFilters = (nextFilters: FilterState) => {
    setFilters(nextFilters)
    onFilterChange(buildCleanFilters(nextFilters))
  }

  const handleChange = (key: keyof FilterState, value: string) => {
    setActiveQuickFilter(null)
    const nextFilters = { ...filters, [key]: value }
    if ((key === 'dateFrom' || key === 'dateTo') && nextFilters.month) {
      nextFilters.month = ''
    }
    applyFilters(nextFilters)
  }

  const handleReset = () => {
    setFilters({})
    setActiveQuickFilter(null)
    onReset()
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length

  const now = new Date()
  const today = formatDateInput(now)
  const last7Days = new Date(now)
  last7Days.setDate(now.getDate() - 6)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const quickFilters = [
    { id: 'expense-all', label: 'Tum Giderler', filters: { type: 'expense' } },
    { id: 'expense-this-month', label: 'Bu Ay Gider', filters: { type: 'expense', dateFrom: formatDateInput(thisMonthStart), dateTo: today } },
    { id: 'expense-last-month', label: 'Gecen Ay Gider', filters: { type: 'expense', dateFrom: formatDateInput(lastMonthStart), dateTo: formatDateInput(lastMonthEnd) } },
    { id: 'expense-last-7', label: 'Son 7 Gun', filters: { type: 'expense', dateFrom: formatDateInput(last7Days), dateTo: today } },
    { id: 'expense-big', label: 'Buyuk Gider (>=1000)', filters: { type: 'expense', minAmount: '1000' } },
    { id: 'expense-pdf', label: 'PDF Gider', filters: { type: 'expense', source: 'pdf' } },
    { id: 'expense-subscription', label: 'Abonelik', filters: { type: 'expense', categoryId: 'subscription' } },
  ]

  const applyQuickFilter = (id: string, nextFilters: FilterState) => {
    setActiveQuickFilter(id)
    applyFilters(nextFilters)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Filtreler</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {activeFilterCount} aktif filtre
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Gizle' : 'Goster'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Hizli Gider Filtreleri</p>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeQuickFilter === filter.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => applyQuickFilter(filter.id, filter.filters)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              id={searchInputId}
              label="Arama"
              placeholder="Aciklama ara..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
            />

            <Select
              label="Tip"
              value={filters.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              options={[
                { value: '', label: 'Tumu' },
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
          </div>

          {isExpanded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Kaynak"
                  value={filters.source || ''}
                  onChange={(e) => handleChange('source', e.target.value)}
                  options={[
                    { value: '', label: 'Tumu' },
                    { value: 'manual', label: 'Manuel' },
                    { value: 'pdf', label: 'PDF' },
                  ]}
                />

            <Select
              label="Ay Secimi"
              value={filters.month || ''}
              onChange={(e) => {
                setActiveQuickFilter(null)
                const month = e.target.value
                if (month) {
                  const [year, monthNum] = month.split('-')
                  const firstDay = `${year}-${monthNum}-01`
                  const lastDay = new Date(parseInt(year), parseInt(monthNum), 0)
                    .toISOString()
                    .split('T')[0]

                  applyFilters({
                    ...filters,
                    month,
                    dateFrom: firstDay,
                    dateTo: lastDay,
                  })
                } else {
                  handleChange('month', '')
                }
              }}
                  options={getMonthOptions()}
                />

                <Input
                  label="Baslangic Tarihi"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => {
                    handleChange('dateFrom', e.target.value)
                  }}
                />

                <Input
                  label="Bitis Tarihi"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => {
                    handleChange('dateTo', e.target.value)
                  }}
                />

                <Input
                  label="Min Tutar (TL)"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                />

                <Input
                  label="Max Tutar (TL)"
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

