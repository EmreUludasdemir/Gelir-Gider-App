'use client';

import {
  ApiError,
  chatWithAssistant,
  getAiInsights,
  parseSmartTransaction,
  Transaction,
} from './api';
import { FinancialInsight, SmartParseResult, TransactionType, Language } from './types';

export async function parseTransactionNaturalLanguage(
  input: string,
  _language: Language = 'tr'
): Promise<SmartParseResult | null> {
  const parsed = await parseSmartTransaction(input);
  return {
    description: parsed.description,
    amount: Math.abs(Number(parsed.amount)),
    type: parsed.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
    category: parsed.category,
    date: parsed.date,
  };
}

export async function generateFinancialInsights(
  _transactions: Transaction[],
  _language: Language = 'tr'
): Promise<FinancialInsight[]> {
  const insights = await getAiInsights();
  return insights.map((insight) => ({
    title: insight.title,
    advice: insight.description,
    color:
      insight.impact === 'high'
        ? 'red'
        : insight.impact === 'medium'
          ? 'yellow'
          : 'blue',
  }));
}

export async function askFinancialAdvisor(
  query: string,
  _transactions: Transaction[],
  language: Language = 'tr'
): Promise<string> {
  try {
    const response = await chatWithAssistant(query);
    if (response?.message) {
      return response.message;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return language === 'tr'
        ? 'AI servisi su anda hazir degil. Lutfen daha sonra tekrar deneyin.'
        : 'AI service is not available right now. Please try again later.';
    }
    throw error;
  }

  return language === 'tr' ? 'Cevap olusturulamadi.' : 'Response could not be generated.';
}

export async function isAIAvailable(): Promise<boolean> {
  try {
    await getAiInsights();
    return true;
  } catch (error) {
    return !(error instanceof ApiError && error.status === 503);
  }
}
