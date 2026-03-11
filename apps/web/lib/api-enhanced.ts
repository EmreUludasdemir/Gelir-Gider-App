import { getApiBaseUrl } from './api-base';

const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

// Legacy auth helpers kept as compatibility no-ops while web uses cookie sessions.
export function setAuthToken(_tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {}
export function getAccessToken(): string | null {
  return null;
}
export function getRefreshToken(): string | null {
  return null;
}
export function clearAuthToken() {}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit, skipRefresh = false): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 401 && !skipRefresh && !endpoint.includes('/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetchApi<T>(endpoint, options, true);
    }
    throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
  }

  if (!res.ok) {
    let errorMessage = `API Error: ${res.statusText}`;
    let errorCode = undefined;
    let errorDetails = undefined;

    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code;
      errorDetails = errorData.details;
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(res.status, errorMessage, errorCode, errorDetails);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

// ====================
// AUTH API
// ====================
export const api = {
  auth: {
    login: (data: { email: string; password: string; twoFactorCode?: string }) =>
      fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: { email: string; password: string; name?: string }) =>
      fetchApi<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    refresh: (refreshToken: string) =>
      fetchApi<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    changePassword: (oldPassword: string, newPassword: string) =>
      fetchApi<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      }),

    twoFactor: {
      generate: () => fetchApi<{ secret: string; qrCode: string }>('/auth/2fa/generate'),
      enable: (code: string, secret: string) =>
        fetchApi<{ message: string }>('/auth/2fa/enable', {
          method: 'POST',
          body: JSON.stringify({ code, secret }),
        }),
      disable: (password: string) =>
        fetchApi<{ message: string }>('/auth/2fa/disable', {
          method: 'POST',
          body: JSON.stringify({ password }),
        }),
    },
  },

  // ====================
  // TRANSACTIONS API
  // ====================
  transactions: {
    getAll: (params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string }) =>
      fetchApi<PaginatedResponse<Transaction>>(`/transactions?${new URLSearchParams(params as any).toString()}`),

    getOne: (id: string) => fetchApi<Transaction>(`/transactions/${id}`),

    create: (data: CreateTransactionDto) =>
      fetchApi<Transaction>('/transactions/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateTransactionDto) =>
      fetchApi<Transaction>(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<void>(`/transactions/${id}`, {
        method: 'DELETE',
      }),

    bulkDelete: (ids: string[]) =>
      fetchApi<{ deleted: number }>('/transactions/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),

    bulkCategorize: (ids: string[], categoryId: string, categoryLabel: string) =>
      fetchApi<{ updated: number }>('/transactions/bulk-categorize', {
        method: 'POST',
        body: JSON.stringify({ ids, categoryId, categoryLabel }),
      }),

    getSummary: () => fetchApi<DashboardSummary>('/transactions/summary'),
    getSuggestions: () => fetchApi<Suggestion[]>('/transactions/suggestions'),
    getRecurring: () => fetchApi<RecurringPayment[]>('/transactions/recurring'),
  },

  // ====================
  // AI API
  // ====================
  ai: {
    chat: (message: string) =>
      fetchApi<{ message: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },

  // ====================
  // BILLS API
  // ====================
  bills: {
    getAll: (params?: { page?: number; limit?: number; isPaid?: boolean }) =>
      fetchApi<PaginatedResponse<Bill>>(`/bills?${new URLSearchParams(params as any).toString()}`),

    getOne: (id: string) => fetchApi<Bill>(`/bills/${id}`),

    create: (data: CreateBillDto) =>
      fetchApi<Bill>('/bills', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateBillDto) =>
      fetchApi<Bill>(`/bills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<void>(`/bills/${id}`, {
        method: 'DELETE',
      }),

    getUpcoming: (days: number = 7) =>
      fetchApi<Bill[]>(`/bills/upcoming?days=${days}`),

    markAsPaid: (id: string) =>
      fetchApi<Bill>(`/bills/${id}/mark-paid`, {
        method: 'PATCH',
      }),

    getStatistics: () =>
      fetchApi<BillStatistics>('/bills/statistics'),
  },

  // ====================
  // DEBTS API
  // ====================
  debts: {
    getAll: (params?: { page?: number; limit?: number; type?: 'owed_to_me' | 'i_owe'; isPaid?: boolean }) =>
      fetchApi<PaginatedResponse<Debt>>(`/debts?${new URLSearchParams(params as any).toString()}`),

    getOne: (id: string) => fetchApi<Debt>(`/debts/${id}`),

    create: (data: CreateDebtDto) =>
      fetchApi<Debt>('/debts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateDebtDto) =>
      fetchApi<Debt>(`/debts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<void>(`/debts/${id}`, {
        method: 'DELETE',
      }),

    markAsPaid: (id: string) =>
      fetchApi<Debt>(`/debts/${id}/mark-paid`, {
        method: 'PATCH',
      }),

    getSummary: () => fetchApi<DebtSummary>('/debts/summary'),
  },

  // ====================
  // SUBSCRIPTIONS API
  // ====================
  subscriptions: {
    getAll: (params?: { page?: number; limit?: number }) =>
      fetchApi<PaginatedResponse<Subscription>>(`/subscriptions?${new URLSearchParams(params as any).toString()}`),

    getActive: () => fetchApi<Subscription[]>('/subscriptions/active'),

    getUpcomingRenewals: (days: number = 7) =>
      fetchApi<Subscription[]>(`/subscriptions/upcoming-renewals?days=${days}`),

    create: (data: CreateSubscriptionDto) =>
      fetchApi<Subscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateSubscriptionDto) =>
      fetchApi<Subscription>(`/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    cancel: (id: string) =>
      fetchApi<Subscription>(`/subscriptions/${id}/cancel`, {
        method: 'PATCH',
      }),

    delete: (id: string) =>
      fetchApi<void>(`/subscriptions/${id}`, {
        method: 'DELETE',
      }),
  },

  // ====================
  // IMPORTS API
  // ====================
  imports: {
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/imports/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new ApiError(res.status, 'File upload failed');
      }

      return res.json() as Promise<ImportResult>;
    },

    downloadTemplate: (format: 'csv' | 'xlsx' = 'csv') => {
      const url = `${API_BASE}/imports/template?format=${format}`;
      window.open(url, '_blank');
    },
  },

  // ====================
  // UPLOADS API
  // ====================
  uploads: {
    uploadPdf: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/uploads/pdf`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new ApiError(res.status, 'PDF upload failed');
      }

      return res.json() as Promise<UploadResult>;
    },
  },
};

// ====================
// TYPES
// ====================
export type TransactionType = 'income' | 'expense';
export type Currency = 'TRY' | 'USD' | 'EUR';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  twoFactorEnabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

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
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  currency?: Currency;
  notes?: string;
  tags?: string[];
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> { }

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categories: CategorySummary[];
  weeklyData: WeeklyData[];
}

export interface CategorySummary {
  categoryId: string;
  categoryLabel: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface WeeklyData {
  week: string;
  income: number;
  expense: number;
}

export interface Suggestion {
  type: 'duplicate' | 'recurring' | 'category';
  message: string;
  transactionId?: string;
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

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDate: string;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
  categoryId: string;
  categoryLabel: string;
  isPaid: boolean;
  reminderDays: number;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillDto {
  name: string;
  amount: number;
  currency?: string;
  dueDate: string;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
  categoryId: string;
  categoryLabel: string;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateBillDto extends Partial<CreateBillDto> {
  isPaid?: boolean;
}

export interface BillStatistics {
  totalBills: number;
  unpaidBills: number;
  totalAmount: number;
  upcomingAmount: number;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  currency: string;
  type: 'owed_to_me' | 'i_owe';
  description?: string;
  dueDate?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtDto {
  personName: string;
  amount: number;
  currency?: string;
  type: 'owed_to_me' | 'i_owe';
  description?: string;
  dueDate?: string;
}

export interface UpdateDebtDto extends Partial<CreateDebtDto> {
  isPaid?: boolean;
}

export interface DebtSummary {
  owedToMe: {
    total: number;
    count: number;
  };
  iOwe: {
    total: number;
    count: number;
  };
  netBalance: number;
  totalDebts: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId: string;
  categoryLabel: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  name: string;
  amount: number;
  currency?: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId: string;
  categoryLabel: string;
  notes?: string;
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {
  isActive?: boolean;
}

export interface ImportResult {
  success: boolean;
  filename: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; message: string }>;
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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// SWR fetcher
export const fetcher = <T>(url: string): Promise<T> => fetchApi<T>(url);

export default api;
