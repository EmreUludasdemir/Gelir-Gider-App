import { api, ApiError, setAuthToken, clearAuthToken } from '../api-enhanced'

global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setAuthToken and clearAuthToken', () => {
    it('should keep compatibility helpers as no-ops', () => {
      expect(() =>
        setAuthToken({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 900,
        })
      ).not.toThrow()

      expect(() => clearAuthToken()).not.toThrow()
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
          credentials: 'include',
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
    it('should fetch transactions with pagination using cookies', async () => {
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
          credentials: 'include',
        })
      )
    })
  })

  describe('Token refresh', () => {
    it('should refresh the cookie session after a 401 and retry the request', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ accessToken: 'new-token', refreshToken: 'new-refresh', expiresIn: 900 }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: [] }),
          headers: new Headers(),
        })

      await api.transactions.getAll()

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      )
    })
  })
})
