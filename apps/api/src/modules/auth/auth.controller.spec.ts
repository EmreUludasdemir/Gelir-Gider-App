import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from '../../shared/cookies'

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    requestEmailVerification: jest.fn(),
    confirmEmailVerification: jest.fn(),
    changePassword: jest.fn(),
    generate2FASecret: jest.fn(),
    enable2FA: jest.fn(),
    disable2FA: jest.fn(),
  } as unknown as jest.Mocked<AuthService>

  const controller = new AuthController(authService)

  const createResponse = () => {
    const cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []
    const cleared: Array<{ name: string; options?: Record<string, unknown> }> = []

    return {
      response: {
        cookie: jest.fn((name: string, value: string, options?: Record<string, unknown>) => {
          cookies.push({ name, value, options })
          return undefined
        }),
        clearCookie: jest.fn((name: string, options?: Record<string, unknown>) => {
          cleared.push({ name, options })
          return undefined
        }),
      },
      cookies,
      cleared,
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set auth cookies on login', async () => {
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        twoFactorEnabled: false,
        emailVerified: true,
      },
    }
    authService.login.mockResolvedValue(tokens)
    const { response, cookies } = createResponse()

    const result = await controller.login(
      { email: 'user@example.com', password: 'Secret123!' },
      response as never,
    )

    expect(authService.login).toHaveBeenCalled()
    expect(result).toBe(tokens)
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: AUTH_ACCESS_COOKIE, value: 'access-token' }),
        expect.objectContaining({ name: AUTH_REFRESH_COOKIE, value: 'refresh-token' }),
      ]),
    )
  })

  it('should read refresh token from cookie header and rotate cookies on refresh', async () => {
    const tokens = {
      accessToken: 'next-access',
      refreshToken: 'next-refresh',
      expiresIn: 900,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        twoFactorEnabled: false,
        emailVerified: true,
      },
    }
    authService.refreshToken.mockResolvedValue(tokens)
    const { response, cookies } = createResponse()

    const result = await controller.refresh(
      { refreshToken: '' },
      {
        headers: {
          cookie: `${AUTH_REFRESH_COOKIE}=cookie-refresh-token`,
        },
      } as never,
      response as never,
    )

    expect(authService.refreshToken).toHaveBeenCalledWith(
      { refreshToken: '' },
      'cookie-refresh-token',
    )
    expect(result).toBe(tokens)
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: AUTH_ACCESS_COOKIE, value: 'next-access' }),
        expect.objectContaining({ name: AUTH_REFRESH_COOKIE, value: 'next-refresh' }),
      ]),
    )
  })

  it('should revoke refresh session and clear auth cookies on logout', async () => {
    authService.logout.mockResolvedValue({ message: 'Logout successful' })
    const { response, cleared } = createResponse()

    const result = await controller.logout(
      {
        headers: {
          cookie: `${AUTH_REFRESH_COOKIE}=cookie-refresh-token`,
        },
      } as never,
      response as never,
    )

    expect(authService.logout).toHaveBeenCalledWith('cookie-refresh-token')
    expect(result).toEqual({ message: 'Logout successful' })
    expect(cleared).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: AUTH_ACCESS_COOKIE }),
        expect.objectContaining({ name: AUTH_REFRESH_COOKIE }),
      ]),
    )
  })
})
