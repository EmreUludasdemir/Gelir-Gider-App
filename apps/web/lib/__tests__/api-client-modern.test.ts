import { ApiError, getCurrentUser, getTransactions, loginUser } from '../api'

global.fetch = jest.fn()

describe('api.ts modern client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should parse backend error envelopes into ApiError metadata', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
      json: async () => ({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Geçersiz email veya şifre',
          details: { attempt: 1 },
          requestId: 'req-auth-1',
          timestamp: '2026-04-01T12:00:00.000Z',
          path: '/auth/login',
        },
      }),
    })

    await expect(
      loginUser({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_001',
      requestId: 'req-auth-1',
      retryable: false,
    })
  })

  it('should mark 5xx failures as retryable', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'x-request-id': 'req-server-1' }),
      json: async () => ({
        success: false,
        error: {
          code: 'EXT_003',
          message: 'Servis şu anda kullanılamıyor',
          requestId: 'req-server-1',
          timestamp: '2026-04-01T12:00:00.000Z',
          path: '/transactions',
        },
      }),
    })

    await expect(getCurrentUser()).rejects.toMatchObject({
      status: 503,
      code: 'EXT_003',
      requestId: 'req-server-1',
      retryable: true,
    })
  })

  it('should refresh the cookie session after a 401 and retry protected requests', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: {
            code: 'AUTH_004',
            message: 'Unauthorized',
            timestamp: '2026-04-01T12:00:00.000Z',
            path: '/transactions',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 900,
          user: { id: 'user-1', email: 'user@example.com' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [],
      })

    const result = await getTransactions()

    expect(result).toEqual([])
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })

  it('should preserve ApiError identity checks', () => {
    const error = new ApiError(500, 'Server error', 'SRV_001')

    expect(ApiError.isApiError(error)).toBe(true)
    expect(ApiError.isApiError(new Error('plain error'))).toBe(false)
  })
})
