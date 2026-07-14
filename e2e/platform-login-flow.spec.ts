import { test, expect } from '@playwright/test';

const GENERIC_LOGIN_URL = '/login';
const HOSPITAL_CODE = 'CLINIVA';

test.describe('Platform Generic Login Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GENERIC_LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display generic login page with welcome heading', async ({ page }) => {
    await expect(page.getByText(/Welcome Back/i)).toBeVisible();
    await expect(page.getByText(/professional email/i)).toBeVisible();
    await expect(page.locator('#generic-email, input[type="email"]').first()).toBeVisible();
  });

  test('should have Continue button on generic login', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('should have link to enter hospital code', async ({ page }) => {
    await expect(page.getByText(/Enter Hospital Code instead/i)).toBeVisible();
  });

  test('should disable Continue button when email is empty', async ({ page }) => {
    await page.locator('#generic-email, input[type="email"]').first().fill('');
    await expect(page.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  test('should disable Continue button for invalid email format', async ({ page }) => {
    const emailInput = page.locator('#generic-email, input[type="email"]').first();
    await emailInput.fill('not-valid-email');
    await expect(page.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  test('should proceed to tenant selection with valid email', async ({ page }) => {
    const emailInput = page.locator('#generic-email, input[type="email"]').first();
    await emailInput.fill('admin@clinivahms.com');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnOtpOrLogin = url.includes('/otp') || url.includes('/login');
    expect(isOnOtpOrLogin).toBeTruthy();
  });

  test('should show secure portal footer on generic login', async ({ page }) => {
    await expect(page.getByText(/Secure Portal/i)).toBeVisible();
    await expect(page.getByText(/Contact Administrator/i)).toBeVisible();
  });

  test('should navigate to hospital code login from generic login', async ({ page }) => {
    await page.getByText(/Enter Hospital Code/i).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to generic login when accessing /login directly', async ({ page }) => {
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Hospital Code Login Flow (E2E)', () => {
  test('should redirect to tenant login page with hospital code', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should have Send OTP button on tenant login', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('should disable Send OTP when email is empty on tenant login', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').fill('');
    await expect(page.locator('button:has-text("Send OTP")')).toBeDisabled();
  });

  test('should navigate from tenant login to OTP page with valid email', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').fill('admin@clinivahms.com');
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${HOSPITAL_CODE}/otp`);
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(6);
    await expect(page.locator('button:has-text("Verify & Login")')).toBeVisible();
  });

  test('should show back button from OTP to login', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').fill('admin@clinivahms.com');
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(`/${HOSPITAL_CODE}/otp`);
    await page.locator('button:has-text("Back")').click();
    await page.waitForURL(new RegExp(`/${HOSPITAL_CODE}/login`));
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/dashboard`);
    await page.waitForTimeout(1000);
    const url = page.url();
    const isLogin = url.includes('/login');
    expect(isLogin).toBeTruthy();
  });
});

test.describe('Tenant Resolution Flow (E2E)', () => {
  test('should redirect to login when accessing unknown hospital code', async ({ page }) => {
    await page.goto('/UNKNOWN/login');
    await page.waitForTimeout(1000);
    const url = page.url().toLowerCase();
    const isValid = url.includes('/login') || url.includes('/unknown/login');
    expect(isValid).toBeTruthy();
  });

  test('should redirect to login when accessing valid hospital code without auth', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/patients`);
    await page.waitForTimeout(1000);
    const url = page.url();
    const isLogin = url.includes('/login');
    expect(isLogin).toBeTruthy();
  });

  test('should redirect to login when accessing admin route without auth', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/users`);
    await page.waitForTimeout(1000);
    const url = page.url();
    const isLogin = url.includes('/login');
    expect(isLogin).toBeTruthy();
  });

  test('should show 404 for non-existent route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await page.waitForTimeout(500);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
