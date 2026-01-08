'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Shield,
  Target,
  PiggyBank,
  Activity
} from 'lucide-react';
import { generateFinancialInsights, isAIAvailable } from '@/lib/gemini';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { useTransactions } from '@/lib/hooks';
import { FinancialInsight } from '@/lib/types';
import { getApiBaseUrl } from '@/lib/api-base';

type Color = 'green' | 'yellow' | 'red' | 'blue';

const colorClasses: Record<Color, string> = {
  green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
};

const iconClasses: Record<Color, string> = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
};

interface SpendingInsight {
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  potentialSavings?: number;
}

interface AnomalySummary {
  totalAnomalies: number;
  riskScore: number;
  recentAnomalies: {
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    maskedDescription: string;
  }[];
}

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

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'critical': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export function AIInsights() {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const { data: transactions } = useTransactions();
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsight[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<AnomalySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'savings'>('insights');

  // Load AI insights from API
  const loadAIInsights = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const apiUrl = getApiBaseUrl();

      const [insightsRes, anomaliesRes] = await Promise.all([
        fetch(`${apiUrl}/ai/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/ai/anomalies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setSpendingInsights(data);
      }

      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalySummary(data);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  }, []);

  useEffect(() => {
    loadAIInsights();
  }, [loadAIInsights]);

  const handleAnalyze = async () => {
    if (!transactions || transactions.length === 0) return;

    setIsLoading(true);
    try {
      const [geminiResult] = await Promise.all([
        isAIAvailable() ? generateFinancialInsights(transactions, language) : Promise.resolve([]),
        loadAIInsights(),
      ]);
      setInsights(geminiResult);
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            {language === 'tr' ? 'Öneriler' : 'Insights'}
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'anomalies'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            {language === 'tr' ? 'Uyarılar' : 'Alerts'}
            {anomalySummary && anomalySummary.totalAnomalies > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {anomalySummary.totalAnomalies}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'savings'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            {language === 'tr' ? 'Tasarruf' : 'Savings'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            {!hasAnalyzed && spendingInsights.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {language === 'tr'
                  ? 'Harcama alışkanlıklarınıza göre tavsiye almak için butona tıklayın.'
                  : 'Click Analyze to get personalized advice based on your spending habits.'}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Spending Insights from API */}
                {spendingInsights.map((insight, index) => (
                  <div
                    key={`spending-${index}`}
                    className={`p-4 rounded-lg border ${
                      insight.impact === 'high'
                        ? colorClasses.red
                        : insight.impact === 'medium'
                        ? colorClasses.yellow
                        : colorClasses.blue
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Target className={`w-5 h-5 mt-0.5 ${
                        insight.impact === 'high'
                          ? iconClasses.red
                          : insight.impact === 'medium'
                          ? iconClasses.yellow
                          : iconClasses.blue
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {insight.title}
                          </h4>
                          {insight.potentialSavings && insight.potentialSavings > 0 && (
                            <span className="text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                              +{insight.potentialSavings.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Gemini Insights */}
                {insights.map((insight, index) => {
                  const Icon = getIcon(insight.color);
                  return (
                    <div
                      key={`gemini-${index}`}
                      className={`p-4 rounded-lg border ${colorClasses[insight.color as Color] || colorClasses.blue}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${iconClasses[insight.color as Color] || iconClasses.blue}`} />
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

                {spendingInsights.length === 0 && insights.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t('no_insights')}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            {anomalySummary ? (
              <>
                {/* Risk Score */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'tr' ? 'Risk Skoru' : 'Risk Score'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {anomalySummary.riskScore}/100
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    anomalySummary.riskScore >= 70
                      ? 'bg-red-100 text-red-600'
                      : anomalySummary.riskScore >= 40
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <Shield className="w-8 h-8" />
                  </div>
                </div>

                {/* Anomaly List */}
                {anomalySummary.recentAnomalies.length > 0 ? (
                  <div className="space-y-2">
                    {anomalySummary.recentAnomalies.map((anomaly, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                            anomaly.severity === 'critical' || anomaly.severity === 'high'
                              ? 'text-red-500'
                              : anomaly.severity === 'medium'
                              ? 'text-yellow-500'
                              : 'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {anomaly.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(anomaly.severity)}`}>
                                {anomaly.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {anomaly.maskedDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {language === 'tr'
                      ? 'Şüpheli işlem tespit edilmedi.'
                      : 'No suspicious transactions detected.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {language === 'tr'
                  ? 'Analiz için yeterli veri yok.'
                  : 'Not enough data for analysis.'}
              </p>
            )}
          </div>
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <div className="space-y-4">
            {spendingInsights.filter(i => i.potentialSavings && i.potentialSavings > 0).length > 0 ? (
              <>
                {/* Total Potential Savings */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {language === 'tr' ? 'Potansiyel Aylık Tasarruf' : 'Potential Monthly Savings'}
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {spendingInsights
                          .filter(i => i.potentialSavings)
                          .reduce((sum, i) => sum + (i.potentialSavings || 0), 0)
                          .toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    <PiggyBank className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                {/* Savings Tips */}
                <div className="space-y-2">
                  {spendingInsights
                    .filter(i => i.potentialSavings && i.potentialSavings > 0)
                    .sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0))
                    .map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {insight.title}
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            +{insight.potentialSavings?.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === 'tr'
                    ? 'Tasarruf fırsatları bulmak için Analiz\'e tıklayın.'
                    : 'Click Analyze to find savings opportunities.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
