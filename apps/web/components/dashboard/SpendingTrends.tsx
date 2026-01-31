'use client';

import { TrendingUp, TrendingDown, Minus, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import { useTrends, SpendingTrend } from '@/hooks/useAiAnalytics';

type TrendType = 'increasing' | 'decreasing' | 'stable';

const trendIcons: Record<TrendType, typeof TrendingUp> = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

const trendColors: Record<TrendType, string> = {
  increasing: 'text-red-500',
  decreasing: 'text-green-500',
  stable: 'text-muted-foreground',
};

const trendBgColors: Record<TrendType, string> = {
  increasing: 'bg-red-50 dark:bg-red-900/20',
  decreasing: 'bg-green-50 dark:bg-green-900/20',
  stable: 'bg-muted/40/50',
};

export function SpendingTrends() {
  const { data: trends, isLoading } = useTrends();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-foreground">Harcama Trendleri</h3>
        </div>
        <p className="text-muted-foreground text-center py-4">
          Trend analizi için yeterli veri yok.
        </p>
      </div>
    );
  }

  const topTrends = trends.slice(0, 5);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-foreground">Harcama Trendleri</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {topTrends.map((trend: SpendingTrend, index: number) => {
          const TrendIcon = trendIcons[trend.trend as TrendType];
          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${trendBgColors[trend.trend as TrendType]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  {trend.categoryLabel}
                </span>
                <div className={`flex items-center gap-1 ${trendColors[trend.trend as TrendType]}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {trend.trend === 'stable' ? '~' : trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{trend.previousMonthSpending.toLocaleString('tr-TR')} ₺</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {trend.currentMonthSpending.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tahmini: {trend.prediction.toLocaleString('tr-TR')} ₺
                </div>
              </div>

              {/* Mini progress bar showing month-over-month change */}
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    trend.trend === 'increasing' ? 'bg-red-400' :
                    trend.trend === 'decreasing' ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.abs(trend.percentageChange))}%`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {trends.length > 5 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground text-center">
            + {trends.length - 5} kategoride daha trend mevcut
          </p>
        </div>
      )}
    </div>
  );
}


