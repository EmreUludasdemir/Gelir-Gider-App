'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CATEGORIES, getCategoryEmoji } from '@/lib/categories'

interface Budget {
  id: string
  categoryId: string
  categoryLabel: string
  amount: number
  spent: number
  period: 'monthly' | 'weekly' | 'yearly'
  alertThreshold: number
}

export function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      categoryId: 'market',
      categoryLabel: 'Market',
      amount: 3000,
      spent: 2100,
      period: 'monthly',
      alertThreshold: 80
    },
    {
      id: '2',
      categoryId: 'restaurant',
      categoryLabel: 'Yemek',
      amount: 2000,
      spent: 1850,
      period: 'monthly',
      alertThreshold: 80
    },
    {
      id: '3',
      categoryId: 'transport',
      categoryLabel: 'Ulaşım',
      amount: 1500,
      spent: 950,
      period: 'monthly',
      alertThreshold: 80
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newBudget, setNewBudget] = useState({
    categoryId: 'market',
    amount: 1000,
    period: 'monthly' as const,
    alertThreshold: 80
  })

  const calculatePercentage = (spent: number, amount: number) => {
    return Math.min(100, (spent / amount) * 100)
  }

  const getStatusColor = (percentage: number, threshold: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= threshold) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (percentage: number, threshold: number) => {
    if (percentage >= 100) return 'Bütçe Aşıldı!'
    if (percentage >= threshold) return 'Limite Yaklaşıldı'
    return 'Normal'
  }

  const handleAddBudget = () => {
    const category = CATEGORIES.find(c => c.id === newBudget.categoryId)
    if (!category) return

    const newId = (budgets.length + 1).toString()
    setBudgets([
      ...budgets,
      {
        id: newId,
        categoryId: newBudget.categoryId,
        categoryLabel: category.label,
        amount: newBudget.amount,
        spent: 0,
        period: newBudget.period,
        alertThreshold: newBudget.alertThreshold
      }
    ])

    setShowAddForm(false)
    setNewBudget({
      categoryId: 'market',
      amount: 1000,
      period: 'monthly',
      alertThreshold: 80
    })
  }

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bütçe Yönetimi</h2>
          <p className="text-gray-600 mt-1">Harcama limitlerini takip edin</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          + Yeni Bütçe
        </Button>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Bütçe Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <Select
                    value={newBudget.categoryId}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, categoryId: e.target.value })
                    }
                  >
                    {CATEGORIES.filter(c => c.type === 'expense').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periyot
                  </label>
                  <Select
                    value={newBudget.period}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        period: e.target.value as 'monthly' | 'weekly' | 'yearly'
                      })
                    }
                  >
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="yearly">Yıllık</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bütçe Tutarı (₺)
                  </label>
                  <Input
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) })
                    }
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uyarı Eşiği (%)
                  </label>
                  <Input
                    type="number"
                    value={newBudget.alertThreshold}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        alertThreshold: parseFloat(e.target.value)
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddBudget} className="flex-1">
                  Ekle
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const percentage = calculatePercentage(budget.spent, budget.amount)
          const statusColor = getStatusColor(percentage, budget.alertThreshold)
          const statusText = getStatusText(percentage, budget.alertThreshold)
          const remaining = budget.amount - budget.spent

          return (
            <Card key={budget.id} className="relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  percentage >= 100
                    ? 'bg-red-500'
                    : percentage >= budget.alertThreshold
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              />

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getCategoryEmoji(budget.categoryId)}
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {budget.categoryLabel}
                      </CardTitle>
                      <p className="text-xs text-gray-500 capitalize">
                        {budget.period === 'monthly'
                          ? 'Aylık'
                          : budget.period === 'weekly'
                          ? 'Haftalık'
                          : 'Yıllık'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {budget.spent.toLocaleString('tr-TR')} ₺
                      </span>
                      <span className="text-gray-500">
                        / {budget.amount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${statusColor}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Kalan</p>
                      <p className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {remaining.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kullanım</p>
                      <p className="font-bold text-gray-900">
                        %{percentage.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded-full text-center ${
                      percentage >= 100
                        ? 'bg-red-100 text-red-800'
                        : percentage >= budget.alertThreshold
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {statusText}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bütçe Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Toplam Bütçe</p>
              <p className="text-2xl font-bold text-gray-900">
                {budgets.reduce((sum, b) => sum + b.amount, 0).toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Toplam Harcama</p>
              <p className="text-2xl font-bold text-blue-600">
                {budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Kalan</p>
              <p className="text-2xl font-bold text-green-600">
                {budgets
                  .reduce((sum, b) => sum + (b.amount - b.spent), 0)
                  .toLocaleString('tr-TR')}{' '}
                ₺
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
