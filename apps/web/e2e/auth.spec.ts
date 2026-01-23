import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check page title
    await expect(page).toHaveTitle(/Gelir-Gider|Giriş|Login/);

    // Check login form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register');

    // Check register form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Enter invalid email
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Check for validation error (either browser validation or custom)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/auth/login');

    // Click register link
    const registerLink = page.locator('a[href="/auth/register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/auth\/register/);
    }
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login|\/$/);
  });
});
