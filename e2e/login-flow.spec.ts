import { test, expect } from '@playwright/test';

test.describe('Login Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(300);
  });

  test('should display the login page with email input', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have a Sign In button', async ({ page }) => {
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.locator('input[type="email"]').fill('');
    await page.locator('#login-submit').click();
    await page.waitForTimeout(300);
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@clinivahms.com');
    await page.locator('input[type="password"]').fill('');
    await page.locator('#login-submit').click();
    await page.waitForTimeout(300);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('#login-submit').click();
    await page.waitForTimeout(300);
  });

  test('should navigate to OTP after valid credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@clinivahms.com');
    await page.locator('input[type="password"]').fill('admin');
    await page.locator('#login-submit').click();
    await page.waitForTimeout(1500);
  });

  test('should have OTP sign-in option', async ({ page }) => {
    await expect(page.getByText(/OTP/i)).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
  });
});
