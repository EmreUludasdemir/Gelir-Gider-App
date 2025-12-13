'use client';

import React, { useState, useEffect } from 'react';

interface BudgetAlert {
  id: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface Props {
  budgets?: BudgetAlert[];
}

export function BudgetAlerts({ budgets }: Props) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (budgets) {
      setAlerts(budgets.filter(b => b.percentage >= 80));
    } else {
      // Mock data
      setAlerts([
        { id: '1', category: 'Yemek', spent: 950, limit: 1000, percentage: 95 },
        { id: '2', category: 'Alışveriş', spent: 1200, limit: 1000, percentage: 120 },
      ]);
    }
  }, [budgets]);

  const dismissAlert = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map((alert) => {
        const isOver = alert.percentage > 100;
        const bgClass = isOver
          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
        const iconColor = isOver ? 'text-red-500' : 'text-amber-500';
        const textColor = isOver ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200';

        return (
          <div
            key={alert.id}
            className={`${bgClass} border rounded-xl p-4 flex items-start gap-3 animate-slide-in`}
          >
            <div className={`${iconColor} mt-0.5`}>
              {isOver ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h4 className={`font-semibold ${textColor}`}>
                {isOver ? `${alert.category} Bütçesi Aşıldı!` : `${alert.category} Bütçesi Dolmak Üzere`}
              </h4>
              <p className={`text-sm ${isOver ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'} mt-1`}>
                ₺{alert.spent.toLocaleString('tr-TR')} / ₺{alert.limit.toLocaleString('tr-TR')}
                <span className="ml-2 font-medium">(%{alert.percentage})</span>
              </p>

              {/* Progress bar */}
              <div className="mt-2 h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => dismissAlert(alert.id)}
              className={`${iconColor} hover:opacity-70 transition-opacity p-1`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
