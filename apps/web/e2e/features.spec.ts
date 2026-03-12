import { test, expect } from '@playwright/test'
import { mockAppRoutes, seedAuthenticatedSession } from './helpers'

test.describe('Export Feature', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
    await page.goto('/dashboard/transactions')
  })

  test('shows export button', async ({ page }) => {
    await expect(page.getByTestId('export-button')).toBeVisible()
  })

  test('opens export menu', async ({ page }) => {
    await page.getByTestId('export-button').click()

    await expect(page.getByTestId('export-csv')).toBeVisible()
    await expect(page.getByTestId('export-json')).toBeVisible()
  })

  test('downloads CSV file', async ({ page }) => {
    await page.getByTestId('export-button').click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-csv').click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })

  test('downloads JSON file', async ({ page }) => {
    await page.getByTestId('export-button').click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-json').click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })
})

test.describe('Bank Connections', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
    await page.goto('/bank-connections')
  })

  test('renders existing bank connections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Banka Bağlantıları/i })).toBeVisible()
    await expect(page.getByText('Akbank')).toBeVisible()
    await expect(page.getByText('Ana Hesap')).toBeVisible()
  })

  test('adds a new bank connection', async ({ page }) => {
    await page.getByRole('button', { name: /Banka Ekle/i }).click()
    await page.selectOption('select', 'garanti')
    await page.fill('input[placeholder="Ana Hesap"]', 'Yedek Hesap')
    await page.getByRole('button', { name: /^Bağlan$/i }).click()

    await expect(page.getByText('Garanti BBVA')).toBeVisible()
    await expect(page.getByText('Yedek Hesap')).toBeVisible()
  })
})

test.describe('PDF Upload Review', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
    await page.goto('/dashboard/upload')
  })

  test('shows import review after a successful pdf upload', async ({ page }) => {
    await page.setInputFiles('#pdf-file-input', [
      {
        name: 'mart-ekstre.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 test file'),
      },
      {
        name: 'nisan-ekstre.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 second test file'),
      },
    ])

    await page.getByTestId('pdf-upload-submit').click()

    await expect(page.getByTestId('pdf-import-workbench')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Birden fazla PDF'i tek akista duzenle ve kaydet/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /mart-ekstre\.pdf/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /nisan-ekstre\.pdf/i })).toBeVisible()
    await page.getByRole('button', { name: /Sadece dusuk guven/i }).click()
    await expect(page.getByText('Istanbulkart Yukleme').first()).toBeVisible()
    await page.getByTestId('pdf-import-confirm').click()

    await expect(page.getByTestId('pdf-import-review')).toBeVisible()
    await expect(page.getByText('Toplu import review hazir')).toBeVisible()
    await expect(page.getByText('Dosya bazli kalite sinyali')).toBeVisible()
    await expect(page.getByText('PDF arsivi (7)')).toBeVisible()
  })
})

test.describe('Subscription Center', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAppRoutes(page)
    await page.goto('/dashboard/subscriptions')
  })

  test('renders subscription summary and can add a detected subscription', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Abonelikleri tek merkezde yonet/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Tespit edilen tekrarli odemeler/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Kayitli abonelikler/i })).toBeVisible()
    await expect(page.getByText('Spotify')).toBeVisible()

    await page.getByRole('button', { name: 'Listeye al' }).first().click()

    await expect(page.getByText('Tespit edilen abonelik listeye eklendi.')).toBeVisible()
    await expect(page.getByText('Aktif abonelik')).toBeVisible()
    await expect(page.getByRole('button', { name: /Pasife al/i }).first()).toBeVisible()
  })
})
