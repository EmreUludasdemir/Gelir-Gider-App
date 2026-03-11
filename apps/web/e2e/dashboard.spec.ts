import { test, expect } from '@playwright/test'
import { mockAppRoutes, seedAuthenticatedSession } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
  })

  test('renders dashboard summary and recent transactions', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Finans Nabzi')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Bu ayki para akisini netlestir/i })).toBeVisible()
    await expect(page.getByTestId('dashboard-command-center')).toBeVisible()
    await expect(page.getByText('Hizli Islemler')).toBeVisible()
    await expect(page.getByText('Komuta Paneli')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Finansal Sağlık' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tasarruf Hedefleri' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Yaklaşan Faturalar' })).toBeVisible()
    await expect(page.getByTitle('Mart Maasi')).toBeVisible()
    await expect(page.getByTitle('Migros Market')).toBeVisible()
  })

  test('marks an upcoming bill as paid from command center', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /Odendi Olarak Isaretle|Ödendi Olarak İşaretle/i }).first().click()

    await expect(page.getByText('Fatura odendi olarak isaretlendi.')).toBeVisible()
  })

  test('submits a manual transaction from transactions page', async ({ page }) => {
    await page.goto('/dashboard/transactions')

    await page.getByTestId('add-transaction-toggle').click()
    await page.fill('input[name="description"]', 'E2E Kahve Harcamasi')
    await page.fill('input[name="amount"]', '245')
    await page.selectOption('select[name="type"]', 'expense')
    await page.fill('input[name="date"]', '2026-03-07')
    await page.locator('form button[type="submit"]').click()

    await expect(page.getByText(/İşlem başarıyla eklendi!/i)).toBeVisible()
    await expect(page.getByTitle('E2E Kahve Harcamasi')).toBeVisible()
  })

  test('applies quick expense filter', async ({ page }) => {
    await page.goto('/dashboard/transactions')

    await page.getByRole('button', { name: 'Tum Giderler' }).click()

    await expect(page.getByTitle('Kira Odemesi')).toBeVisible()
    await expect(page.getByTitle('Migros Market')).toBeVisible()
    await expect(page.getByTitle('Mart Maasi')).toHaveCount(0)
  })
})
