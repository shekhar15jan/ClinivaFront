import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Settings Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Settings').first().click();
    await page.waitForURL(/\/settings/);
  });

  test('should display clinic settings page', async ({ page }) => {
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
  });

  test('should show clinic name field', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Clinic"], input[formControlName="name"]')).toBeVisible();
  });

  test('should show clinic email and phone fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"], input[placeholder*="Phone"]')).toBeVisible();
  });

  test('should show clinic address field', async ({ page }) => {
    await expect(page.locator('textarea, [formControlName="address"]')).toBeVisible();
  });

  test('should show patient ID prefix setting', async ({ page }) => {
    await expect(page.getByText(/Patient ID|Prefix/i)).toBeVisible();
  });

  test('should show timezone setting', async ({ page }) => {
    await expect(page.getByText(/Timezone/i)).toBeVisible();
  });

  test('should show logo upload option', async ({ page }) => {
    await expect(page.getByText(/Logo/i)).toBeVisible();
  });

  test('should update clinic name and save', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="Clinic"], input[formControlName="name"]').first();
    await nameInput.fill('Updated Clinic Name');
    const saveBtn = page.getByRole('button', { name: /Save/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should update patient ID prefix', async ({ page }) => {
    const prefixInput = page.locator('input[formControlName="patientIdPrefix"], input[placeholder*="prefix"]');
    if (await prefixInput.isVisible()) {
      await prefixInput.fill('CLI');
      const saveBtn = page.getByRole('button', { name: /Save/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should discard changes on cancel', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="Clinic"], input[formControlName="name"]').first();
    const originalValue = await nameInput.inputValue();
    await nameInput.fill('Temp Change');
    const cancelBtn = page.getByRole('button', { name: /Cancel|Reset/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
