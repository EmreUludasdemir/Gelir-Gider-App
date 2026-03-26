'use client'

import useSWR from 'swr'
import { useAuth } from '@/components/auth-provider'
import {
  fetcher,
  DashboardSummary,
  Transaction,
  Suggestion,
  RecurringPayment,
  DuplicateGroup,
  Budget,
  SavingsGoal,
  Bill,
  ManagedSubscription,
  DetectedSubscription,
  SubscriptionSummary,
  CashFlowForecast,
  SavingsAction,
  Household,
} from './api'

function useProtectedKey(path: string | null) {
  const { isAuthenticated, loading } = useAuth()
  if (loading || !isAuthenticated) {
    return null
  }
  return path
}

export function useTransactions(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  const key = useProtectedKey(`/transactions${params ? `?${params}` : ''}`)
  return useSWR<Transaction[]>(key, fetcher, { refreshInterval: 30000 })
}

export function useSummary(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  const key = useProtectedKey(`/transactions/summary${params ? `?${params}` : ''}`)
  return useSWR<DashboardSummary>(key, fetcher, { refreshInterval: 60000 })
}

export function useSuggestions() {
  return useSWR<Suggestion[]>(useProtectedKey('/transactions/suggestions'), fetcher)
}

export function useRecurring() {
  return useSWR<RecurringPayment[]>(useProtectedKey('/transactions/recurring'), fetcher)
}

export function useDuplicateGroups(options?: {
  days?: number
  windowDays?: number
  amountTolerance?: number
}) {
  const params = new URLSearchParams()
  if (options?.days) params.set('days', options.days.toString())
  if (options?.windowDays) params.set('windowDays', options.windowDays.toString())
  if (options?.amountTolerance !== undefined) {
    params.set('amountTolerance', options.amountTolerance.toString())
  }
  const query = params.toString()
  const key = useProtectedKey(`/transactions/duplicates${query ? `?${query}` : ''}`)
  return useSWR<DuplicateGroup[]>(key, fetcher, { refreshInterval: 60000 })
}

export function useBudgetStatus() {
  return useSWR<Budget[]>(useProtectedKey('/budgets/status'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useSavingsGoals() {
  return useSWR<SavingsGoal[]>(useProtectedKey('/savings-goals'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useUpcomingBills(days = 14) {
  return useSWR<Bill[]>(useProtectedKey(`/bills/upcoming?days=${days}`), fetcher, {
    refreshInterval: 60000,
  })
}

export function useSubscriptions() {
  return useSWR<ManagedSubscription[]>(useProtectedKey('/subscriptions'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useDetectedSubscriptions() {
  return useSWR<DetectedSubscription[]>(useProtectedKey('/subscriptions/detected'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useSubscriptionSummary() {
  return useSWR<SubscriptionSummary>(useProtectedKey('/subscriptions/summary'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useCashFlowForecast(days = 30) {
  return useSWR<CashFlowForecast>(useProtectedKey(`/transactions/cash-flow?days=${days}`), fetcher, {
    refreshInterval: 60000,
  })
}

export function useSavingsActions() {
  return useSWR<SavingsAction[]>(useProtectedKey('/analytics/savings-actions'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useHouseholds() {
  return useSWR<Household[]>(useProtectedKey('/households'), fetcher, {
    refreshInterval: 60000,
  })
}

export function useRefreshAll() {
  const { mutate: mutateTransactions } = useTransactions()
  const { mutate: mutateSummary } = useSummary()
  const { mutate: mutateSuggestions } = useSuggestions()
  const { mutate: mutateSubscriptions } = useSubscriptionSummary()
  const { mutate: mutateCashFlow } = useCashFlowForecast()
  const { mutate: mutateSavingsActions } = useSavingsActions()
  const { mutate: mutateHouseholds } = useHouseholds()

  return async () => {
    await Promise.all([
      mutateTransactions(),
      mutateSummary(),
      mutateSuggestions(),
      mutateSubscriptions(),
      mutateCashFlow(),
      mutateSavingsActions(),
      mutateHouseholds(),
    ])
  }
}
