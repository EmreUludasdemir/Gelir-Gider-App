import { CookieOptions, Response } from 'express'

export const AUTH_ACCESS_COOKIE = 'access_token'
export const AUTH_REFRESH_COOKIE = 'refresh_token'

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
  }
}

export function getAccessCookieOptions(): CookieOptions {
  return {
    ...getBaseCookieOptions(),
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  }
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    ...getBaseCookieOptions(),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  }
}

export function setAuthCookies(
  response: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  response.cookie(AUTH_ACCESS_COOKIE, tokens.accessToken, getAccessCookieOptions())
  response.cookie(AUTH_REFRESH_COOKIE, tokens.refreshToken, getRefreshCookieOptions())
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(AUTH_ACCESS_COOKIE, getBaseCookieOptions())
  response.clearCookie(AUTH_REFRESH_COOKIE, getBaseCookieOptions())
}

export function parseCookieHeader(rawCookieHeader?: string): Record<string, string> {
  if (!rawCookieHeader) {
    return {}
  }

  return rawCookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, entry) => {
      const separatorIndex = entry.indexOf('=')
      if (separatorIndex === -1) {
        return cookies
      }

      const key = decodeURIComponent(entry.slice(0, separatorIndex).trim())
      const value = decodeURIComponent(entry.slice(separatorIndex + 1).trim())
      cookies[key] = value
      return cookies
    }, {})
}

export function getCookieValue(
  rawCookieHeader: string | undefined,
  cookieName: string
): string | undefined {
  return parseCookieHeader(rawCookieHeader)[cookieName]
}
