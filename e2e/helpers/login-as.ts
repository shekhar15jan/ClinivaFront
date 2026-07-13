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

  await page.goto('/login');
  await page.waitForTimeout(500);

  await page.fill('input[type="email"]', email);
  await page.locator('#login-submit, button[type="submit"]').first().click();
  await page.waitForTimeout(1000);

  const otpInputs = page.locator('input[maxlength="1"]');
  const otpCount = await otpInputs.count();

  if (otpCount > 0) {
    for (let i = 0; i < otpCount; i++) {
      await otpInputs.nth(i).fill('123456');
    }
    await page.getByRole('button', { name: /Verify/i }).click();
    await page.waitForTimeout(1000);
  }

  await page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});

  await expect(page.locator('.dashboard-header, h1, .page-title')).first().toBeVisible({ timeout: 5000 });
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
