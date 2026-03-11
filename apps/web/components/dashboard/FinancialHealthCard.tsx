'use client';

import { useState } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { useFinancialHealth, useAnomalies, FinancialHealthFactor, SpendingAnomaly } from '@/hooks/useAiAnalytics';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
type Status = 'good' | 'warning' | 'critical';
type Severity = 'low' | 'medium' | 'high';

const gradeColors: Record<Grade, string> = {
  A: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  B: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  C: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  D: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  F: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

const statusIcons: Record<Status, typeof CheckCircle> = {
  good: CheckCircle,
  warning: AlertCircle,
  critical: XCircle,
};

const statusColors: Record<Status, string> = {
  good: 'text-green-500',
  warning: 'text-yellow-500',
  critical: 'text-red-500',
};

const severityColors: Record<Severity, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function FinancialHealthCard() {
  const { data: health, isLoading: healthLoading } = useFinancialHealth();
  const { data: anomalies, isLoading: anomaliesLoading } = useAnomalies();
  const [showDetails, setShowDetails] = useState(false);

  const isLoading = healthLoading || anomaliesLoading;

  if (isLoading) {
    return (
      <div className="glass-card rounded-[28px] p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const highSeverityAnomalies = anomalies?.filter((a: SpendingAnomaly) => a.severity === 'high') || [];

  return (
    <div className="glass-card rounded-[28px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Finansal Sağlık</h3>
          </div>
          {highSeverityAnomalies.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {highSeverityAnomalies.length} Uyarı
            </span>
          )}
        </div>
      </div>

      {/* Score Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${gradeColors[health.grade as Grade]}`}>
              {health.grade}
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {health.score}/100
              </div>
              <div className="text-sm text-muted-foreground">
                Finansal Puan
              </div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tasarruf:</span>
              <span className={`font-medium ${health.savingsRate >= 20 ? 'text-green-600' : health.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                %{health.savingsRate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bütçe Uyumu:</span>
              <span className={`font-medium ${health.budgetAdherence >= 90 ? 'text-green-600' : health.budgetAdherence >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                %{health.budgetAdherence}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                health.score >= 70 ? 'bg-green-500' : health.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {health.factors.map((factor: FinancialHealthFactor, index: number) => {
            const Icon = statusIcons[factor.status as Status];
            return (
              <div key={index} className="rounded-2xl bg-muted/50 p-2 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${statusColors[factor.status as Status]}`} />
                <div className="text-xs text-muted-foreground truncate" title={factor.name}>
                  {factor.name}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {factor.score}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Anomalies Section */}
        {anomalies && anomalies.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tespit Edilen Anomaliler
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {anomalies.slice(0, 3).map((anomaly: SpendingAnomaly, index: number) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-sm ${severityColors[anomaly.severity as Severity]}`}
                >
                  <div className="flex items-start gap-2">
                    {anomaly.severity === 'high' ? (
                      <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{anomaly.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center justify-center gap-1"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Detayları Gizle
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Detayları Göster
            </>
          )}
        </button>

        {/* Detailed Factors */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {health.factors.map((factor: FinancialHealthFactor, index: number) => {
              const Icon = statusIcons[factor.status as Status];
              return (
                <div key={index} className="rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${statusColors[factor.status as Status]}`} />
                      <span className="font-medium text-foreground">
                        {factor.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {factor.score}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {factor.advice}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



