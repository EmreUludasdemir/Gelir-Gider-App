'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts'
import { CATEGORIES } from '@/lib/categories'
import { useTransactions } from '@/lib/hooks'

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
        showToast(`⚠️ ${budget.categoryLabel} bütçesi %${Math.round(budget.percentage)} doldu`, 'warning')
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bütçe Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Harcama limitlerini belirle ve takip et</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : '+ Yeni Bütçe'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Bütçe Oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Kategori"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Kategori seçin</option>
                  {CATEGORIES.filter(c => c.type === 'expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Limit (₺)"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />

                <Select
                  label="Periyot"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'weekly' })}
                  options={[
                    { value: 'monthly', label: 'Aylık' },
                    { value: 'weekly', label: 'Haftalık' }
                  ]}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Bütçe Oluştur</Button>
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
            <p className="text-4xl mb-4">💰</p>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Henüz bütçe oluşturulmadı
            </p>
            <p className="text-gray-600 mb-4">
              Harcamalarınızı kontrol altında tutmak için bütçe limitleri belirleyin
            </p>
            <Button onClick={() => setShowForm(true)}>
              İlk Bütçeni Oluştur
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
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Harcanan</span>
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
                    <span className="text-gray-600">Limit:</span>
                    <span className="font-medium">₺{budget.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harcanan:</span>
                    <span className="font-medium text-red-600">₺{budget.spent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Kalan:</span>
                    <span className="font-semibold text-green-600">₺{budget.remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Periyot: {budget.period === 'monthly' ? 'Aylık' : 'Haftalık'}
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
