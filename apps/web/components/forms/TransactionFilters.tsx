'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

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
  { value: '', label: 'all_categories' },
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

const formatDateInput = (date: Date) => date.toISOString().split('T')[0]

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function TransactionFilters({ searchInputId, onFilterChange, onReset }: TransactionFiltersProps) {
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const [filters, setFilters] = useState<FilterState>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  
  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300)
  const isFirstRender = useRef(true)
  const latestFiltersRef = useRef<FilterState>({})
  const buildCleanFilters = useCallback(
    (nextFilters: FilterState) =>
      Object.entries(nextFilters).reduce((acc, [k, v]) => {
        if (v && v !== '') acc[k] = v
        return acc
      }, {} as Record<string, string>),
    [],
  )

  useEffect(() => {
    latestFiltersRef.current = filters
  }, [filters])

  // Apply debounced search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if ((latestFiltersRef.current.search || '') === debouncedSearch) {
      return
    }

    const nextFilters = { ...latestFiltersRef.current, search: debouncedSearch }
    setFilters(nextFilters)
    onFilterChange(buildCleanFilters(nextFilters))
  }, [buildCleanFilters, debouncedSearch, onFilterChange])

  const getMonthOptions = useCallback(() => {
    const months = []
    const now = new Date()
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
      months.push({ value, label })
    }

    return [{ value: '', label: language === 'tr' ? 'Tüm Aylar' : 'All Months' }, ...months]
  }, [language])

  const applyFilters = (nextFilters: FilterState) => {
    setIsApplying(true)
    setFilters(nextFilters)
    onFilterChange(buildCleanFilters(nextFilters))
    // Visual feedback
    setTimeout(() => setIsApplying(false), 200)
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
    setSearchValue('')
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

  const quickFilters = language === 'tr' ? [
    { id: 'expense-all', label: 'Tüm Giderler', filters: { type: 'expense' } },
    { id: 'expense-this-month', label: 'Bu Ay Gider', filters: { type: 'expense', dateFrom: formatDateInput(thisMonthStart), dateTo: today } },
    { id: 'expense-last-month', label: 'Geçen Ay Gider', filters: { type: 'expense', dateFrom: formatDateInput(lastMonthStart), dateTo: formatDateInput(lastMonthEnd) } },
    { id: 'expense-last-7', label: 'Son 7 Gün', filters: { type: 'expense', dateFrom: formatDateInput(last7Days), dateTo: today } },
    { id: 'expense-big', label: 'Büyük Gider (>=1000)', filters: { type: 'expense', minAmount: '1000' } },
    { id: 'expense-pdf', label: 'PDF Gider', filters: { type: 'expense', source: 'pdf' } },
    { id: 'expense-subscription', label: 'Abonelik', filters: { type: 'expense', categoryId: 'subscription' } },
  ] : [
    { id: 'expense-all', label: 'All Expenses', filters: { type: 'expense' } },
    { id: 'expense-this-month', label: 'This Month', filters: { type: 'expense', dateFrom: formatDateInput(thisMonthStart), dateTo: today } },
    { id: 'expense-last-month', label: 'Last Month', filters: { type: 'expense', dateFrom: formatDateInput(lastMonthStart), dateTo: formatDateInput(lastMonthEnd) } },
    { id: 'expense-last-7', label: 'Last 7 Days', filters: { type: 'expense', dateFrom: formatDateInput(last7Days), dateTo: today } },
    { id: 'expense-big', label: 'Large (>=1000)', filters: { type: 'expense', minAmount: '1000' } },
    { id: 'expense-pdf', label: 'PDF Imports', filters: { type: 'expense', source: 'pdf' } },
    { id: 'expense-subscription', label: 'Subscriptions', filters: { type: 'expense', categoryId: 'subscription' } },
  ]

  const applyQuickFilter = (id: string, nextFilters: FilterState) => {
    setActiveQuickFilter(id)
    applyFilters(nextFilters)
  }

  return (
    <Card className={isApplying ? 'animate-inline-feedback ring-2 ring-primary/20 transition-all' : 'animate-fade-in-soft transition-all'}>
      <CardContent className="pt-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">{t('filter')}</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="text-sm text-muted-foreground animate-fade-in">
                  {activeFilterCount} {language === 'tr' ? 'aktif filtre' : 'active filters'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (language === 'tr' ? 'Gizle' : 'Hide') : (language === 'tr' ? 'Göster' : 'Show')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {language === 'tr' ? 'Hızlı Gider Filtreleri' : 'Quick Expense Filters'}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeQuickFilter === filter.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => applyQuickFilter(filter.id, filter.filters)}
                  className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              id={searchInputId}
              label={t('search')}
              placeholder={t('search_transactions')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <Select
              label={t('type')}
              value={filters.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              options={[
                { value: '', label: t('all_types') },
                { value: 'income', label: t('income') },
                { value: 'expense', label: t('expense') },
              ]}
            />

            <Select
              label={t('category')}
              value={filters.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              options={CATEGORIES.map(c => ({
                value: c.value,
                label: c.value === '' ? t('all_categories') : c.label
              }))}
            />
          </div>

          {/* Collapsible advanced filters with animation */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label={language === 'tr' ? 'Kaynak' : 'Source'}
                  value={filters.source || ''}
                  onChange={(e) => handleChange('source', e.target.value)}
                  options={[
                    { value: '', label: language === 'tr' ? 'Tümü' : 'All' },
                    { value: 'manual', label: language === 'tr' ? 'Manuel' : 'Manual' },
                    { value: 'pdf', label: 'PDF' },
                  ]}
                />

                <Select
                  label={language === 'tr' ? 'Ay Seçimi' : 'Select Month'}
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
                  label={language === 'tr' ? 'Başlangıç Tarihi' : 'Start Date'}
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => {
                    handleChange('dateFrom', e.target.value)
                  }}
                />

                <Input
                  label={language === 'tr' ? 'Bitiş Tarihi' : 'End Date'}
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => {
                    handleChange('dateTo', e.target.value)
                  }}
                />

                <Input
                  label={language === 'tr' ? 'Min Tutar' : 'Min Amount'}
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                />

                <Input
                  label={language === 'tr' ? 'Max Tutar' : 'Max Amount'}
                  type="number"
                  placeholder="999999"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                />
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end animate-fade-in">
                  <Button variant="secondary" onClick={handleReset}>
                    {t('clear_filters')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

