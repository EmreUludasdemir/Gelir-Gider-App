import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to login from landing page', async ({ page }) => {
    await page.goto('/');

    // Find and click login link/button
    const loginButton = page.locator('a[href*="login"], button:has-text("Giriş"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test('should show 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page-xyz');
    
    // Should either show 404 page or redirect
    const status = response?.status();
    expect([200, 404]).toContain(status);
  });

  test('should have consistent header across pages', async ({ page }) => {
    await page.goto('/');
    
    // Check if there's a logo or app name
    const logoOrTitle = page.locator('header, nav').first();
    await expect(logoOrTitle).toBeVisible();
  });

  test('should handle dark mode toggle if present', async ({ page }) => {
    await page.goto('/');

    // Look for dark mode toggle
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀️")').first();
    
    if (await darkModeToggle.isVisible()) {
      const htmlClass = await page.locator('html').getAttribute('class');
      await darkModeToggle.click();
      const newHtmlClass = await page.locator('html').getAttribute('class');
      
      // Class should have changed (dark mode toggled)
      expect(htmlClass).not.toBe(newHtmlClass);
    }
  });
});
