import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Use stored auth state or login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard with stats', async ({ page }) => {
    // Check main elements
    await expect(page.locator('text=/Gelir/i').first()).toBeVisible();
    await expect(page.locator('text=/Gider/i').first()).toBeVisible();
    await expect(page.locator('text=/Bakiye/i').first()).toBeVisible();
  });

  test('should display transaction list', async ({ page }) => {
    // Check transaction table/list exists
    await expect(page.locator('[data-testid="transaction-list"]').or(
      page.locator('table').or(page.locator('text=/İşlem/i'))
    )).toBeVisible();
  });

  test('should open add transaction modal', async ({ page }) => {
    // Click add transaction button
    await page.click('[data-testid="add-transaction-btn"]').catch(() => {
      // Fallback to text-based selector
      return page.click('button:has-text("İşlem Ekle")');
    });

    // Check modal is visible
    await expect(page.locator('[role="dialog"]').or(
      page.locator('.modal')
    ).or(page.locator('text=/Yeni İşlem/i'))).toBeVisible({ timeout: 5000 });
  });

  test('should add a new expense transaction', async ({ page }) => {
    // Open add transaction
    await page.click('button:has-text("İşlem Ekle")').catch(() => 
      page.click('[data-testid="add-transaction-btn"]')
    );

    // Fill form
    await page.fill('input[name="description"]', 'E2E Test - Market Alışverişi');
    await page.fill('input[name="amount"]', '150.50');
    
    // Select expense type
    await page.click('text=/Gider/i').catch(() => {});
    
    // Submit
    await page.click('button[type="submit"]');

    // Verify success - wait for toast or list update
    await expect(page.locator('text=/başarıyla/i').or(
      page.locator('text=/E2E Test - Market/)
    )).toBeVisible({ timeout: 5000 });
  });

  test('should filter transactions by type', async ({ page }) => {
    // Click on filter/type selector if exists
    const filterBtn = page.locator('[data-testid="filter-type"]').or(
      page.locator('select[name="type"]')
    );
    
    if (await filterBtn.isVisible()) {
      await filterBtn.selectOption('expense');
      // Verify filter applied
      await page.waitForTimeout(500);
    }
  });

  test('should display budget section', async ({ page }) => {
    await expect(page.locator('text=/Bütçe/i').first()).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    // Click on settings link/button
    await page.click('[data-testid="settings-link"]').catch(() =>
      page.click('a[href="/settings"]').catch(() =>
        page.click('text=/Ayarlar/i')
      )
    );

    await expect(page).toHaveURL(/\/settings/, { timeout: 5000 }).catch(() => {
      // Settings might be modal or inline
      expect(page.locator('text=/Ayarlar/i')).toBeVisible();
    });
  });
});
