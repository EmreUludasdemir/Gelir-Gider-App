// Type definitions for the application
export type Language = 'tr' | 'en';
export type CurrencyCode = 'TRY' | 'USD' | 'EUR';
export type ThemeMode = 'light' | 'dark' | 'system';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface FinancialInsight {
  title: string;
  advice: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  language: Language;
  currency: CurrencyCode;
  theme: ThemeMode;
}

export interface SmartParseResult {
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  date?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'inc-1', name: 'Maaş', type: TransactionType.INCOME },
  { id: 'inc-2', name: 'Freelance', type: TransactionType.INCOME },
  { id: 'inc-3', name: 'Yatırım', type: TransactionType.INCOME },
  { id: 'inc-4', name: 'Hediye', type: TransactionType.INCOME },
  { id: 'exp-1', name: 'Yemek', type: TransactionType.EXPENSE },
  { id: 'exp-2', name: 'Ulaşım', type: TransactionType.EXPENSE },
  { id: 'exp-3', name: 'Konut', type: TransactionType.EXPENSE },
  { id: 'exp-4', name: 'Faturalar', type: TransactionType.EXPENSE },
  { id: 'exp-5', name: 'Eğlence', type: TransactionType.EXPENSE },
  { id: 'exp-6', name: 'Sağlık', type: TransactionType.EXPENSE },
  { id: 'exp-7', name: 'Alışveriş', type: TransactionType.EXPENSE },
  { id: 'exp-8', name: 'Diğer', type: TransactionType.EXPENSE },
];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};
