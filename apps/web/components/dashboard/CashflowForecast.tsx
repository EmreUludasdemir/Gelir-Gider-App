'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { usePreferences } from '@/lib/PreferencesContext';

interface DailyForecast {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedBalance: number;
  bills: { name: string; amount: number }[];
  subscriptions: { name: string; amount: number }[];
  confidence: number;
}

interface CashflowForecastData {
  startDate: string;
  endDate: string;
  currentBalance: number;
  projectedEndBalance: number;
  totalPredictedIncome: number;
  totalPredictedExpense: number;
  dailyForecasts: DailyForecast[];
  insights: string[];
  warnings: string[];
}

// Hook to get token
function useToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);
  return token;
}

// Fetcher with auth
const createFetcher = (token: string | null) => async (url: string) => {
  if (!token) throw new Error('No token');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export function CashflowForecast() {
  const { language, currency } = usePreferences();
  const [expanded, setExpanded] = useState(false);
  const token = useToken();

  const { data: forecast, isLoading } = useSWR<CashflowForecastData>(
    token ? `/analytics/cashflow?days=30&language=${language}` : null,
    createFetcher(token),
    { refreshInterval: 5 * 60 * 1000 }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!forecast) {
    return null;
  }

  const balanceChange = forecast.projectedEndBalance - forecast.currentBalance;
  const isPositiveChange = balanceChange >= 0;

  // Get next 7 days for mini chart
  const next7Days = forecast.dailyForecasts.slice(0, 7);
  const maxBalance = Math.max(...next7Days.map((d) => d.predictedBalance));
  const minBalance = Math.min(...next7Days.map((d) => d.predictedBalance));
  const range = maxBalance - minBalance || 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {language === 'tr' ? '30 Günlük Tahmin' : '30-Day Forecast'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(forecast.startDate)} - {formatDate(forecast.endDate)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'tr' ? 'Tahmini Bitiş Bakiyesi' : 'Projected End Balance'}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(forecast.projectedEndBalance)}
          </p>
          <div
            className={`flex items-center gap-1 text-xs ${
              isPositiveChange ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositiveChange ? '+' : ''}
              {formatCurrency(balanceChange)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'tr' ? 'Tahmini Giderler' : 'Predicted Expenses'}
          </p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatCurrency(forecast.totalPredictedExpense)}
          </p>
          <p className="text-xs text-gray-500">
            {language === 'tr' ? 'Gelir: ' : 'Income: '}
            <span className="text-emerald-600 font-medium">
              {formatCurrency(forecast.totalPredictedIncome)}
            </span>
          </p>
        </div>
      </div>

      {/* Mini Balance Chart */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {language === 'tr' ? 'Önümüzdeki 7 Gün' : 'Next 7 Days'}
        </p>
        <div className="flex items-end gap-1 h-16">
          {next7Days.map((day, idx) => {
            const height = ((day.predictedBalance - minBalance) / range) * 100;
            const isNegative = day.predictedBalance < 0;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full relative h-12">
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      isNegative
                        ? 'bg-red-400 dark:bg-red-500'
                        : idx === 0
                          ? 'bg-purple-500'
                          : 'bg-purple-300 dark:bg-purple-700'
                    }`}
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings */}
      {forecast.warnings.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 space-y-1">
            {forecast.warnings.slice(0, 2).map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* Insights */}
          {forecast.insights.length > 0 && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {language === 'tr' ? 'İçgörüler' : 'Insights'}
                </p>
              </div>
              <ul className="space-y-1">
                {forecast.insights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Daily Details */}
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {language === 'tr' ? 'Günlük Tahminler' : 'Daily Predictions'}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {forecast.dailyForecasts.slice(0, 14).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(day.date)}
                    </p>
                    {day.bills.length > 0 && (
                      <p className="text-xs text-amber-600">
                        📋 {day.bills.map((b) => b.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        day.predictedBalance >= 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(day.predictedBalance)}
                    </p>
                    <p className="text-xs text-gray-500">
                      -{formatCurrency(day.predictedExpense)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
