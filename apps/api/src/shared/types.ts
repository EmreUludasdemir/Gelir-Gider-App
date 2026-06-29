export type TransactionSource = 'pdf' | 'manual';
export type TransactionType = 'income' | 'expense';
export type Currency = 'TRY' | 'USD' | 'EUR';

// JWT Payload from auth
export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Prisma Transaction type for internal use
export interface PrismaTransaction {
  id: string;
  userId: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  source: string;
  type: string;
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  tags: string;
  notes: string | null;
  householdId?: string | null;
  ownerUserId?: string | null;
  reviewerUserId?: string | null;
  needsReview?: boolean;
  creditCardId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionEntity {
  id: string;
  userId: string;
  accountId: string;
  date: string;           // ISO 8601
  description: string;
  amount: number;         // Negatif = gider, Pozitif = gelir
  currency: Currency;
  source: TransactionSource;
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  confidence: number;     // 0-100
  tags: string[];
  notes?: string;
  householdId?: string;
  ownerUserId?: string;
  ownerName?: string;
  reviewerUserId?: string;
  reviewerName?: string;
  needsReview?: boolean;
  createdAt: string;
  updatedAt: string;
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
  transactions: TransactionEntity[];
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
  householdId?: string;
  ownerUserId?: string;
  reviewerUserId?: string;
  needsReview?: boolean;
  isPossibleDuplicate?: boolean;
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
  transactions: TransactionEntity[];
}

export interface CashFlowForecastEvent {
  id: string;
  label: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  source: "bill" | "subscription";
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
  health: "stable" | "watch" | "critical";
  runwayDays: number | null;
  upcomingEvents: CashFlowForecastEvent[];
}

// Query parameters
export interface TransactionQuery {
  type?: TransactionType;
  categoryId?: string;
  source?: TransactionSource;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// DTOs
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
