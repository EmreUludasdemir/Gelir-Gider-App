import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { useAuth } from '@/components/auth-provider'
import { getUpcomingBills } from '@/lib/api'
import { useUpcomingBillsQuery } from '../react-query-hooks'

jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  getUpcomingBills: jest.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpcomingBillsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch bills when user is authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, loading: false })
    ;(getUpcomingBills as jest.Mock).mockResolvedValue([
      { id: 'bill-1', name: 'Elektrik', amount: 120, currency: 'TRY', dueDate: '2026-05-20', isPaid: false },
    ])

    const { result } = renderHook(() => useUpcomingBillsQuery(14), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getUpcomingBills).toHaveBeenCalledWith(14)
    expect(result.current.data).toHaveLength(1)
  })

  it('should not fetch bills while auth is loading', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, loading: true })

    const { result } = renderHook(() => useUpcomingBillsQuery(14), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getUpcomingBills).not.toHaveBeenCalled()
  })
})
