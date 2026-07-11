import { Page } from '@playwright/test';

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForTimeout(500);

  await page.locator('input[type="email"]').fill('admin@clinivahms.com');
  await page.locator('input[type="password"]').fill('admin');

  await page.locator('#login-submit').click();
  await page.waitForTimeout(1000);

  const otpInputs = page.locator('input[maxlength="1"]');
  const otpCount = await otpInputs.count();

  if (otpCount > 0) {
    for (let i = 0; i < otpCount; i++) {
      await otpInputs.nth(i).fill((i + 1).toString());
    }
    await page.getByRole('button', { name: /Verify/i }).click();
    await page.waitForTimeout(1000);
  }

  await page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
}
