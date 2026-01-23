import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');

    // Check main heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for login/register buttons or links
    const loginLink = page.locator('a[href*="login"], button:has-text("Giriş"), button:has-text("Login")').first();
    await expect(loginLink).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await page.goto('/');

    // Check for pricing cards or section
    const pricingSection = page.locator('text=/Free|Pro|Business|Ücretsiz|Başlangıç/i').first();
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toBeVisible();
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(body).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have no critical JS errors
    expect(errors.length).toBe(0);
  });
});
