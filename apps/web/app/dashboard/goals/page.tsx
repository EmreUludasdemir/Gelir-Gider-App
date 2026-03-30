'use client'

import { useState } from 'react'
import { Plus, Target, Trash2, Edit2, X, Check } from 'lucide-react'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SavingsGoal } from '@/lib/types'

// Mock data - in real app, this would come from backend
const MOCK_GOALS: SavingsGoal[] = [
  {
    id: '1',
    name: 'Tatil Fonu',
    targetAmount: 50000,
    currentAmount: 15000,
    color: '#8B5CF6',
    icon: '✈️ï¸',
  },
  {
    id: '2',
    name: 'Acil Durum Fonu',
    targetAmount: 100000,
    currentAmount: 45000,
    color: '#10B981',
    icon: '🏦',
  },
  {
    id: '3',
    name: 'Yeni Araba',
    targetAmount: 300000,
    currentAmount: 75000,
    color: '#F59E0B',
    icon: '🚗',
  },
]

export default function GoalsPage() {
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  const [goals, setGoals] = useState<SavingsGoal[]>(MOCK_GOALS)
  const [isAdding, setIsAdding] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '' })

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return

    const goal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      icon: '🎯',
    }

    setGoals((prev) => [...prev, goal])
    setNewGoal({ name: '', targetAmount: '', currentAmount: '' })
    setIsAdding(false)
  }

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  return (
    <div className="space-y-6" id="main-content">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('savings_goals'), icon: <Target className="w-4 h-4" /> }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('savings_goals')}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'tr' 
              ? 'Finansal hedeflerinizi takip edin' 
              : 'Track your financial goals'}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('add_goal')}
        </button>
      </div>

      {/* Add Goal Form */}
      {isAdding && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t('add_goal')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('goal_name')}
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card dark:bg-gray-700 text-foreground"
                placeholder={language === 'tr' ? 'Örn: Tatil Fonu' : 'E.g., Vacation Fund'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('target_amount')}
              </label>
              <input
                type="number"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, targetAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card dark:bg-gray-700 text-foreground"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('current_amount')}
              </label>
              <input
                type="number"
                value={newGoal.currentAmount}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, currentAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card dark:bg-gray-700 text-foreground"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-foreground hover:bg-muted dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('cancel')}
            </button>
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
          return (
            <div
              key={goal.id}
              className="bg-card rounded-xl shadow-sm border border-border p-6 relative group"
            >
              <button
                onClick={() => handleDeleteGoal(goal.id)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{goal.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {progress}% {t('progress')}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(goal.currentAmount)}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(goal.targetAmount)}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                <p className="text-sm text-muted-foreground">
                  {language === 'tr' ? 'Kalan:' : 'Remaining:'}{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(goal.targetAmount - goal.currentAmount)}
                  </span>
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {goals.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {language === 'tr' ? 'Henüz hedef yok' : 'No goals yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'tr' 
              ? 'İlk tasarruf hedefinizi oluşturun' 
              : 'Create your first savings goal'}
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('add_goal')}
          </button>
        </div>
      )}
    </div>
  )
}


