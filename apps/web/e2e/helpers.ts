import type { Page, Route } from '@playwright/test'

const testPort = process.env.PLAYWRIGHT_TEST_PORT || '3100'
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://127.0.0.1:${testPort}`
const authToken = 'e2e-token'

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
]

export const defaultConnections = [
  {
    id: 'conn-1',
    bankCode: 'akbank',
    bankName: 'Akbank',
    accountNumber: 'TR00 0000',
    accountName: 'Ana Hesap',
    accountType: 'checking',
    lastSyncAt: '2026-03-06T10:00:00.000Z',
    lastSyncStatus: 'success',
    isActive: true,
  },
]

export const availableBanks = [
  { code: 'akbank', name: 'Akbank' },
  { code: 'garanti', name: 'Garanti BBVA' },
  { code: 'mock', name: 'Demo Banka' },
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
    transactions?: Array<(typeof defaultTransactions)[number]>
    connections?: typeof defaultConnections
    budgets?: typeof defaultBudgetStatus
    goals?: typeof defaultSavingsGoals
    bills?: typeof defaultUpcomingBills
  },
) {
  let transactions = cloneTransactions(options?.transactions)
  let connections = (options?.connections || defaultConnections).map((connection) => ({ ...connection }))
  let budgets = (options?.budgets || defaultBudgetStatus).map((budget) => ({ ...budget }))
  let goals = (options?.goals || defaultSavingsGoals).map((goal) => ({ ...goal }))
  let bills = (options?.bills || defaultUpcomingBills).map((bill) => ({ ...bill }))

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

    if (path === '/transactions' && method === 'GET') {
      return createJsonResponse(route, applyTransactionFilters(transactions, url.searchParams))
    }

    if (path === '/transactions/duplicates' && method === 'GET') {
      return createJsonResponse(route, [])
    }

    if (path === '/transactions/suggestions' && method === 'GET') {
      return createJsonResponse(route, [])
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

    if (path === '/transactions/manual' && method === 'POST') {
      const body = parseJson<{
        description: string
        amount: number
        type: 'income' | 'expense'
        date: string
      }>(route)

      const createdTransaction = {
        id: `tx-${transactions.length + 1}`,
        date: `${body.date}T12:00:00.000Z`,
        description: body.description,
        amount: body.amount,
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

    if (path.match(/^\/bank-connections\/[^/]+\/sync$/) && method === 'POST') {
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
