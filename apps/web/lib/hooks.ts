'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { fetcher, DashboardSummary, Transaction, Suggestion, RecurringPayment, DuplicateGroup } from './api'

// Hook to get token reactively
function useToken() {
  const [token, setToken] = useState<string | null>(null)
  
  useEffect(() => {
    // Check token immediately and on storage changes
    const checkToken = () => {
      const t = localStorage.getItem('token')
      setToken(t)
    }
    
    checkToken()
    
    // Listen for storage changes (in case token is set after mount)
    window.addEventListener('storage', checkToken)
    
    // Also check periodically for the first few seconds (handles race conditions)
    const interval = setInterval(checkToken, 500)
    setTimeout(() => clearInterval(interval), 3000)
    
    return () => {
      window.removeEventListener('storage', checkToken)
      clearInterval(interval)
    }
  }, [])
  
  return token
}

export function useTransactions(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  const token = useToken()
  return useSWR<Transaction[]>(
    token ? `/transactions${params ? `?${params}` : ''}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )
}

export function useSummary(query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString()
  const token = useToken()
  return useSWR<DashboardSummary>(
    token ? `/transactions/summary${params ? `?${params}` : ''}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )
}

export function useSuggestions() {
  const token = useToken()
  return useSWR<Suggestion[]>(token ? '/transactions/suggestions' : null, fetcher)
}

export function useRecurring() {
  const token = useToken()
  return useSWR<RecurringPayment[]>(token ? '/transactions/recurring' : null, fetcher)
}

export function useDuplicateGroups(options?: {
  days?: number
  windowDays?: number
  amountTolerance?: number
}) {
  const token = useToken()
  const params = new URLSearchParams()
  if (options?.days) params.set('days', options.days.toString())
  if (options?.windowDays) params.set('windowDays', options.windowDays.toString())
  if (options?.amountTolerance !== undefined) {
    params.set('amountTolerance', options.amountTolerance.toString())
  }
  const query = params.toString()
  return useSWR<DuplicateGroup[]>(
    token ? `/transactions/duplicates${query ? `?${query}` : ''}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )
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
