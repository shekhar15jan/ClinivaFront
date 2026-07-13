import { test, expect } from '@playwright/test';

// Use correct tenant code from mock backend
const TENANT_CODE = 'CLINIVA';
const ADMIN_EMAIL = 'admin@clinivahms.com';

test.describe('Login Flow (E2E) - OTP Only', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display the login page with email input only', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('should have Send OTP button', async ({ page }) => {
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.locator('input[type="email"]').fill('');
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.text-red-700, .bg-red-50, [class*="red"]')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.text-red-700, .bg-red-50, [class*="red"]')).toBeVisible();
  });

  test('should navigate to OTP page after valid email', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(6);
    await expect(page.locator('button:has-text("Verify & Login")')).toBeVisible();
    await expect(page.locator('text=We\'ve sent a 6-digit code')).toBeVisible();
  });

  test('should show back button on OTP page', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
  });

  test('should show resend OTP button on OTP page', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    await expect(page.locator('button:has-text("Resend OTP")')).toBeVisible();
  });

  test('should show error for incomplete OTP', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    await page.locator('button:has-text("Verify & Login")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Please enter the complete 6-digit OTP')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/dashboard`);
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(`/${TENANT_CODE}/login`);
  });
});

test.describe('OTP Verification Flow (E2E)', () => {
  test('should show error for invalid OTP', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/otp`);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Verify & Login")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Please enter the complete 6-digit OTP')).toBeVisible();
  });

  test('should show error for wrong OTP', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/otp`);
    await page.waitForTimeout(500);
    const inputs = page.locator('input[maxlength="1"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('0');
    }
    await page.locator('button:has-text("Verify & Login")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Invalid OTP')).toBeVisible();
  });

  test('should go back to login page from OTP page', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/otp`);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Back")').click();
    await page.waitForURL(`/${TENANT_CODE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});