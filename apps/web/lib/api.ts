import { getApiBaseUrl } from './api-base';

const API_BASE = getApiBaseUrl();

// Auth token management
export function setAuthToken(token: string, refreshToken?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API Error: ${res.statusText}`);
  }

  return res.json();
}

// SWR fetcher
export const fetcher = <T>(url: string): Promise<T> => fetchApi<T>(url);

// Transactions
export const getTransactions = (query?: Record<string, string>) => {
  const params = new URLSearchParams(query).toString();
  return fetchApi<Transaction[]>(`/transactions${params ? `?${params}` : ''}`);
};

export const getDuplicateGroups = (options?: {
  days?: number;
  windowDays?: number;
  amountTolerance?: number;
}) => {
  const params = new URLSearchParams();
  if (options?.days) params.set('days', options.days.toString());
  if (options?.windowDays) params.set('windowDays', options.windowDays.toString());
  if (options?.amountTolerance !== undefined) {
    params.set('amountTolerance', options.amountTolerance.toString());
  }

  const query = params.toString();
  return fetchApi<DuplicateGroup[]>(
    `/transactions/duplicates${query ? `?${query}` : ''}`
  );
};

export const resolveDuplicateGroup = (keepId: string, transactionIds: string[]) =>
  fetchApi<{ keptId: string; deleted: number }>(`/transactions/duplicates/resolve`, {
    method: 'POST',
    body: JSON.stringify({ keepId, transactionIds }),
  });

export const createTransaction = (data: CreateTransactionDto) =>
  fetchApi<Transaction>('/transactions/manual', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTransaction = (id: string, data: UpdateTransactionDto) =>
  fetchApi<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteTransaction = (id: string) =>
  fetchApi<{ success: boolean }>(`/transactions/${id}`, {
    method: 'DELETE',
  });

// Dashboard
export const getSummary = () => fetchApi<DashboardSummary>('/transactions/summary');
export const getSuggestions = () => fetchApi<Suggestion[]>('/transactions/suggestions');
export const getRecurring = () => fetchApi<RecurringPayment[]>('/transactions/recurring');
export const chatWithAssistant = (message: string) =>
  fetchApi<{ message: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

// Upload
export const uploadPdf = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_BASE}/uploads/pdf`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, 'PDF upload failed');
  }

  return res.json();
};

// Types
export type TransactionType = 'income' | 'expense';
export type Currency = 'TRY' | 'USD' | 'EUR';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  source: 'pdf' | 'manual';
  confidence: number;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  date: string;
  description: string;
  amount: number;
  currency?: Currency;
  type: TransactionType;
  categoryId?: string;
  categoryLabel?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  categoryId?: string;
  categoryLabel?: string;
  tags?: string[];
  notes?: string;
}

export interface DashboardSummary {
  period: {
    month: string;
    year: number;
    startDate: string;
    endDate: string;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
    transactionCount: number;
  };
  comparison: {
    previousMonth: {
      income: number;
      expense: number;
    };
    changePercentage: {
      income: number;
      expense: number;
    };
  };
  topCategories: CategorySummary[];
  weeklyTrend: WeeklyData[];
  recurringPayments: RecurringPayment[];
}

export interface CategorySummary {
  categoryId: string;
  categoryLabel: string;
  total: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyData {
  week: string;
  income: number;
  expense: number;
}

export interface RecurringPayment {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  frequency: 'weekly' | 'monthly' | 'yearly';
  categoryLabel: string;
  lastDate: string;
  nextDate: string;
  isActive: boolean;
}

export interface Suggestion {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  currency: Currency;
  currentCategory?: string;
  suggestedCategories: Array<{
    categoryId: string;
    categoryLabel: string;
    confidence: number;
  }>;
  createdAt: string;
}

export interface UploadResult {
  success: boolean;
  duplicate?: boolean;
  filename: string;
  totalParsed: number;
  totalSaved: number;
  lowConfidenceCount: number;
  errors: string[];
  suggestions?: string[];
  transactions: Transaction[];
}

export interface DuplicateGroup {
  id: string;
  reason: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  dateFrom: string;
  dateTo: string;
  count: number;
  transactions: Transaction[];
}

// Savings Goals
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  color?: string;
  icon?: string;
  deadline?: string;
}

export const getSavingsGoals = () => fetchApi<SavingsGoal[]>('/savings-goals');
export const createSavingsGoal = (data: CreateSavingsGoalDto) =>
  fetchApi<SavingsGoal>('/savings-goals', { method: 'POST', body: JSON.stringify(data) });
export const updateSavingsGoal = (id: string, data: Partial<CreateSavingsGoalDto>) =>
  fetchApi<SavingsGoal>(`/savings-goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSavingsGoal = (id: string) =>
  fetchApi<{ success: boolean }>(`/savings-goals/${id}`, { method: 'DELETE' });
export const addToSavingsGoal = (id: string, amount: number) =>
  fetchApi<SavingsGoal>(`/savings-goals/${id}/add`, { method: 'PATCH', body: JSON.stringify({ amount }) });

// Budgets
export interface Budget {
  id: string;
  categoryId: string;
  categoryLabel: string;
  limitAmount: number;
  period: string;
  alertThreshold: number;
  isActive: boolean;
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: 'ok' | 'warning' | 'over';
}

export const getBudgets = () => fetchApi<Budget[]>('/budgets');
export const getBudgetStatus = () => fetchApi<Budget[]>('/budgets/status');
export const createBudget = (data: { categoryId: string; categoryLabel: string; limitAmount: number }) =>
  fetchApi<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) });
export const deleteBudget = (id: string) =>
  fetchApi<{ success: boolean }>(`/budgets/${id}`, { method: 'DELETE' });

// Preferences
export interface UserPreferences {
  id: string;
  language: string;
  currency: string;
  theme: string;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  weeklyReport: boolean;
}

export const getPreferences = () => fetchApi<UserPreferences>('/preferences');
export const updatePreferences = (data: Partial<UserPreferences>) =>
  fetchApi<UserPreferences>('/preferences', { method: 'PATCH', body: JSON.stringify(data) });

