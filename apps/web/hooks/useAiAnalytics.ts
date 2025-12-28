'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export interface SpendingAnomaly {
  type: 'high_spending' | 'unusual_category' | 'frequency_spike' | 'large_transaction';
  severity: 'low' | 'medium' | 'high';
  message: string;
  categoryId?: string;
  categoryLabel?: string;
  amount?: number;
  percentageAboveNormal?: number;
  detectedAt: string;
}

export interface SpendingTrend {
  categoryId: string;
  categoryLabel: string;
  currentMonthSpending: number;
  previousMonthSpending: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  prediction: number;
}

export interface FinancialHealthFactor {
  name: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
  advice: string;
}

export interface FinancialHealth {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: FinancialHealthFactor[];
  savingsRate: number;
  expenseToIncomeRatio: number;
  budgetAdherence: number;
}

export interface CategoryInsight {
  categoryId: string;
  categoryLabel: string;
  totalSpent: number;
  averageTransaction: number;
  transactionCount: number;
  percentageOfTotal: number;
  comparedToAverage: 'above' | 'below' | 'normal';
  suggestion?: string;
}

export interface AiAnalyticsSummary {
  anomalies: SpendingAnomaly[];
  trends: SpendingTrend[];
  health: FinancialHealth;
  categoryInsights: CategoryInsight[];
  generatedAt: string;
}

interface ApiResponse<T> {
  data: T;
}

export function useAnomalies() {
  const { data, error, isLoading } = useSWR<ApiResponse<SpendingAnomaly[]>>(
    '/ai-analytics/anomalies',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );
  return { data: data?.data, error, isLoading };
}

export function useTrends() {
  const { data, error, isLoading } = useSWR<ApiResponse<SpendingTrend[]>>(
    '/ai-analytics/trends',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );
  return { data: data?.data, error, isLoading };
}

export function useFinancialHealth() {
  const { data, error, isLoading } = useSWR<ApiResponse<FinancialHealth>>(
    '/ai-analytics/health',
    fetcher,
    { refreshInterval: 10 * 60 * 1000 }
  );
  return { data: data?.data, error, isLoading };
}

export function useCategoryInsights() {
  const { data, error, isLoading } = useSWR<ApiResponse<CategoryInsight[]>>(
    '/ai-analytics/category-insights',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );
  return { data: data?.data, error, isLoading };
}

export function useAiAnalyticsSummary() {
  const { data, error, isLoading } = useSWR<ApiResponse<AiAnalyticsSummary>>(
    '/ai-analytics/summary',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );
  return { data: data?.data, error, isLoading };
}
