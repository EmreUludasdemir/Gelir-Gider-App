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

export const previewPdfImport = async (file: File): Promise<UploadPreview> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/uploads/pdf/preview`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    throw new ApiError(res.status, 'PDF preview failed');
  }

  return res.json();
};

export const confirmPdfImport = (data: ConfirmPdfUploadPayload) =>
  fetchApi<UploadResult>('/uploads/pdf/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  });

function buildUploadBatchPreview(items: UploadBatchPreviewItem[]): UploadBatchPreview {
  const actionableItems = items.filter(
    (item) => item.preview.success && !item.preview.duplicate && item.preview.transactions.length > 0,
  )
  const duplicateFiles = items.filter((item) => item.preview.duplicate).length
  const errorFiles = items.filter((item) => !item.preview.success && !item.preview.duplicate).length

  return {
    items,
    totalFiles: items.length,
    actionableFiles: actionableItems.length,
    duplicateFiles,
    errorFiles,
    totalParsed: items.reduce((sum, item) => sum + item.preview.totalParsed, 0),
    totalLowConfidenceCount: items.reduce((sum, item) => sum + item.preview.lowConfidenceCount, 0),
    totalSize: items.reduce((sum, item) => sum + item.preview.fileSize, 0),
  }
}

function buildUploadBatchResult(fileResults: UploadBatchResultItem[]): UploadBatchResult {
  const savedResults = fileResults.filter((item) => item.result.success && !item.result.duplicate)
  const duplicateFiles = fileResults.filter((item) => item.result.duplicate).length

  return {
    success: savedResults.length > 0 || duplicateFiles > 0,
    totalFiles: fileResults.length,
    processedFiles: savedResults.length,
    duplicateFiles,
    totalParsed: fileResults.reduce((sum, item) => sum + item.result.totalParsed, 0),
    totalSaved: fileResults.reduce((sum, item) => sum + item.result.totalSaved, 0),
    lowConfidenceCount: fileResults.reduce((sum, item) => sum + item.result.lowConfidenceCount, 0),
    errors: fileResults.flatMap((item) => item.result.errors),
    suggestions: fileResults.flatMap((item) => item.result.suggestions || []),
    transactions: fileResults.flatMap((item) => item.result.transactions),
    fileResults,
  }
}

export async function previewPdfImportBatch(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<UploadBatchPreview> {
  const items: UploadBatchPreviewItem[] = []

  for (const [index, file] of files.entries()) {
    let preview: UploadPreview
    try {
      preview = await previewPdfImport(file)
    } catch (error) {
      preview = {
        success: false,
        filename: file.name,
        fileHash: `preview-error-${index + 1}`,
        fileSize: file.size,
        totalParsed: 0,
        lowConfidenceCount: 0,
        errors: [error instanceof Error ? error.message : 'PDF preview failed'],
        suggestions: [],
        transactions: [],
      }
    }

    items.push({
      id: `${file.name}-${index}`,
      preview: {
        ...preview,
        filename: file.name,
        fileSize: file.size,
      },
    })

    onProgress?.(index + 1, files.length)
  }

  return buildUploadBatchPreview(items)
}

export async function confirmPdfImportBatch(
  payloads: ConfirmPdfUploadPayload[],
  onProgress?: (completed: number, total: number) => void,
): Promise<UploadBatchResult> {
  const fileResults: UploadBatchResultItem[] = []

  for (const [index, payload] of payloads.entries()) {
    try {
      const result = await confirmPdfImport(payload)
      fileResults.push({
        id: `${payload.filename}-${index}`,
        filename: payload.filename,
        result,
      })
    } catch (error) {
      fileResults.push({
        id: `${payload.filename}-${index}`,
        filename: payload.filename,
        result: {
          success: false,
          filename: payload.filename,
          totalParsed: payload.totalParsed,
          totalSaved: 0,
          lowConfidenceCount: payload.transactions.filter((transaction) => transaction.confidence < 70).length,
          errors: [error instanceof Error ? error.message : 'Import failed'],
          suggestions: [],
          transactions: [],
        },
      })
    }

    onProgress?.(index + 1, payloads.length)
  }

  return buildUploadBatchResult(fileResults)
}

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

export interface UploadPreviewTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  tags: string[];
  notes?: string;
}

export interface UploadPreview {
  success: boolean;
  duplicate?: boolean;
  filename: string;
  fileHash: string;
  fileSize: number;
  totalParsed: number;
  lowConfidenceCount: number;
  errors: string[];
  suggestions?: string[];
  transactions: UploadPreviewTransaction[];
}

export interface ConfirmPdfUploadPayload {
  filename: string;
  fileHash: string;
  fileSize: number;
  totalParsed: number;
  transactions: UploadPreviewTransaction[];
}

export interface UploadBatchPreviewItem {
  id: string;
  preview: UploadPreview;
}

export interface UploadBatchPreview {
  items: UploadBatchPreviewItem[];
  totalFiles: number;
  actionableFiles: number;
  duplicateFiles: number;
  errorFiles: number;
  totalParsed: number;
  totalLowConfidenceCount: number;
  totalSize: number;
}

export interface UploadBatchResultItem {
  id: string;
  filename: string;
  result: UploadResult;
}

export interface UploadBatchResult {
  success: boolean;
  totalFiles: number;
  processedFiles: number;
  duplicateFiles: number;
  totalParsed: number;
  totalSaved: number;
  lowConfidenceCount: number;
  errors: string[];
  suggestions?: string[];
  transactions: Transaction[];
  fileResults: UploadBatchResultItem[];
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

// Subscriptions
export interface ManagedSubscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId: string;
  categoryLabel: string;
  isActive: boolean;
  notes?: string;
  monthlyCost: number;
  annualCost: number;
  daysUntilBilling: number;
}

export interface DetectedSubscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  categoryLabel: string;
  lastPayment: string;
  nextPayment: string;
  isActive: boolean;
  totalSpentYear: number;
  matchSource: 'known' | 'pattern';
}

export interface SubscriptionSummary {
  subscriptions: ManagedSubscription[];
  detectedSuggestions: DetectedSubscription[];
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  upcomingPayments: Array<{
    id: string;
    name: string;
    amount: number;
    currency: Currency;
    date: string;
  }>;
  savingsOpportunities: Array<{
    id: string;
    name: string;
    monthlyCost: number;
  }>;
}

export const getSubscriptions = () => fetchApi<ManagedSubscription[]>('/subscriptions');
export const getDetectedSubscriptions = () =>
  fetchApi<DetectedSubscription[]>('/subscriptions/detected');
export const getSubscriptionSummary = () =>
  fetchApi<SubscriptionSummary>('/subscriptions/summary');
export const createSubscription = (data: {
  name: string;
  amount: number;
  currency?: Currency;
  billingCycle?: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId?: string;
  categoryLabel?: string;
  notes?: string;
  isActive?: boolean;
}) =>
  fetchApi<ManagedSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateSubscription = (
  id: string,
  data: Partial<{
    name: string;
    amount: number;
    currency: Currency;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    nextBillingDate: string;
    categoryId: string;
    categoryLabel: string;
    notes: string;
    isActive: boolean;
  }>
) =>
  fetchApi<ManagedSubscription>(`/subscriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
export const deleteSubscription = (id: string) =>
  fetchApi<{ success: boolean }>(`/subscriptions/${id}`, {
    method: 'DELETE',
  });

// Cash Flow
export interface CashFlowForecastEvent {
  id: string;
  label: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  source: 'bill' | 'subscription';
  categoryLabel: string;
}

export interface CashFlowForecast {
  days: number;
  currentBalance: number;
  averageDailyExpense: number;
  committedExpenses: number;
  projectedVariableExpenses: number;
  projectedEndBalance: number;
  bufferTarget: number;
  health: 'stable' | 'watch' | 'critical';
  runwayDays: number | null;
  upcomingEvents: CashFlowForecastEvent[];
}

export const getCashFlowForecast = (days: number = 30) =>
  fetchApi<CashFlowForecast>(`/transactions/cash-flow?days=${days}`);

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

