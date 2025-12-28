import { api, ApiError, setAuthToken, clearAuthToken } from '../api-enhanced'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  describe('setAuthToken and clearAuthToken', () => {
    it('should store tokens in localStorage', () => {
      const mockTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 900,
      }

      setAuthToken(mockTokens)

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', mockTokens.accessToken)
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockTokens.refreshToken)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should clear tokens from localStorage', () => {
      clearAuthToken()

      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('tokenExpiry')
    })
  })

  describe('ApiError', () => {
    it('should create error with all properties', () => {
      const error = new ApiError(404, 'Not found', 'NOT_FOUND', { id: '123' })

      expect(error.status).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.details).toEqual({ id: '123' })
      expect(error.name).toBe('ApiError')
    })

    it('should identify ApiError instances', () => {
      const error = new ApiError(500, 'Server error')
      const normalError = new Error('Normal error')

      expect(ApiError.isApiError(error)).toBe(true)
      expect(ApiError.isApiError(normalError)).toBe(false)
    })
  })

  describe('auth.login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
        expiresIn: 900,
        user: {
          id: '1',
          email: 'test@example.com',
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      })

      const result = await api.auth.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      )
    })

    it('should handle login errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
        headers: new Headers(),
      })

      await expect(
        api.auth.login({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow(ApiError)
    })
  })

  describe('transactions.getAll', () => {
    beforeEach(() => {
      // Set a token for authenticated requests
      setAuthToken({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      })
    })

    it('should fetch transactions with pagination', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            date: '2024-01-01',
            description: 'Test transaction',
            amount: 100,
            type: 'expense',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      })

      const result = await api.transactions.getAll({ page: 1, limit: 20 })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions?page=1&limit=20'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })

  describe('Token refresh', () => {
    it('should refresh token when access token expires', async () => {
      // Set expired token using mock
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'expired-token'
        if (key === 'refreshToken') return 'refresh-token'
        if (key === 'tokenExpiry') return (Date.now() - 1000).toString()
        return null
      })

      const mockRefreshResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 900,
      }

      // First call: refresh token
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshResponse,
        headers: new Headers(),
      })

      // Second call: actual request
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
        headers: new Headers(),
      })

      await api.transactions.getAll()

      // Should have called refresh endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.any(Object)
      )
    })
  })
})
