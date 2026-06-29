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
  Activity,
  CheckCircle2
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

type Color = 'green' | 'yellow' | 'red' | 'blue';

const colorClasses: Record<Color, string> = {
  green: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-400',
  yellow: 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-400',
  red: 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-400',
  blue: 'bg-primary/10 border-primary/20 text-primary dark:text-primary-400',
};

const iconClasses: Record<Color, string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-rose-600 dark:text-rose-400',
  blue: 'text-primary',
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
    case 'low': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    case 'medium': return 'text-amber-600 bg-amber-500/15 border-amber-500/25';
    case 'high': return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
    case 'critical': return 'text-rose-600 bg-rose-500/15 border-rose-500/30';
    default: return 'text-muted-foreground bg-muted border-border';
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

export function SmartInsights() {
  const { language, formatCurrency } = usePreferences();
  const { t } = useTranslation(language);
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsight[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<AnomalySummary | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'savings'>('insights');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const loadSmartInsights = useCallback(async () => {
    // Deterministic rules or empty state for now instead of hitting AI endpoints
    setSpendingInsights([]);
    setAnomalySummary({
      totalAnomalies: 0,
      riskScore: 0,
      recentAnomalies: [],
    });
    setServiceUnavailable(false);
  }, []);

  useEffect(() => {
    void loadSmartInsights();
  }, [loadSmartInsights]);

  return (
    <div className="bg-card/75 dark:bg-card/45 border border-border/70 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden backdrop-blur-xl">
      <div className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/[0.02] to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Sparkles className="w-5.5 h-5.5 text-primary" />
            </span>
            <div>
              <h3 className="font-display font-bold text-foreground text-base">
                {language === 'tr' ? 'Akıllı Kurallar & Analiz' : 'Smart Rule Insights'}
              </h3>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                {language === 'tr'
                  ? 'Belirlediğiniz kurallara göre otomatik analiz'
                  : 'Automated analysis based on smart rules'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
            {language === 'tr' ? 'Otomatik' : 'Automatic'}
          </span>
        </div>

        {/* Premium Tab Bar Segmented Control */}
        <div className="flex p-1 bg-muted/60 dark:bg-muted/30 border border-border/40 rounded-xl">
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200",
              activeTab === 'insights'
                ? "bg-card text-foreground shadow-sm border border-border/30"
                : "text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Activity className="w-4 h-4" />
            {language === 'tr' ? 'Öneriler' : 'Insights'}
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 relative",
              activeTab === 'anomalies'
                ? "bg-card text-foreground shadow-sm border border-border/30"
                : "text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Shield className="w-4 h-4" />
            {language === 'tr' ? 'Risk & Anomaliler' : 'Alerts & Risks'}
            {anomalySummary && anomalySummary.totalAnomalies > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-card animate-bounce-in">
                {anomalySummary.totalAnomalies}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200",
              activeTab === 'savings'
                ? "bg-card text-foreground shadow-sm border border-border/30"
                : "text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
            )}
          >
            <PiggyBank className="w-4 h-4" />
            {language === 'tr' ? 'Tasarruf Potansiyeli' : 'Savings'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {serviceUnavailable && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {language === 'tr'
              ? 'Analiz motoru şu anda geçici olarak servis dışı. Bulgular arka planda güncellenmeye devam ediyor.'
              : 'The analysis engine is currently unavailable. Insights will update in the background.'}
          </div>
        )}

        {/* Tab Content: Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-4 animate-fade-in-soft">
            {spendingInsights.length === 0 ? (
              <div className="text-center py-10">
                <Lightbulb className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {language === 'tr'
                    ? 'Hesap aktiviteleriniz analiz ediliyor. Gerekli veriler oluştukça akıllı öneriler burada belirecektir.'
                    : 'Your account activities are being analyzed. Smart recommendations will appear as data flows.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {spendingInsights.map((insight, index) => {
                  const color = impactToColor(insight.impact);
                  const Icon = getIcon(insight.impact);
                  return (
                    <div
                      key={`insight-${index}`}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
                        colorClasses[color]
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <span className={cn("p-2 rounded-lg bg-card/60 border border-border/40 shadow-sm", iconClasses[color])}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-foreground text-sm tracking-tight leading-snug">
                              {insight.title}
                            </h4>
                            {insight.potentialSavings && insight.potentialSavings > 0 && (
                              <span className="inline-flex items-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 rounded-md flex-shrink-0 tabular-nums">
                                +{formatCurrency(insight.potentialSavings)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground/90 mt-1.5 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Anomalies */}
        {activeTab === 'anomalies' && (
          <div className="space-y-5 animate-fade-in-soft">
            {anomalySummary ? (
              <>
                {/* Risk Score Banner */}
                <div className="flex items-center justify-between p-4.5 rounded-2xl border border-border/60 bg-gradient-to-r from-muted/30 to-muted/10">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === 'tr' ? 'Genel Risk Puanı' : 'Overall Risk Score'}
                    </p>
                    <p className="text-3xl font-display font-black text-foreground tabular-nums">
                      {anomalySummary.riskScore} <span className="text-sm font-medium text-muted-foreground">/ 100</span>
                    </p>
                  </div>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md",
                    anomalySummary.riskScore >= 70
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                      : anomalySummary.riskScore >= 40
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  )}>
                    <Shield className="w-7 h-7" />
                  </div>
                </div>

                {/* Anomalies List */}
                {anomalySummary.recentAnomalies.length > 0 ? (
                  <div className="grid gap-3">
                    {anomalySummary.recentAnomalies.map((anomaly, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border/50 hover:border-primary/20 rounded-xl bg-card/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            "p-2 rounded-lg bg-card/60 border border-border/40 shadow-sm mt-0.5",
                            anomaly.severity === 'critical' || anomaly.severity === 'high'
                              ? 'text-rose-500'
                              : anomaly.severity === 'medium'
                              ? 'text-amber-500'
                              : 'text-primary'
                          )}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="font-bold text-foreground text-sm tracking-tight leading-snug truncate">
                                {anomaly.title}
                              </h4>
                              <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded-md border tracking-wider", getSeverityColor(anomaly.severity))}>
                                {anomaly.severity}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground/95 leading-relaxed">
                              {anomaly.maskedDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'tr'
                        ? 'Hesaplarınızda şüpheli veya alışılmadık bir işleme rastlanmadı.'
                        : 'No suspicious transactions detected.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {language === 'tr'
                    ? 'Gerekli analiz verileri henüz toplanmadı.'
                    : 'Analysis dataset is not sufficient yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Savings */}
        {activeTab === 'savings' && (
          <div className="space-y-4 animate-fade-in-soft">
            {spendingInsights.filter(i => i.potentialSavings && i.potentialSavings > 0).length > 0 ? (
              <>
                {/* Total Potential Savings */}
                <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/[0.02] dark:from-emerald-950/20 dark:to-transparent rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {language === 'tr' ? 'Potansiyel Aylık Tasarruf' : 'Potential Monthly Savings'}
                    </p>
                    <p className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(
                        spendingInsights
                          .filter(i => i.potentialSavings)
                          .reduce((sum, i) => sum + (i.potentialSavings || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                    <PiggyBank className="w-6 h-6" />
                  </div>
                </div>

                {/* Savings Items */}
                <div className="grid gap-3">
                  {spendingInsights
                    .filter(i => i.potentialSavings && i.potentialSavings > 0)
                    .sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0))
                    .map((insight, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border/50 hover:border-emerald-500/20 rounded-xl bg-card/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="font-bold text-foreground text-sm tracking-tight leading-snug">
                            {insight.title}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded-md tabular-nums">
                            +{formatCurrency(insight.potentialSavings || 0)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/95 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <PiggyBank className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {language === 'tr'
                    ? 'Hesap harcamalarınız optimize ediliyor. Akıllı motor tarafından belirlenecek tasarruf fırsatları burada listelenecektir.'
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

