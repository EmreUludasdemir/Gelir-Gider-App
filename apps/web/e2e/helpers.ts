import type { Page, Route } from '@playwright/test'

const testPort = process.env.PLAYWRIGHT_TEST_PORT || '3100'
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://127.0.0.1:${testPort}`
const authToken = 'e2e-token'
const forecastAnchorDate = new Date('2026-03-11T12:00:00.000Z')

export const mockUser = {
  id: 'e2e-user-1',
  email: 'e2e@example.com',
  name: 'E2E User',
  emailVerified: true,
}

export const defaultTransactions = [
  {
    id: 'tx-income-1',
    date: '2026-03-05T09:00:00.000Z',
    description: 'Mart Maasi',
    amount: 85000,
    currency: 'TRY',
    type: 'income',
    categoryId: 'salary',
    categoryLabel: 'Maas',
    source: 'manual',
    confidence: 100,
    tags: [],
    createdAt: '2026-03-05T09:00:00.000Z',
    updatedAt: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 'tx-expense-1',
    date: '2026-03-04T12:30:00.000Z',
    description: 'Kira Odemesi',
    amount: -25000,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'rent',
    categoryLabel: 'Kira',
    source: 'pdf',
    confidence: 92,
    tags: [],
    createdAt: '2026-03-04T12:30:00.000Z',
    updatedAt: '2026-03-04T12:30:00.000Z',
  },
  {
    id: 'tx-expense-2',
    date: '2026-03-03T18:15:00.000Z',
    description: 'Migros Market',
    amount: -3500,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'market',
    categoryLabel: 'Market',
    source: 'manual',
    confidence: 100,
    tags: ['haftalik'],
    createdAt: '2026-03-03T18:15:00.000Z',
    updatedAt: '2026-03-03T18:15:00.000Z',
  },
  {
    id: 'tx-expense-3',
    date: '2026-03-02T08:00:00.000Z',
    description: 'Kira Odemesi 2026',
    amount: -25000,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'other',
    categoryLabel: 'Diger',
    source: 'manual',
    confidence: 100,
    tags: [],
    createdAt: '2026-03-02T08:00:00.000Z',
    updatedAt: '2026-03-02T08:00:00.000Z',
  },
]

export const defaultUploadTransactions = [
  {
    id: 'tx-upload-1',
    date: '2026-03-08T09:15:00.000Z',
    description: 'Istanbulkart Yukleme',
    amount: -420,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'transport',
    categoryLabel: 'Ulasim',
    source: 'pdf',
    confidence: 64,
    tags: ['pdf-upload'],
    createdAt: '2026-03-08T09:15:00.000Z',
    updatedAt: '2026-03-08T09:15:00.000Z',
  },
  {
    id: 'tx-upload-2',
    date: '2026-03-08T10:00:00.000Z',
    description: 'A101 Market',
    amount: -1180,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'market',
    categoryLabel: 'Market',
    source: 'pdf',
    confidence: 91,
    tags: ['pdf-upload'],
    createdAt: '2026-03-08T10:00:00.000Z',
    updatedAt: '2026-03-08T10:00:00.000Z',
  },
  {
    id: 'tx-upload-3',
    date: '2026-03-08T11:30:00.000Z',
    description: 'Freelance Odemesi',
    amount: 12500,
    currency: 'TRY',
    type: 'income',
    categoryId: 'freelance',
    categoryLabel: 'Freelance',
    source: 'pdf',
    confidence: 88,
    tags: ['pdf-upload'],
    createdAt: '2026-03-08T11:30:00.000Z',
    updatedAt: '2026-03-08T11:30:00.000Z',
  },
]

export const defaultConnections = [
  {
    id: 'conn-1',
    bankCode: 'akbank',
    bankName: 'Akbank',
    accountNumber: 'TR00 0000',
    accountName: 'Ana Hesap',
    accountType: 'checking',
    expiresAt: '2026-03-06T12:00:00.000Z',
    lastSyncAt: '2026-03-06T10:00:00.000Z',
    lastSyncStatus: 'success',
    lifecycleState: 'connected',
    syncError: null,
    errorReason: null,
    providerErrorCode: null,
    lastConsentAt: '2026-03-06T09:30:00.000Z',
    reauthRequiredAt: null,
    isActive: true,
  },
]

export const availableBanks = [
  { code: 'akbank', name: 'Akbank', isDemo: false },
  { code: 'garanti', name: 'Garanti BBVA', isDemo: false },
  { code: 'mock', name: 'Demo Banka', isDemo: true },
]

export const defaultBudgetStatus = [
  {
    id: 'budget-rent',
    categoryId: 'rent',
    categoryLabel: 'Kira',
    limitAmount: 26000,
    period: 'monthly',
    alertThreshold: 80,
    isActive: true,
    spent: 25000,
    remaining: 1000,
    percentage: 96.1,
    status: 'warning',
  },
  {
    id: 'budget-market',
    categoryId: 'market',
    categoryLabel: 'Market',
    limitAmount: 5000,
    period: 'monthly',
    alertThreshold: 80,
    isActive: true,
    spent: 3500,
    remaining: 1500,
    percentage: 70,
    status: 'ok',
  },
]

export const defaultSavingsGoals = [
  {
    id: 'goal-1',
    name: 'Acil Durum Fonu',
    targetAmount: 120000,
    currentAmount: 54000,
    color: '#0f766e',
    icon: 'shield',
    deadline: '2026-09-01',
    isCompleted: false,
  },
  {
    id: 'goal-2',
    name: 'Yaz Tatili',
    targetAmount: 45000,
    currentAmount: 33000,
    color: '#d97706',
    icon: 'sun',
    deadline: '2026-07-15',
    isCompleted: false,
  },
]

export const defaultUpcomingBills = [
  {
    id: 'bill-1',
    name: 'Elektrik Faturasi',
    amount: 1325,
    currency: 'TRY',
    dueDate: '2026-03-10',
    categoryId: 'utilities',
    categoryLabel: 'Faturalar',
    isPaid: false,
  },
  {
    id: 'bill-2',
    name: 'Internet',
    amount: 799,
    currency: 'TRY',
    dueDate: '2026-03-14',
    categoryId: 'utilities',
    categoryLabel: 'Faturalar',
    isPaid: false,
  },
]

export const defaultFinancialHealth = {
  score: 78,
  grade: 'B',
  savingsRate: 18,
  expenseToIncomeRatio: 72,
  budgetAdherence: 84,
  factors: [
    {
      name: 'Tasarruf',
      score: 78,
      status: 'good',
      advice: 'Mevcut hiz korunursa hedefler rahat finanse edilir.',
    },
    {
      name: 'Butce Disiplini',
      score: 84,
      status: 'good',
      advice: 'Yuksek harcama kategorilerinde erken uyarilar aktif tutulmali.',
    },
    {
      name: 'Nakit Akisi',
      score: 71,
      status: 'warning',
      advice: 'Fatura gunleri oncesinde bosluk birakmak faydali olur.',
    },
    {
      name: 'Istikrar',
      score: 79,
      status: 'good',
      advice: 'Aylik gelir harcama dengesi stabil gorunuyor.',
    },
  ],
}

export const defaultAnomalies = [
  {
    type: 'unusual_category',
    severity: 'medium',
    message: 'Kira kategorisinde bu ay normalin uzerinde harcama goruluyor.',
    categoryId: 'rent',
    categoryLabel: 'Kira',
    percentageAboveNormal: 18,
    detectedAt: '2026-03-07T09:00:00.000Z',
  },
]

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeMerchantKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[0-9]/g, ' ')
    .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ')
}

function calculateMonthlyCost(amount: number, billingCycle: 'weekly' | 'monthly' | 'yearly') {
  if (billingCycle === 'weekly') {
    return Number((amount * 4).toFixed(2))
  }

  if (billingCycle === 'yearly') {
    return Number((amount / 12).toFixed(2))
  }

  return Number(amount.toFixed(2))
}

function calculateAnnualCost(amount: number, billingCycle: 'weekly' | 'monthly' | 'yearly') {
  return Number((calculateMonthlyCost(amount, billingCycle) * 12).toFixed(2))
}

function calculateDaysUntilBilling(nextBillingDate: string) {
  const diffMs = new Date(nextBillingDate).getTime() - forecastAnchorDate.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function toManagedSubscription(input: {
  id: string
  name: string
  amount: number
  currency?: string
  billingCycle: 'weekly' | 'monthly' | 'yearly'
  nextBillingDate: string
  categoryId: string
  categoryLabel: string
  isActive: boolean
  notes?: string
}) {
  const amount = Number(Math.abs(input.amount).toFixed(2))

  return {
    id: input.id,
    name: input.name,
    amount,
    currency: input.currency || 'TRY',
    billingCycle: input.billingCycle,
    nextBillingDate: input.nextBillingDate,
    categoryId: input.categoryId,
    categoryLabel: input.categoryLabel,
    isActive: input.isActive,
    notes: input.notes,
    monthlyCost: calculateMonthlyCost(amount, input.billingCycle),
    annualCost: calculateAnnualCost(amount, input.billingCycle),
    daysUntilBilling: calculateDaysUntilBilling(input.nextBillingDate),
  }
}

export const defaultManagedSubscriptions = [
  toManagedSubscription({
    id: 'sub-1',
    name: 'Netflix',
    amount: 199.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-03-15T00:00:00.000Z',
    categoryId: 'subscription',
    categoryLabel: 'Abonelik',
    isActive: true,
    notes: '4K paket',
  }),
  toManagedSubscription({
    id: 'sub-2',
    name: 'iCloud+',
    amount: 129.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-03-18T00:00:00.000Z',
    categoryId: 'technology',
    categoryLabel: 'Teknoloji',
    isActive: true,
    notes: '200 GB plan',
  }),
]

export const defaultDetectedSubscriptions = [
  {
    id: 'detected-spotify',
    name: 'Spotify',
    amount: 59.99,
    frequency: 'monthly',
    categoryLabel: 'Abonelik',
    lastPayment: '2026-02-11T00:00:00.000Z',
    nextPayment: '2026-03-11T00:00:00.000Z',
    isActive: true,
    totalSpentYear: 719.88,
    matchSource: 'known',
    confidenceScore: 91,
    reasonCodes: ['known_merchant_match', 'cadence_stable', 'amount_consistent'],
  },
  {
    id: 'detected-adobe-cc',
    name: 'Adobe CC',
    amount: 399.99,
    frequency: 'monthly',
    categoryLabel: 'Work',
    lastPayment: '2026-02-20T00:00:00.000Z',
    nextPayment: '2026-03-20T00:00:00.000Z',
    isActive: true,
    totalSpentYear: 4799.88,
    matchSource: 'pattern',
    confidenceScore: 82,
    reasonCodes: ['recurring_pattern_detected', 'frequency_history_strong', 'frequency_stable'],
  },
]

type MockTransaction = (typeof defaultTransactions)[number]
type MockConnection = (typeof defaultConnections)[number]
type MockBudget = (typeof defaultBudgetStatus)[number]
type MockGoal = (typeof defaultSavingsGoals)[number]
type MockBill = (typeof defaultUpcomingBills)[number]
type ManagedSubscription = (typeof defaultManagedSubscriptions)[number]
type DetectedSubscription = (typeof defaultDetectedSubscriptions)[number]

function createJsonResponse(
  route: Route,
  body: unknown,
  status = 200,
  headers?: Record<string, string>
) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
    headers,
  })
}

function normalizePath(url: string) {
  const pathname = new URL(url).pathname
  return pathname.startsWith('/api/') ? pathname.slice(4) : pathname
}

function cloneTransactions(transactions = defaultTransactions) {
  return transactions.map((transaction) => ({ ...transaction, tags: [...transaction.tags] }))
}

function cloneConnections(connections = defaultConnections) {
  return connections.map((connection) => ({ ...connection }))
}

function cloneBudgets(budgets = defaultBudgetStatus) {
  return budgets.map((budget) => ({ ...budget }))
}

function cloneGoals(goals = defaultSavingsGoals) {
  return goals.map((goal) => ({ ...goal }))
}

function cloneBills(bills = defaultUpcomingBills) {
  return bills.map((bill) => ({ ...bill }))
}

function cloneManagedSubscriptions(subscriptions = defaultManagedSubscriptions) {
  return subscriptions.map((subscription) => ({ ...subscription }))
}

function cloneDetectedSubscriptions(subscriptions = defaultDetectedSubscriptions) {
  return subscriptions.map((subscription) => ({ ...subscription }))
}

function buildUploadPreviewTransactions(transactions = defaultUploadTransactions) {
  return transactions.map((transaction, index) => ({
    id: `preview-${index + 1}`,
    date: transaction.date,
    description: transaction.description,
    amount: Math.abs(Number(transaction.amount)),
    currency: transaction.currency,
    type: transaction.type,
    categoryId: transaction.categoryId,
    categoryLabel: transaction.categoryLabel,
    confidence: transaction.confidence,
    tags: [...transaction.tags],
    notes: 'Parsed from mart-ekstre.pdf',
  }))
}

function applyTransactionFilters(
  transactions: Array<(typeof defaultTransactions)[number]>,
  searchParams: URLSearchParams,
) {
  return transactions.filter((transaction) => {
    if (searchParams.get('type') && transaction.type !== searchParams.get('type')) {
      return false
    }

    if (searchParams.get('categoryId') && transaction.categoryId !== searchParams.get('categoryId')) {
      return false
    }

    if (searchParams.get('source') && transaction.source !== searchParams.get('source')) {
      return false
    }

    const search = searchParams.get('search')?.toLowerCase()
    if (
      search &&
      !transaction.description.toLowerCase().includes(search) &&
      !transaction.categoryLabel.toLowerCase().includes(search)
    ) {
      return false
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom && new Date(transaction.date) < new Date(dateFrom)) {
      return false
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo && new Date(transaction.date) > new Date(`${dateTo}T23:59:59.999Z`)) {
      return false
    }

    const absAmount = Math.abs(Number(transaction.amount))
    const minAmount = searchParams.get('minAmount')
    if (minAmount && absAmount < Number(minAmount)) {
      return false
    }

    const maxAmount = searchParams.get('maxAmount')
    if (maxAmount && absAmount > Number(maxAmount)) {
      return false
    }

    return true
  })
}

function buildSummary(transactions: Array<(typeof defaultTransactions)[number]>) {
  const incomeTransactions = transactions.filter((transaction) => transaction.type === 'income')
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense')

  const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)

  const categoryTotals = expenseTransactions.reduce<Record<string, { total: number; count: number }>>((acc, transaction) => {
    const current = acc[transaction.categoryId] || { total: 0, count: 0 }
    current.total += Math.abs(Number(transaction.amount))
    current.count += 1
    acc[transaction.categoryId] = current
    return acc
  }, {})

  const topCategories = Object.entries(categoryTotals).map(([categoryId, value]) => {
    const transaction = expenseTransactions.find((item) => item.categoryId === categoryId)
    return {
      categoryId,
      categoryLabel: transaction?.categoryLabel || categoryId,
      total: value.total,
      percentage: totalExpense > 0 ? Number(((value.total / totalExpense) * 100).toFixed(1)) : 0,
      transactionCount: value.count,
      trend: 'stable',
    }
  })

  return {
    period: {
      month: 'Mart',
      year: 2026,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    },
    comparison: {
      previousMonth: {
        income: 78000,
        expense: 26000,
      },
      changePercentage: {
        income: 8.9,
        expense: -4.5,
      },
    },
    topCategories,
    weeklyTrend: [
      { week: '1. Hafta', income: 85000, expense: 14000 },
      { week: '2. Hafta', income: 0, expense: 12000 },
      { week: '3. Hafta', income: 0, expense: 9000 },
      { week: '4. Hafta', income: 0, expense: 7500 },
    ],
    recurringPayments: [
      {
        id: 'rec-1',
        description: 'Netflix',
        amount: 199.99,
        currency: 'TRY',
        frequency: 'monthly',
        categoryLabel: 'Abonelik',
        lastDate: '2026-02-15',
        nextDate: '2026-03-15',
        isActive: true,
      },
    ],
  }
}

function buildSubscriptionSummary(
  subscriptions: ManagedSubscription[],
  detectedSuggestions: DetectedSubscription[],
) {
  const filteredDetected = detectedSuggestions.filter((suggestion) => {
    const suggestionName = normalizeName(suggestion.name)
    return !subscriptions.some((subscription) => normalizeName(subscription.name) === suggestionName)
  })

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.isActive)
  const totalMonthly = Number(
    activeSubscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0).toFixed(2),
  )
  const totalYearly = Number(
    activeSubscriptions.reduce((sum, subscription) => sum + subscription.annualCost, 0).toFixed(2),
  )

  return {
    subscriptions,
    detectedSuggestions: filteredDetected,
    totalMonthly,
    totalYearly,
    activeCount: activeSubscriptions.length,
    upcomingPayments: activeSubscriptions
      .slice()
      .sort(
        (left, right) => new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime(),
      )
      .slice(0, 5)
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        amount: subscription.amount,
        currency: subscription.currency,
        date: subscription.nextBillingDate,
      })),
    savingsOpportunities: activeSubscriptions
      .slice()
      .sort((left, right) => right.monthlyCost - left.monthlyCost)
      .slice(0, 3)
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        monthlyCost: subscription.monthlyCost,
      })),
  }
}

function buildCashFlowForecast(
  transactions: MockTransaction[],
  bills: MockBill[],
  subscriptions: ManagedSubscription[],
  days: number,
) {
  const horizonDays = Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 30
  const now = new Date(forecastAnchorDate)
  const horizonEnd = new Date(now)
  horizonEnd.setDate(horizonEnd.getDate() + horizonDays)
  const recentStart = new Date(now)
  recentStart.setDate(recentStart.getDate() - 29)
  const monthStart = new Date(Date.UTC(2026, 2, 1, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(2026, 2, 31, 23, 59, 59))

  const recentTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date)
    return date >= recentStart && date <= now
  })

  const monthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date)
    return date >= monthStart && date <= now
  })

  const upcomingEvents = [
    ...bills
      .filter((bill) => !bill.isPaid)
      .filter((bill) => {
        const dueDate = new Date(bill.dueDate)
        return dueDate >= now && dueDate <= horizonEnd
      })
      .map((bill) => ({
        id: `bill-${bill.id}`,
        label: bill.name,
        amount: Math.abs(Number(bill.amount)),
        currency: bill.currency,
        dueDate: bill.dueDate,
        source: 'bill' as const,
        categoryLabel: bill.categoryLabel,
      })),
    ...subscriptions
      .filter((subscription) => subscription.isActive)
      .filter((subscription) => {
        const dueDate = new Date(subscription.nextBillingDate)
        return dueDate >= now && dueDate <= horizonEnd
      })
      .map((subscription) => ({
        id: `subscription-${subscription.id}`,
        label: subscription.name,
        amount: Math.abs(Number(subscription.amount)),
        currency: subscription.currency,
        dueDate: subscription.nextBillingDate,
        source: 'subscription' as const,
        categoryLabel: subscription.categoryLabel,
      })),
  ].sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())

  const currentBalance = monthTransactions.reduce((sum, transaction) => {
    if (transaction.type === 'income') {
      return sum + Math.abs(Number(transaction.amount))
    }

    return sum - Math.abs(Number(transaction.amount))
  }, 0)

  const recentExpenseTotal = recentTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)

  const averageDailyExpense = recentExpenseTotal / 30
  const committedExpenses = upcomingEvents.reduce((sum, event) => sum + event.amount, 0)
  const daysRemainingInMonth = Math.max(
    0,
    Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const projectedVariableExpenses = Number((averageDailyExpense * daysRemainingInMonth).toFixed(2))
  const projectedEndBalance = Number((currentBalance - committedExpenses - projectedVariableExpenses).toFixed(2))
  const bufferTarget = Number((averageDailyExpense * 7).toFixed(2))

  let health: 'stable' | 'watch' | 'critical' = 'stable'
  if (projectedEndBalance < 0) {
    health = 'critical'
  } else if (projectedEndBalance < bufferTarget) {
    health = 'watch'
  }

  const runwayDays =
    averageDailyExpense > 0
      ? Math.max(0, Math.floor((currentBalance - committedExpenses) / averageDailyExpense))
      : null

  return {
    days: horizonDays,
    currentBalance: Number(currentBalance.toFixed(2)),
    averageDailyExpense: Number(averageDailyExpense.toFixed(2)),
    committedExpenses: Number(committedExpenses.toFixed(2)),
    projectedVariableExpenses,
    projectedEndBalance,
    bufferTarget,
    health,
    runwayDays,
    upcomingEvents: upcomingEvents.slice(0, 6),
  }
}

function parseJson<T>(route: Route): T {
  return JSON.parse(route.request().postData() || '{}') as T
}

export async function seedAuthenticatedSession(page: Page) {
  await page.context().addCookies([
    {
      name: 'access_token',
      value: authToken,
      url: baseUrl,
    },
    {
      name: 'refresh_token',
      value: 'e2e-refresh-token',
      url: baseUrl,
    },
  ])
}

export async function mockAppRoutes(
  page: Page,
  options?: {
    loginSuccess?: boolean
    registerSuccess?: boolean
    transactions?: MockTransaction[]
    connections?: MockConnection[]
    budgets?: MockBudget[]
    goals?: MockGoal[]
    bills?: MockBill[]
    subscriptions?: ManagedSubscription[]
    detectedSubscriptions?: DetectedSubscription[]
  },
) {
  let transactions = cloneTransactions(options?.transactions)
  let connections = cloneConnections(options?.connections)
  let budgets = cloneBudgets(options?.budgets)
  let goals = cloneGoals(options?.goals)
  let bills = cloneBills(options?.bills)
  let subscriptions = cloneManagedSubscriptions(options?.subscriptions)
  let detectedSubscriptions = cloneDetectedSubscriptions(options?.detectedSubscriptions)
  let previewCallCount = 0
  const connectionIdByState = new Map<string, string>()

  await page.route('**/*', async (route) => {
    const request = route.request()

    if (request.resourceType() === 'document') {
      return route.continue()
    }

    const method = request.method()
    const path = normalizePath(request.url())
    const url = new URL(request.url())

    if (path === '/auth/login' && method === 'POST') {
      if (options?.loginSuccess === false) {
        return createJsonResponse(route, { message: 'Login failed' }, 401)
      }

      await page.context().addCookies([
        {
          name: 'access_token',
          value: authToken,
          url: baseUrl,
        },
        {
          name: 'refresh_token',
          value: 'e2e-refresh-token',
          url: baseUrl,
        },
      ])

      return createJsonResponse(
        route,
        {
          accessToken: authToken,
          refreshToken: 'e2e-refresh-token',
          expiresIn: 3600,
          user: mockUser,
        },
        200,
        {
          'set-cookie':
            'access_token=e2e-token; Path=/; SameSite=Lax, refresh_token=e2e-refresh-token; Path=/; SameSite=Lax',
          'access-control-allow-credentials': 'true',
        },
      )
    }

    if (path === '/auth/register' && method === 'POST') {
      if (options?.registerSuccess === false) {
        return createJsonResponse(route, { message: 'Registration failed' }, 400)
      }

      const body = parseJson<{ email?: string; name?: string }>(route)
      return createJsonResponse(route, {
        ...mockUser,
        email: body.email || mockUser.email,
        name: body.name || mockUser.name,
      })
    }

    if (path === '/auth/me' && method === 'GET') {
      const cookieHeader = request.headers()['cookie'] || ''
      const isAuthenticated = cookieHeader.includes('access_token=')
      return createJsonResponse(route, isAuthenticated ? mockUser : { message: 'Unauthorized' }, isAuthenticated ? 200 : 401)
    }

    if (path === '/auth/refresh' && method === 'POST') {
      const cookieHeader = request.headers()['cookie'] || ''
      const hasRefreshToken = cookieHeader.includes('refresh_token=')

      if (!hasRefreshToken) {
        return createJsonResponse(route, { message: 'Unauthorized' }, 401)
      }

      await page.context().addCookies([
        {
          name: 'access_token',
          value: authToken,
          url: baseUrl,
        },
        {
          name: 'refresh_token',
          value: 'e2e-refresh-token',
          url: baseUrl,
        },
      ])

      return createJsonResponse(
        route,
        {
          accessToken: authToken,
          refreshToken: 'e2e-refresh-token',
          expiresIn: 3600,
          user: mockUser,
        },
        200,
        {
          'set-cookie':
            'access_token=e2e-token; Path=/; SameSite=Lax, refresh_token=e2e-refresh-token; Path=/; SameSite=Lax',
          'access-control-allow-credentials': 'true',
        },
      )
    }

    if (path === '/auth/logout' && method === 'POST') {
      await page.context().clearCookies()
      return createJsonResponse(
        route,
        { message: 'Logout successful' },
        200,
        {
          'set-cookie':
            'access_token=; Path=/; Max-Age=0; SameSite=Lax, refresh_token=; Path=/; Max-Age=0; SameSite=Lax',
          'access-control-allow-credentials': 'true',
        },
      )
    }

    if (path === '/transactions/summary' && method === 'GET') {
      return createJsonResponse(route, buildSummary(transactions))
    }

    if (path === '/transactions/cash-flow' && method === 'GET') {
      const days = Number(url.searchParams.get('days') || '30')
      return createJsonResponse(route, buildCashFlowForecast(transactions, bills, subscriptions, days))
    }

    if (path === '/transactions' && method === 'GET') {
      return createJsonResponse(route, applyTransactionFilters(transactions, url.searchParams))
    }

    if (path === '/uploads/pdf/preview' && method === 'POST') {
      previewCallCount += 1

      if (previewCallCount === 2) {
        return createJsonResponse(route, { message: 'PDF preview failed' }, 503)
      }

      const previewTransactions = buildUploadPreviewTransactions()

      return createJsonResponse(route, {
        success: true,
        filename: 'mart-ekstre.pdf',
        fileHash: 'preview-file-hash',
        fileSize: 4096,
        totalParsed: previewTransactions.length,
        lowConfidenceCount: 1,
        errors: ['1 satir kategori guveni dusuk oldugu icin on inceleme sirasina alindi.'],
        suggestions: ['Dusuk guvenli satirlari duzeltip sonra importu onaylayin.'],
        transactions: previewTransactions,
      })
    }

    if (path === '/uploads/pdf/confirm' && method === 'POST') {
      const body = parseJson<{
        filename: string
        totalParsed: number
        transactions: Array<{
          id: string
          date: string
          description: string
          amount: number
          currency: string
          type: 'income' | 'expense'
          categoryId: string
          categoryLabel: string
          confidence: number
          tags: string[]
          notes?: string
        }>
      }>(route)

      const savedTransactions = body.transactions.map((transaction, index) => ({
        id: `tx-upload-confirmed-${index + 1}`,
        date: transaction.date,
        description: transaction.description,
        amount:
          transaction.type === 'expense'
            ? -Math.abs(Number(transaction.amount))
            : Math.abs(Number(transaction.amount)),
        currency: transaction.currency,
        type: transaction.type,
        categoryId: transaction.categoryId,
        categoryLabel: transaction.categoryLabel,
        source: 'pdf',
        confidence: transaction.confidence,
        tags: transaction.tags,
        notes: transaction.notes,
        createdAt: transaction.date,
        updatedAt: transaction.date,
      }))

      transactions = [...savedTransactions, ...transactions]

      return createJsonResponse(route, {
        success: true,
        filename: body.filename,
        totalParsed: body.totalParsed || savedTransactions.length,
        totalSaved: savedTransactions.length,
        lowConfidenceCount: savedTransactions.filter((transaction) => transaction.confidence < 70).length,
        errors: ['1 satir review ekraninda takibe alindi.'],
        suggestions: ['PDF kaynakli islemler transactions ekranindan toplu duzenlenebilir.'],
        transactions: savedTransactions,
      })
    }

    if (path === '/uploads/pdf' && method === 'POST') {
      const uploadTransactions = cloneTransactions(defaultUploadTransactions as unknown as MockTransaction[])
      transactions = [...uploadTransactions, ...transactions]

      return createJsonResponse(route, {
        success: true,
        filename: 'mart-ekstre.pdf',
        totalParsed: uploadTransactions.length,
        totalSaved: uploadTransactions.length,
        lowConfidenceCount: 1,
        errors: ['1 satir kategori guveni dusuk oldugu icin kontrol sirasina alindi.'],
        suggestions: [
          'Dusuk guvenli satirlari once kontrol edin.',
          'Import sonrasi PDF filtreli islem ekraninda toplu duzenleme yapabilirsiniz.',
        ],
        transactions: uploadTransactions,
      })
    }

    if (path === '/transactions/duplicates' && method === 'GET') {
      return createJsonResponse(route, [])
    }

    if (path === '/transactions/suggestions' && method === 'GET') {
      return createJsonResponse(route, [])
    }

    if (path === '/transactions/bulk-categorize' && method === 'POST') {
      const body = parseJson<{
        transactionIds: string[]
        categoryId: string
        categoryLabel: string
        applyToSimilar?: boolean
      }>(route)

      const selectedIds = new Set(body.transactionIds || [])
      const selectedTransactions = transactions.filter((transaction) => selectedIds.has(transaction.id))
      const similarityKeys = new Set(
        selectedTransactions
          .map((transaction) => normalizeMerchantKey(transaction.description))
          .filter(Boolean),
      )

      transactions = transactions.map((transaction) =>
        selectedIds.has(transaction.id) ||
        (body.applyToSimilar &&
          selectedTransactions.some((selected) => selected.type === transaction.type) &&
          similarityKeys.has(normalizeMerchantKey(transaction.description)))
          ? {
              ...transaction,
              categoryId: body.categoryId,
              categoryLabel: body.categoryLabel,
              updatedAt: forecastAnchorDate.toISOString(),
            }
          : transaction,
      )

      const updated = transactions.filter(
        (transaction) =>
          transaction.categoryId === body.categoryId &&
          transaction.categoryLabel === body.categoryLabel &&
          (
            selectedIds.has(transaction.id) ||
            (body.applyToSimilar &&
              selectedTransactions.some((selected) => selected.type === transaction.type) &&
              similarityKeys.has(normalizeMerchantKey(transaction.description)))
          ),
      ).length

      return createJsonResponse(route, {
        updated,
        matchedSimilar: Math.max(0, updated - selectedIds.size),
      })
    }

    if (path === '/transactions/bulk-update' && method === 'POST') {
      const body = parseJson<{
        transactionIds: string[]
        categoryId?: string
        categoryLabel?: string
        type?: 'income' | 'expense'
        tags?: string[]
        applyToSimilar?: boolean
      }>(route)

      const selectedIds = new Set(body.transactionIds || [])
      const selectedTransactions = transactions.filter((transaction) => selectedIds.has(transaction.id))
      const similarityKeys = new Set(
        selectedTransactions
          .map((transaction) => normalizeMerchantKey(transaction.description))
          .filter(Boolean),
      )

      transactions = transactions.map((transaction) => {
        const shouldUpdate =
          selectedIds.has(transaction.id) ||
          (body.applyToSimilar &&
            selectedTransactions.some((selected) => selected.type === transaction.type) &&
            similarityKeys.has(normalizeMerchantKey(transaction.description)))

        if (!shouldUpdate) {
          return transaction
        }

        return {
          ...transaction,
          categoryId: body.categoryId ?? transaction.categoryId,
          categoryLabel: body.categoryLabel ?? transaction.categoryLabel,
          type: body.type ?? transaction.type,
          tags: body.tags ?? transaction.tags,
          updatedAt: forecastAnchorDate.toISOString(),
        }
      })

      const updated = transactions.filter((transaction) => {
        const isSelected = selectedIds.has(transaction.id)
        const isSimilarMatch =
          !!body.applyToSimilar &&
          selectedTransactions.some((selected) => selected.type === transaction.type) &&
          similarityKeys.has(normalizeMerchantKey(transaction.description))

        return isSelected || isSimilarMatch
      }).length

      return createJsonResponse(route, {
        updated,
        matchedSimilar: Math.max(0, updated - selectedIds.size),
      })
    }

    if (path === '/budgets/status' && method === 'GET') {
      return createJsonResponse(route, budgets)
    }

    if (path === '/savings-goals' && method === 'GET') {
      return createJsonResponse(route, goals)
    }

    if (path === '/bills/upcoming' && method === 'GET') {
      return createJsonResponse(route, bills)
    }

    if (path.match(/^\/bills\/[^/]+\/mark-paid$/) && method === 'PATCH') {
      const billId = path.split('/')[2]
      bills = bills.map((bill) =>
        bill.id === billId
          ? {
              ...bill,
              isPaid: true,
            }
          : bill,
      )
      return createJsonResponse(route, bills.find((bill) => bill.id === billId))
    }

    if (path === '/subscriptions' && method === 'GET') {
      return createJsonResponse(route, subscriptions)
    }

    if (path === '/subscriptions/detected' && method === 'GET') {
      return createJsonResponse(route, buildSubscriptionSummary(subscriptions, detectedSubscriptions).detectedSuggestions)
    }

    if (path === '/subscriptions/summary' && method === 'GET') {
      return createJsonResponse(route, buildSubscriptionSummary(subscriptions, detectedSubscriptions))
    }

    if (path === '/subscriptions' && method === 'POST') {
      const body = parseJson<{
        name: string
        amount: number
        currency?: string
        billingCycle?: 'weekly' | 'monthly' | 'yearly'
        nextBillingDate: string
        categoryId?: string
        categoryLabel?: string
        notes?: string
        isActive?: boolean
      }>(route)

      const createdSubscription = toManagedSubscription({
        id: `sub-${subscriptions.length + 1}`,
        name: body.name,
        amount: body.amount,
        currency: body.currency || 'TRY',
        billingCycle: body.billingCycle || 'monthly',
        nextBillingDate: body.nextBillingDate,
        categoryId: body.categoryId || 'subscription',
        categoryLabel: body.categoryLabel || 'Abonelik',
        isActive: body.isActive ?? true,
        notes: body.notes,
      })

      subscriptions = [createdSubscription, ...subscriptions]
      detectedSubscriptions = detectedSubscriptions.filter(
        (subscription) => normalizeName(subscription.name) !== normalizeName(createdSubscription.name),
      )

      return createJsonResponse(route, createdSubscription, 201)
    }

    if (path === '/subscriptions/dismiss' && method === 'POST') {
      const body = parseJson<{
        name: string
      }>(route)

      detectedSubscriptions = detectedSubscriptions.filter(
        (subscription) => normalizeName(subscription.name) !== normalizeName(body.name),
      )

      return createJsonResponse(route, { success: true })
    }

    if (path.match(/^\/subscriptions\/detected\/[^/]+\/feedback$/) && method === 'POST') {
      const detectedId = path.split('/')[3]
      const body = parseJson<{
        status: 'confirmed' | 'rejected'
      }>(route)

      if (body.status === 'rejected') {
        detectedSubscriptions = detectedSubscriptions.filter(
          (subscription) => subscription.id !== detectedId,
        )
      }

      return createJsonResponse(route, {
        success: true,
        fingerprint: detectedId.replace(/^detected-/, ''),
        status: body.status,
      })
    }

    if (path.match(/^\/subscriptions\/[^/]+$/) && method === 'PATCH') {
      const subscriptionId = path.split('/')[2]
      const body = parseJson<Partial<ManagedSubscription>>(route)
      const existing = subscriptions.find((subscription) => subscription.id === subscriptionId)

      if (!existing) {
        return createJsonResponse(route, { message: 'Not found' }, 404)
      }

      const updatedSubscription = toManagedSubscription({
        id: existing.id,
        name: body.name || existing.name,
        amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
        currency: body.currency || existing.currency,
        billingCycle: (body.billingCycle as 'weekly' | 'monthly' | 'yearly') || existing.billingCycle,
        nextBillingDate: body.nextBillingDate || existing.nextBillingDate,
        categoryId: body.categoryId || existing.categoryId,
        categoryLabel: body.categoryLabel || existing.categoryLabel,
        isActive: body.isActive ?? existing.isActive,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      })

      subscriptions = subscriptions.map((subscription) =>
        subscription.id === subscriptionId ? updatedSubscription : subscription,
      )

      return createJsonResponse(route, updatedSubscription)
    }

    if (path.match(/^\/subscriptions\/[^/]+$/) && method === 'DELETE') {
      const subscriptionId = path.split('/')[2]
      subscriptions = subscriptions.filter((subscription) => subscription.id !== subscriptionId)
      return createJsonResponse(route, { success: true })
    }

    if (path === '/transactions/manual' && method === 'POST') {
      const body = parseJson<{
        description: string
        amount: number
        type: 'income' | 'expense'
        date: string
      }>(route)

      const amount = body.type === 'expense' ? -Math.abs(Number(body.amount)) : Math.abs(Number(body.amount))
      const createdTransaction = {
        id: `tx-${transactions.length + 1}`,
        date: `${body.date}T12:00:00.000Z`,
        description: body.description,
        amount,
        currency: 'TRY',
        type: body.type,
        categoryId: body.type === 'income' ? 'salary' : 'other',
        categoryLabel: body.type === 'income' ? 'Maas' : 'Diger',
        source: 'manual',
        confidence: 100,
        tags: [],
        createdAt: `${body.date}T12:00:00.000Z`,
        updatedAt: `${body.date}T12:00:00.000Z`,
      }

      transactions = [createdTransaction, ...transactions]
      return createJsonResponse(route, createdTransaction, 201)
    }

    if (path === '/ai/insights' && method === 'GET') {
      return createJsonResponse(route, [])
    }

    if (path === '/ai/anomalies' && method === 'GET') {
      return createJsonResponse(route, {
        totalAnomalies: 0,
        riskScore: 12,
        recentAnomalies: [],
      })
    }

    if (path === '/ai-analytics/health' && method === 'GET') {
      return createJsonResponse(route, { data: defaultFinancialHealth })
    }

    if (path === '/ai-analytics/anomalies' && method === 'GET') {
      return createJsonResponse(route, { data: defaultAnomalies })
    }

    if (path === '/bank-connections' && method === 'GET') {
      return createJsonResponse(route, connections)
    }

    if (path === '/bank-connections/banks' && method === 'GET') {
      return createJsonResponse(route, availableBanks)
    }

    if (path === '/bank-connections/connect/start' && method === 'POST') {
      const body = parseJson<{
        bankCode: string
        bankName?: string
        accountNumber?: string
        accountName?: string
      }>(route)

      const state = `state-${body.bankCode}-${connections.length + 1}`

      const pendingConnection = {
        id: `conn-${connections.length + 1}`,
        bankCode: body.bankCode,
        bankName: body.bankName || body.bankCode,
        accountNumber: body.accountNumber || '',
        accountName: body.accountName || 'Yeni Hesap',
        accountType: 'checking',
        expiresAt: undefined,
        lastSyncAt: undefined,
        lastSyncStatus: 'pending',
        lifecycleState: 'pending_consent',
        syncError: null,
        errorReason: null,
        providerErrorCode: null,
        lastConsentAt: undefined,
        reauthRequiredAt: null,
        isActive: true,
      }

      connections = [...connections, pendingConnection]
      connectionIdByState.set(state, pendingConnection.id)

      return createJsonResponse(route, {
        connectionId: pendingConnection.id,
        state,
        lifecycleState: 'pending_consent',
        redirectUrl: `${baseUrl}/bank-connections?bankCode=${body.bankCode}&state=${state}&code=${body.bankCode}-sandbox-code`,
      })
    }

    if (path === '/bank-connections/connect/callback' && method === 'GET') {
      const bankCode = url.searchParams.get('bankCode') || 'akbank'
      const state = url.searchParams.get('state') || ''
      const connectionId = connectionIdByState.get(state)
      const currentConnection =
        (connectionId ? connections.find((connection) => connection.id === connectionId) : null) ||
        [...connections]
          .reverse()
          .find((connection) => connection.bankCode === bankCode && connection.lifecycleState === 'pending_consent') ||
        [...connections]
          .reverse()
          .find((connection) => connection.bankCode === bankCode && connection.lifecycleState === 'connected')

      const updatedConnection = {
        ...(currentConnection || {
          id: connectionId || `conn-${connections.length + 1}`,
          bankCode,
          bankName: availableBanks.find((bank) => bank.code === bankCode)?.name || bankCode,
          accountNumber: `TR-${bankCode}-001`,
          accountName: 'Yeni Hesap',
          accountType: 'checking',
          isActive: true,
        }),
        bankName:
          currentConnection?.bankName ||
          availableBanks.find((bank) => bank.code === bankCode)?.name ||
          bankCode,
        accountNumber: currentConnection?.accountNumber || `TR-${bankCode}-001`,
        accountName: currentConnection?.accountName || 'Yeni Hesap',
        expiresAt: '2026-03-30T12:00:00.000Z',
        lastSyncAt: undefined,
        lastSyncStatus: 'pending',
        lifecycleState: 'connected',
        syncError: null,
        errorReason: null,
        providerErrorCode: null,
        lastConsentAt: '2026-03-10T09:00:00.000Z',
        reauthRequiredAt: null,
      }

      connections = connections.map((connection) =>
        connection.id === updatedConnection.id ? updatedConnection : connection,
      )

      if (!connections.some((connection) => connection.id === updatedConnection.id)) {
        connections = [...connections, updatedConnection]
      }

      connectionIdByState.delete(state)

      return createJsonResponse(route, {
        ...updatedConnection,
        state,
      })
    }

    if (path === '/bank-connections' && method === 'POST') {
      const body = parseJson<{
        bankCode: string
        bankName: string
        accountNumber?: string
        accountName?: string
      }>(route)

      const newConnection = {
        id: `conn-${connections.length + 1}`,
        bankCode: body.bankCode,
        bankName: body.bankName,
        accountNumber: body.accountNumber || '',
        accountName: body.accountName || 'Yeni Hesap',
        accountType: 'checking',
        lastSyncAt: undefined,
        lastSyncStatus: 'pending',
        isActive: true,
      }

      connections = [...connections, newConnection]
      return createJsonResponse(route, newConnection, 201)
    }

    if (path.match(/^\/bank-connections\/[^/]+\/reconnect$/) && method === 'POST') {
      const connectionId = path.split('/')[2]
      const connection = connections.find((item) => item.id === connectionId)
      const state = `reauth-${connectionId}`

      connections = connections.map((item) =>
        item.id === connectionId
          ? {
              ...item,
              lifecycleState: 'pending_consent',
              lastSyncStatus: 'reauth_required',
              errorReason: null,
              syncError: null,
            }
          : item,
      )
      connectionIdByState.set(state, connectionId)

      return createJsonResponse(route, {
        connectionId,
        state,
        lifecycleState: 'pending_consent',
        redirectUrl: `${baseUrl}/bank-connections?bankCode=${connection?.bankCode || 'akbank'}&state=${state}&code=reauth-code`,
      })
    }

    if (path.match(/^\/bank-connections\/[^/]+\/sync$/) && method === 'POST') {
      const connectionId = path.split('/')[2]
      connections = connections.map((connection) =>
        connection.id === connectionId
          ? {
              ...connection,
              lifecycleState: 'connected',
              lastSyncStatus: 'success',
              lastSyncAt: '2026-03-11T08:00:00.000Z',
              errorReason: null,
              syncError: null,
            }
          : connection,
      )
      return createJsonResponse(route, { success: true })
    }

    if (path.match(/^\/bank-connections\/[^/]+$/) && method === 'DELETE') {
      const connectionId = path.split('/').pop()
      connections = connections.filter((connection) => connection.id !== connectionId)
      return createJsonResponse(route, { success: true })
    }

    return route.continue()
  })
}
