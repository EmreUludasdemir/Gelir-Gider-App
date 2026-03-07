import { test, expect } from '@playwright/test'

test.describe('Auth Recovery', () => {
  test('shows recovery links on login screen', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('link', { name: /Şifremi unuttum/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Dogrulama e-postasi gonder/i })).toBeVisible()
  })

  test('submits forgot password request', async ({ page }) => {
    await page.route('**/auth/password-reset/request', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Eger hesap varsa sifirlama adimlari e-posta adresine gonderildi.',
        }),
      })
    })

    await page.goto('/auth/forgot-password')
    await page.fill('input[type="email"]', 'recover@example.com')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/Talep alindi/i')).toBeVisible()
  })

  test('submits resend verification request', async ({ page }) => {
    await page.route('**/auth/email-verification/request', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Eger hesap varsa dogrulama adimlari e-posta adresine gonderildi.',
        }),
      })
    })

    await page.goto('/auth/resend-verification')
    await page.fill('input[type="email"]', 'verify@example.com')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/Talep alindi/i')).toBeVisible()
  })

  test('resets password with token', async ({ page }) => {
    await page.route('**/auth/password-reset/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset completed' }),
      })
    })

    await page.goto('/auth/reset-password?token=test-token')

    await page.fill('input#password', 'Test1234!')
    await page.fill('input#confirmPassword', 'Mismatch123!')
    await expect(page.locator('text=/Sifreler eslesmiyor/i')).toBeVisible()

    await page.fill('input#confirmPassword', 'Test1234!')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/Sifre basariyla guncellendi/i')).toBeVisible()
  })

  test('verifies email with token', async ({ page }) => {
    await page.route('**/auth/email-verification/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'E-posta dogrulama tamamlandi.' }),
      })
    })

    await page.goto('/auth/verify-email?token=test-token')
    await expect(page.locator('text=/E-posta dogrulama tamamlandi/i')).toBeVisible()
  })
})
