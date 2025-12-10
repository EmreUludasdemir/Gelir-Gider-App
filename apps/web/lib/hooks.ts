'use client'

import useSWR from 'swr'
import { fetcher, DashboardSummary, Transaction, Suggestion, RecurringPayment } from './api'

export function useTransactions(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  return useSWR<Transaction[]>(
    `/transactions${params ? `?${params}` : ''}`,
    fetcher,
    { refreshInterval: 30000 }
  )
}

export function useSummary(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  return useSWR<DashboardSummary>(
    `/transactions/summary${params ? `?${params}` : ''}`,
    fetcher,
    { refreshInterval: 60000 }
  )
}

export function useSuggestions() {
  return useSWR<Suggestion[]>('/transactions/suggestions', fetcher)
}

export function useRecurring() {
  return useSWR<RecurringPayment[]>('/transactions/recurring', fetcher)
}

export function useRefreshAll() {
  const { mutate: mutateTransactions } = useTransactions()
  const { mutate: mutateSummary } = useSummary()
  const { mutate: mutateSuggestions } = useSuggestions()

  return async () => {
    await Promise.all([
      mutateTransactions(),
      mutateSummary(),
      mutateSuggestions(),
    ])
  }
}
