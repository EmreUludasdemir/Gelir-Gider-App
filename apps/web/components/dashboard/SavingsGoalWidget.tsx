'use client'

import { Target, Plus, TrendingUp, Calendar } from 'lucide-react'

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  currency: string
  targetDate?: string
  isCompleted: boolean
}

interface SavingsGoalWidgetProps {
  goals: SavingsGoal[]
  onAddGoal?: () => void
  onGoalClick?: (goal: SavingsGoal) => void
}

export function SavingsGoalWidget({ goals, onAddGoal, onGoalClick }: SavingsGoalWidgetProps) {
  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const activeGoals = goals.filter(g => !g.isCompleted)
  const completedGoals = goals.filter(g => g.isCompleted)

  return (
    <div className="glass-card rounded-[28px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Tasarruf Hedefleri
        </h3>
        {onAddGoal && (
          <button
            onClick={onAddGoal}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Hedef
          </button>
        )}
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz tasarruf hedefiniz yok</p>
          {onAddGoal && (
            <button
              onClick={onAddGoal}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              İlk hedefinizi oluşturun
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Goals */}
          {activeGoals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
            const remaining = goal.targetAmount - goal.currentAmount
            const daysRemaining = getDaysRemaining(goal.targetDate)

            return (
              <div
                key={goal.id}
                onClick={() => onGoalClick?.(goal)}
                className="cursor-pointer rounded-2xl border border-border p-4 transition-colors hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{goal.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {formatCurrency(goal.currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
                      </span>
                      {daysRemaining !== null && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {daysRemaining > 0 ? `${daysRemaining} gün kaldı` : 'Süre doldu'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    %{progress.toFixed(0)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Remaining Amount */}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Kalan: {formatCurrency(remaining, goal.currency)}</span>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <span>Günlük: {formatCurrency(remaining / daysRemaining, goal.currency)}</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Completed Goals Summary */}
          {completedGoals.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                  ✓
                </span>
                {completedGoals.length} hedef tamamlandı
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {activeGoals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Hedef</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(
                  activeGoals.reduce((sum, g) => sum + g.targetAmount, 0),
                  activeGoals[0]?.currency
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Toplam Birikim</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(
                  activeGoals.reduce((sum, g) => sum + g.currentAmount, 0),
                  activeGoals[0]?.currency
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


