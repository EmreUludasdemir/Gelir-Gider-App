import { test, expect } from '@playwright/test'
import { mockAppRoutes, seedAuthenticatedSession } from './helpers'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppRoutes(page)
    await page.goto('/auth/login')
  })

  test('shows login screen', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows error for invalid login', async ({ page }) => {
    await mockAppRoutes(page, { loginSuccess: false })
    await page.goto('/auth/login')

    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText(/E-posta veya şifre hatalı/i)).toBeVisible()
  })

  test('submits login request and unlocks dashboard', async ({ page }) => {
    const loginRequest = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return request.method() === 'POST' && url.pathname.endsWith('/auth/login')
    })

    await page.fill('input[type="email"]', 'e2e@example.com')
    await page.fill('input[type="password"]', 'Test1234!')
    await page.click('button[type="submit"]')

    const request = await loginRequest
    expect(request.postDataJSON()).toMatchObject({
      email: 'e2e@example.com',
      password: 'Test1234!',
    })

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText('Finans Nabzi')).toBeVisible()
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('token'))).toBeNull()
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('user'))).toBeNull()
  })

  test('logs out successfully', async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
    await page.goto('/dashboard')

    await page
      .locator('[data-testid="logout-button"], [data-testid="mobile-logout-button"], button[title="Çıkış Yap"], button[title="Logout"]')
      .first()
      .click()

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('token'))).toBeNull()
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('user'))).toBeNull()
  })

  test('navigates to register page', async ({ page }) => {
    await page.getByRole('link', { name: /Kayıt Ol/i }).click()

    await expect(page).toHaveURL(/\/auth\/register/)
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('registers a new user', async ({ page }) => {
    await page.goto('/auth/register')

    const email = `test-${Date.now()}@example.com`

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', email)
    await page.fill('input#password', 'Test1234!')
    await page.fill('input#confirmPassword', 'Test1234!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText('Finans Nabzi')).toBeVisible()
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('token'))).toBeNull()
  })

  test('keeps submit disabled for weak password', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input#password', 'weak')
    await page.fill('input#confirmPassword', 'weak')

    await expect(page.locator('text=/Zayif/i')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })
})
