import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string = 'admin@clinivahms.com'): Promise<void> {
  // Step 1: Go to generic login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Step 2: Fill email and click Continue (GenericLogin resolves tenant)
  await page.fill('input[type="email"]', email);
  await page.locator('button[type="submit"]').first().click();

  // Step 3: Wait for redirect to /{code}/login (LoginEmail page)
  await page.waitForURL(/\/login$/, { timeout: 10000 });

  // Step 4: Click "Send OTP" on LoginEmail page
  const sendOtpBtn = page.locator('button:has-text("Send OTP")');
  await sendOtpBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sendOtpBtn.click();

  // Step 5: Wait for redirect to /{code}/otp (OTP page)
  await page.waitForURL(/\/otp$/, { timeout: 10000 });

  // Step 6: Fill OTP digits (each digit in its own input)
  const otpInputs = page.locator('input[maxlength="1"]');
  await otpInputs.first().waitFor({ state: 'visible', timeout: 5000 });
  const otpCount = await otpInputs.count();
  const digits = '123456';
  for (let i = 0; i < Math.min(otpCount, 6); i++) {
    await otpInputs.nth(i).fill(digits[i]);
  }

  // Step 7: Click "Verify & Login"
  await page.locator('button:has-text("Verify")').click();

  // Step 8: Wait for dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, 'admin@clinivahms.com');
}

export async function loginAsDoctor(page: Page): Promise<void> {
  await login(page, 'doctor@clinic-a.com');
}

export async function loginAsReceptionist(page: Page): Promise<void> {
  await login(page, 'receptionist@clinic-a.com');
}

export async function loginAsNurse(page: Page): Promise<void> {
  await login(page, 'nurse@clinic-a.com');
}

export async function loginAsPatient(page: Page): Promise<void> {
  await login(page, 'patient@clinic-a.com');
}

export async function loginAsTenantBAdmin(page: Page): Promise<void> {
  await login(page, 'admin@clinic-b.com');
}

export async function loginAsTenantBDoctor(page: Page): Promise<void> {
  await login(page, 'doctor@clinic-b.com');
}
