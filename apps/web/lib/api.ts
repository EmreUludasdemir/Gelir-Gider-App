import { getApiBaseUrl } from './api-base';

const API_BASE = getApiBaseUrl();

type FetchApiOptions = RequestInit & {
  skipRefresh?: boolean;
  allowUnauthorized?: boolean;
};

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

// Legacy no-op exports kept for compatibility during cookie migration.
export function setAuthToken(_token: string, _refreshToken?: string) {}
export function clearAuthToken() {}
export function getAuthToken(): string | null {
  return null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(headers: HeadersInit | undefined, body: BodyInit | null | undefined) {
  const resolvedHeaders = new Headers(headers);
  if (!(body instanceof FormData) && !resolvedHeaders.has('Content-Type')) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }
  return resolvedHeaders;
}

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function fetchApi<T>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers, options.body),
    credentials: 'include',
  });

  const isAuthEndpoint =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/logout');

  if (
    res.status === 401 &&
    !options.skipRefresh &&
    !options.allowUnauthorized &&
    !isAuthEndpoint
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return fetchApi<T>(endpoint, { ...options, skipRefresh: true });
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, `API Error: ${res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const loginUser = (data: { email: string; password: string; twoFactorCode?: string }) =>
  fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    skipRefresh: true,
    allowUnauthorized: true,
  });

export const refreshUserSession = () =>
  fetchApi<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
    skipRefresh: true,
    allowUnauthorized: true,
  });

export const logoutUser = () =>
  fetchApi<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
    skipRefresh: true,
    allowUnauthorized: true,
  });

export const getCurrentUser = () => fetchApi<SessionUser>('/auth/me');

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
export const parseSmartTransaction = (input: string) =>
  fetchApi<{
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    date: string;
  }>('/ai/parse', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
export const getAiInsights = () => fetchApi<{
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  potentialSavings?: number;
}[]>('/ai/insights');
export const getAiAnomalies = () => fetchApi<{
  totalAnomalies: number;
  riskScore: number;
  recentAnomalies: {
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    maskedDescription: string;
  }[];
}>('/ai/anomalies');

// Upload
export const uploadPdf = async (file: File): Promise<UploadResult> => {
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

// Bills
export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  frequency?: 'once' | 'weekly' | 'monthly' | 'yearly';
  categoryId: string;
  categoryLabel: string;
  reminderDays?: number;
  notes?: string;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getUpcomingBills = (days: number = 14) =>
  fetchApi<Bill[]>(`/bills/upcoming?days=${days}`);
export const markBillAsPaid = (id: string) =>
  fetchApi<Bill>(`/bills/${id}/mark-paid`, { method: 'PATCH' });

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

