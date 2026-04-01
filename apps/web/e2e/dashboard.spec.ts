import { test, expect, type Page } from '@playwright/test'
import { mockAppRoutes, seedAuthenticatedSession } from './helpers'

async function selectPdfTransactions(page: Page) {
  await page.getByLabel('Tum PDF islemlerini sec').check()
}

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
    await expect(page.getByText('Aydan aya tempo')).toBeVisible()
    await expect(page.getByText('En baskin kategori')).toBeVisible()
    await expect(page.getByTestId('dashboard-command-center')).toBeVisible()
    await expect(page.getByTestId('cash-flow-forecast-card')).toBeVisible()
    await expect(page.getByTestId('financial-analysis-board')).toBeVisible()
    await expect(page.getByText('Ay sonu nakit akis tahmini')).toBeVisible()
    await expect(page.getByText('Verinin anlattigi resmi daha net gor')).toBeVisible()
    await expect(page.getByText('Finansal icgoruler')).toBeVisible()
    await expect(page.getByText('Harcama ivmesi')).toBeVisible()
    await expect(page.getByText('Kesilebilecek alan')).toBeVisible()
    await expect(page.getByText('Aydan aya fark')).toBeVisible()
    await expect(page.getByText('Hizli Islemler')).toBeVisible()
    await expect(page.getByText('Komuta Paneli')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Finansal Sağlık' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tasarruf Hedefleri' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Yaklaşan Faturalar' })).toBeVisible()
    await expect(page.getByTitle('Mart Maasi')).toBeVisible()
    await expect(page.getByTitle('Migros Market')).toBeVisible()
    await expect(page.getByText('Akıllı Giriş')).toHaveCount(0)
    await expect(page.getByLabel('Finansal Asistan')).toHaveCount(0)
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

    const filteredResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return url.pathname.endsWith('/transactions') && url.searchParams.get('type') === 'expense'
    })

    await page.getByRole('button', { name: /T[üu]m Giderler/i }).click()
    await filteredResponse

    await expect(page.getByTitle('Kira Odemesi', { exact: true })).toBeVisible()
    await expect(page.getByTitle('Migros Market')).toBeVisible()
    await expect(page.getByTitle('Mart Maasi')).toHaveCount(0)
  })

  test('suggests similar transaction clusters and applies a category to the whole cluster', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Cluster suggestion smoke is covered on desktop layout.')
    await page.goto('/dashboard/transactions')

    await expect(page.getByTestId('similar-cluster-panel')).toBeVisible()
    await page.getByTestId('similar-cluster-apply-kira-odemesi-expense').click()

    await expect(page.getByText(/2 benzer islem .* kategorisine alindi/i)).toBeVisible()

    const similarRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi 2026', { exact: true }) })
    await expect(similarRow.locator('td').nth(3)).toContainText('Kira')
    await expect(page.getByTestId('similar-cluster-panel')).toHaveCount(0)
  })

  test('bulk categorizes selected pdf transactions', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Bulk transaction smoke is covered on desktop layout.')
    await page.goto('/dashboard/transactions')

    await selectPdfTransactions(page)
    await expect(page.getByTestId('bulk-categorize-button')).toBeVisible()

    await page.getByTestId('bulk-categorize-button').click()
    await page.getByTestId('bulk-category-option-transport').click()

    await expect(page.getByText(/1 islem .* kategorisine tasindi/i)).toBeVisible()
    const updatedRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi', { exact: true }) })
    await expect(updatedRow.getByText(/Ulasim|Ulaşım/)).toBeVisible()
  })

  test('bulk categorizes similar merchant transactions when requested', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Bulk transaction smoke is covered on desktop layout.')
    await page.goto('/dashboard/transactions')

    await selectPdfTransactions(page)
    await page.getByTestId('bulk-categorize-button').click()
    await page.getByTestId('bulk-apply-similar-toggle').check()
    await page.getByTestId('bulk-category-option-transport').click()

    await expect(page.getByText(/2 islem .* kategorisine tasindi/i)).toBeVisible()

    const selectedRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi', { exact: true }) })
    const similarRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi 2026', { exact: true }) })

    await expect(selectedRow.getByText(/Ulasim|Ulaşım/)).toBeVisible()
    await expect(similarRow.getByText(/Ulasim|Ulaşım/)).toBeVisible()
  })

  test('bulk updates selected pdf transaction type', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Bulk transaction smoke is covered on desktop layout.')
    await page.goto('/dashboard/transactions')

    await selectPdfTransactions(page)
    await page.getByTestId('bulk-type-button').click()
    await page.getByTestId('bulk-type-option-income').click()

    await expect(page.getByText(/1 islem gelir tipine tasindi/i)).toBeVisible()
    const updatedRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi', { exact: true }) })
    await expect(updatedRow.getByText('Gelir')).toBeVisible()
  })

  test('bulk applies tags to selected pdf transactions', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Bulk transaction smoke is covered on desktop layout.')
    await page.goto('/dashboard/transactions')

    await selectPdfTransactions(page)
    await page.getByTestId('bulk-tags-button').click()
    await page.getByTestId('bulk-tags-input').fill('denetim, mart')
    await page.getByTestId('bulk-tags-apply-button').click()

    await expect(page.getByText(/1 islem guncellendi/i)).toBeVisible()
    const updatedRow = page.locator('tr', { has: page.getByTitle('Kira Odemesi', { exact: true }) })
    await expect(updatedRow.getByText('#denetim')).toBeVisible()
    await expect(updatedRow.getByText('#mart')).toBeVisible()
  })
})
