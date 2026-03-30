'use client'

import { useState, useMemo, useEffect } from 'react'
import { Wallet, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts'
import { CATEGORIES } from '@/lib/categories'
import { useTransactions } from '@/lib/hooks'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

interface Budget {
  id: string
  categoryId: string
  categoryLabel: string
  amount: number
  period: 'monthly' | 'weekly'
  spent: number
  remaining: number
  percentage: number
}

export default function BudgetsPage() {
  const { showToast } = useToast()
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  const { data: allTransactions } = useTransactions()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly'
  })

  // Calculate actual spending from transactions
  const budgetsWithSpending = useMemo(() => {
    if (!allTransactions) return budgets

    return budgets.map(budget => {
      const now = new Date()
      let startDate: Date

      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        // Weekly - last 7 days
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
      }

      const spent = allTransactions
        .filter(tx => 
          tx.type === 'expense' &&
          tx.categoryId === budget.categoryId &&
          new Date(tx.date) >= startDate
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

      const percentage = (spent / budget.amount) * 100
      const remaining = budget.amount - spent

      return {
        ...budget,
        spent,
        remaining,
        percentage
      }
    })
  }, [budgets, allTransactions])

  // Show alerts when budgets exceed thresholds
  useEffect(() => {
    budgetsWithSpending.forEach(budget => {
      if (budget.percentage >= 100 && budget.spent > 0) {
        showToast(`🚨 ${budget.categoryLabel} bütçesi aşıldı!`, 'error')
      } else if (budget.percentage >= 80 && budget.percentage < 100) {
        showToast(`⚠ï¸ ${budget.categoryLabel} bütçesi %${Math.round(budget.percentage)} doldu`, 'warning')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetsWithSpending.length, budgetsWithSpending.map(b => Math.floor(b.percentage / 10)).join(',')])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const category = CATEGORIES.find(c => c.id === formData.categoryId)
    if (!category) return

    const newBudget: Budget = {
      id: Math.random().toString(36).substr(2, 9),
      categoryId: formData.categoryId,
      categoryLabel: category.label,
      amount: parseFloat(formData.amount),
      period: formData.period,
      spent: 0,
      remaining: parseFloat(formData.amount),
      percentage: 0
    }

    setBudgets([...budgets, newBudget])
    setFormData({ categoryId: '', amount: '', period: 'monthly' })
    setShowForm(false)
    showToast('Bütçe başarıyla oluşturuldu! 💰', 'success')
  }

  const handleDelete = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id))
    showToast('Bütçe silindi! 🗑️', 'success')
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6" id="main-content">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('budgets'), icon: <Wallet className="w-4 h-4" /> }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">{t('budgets')}</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            {language === 'tr' ? 'Harcama limitlerini belirle ve takip et' : 'Set and track spending limits'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t('cancel') : t('add_budget')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'tr' ? 'Yeni Bütçe Oluştur' : 'Create New Budget'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label={t('category')}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">{language === 'tr' ? 'Kategori seçin' : 'Select category'}</option>
                  {CATEGORIES.filter(c => c.type === 'expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label={t('budget_limit')}
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />

                <Select
                  label={language === 'tr' ? 'Periyot' : 'Period'}
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'weekly' })}
                  options={[
                    { value: 'monthly', label: t('monthly') },
                    { value: 'weekly', label: t('weekly') }
                  ]}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">{language === 'tr' ? 'Bütçe Oluştur' : 'Create Budget'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      {budgetsWithSpending.length > 0 && (
        <BudgetAlerts budgets={budgetsWithSpending} />
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <PiggyBank className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              {t('no_budgets')}
            </p>
            <p className="text-muted-foreground mb-4">
              {t('create_first_budget')}
            </p>
            <Button onClick={() => setShowForm(true)}>
              {t('add_budget')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetsWithSpending.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{budget.categoryLabel}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{t('spent')}</span>
                    <span>{budget.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${getStatusColor(budget.percentage)}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'tr' ? 'Limit' : 'Limit'}:</span>
                    <span className="font-medium">{formatCurrency(budget.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('spent')}:</span>
                    <span className="font-medium text-red-600">{formatCurrency(budget.spent)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">{t('remaining')}:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(budget.remaining)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'tr' ? 'Periyot' : 'Period'}: {budget.period === 'monthly' ? t('monthly') : t('weekly')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

