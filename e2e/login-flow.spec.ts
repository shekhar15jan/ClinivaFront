import { test, expect } from '@playwright/test';

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
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('should have Send OTP button', async ({ page }) => {
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('should disable Send OTP button when email is empty', async ({ page }) => {
    await page.locator('input[type="email"]').fill('');
    await expect(page.locator('button:has-text("Send OTP")')).toBeDisabled();
  });

  test('should disable Send OTP button for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await expect(page.locator('button:has-text("Send OTP")')).toBeDisabled();
  });

  test('should enable Send OTP button for valid email', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await expect(page.locator('button:has-text("Send OTP")')).toBeEnabled();
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

  test('should disable Verify button when OTP is incomplete', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    await expect(page.locator('button:has-text("Verify & Login")')).toBeDisabled();
  });

  test('should enable Verify button only when all 6 digits entered', async ({ page }) => {
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    const inputs = page.locator('input[maxlength="1"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }
    await expect(page.locator('button:has-text("Verify & Login")')).toBeEnabled();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/dashboard`);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(new RegExp(`/${TENANT_CODE}/login`));
  });
});

test.describe('OTP Verification Flow (E2E)', () => {
  test('should accept any 6-digit OTP in mock mode', async ({ page }) => {
    await page.goto(`/${TENANT_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    const inputs = page.locator('input[maxlength="1"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('0');
    }
    await page.locator('button:has-text("Verify & Login")').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should go back to login page from OTP page', async ({ page }) => {
    // Navigate through full flow to reach OTP page
    await page.goto(`/${TENANT_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${TENANT_CODE}/otp`);
    // Click Back
    await page.locator('button:has-text("Back")').click();
    await page.waitForURL(new RegExp(`/${TENANT_CODE}/login`));
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
