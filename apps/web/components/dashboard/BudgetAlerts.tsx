'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BudgetAlert {
  id: string
  categoryLabel: string
  percentage: number
  spent: number
  limit: number
  severity: 'warning' | 'danger'
}

interface BudgetAlertsProps {
  budgets: Array<{
    categoryId: string
    categoryLabel: string
    amount: number
    spent: number
    percentage: number
  }>
}

export function BudgetAlerts({ budgets }: BudgetAlertsProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newAlerts: BudgetAlert[] = []

    budgets.forEach((budget) => {
      const alertId = `${budget.categoryId}-${Math.floor(budget.percentage / 10)}`
      
      if (dismissed.has(alertId)) return

      if (budget.percentage >= 100) {
        newAlerts.push({
          id: alertId,
          categoryLabel: budget.categoryLabel,
          percentage: budget.percentage,
          spent: budget.spent,
          limit: budget.amount,
          severity: 'danger'
        })
      } else if (budget.percentage >= 80) {
        newAlerts.push({
          id: alertId,
          categoryLabel: budget.categoryLabel,
          percentage: budget.percentage,
          spent: budget.spent,
          limit: budget.amount,
          severity: 'warning'
        })
      }
    })

    setAlerts(newAlerts)
  }, [budgets, dismissed])

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => new Set([...prev, alertId]))
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card 
          key={alert.id}
          className={`border-l-4 ${
            alert.severity === 'danger' 
              ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
          }`}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">
                  {alert.severity === 'danger' ? '🚨' : '⚠️'}
                </span>
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    alert.severity === 'danger' 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {alert.severity === 'danger' ? 'Bütçe Aşıldı!' : 'Bütçe Limitine Yaklaşıyorsunuz'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    alert.severity === 'danger' 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <strong>{alert.categoryLabel}</strong> kategorisinde bütçenizin{' '}
                    <strong>%{Math.round(alert.percentage)}</strong>'ini kullandınız
                    {' '}({alert.spent.toFixed(2)} ₺ / {alert.limit.toFixed(2)} ₺)
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(alert.id)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
