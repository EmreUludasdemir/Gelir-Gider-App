'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Lightbulb, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { generateFinancialInsights, isAIAvailable } from '@/lib/gemini';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { useTransactions } from '@/lib/hooks';
import { FinancialInsight } from '@/lib/types';

const colorClasses = {
  green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
};

const iconClasses = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
};

const getIcon = (color: string) => {
  switch (color) {
    case 'green':
      return TrendingUp;
    case 'yellow':
      return AlertCircle;
    case 'red':
      return TrendingDown;
    default:
      return Lightbulb;
  }
};

export function AIInsights() {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const { data: transactions } = useTransactions();
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!transactions || transactions.length === 0) return;

    setIsLoading(true);
    try {
      const result = await generateFinancialInsights(transactions, language);
      setInsights(result);
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAIAvailable()) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('auto_insights')}</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !transactions?.length}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {t('analyze')}
        </button>
      </div>

      <div className="p-4">
        {!hasAnalyzed ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {language === 'tr'
              ? 'Harcama alışkanlıklarınıza göre tavsiye almak için butona tıklayın.'
              : 'Click Analyze to get personalized advice based on your spending habits.'}
          </p>
        ) : insights.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {t('no_insights')}
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getIcon(insight.color);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colorClasses[insight.color]}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${iconClasses[insight.color]}`} />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {insight.advice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
