'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

export function useAnomalies() {
  return useQuery({
    queryKey: ['ai-analytics', 'anomalies'],
    queryFn: async () => {
      const response = await api.get('/ai-analytics/anomalies');
      return response.data.data as SpendingAnomaly[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrends() {
  return useQuery({
    queryKey: ['ai-analytics', 'trends'],
    queryFn: async () => {
      const response = await api.get('/ai-analytics/trends');
      return response.data.data as SpendingTrend[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinancialHealth() {
  return useQuery({
    queryKey: ['ai-analytics', 'health'],
    queryFn: async () => {
      const response = await api.get('/ai-analytics/health');
      return response.data.data as FinancialHealth;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategoryInsights() {
  return useQuery({
    queryKey: ['ai-analytics', 'category-insights'],
    queryFn: async () => {
      const response = await api.get('/ai-analytics/category-insights');
      return response.data.data as CategoryInsight[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiAnalyticsSummary() {
  return useQuery({
    queryKey: ['ai-analytics', 'summary'],
    queryFn: async () => {
      const response = await api.get('/ai-analytics/summary');
      return response.data.data as AiAnalyticsSummary;
    },
    staleTime: 5 * 60 * 1000,
  });
}
