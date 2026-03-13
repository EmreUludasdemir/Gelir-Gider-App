'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Shield,
  PiggyBank,
  Activity
} from 'lucide-react';
import { ApiError, getAiAnomalies, getAiInsights } from '@/lib/api';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';

type Color = 'green' | 'yellow' | 'red' | 'blue';

const colorClasses: Record<Color, string> = {
  green: 'bg-success/12 border-success/20',
  yellow: 'bg-warning/15 border-warning/20',
  red: 'bg-destructive/12 border-destructive/20',
  blue: 'bg-primary-50 border-primary-200',
};

const iconClasses: Record<Color, string> = {
  green: 'text-success',
  yellow: 'text-warning',
  red: 'text-destructive',
  blue: 'text-primary-600',
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

const getIcon = (impact: SpendingInsight['impact']) => {
  switch (impact) {
    case 'high':
      return TrendingDown;
    case 'medium':
      return AlertCircle;
    case 'low':
      return TrendingUp;
    default:
      return Lightbulb;
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'low': return 'text-success bg-success/15';
    case 'medium': return 'text-warning bg-warning/20';
    case 'high': return 'text-destructive bg-destructive/10';
    case 'critical': return 'text-destructive bg-destructive/15';
    default: return 'text-muted-foreground bg-muted';
  }
};

function impactToColor(impact: SpendingInsight['impact']): Color {
  switch (impact) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    default:
      return 'blue';
  }
}

export function AIInsights() {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsight[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<AnomalySummary | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'savings'>('insights');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const loadAIInsights = useCallback(async () => {
    try {
      const [insights, anomalies] = await Promise.all([
        getAiInsights(),
        getAiAnomalies(),
      ]);
      setSpendingInsights(insights);
      setAnomalySummary(anomalies);
      setServiceUnavailable(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setServiceUnavailable(true);
      } else {
        console.error('Error loading AI insights:', error);
      }
    }
  }, []);

  useEffect(() => {
    void loadAIInsights();
  }, [loadAIInsights]);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-semibold text-foreground">
                {language === 'tr' ? 'Finansal icgoruler' : 'Financial insights'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'tr'
                  ? 'Arka planda uretilen analiz sinyalleri'
                  : 'Background-generated analysis signals'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full border border-primary/20 bg-primary/10 text-primary">
            {language === 'tr' ? 'Otomatik' : 'Automatic'}
          </span>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'insights'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-4 h-4" />
            {language === 'tr' ? 'Oneriler' : 'Insights'}
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'anomalies'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            {language === 'tr' ? 'Uyarilar' : 'Alerts'}
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
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            {language === 'tr' ? 'Tasarruf' : 'Savings'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {serviceUnavailable && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {language === 'tr'
              ? 'Analiz motoru su anda hazir degil. Kartlar sonradan otomatik dolacak.'
              : 'The analysis engine is currently unavailable. Cards will populate automatically later.'}
          </div>
        )}

        {activeTab === 'insights' && (
          <>
            {spendingInsights.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {language === 'tr'
                  ? 'Sunucu tarafli analizler hazir oldugunda oneriler burada gorunecek.'
                  : 'Server-side insights will appear here when ready.'}
              </p>
            ) : (
              <div className="space-y-3">
                {spendingInsights.map((insight, index) => {
                  const color = impactToColor(insight.impact);
                  const Icon = getIcon(insight.impact);
                  return (
                    <div
                      key={`insight-${index}`}
                      className={`p-4 rounded-lg border ${colorClasses[color]}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${iconClasses[color]}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground mb-1">
                              {insight.title}
                            </h4>
                            {insight.potentialSavings && insight.potentialSavings > 0 && (
                              <span className="text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                                +{insight.potentialSavings.toLocaleString('tr-TR')} ?
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {spendingInsights.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {t('no_insights')}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            {anomalySummary ? (
              <>
                <div className="flex items-center justify-between p-4 bg-muted/40/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'tr' ? 'Risk Skoru' : 'Risk Score'}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
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

                {anomalySummary.recentAnomalies.length > 0 ? (
                  <div className="space-y-2">
                    {anomalySummary.recentAnomalies.map((anomaly, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg"
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
                              <h4 className="font-medium text-foreground text-sm">
                                {anomaly.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(anomaly.severity)}`}>
                                {anomaly.severity}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {anomaly.maskedDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {language === 'tr'
                      ? 'Supheli islem tespit edilmedi.'
                      : 'No suspicious transactions detected.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {language === 'tr'
                  ? 'Analiz icin yeterli veri yok.'
                  : 'Not enough data for analysis.'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-4">
            {spendingInsights.filter(i => i.potentialSavings && i.potentialSavings > 0).length > 0 ? (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {language === 'tr' ? 'Potansiyel Aylik Tasarruf' : 'Potential Monthly Savings'}
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {spendingInsights
                          .filter(i => i.potentialSavings)
                          .reduce((sum, i) => sum + (i.potentialSavings || 0), 0)
                          .toLocaleString('tr-TR')} ?
                      </p>
                    </div>
                    <PiggyBank className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  {spendingInsights
                    .filter(i => i.potentialSavings && i.potentialSavings > 0)
                    .sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0))
                    .map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground text-sm">
                            {insight.title}
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            +{insight.potentialSavings?.toLocaleString('tr-TR')} ?
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
                <div className="text-center py-8">
                  <PiggyBank className="w-12 h-12 text-gray-300 dark:text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'tr'
                    ? 'Tasarruf firsatlari hazir oldugunda burada listelenecek.'
                    : 'Savings opportunities will appear here when ready.'}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
