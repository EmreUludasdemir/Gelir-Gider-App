const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  filename: string;
  totalParsed: number;
  totalSaved: number;
  lowConfidenceCount: number;
  errors: string[];
  transactions: Transaction[];
}
