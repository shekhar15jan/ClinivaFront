import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string = 'admin@clinivahms.com'): Promise<void> {
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
