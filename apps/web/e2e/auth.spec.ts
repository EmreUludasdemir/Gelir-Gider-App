import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Gelir-Gider/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show error on invalid login', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/hata/i')).toBeVisible({ timeout: 5000 })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=/Dashboard/i')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // Click logout (adjust selector based on your UI)
    await page.click('[data-testid="logout-button"]')

    // Should redirect to login
    await expect(page).toHaveURL('/')
  })

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=/Kayıt Ol/i')
    await expect(page).toHaveURL(/\/register/)
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('should register new user', async ({ page }) => {
    await page.goto('/register')

    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`

    await page.fill('input[type="email"]', email)
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard or login
    await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 10000 })
  })

  test('should show validation errors for weak password', async ({ page }) => {
    await page.goto('/register')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="password"]', 'weak')
    await page.click('button[type="submit"]')

    // Should show password validation error
    await expect(page.locator('text=/en az 8 karakter/i')).toBeVisible()
  })
})
