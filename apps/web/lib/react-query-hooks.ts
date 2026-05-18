'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/auth-provider'
import { getUpcomingBills } from '@/lib/api'

export const upcomingBillsQueryKey = (days: number) => ['bills', 'upcoming', days] as const

export function useUpcomingBillsQuery(days: number = 14) {
  const { isAuthenticated, loading } = useAuth()

  return useQuery({
    queryKey: upcomingBillsQueryKey(days),
    queryFn: () => getUpcomingBills(days),
    enabled: isAuthenticated && !loading,
    refetchInterval: 60_000,
  })
}
