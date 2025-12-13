'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Plus, X, Loader2 } from 'lucide-react';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { DEFAULT_CATEGORIES, TransactionType } from '@/lib/types';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryLabel: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'over';
}

// Mock data - in production, this would come from the API
const MOCK_BUDGETS: BudgetItem[] = [
  { id: '1', categoryId: 'exp-1', categoryLabel: 'Yemek', limitAmount: 3000, spent: 2100, remaining: 900, percentage: 70, status: 'ok' },
  { id: '2', categoryId: 'exp-2', categoryLabel: 'Ulaşım', limitAmount: 1500, spent: 1350, remaining: 150, percentage: 90, status: 'warning' },
  { id: '3', categoryId: 'exp-7', categoryLabel: 'Alışveriş', limitAmount: 2000, spent: 2500, remaining: 0, percentage: 100, status: 'over' },
];

export function BudgetSection() {
  const { language, formatCurrency } = usePreferences();
  const { t } = useTranslation(language);
  const [budgets, setBudgets] = useState<BudgetItem[]>(MOCK_BUDGETS);
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState({ categoryId: '', limit: '' });

  const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.type === TransactionType.EXPENSE);

  const handleAddBudget = () => {
    if (!newBudget.categoryId || !newBudget.limit) return;

    const category = expenseCategories.find((c) => c.id === newBudget.categoryId);
    if (!category) return;

    const budget: BudgetItem = {
      id: crypto.randomUUID(),
      categoryId: category.id,
      categoryLabel: category.name,
      limitAmount: parseFloat(newBudget.limit),
      spent: 0,
      remaining: parseFloat(newBudget.limit),
      percentage: 0,
      status: 'ok',
    };

    setBudgets((prev) => [...prev, budget]);
    setNewBudget({ categoryId: '', limit: '' });
    setIsAdding(false);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language === 'tr' ? 'Bütçe Takibi' : 'Budget Tracking'}
          </h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {isAdding && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newBudget.categoryId}
                onChange={(e) => setNewBudget((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">{language === 'tr' ? 'Kategori seçin' : 'Select category'}</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newBudget.limit}
                onChange={(e) => setNewBudget((prev) => ({ ...prev, limit: e.target.value }))}
                placeholder={language === 'tr' ? 'Limit' : 'Limit'}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddBudget}
                className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
              >
                {t('save')}
              </button>
            </div>
          </div>
        )}

        {budgets.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            {language === 'tr' ? 'Bütçe tanımlanmamış' : 'No budgets defined'}
          </p>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {budget.categoryLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limitAmount)}
                  </span>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(budget.status)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              {budget.status === 'over' && (
                <p className="mt-1 text-xs text-red-500">
                  {language === 'tr'
                    ? `${formatCurrency(budget.spent - budget.limitAmount)} aşım!`
                    : `${formatCurrency(budget.spent - budget.limitAmount)} over budget!`}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
