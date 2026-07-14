import { Page, expect } from '@playwright/test';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'NURSE' | 'PATIENT';

// Tenant A (Clinica Hospital) credentials
const tenantACredentials: Record<UserRole, { email: string }> = {
  ADMIN: { email: 'admin@clinivahms.com' },
  DOCTOR: { email: 'doctor@clinic-a.com' },
  RECEPTIONIST: { email: 'receptionist@clinic-a.com' },
  NURSE: { email: 'nurse@clinic-a.com' },
  PATIENT: { email: 'patient@clinic-a.com' },
};

// Tenant B (Wellness Clinic) credentials
const tenantBCredentials: Record<UserRole, { email: string }> = {
  ADMIN: { email: 'admin@clinic-b.com' },
  DOCTOR: { email: 'doctor@clinic-b.com' },
  RECEPTIONIST: { email: 'receptionist@clinic-b.com' },
  NURSE: { email: 'nurse@clinic-b.com' },
  PATIENT: { email: 'patient@clinic-b.com' },
};

export interface LoginOptions {
  tenant?: 'A' | 'B';
  email?: string;
}

export async function loginAs(page: Page, role: UserRole, options: LoginOptions = {}): Promise<void> {
  const credentials = options.tenant === 'B' ? tenantBCredentials : tenantACredentials;
  const email = options.email || credentials[role].email;

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

export async function loginAsAdmin(page: Page, options?: LoginOptions): Promise<void> {
  return loginAs(page, 'ADMIN', options);
}

export async function loginAsDoctor(page: Page, options?: LoginOptions): Promise<void> {
  return loginAs(page, 'DOCTOR', options);
}

export async function loginAsReceptionist(page: Page, options?: LoginOptions): Promise<void> {
  return loginAs(page, 'RECEPTIONIST', options);
}

export async function loginAsNurse(page: Page, options?: LoginOptions): Promise<void> {
  return loginAs(page, 'NURSE', options);
}

export async function loginAsPatient(page: Page, options?: LoginOptions): Promise<void> {
  return loginAs(page, 'PATIENT', options);
}

// Specific login functions for cross-tenant tests
export async function loginAsTenantBAdmin(page: Page): Promise<void> {
  return loginAs(page, 'ADMIN', { tenant: 'B' });
}

export async function loginAsTenantBDoctor(page: Page): Promise<void> {
  return loginAs(page, 'DOCTOR', { tenant: 'B' });
}

export async function loginAsTenantBReceptionist(page: Page): Promise<void> {
  return loginAs(page, 'RECEPTIONIST', { tenant: 'B' });
}

export async function loginAsTenantBNurse(page: Page): Promise<void> {
  return loginAs(page, 'NURSE', { tenant: 'B' });
}

export async function loginAsTenantBPatient(page: Page): Promise<void> {
  return loginAs(page, 'PATIENT', { tenant: 'B' });
}
