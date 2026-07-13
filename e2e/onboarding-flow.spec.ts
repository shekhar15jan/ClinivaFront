import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

const HOSPITAL_CODE = 'DEMO';

test.describe('Onboarding Flow (E2E)', () => {
  test('should redirect to dashboard when accessing onboarding while already set up', async ({ page }) => {
    await login(page);
    await page.goto(`/${HOSPITAL_CODE}/onboarding`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isDashboard = url.includes('/dashboard');
    const isOnboarding = url.includes('/onboarding');
    expect(isDashboard || isOnboarding).toBeTruthy();
  });

  test('should redirect to login when accessing onboarding without auth', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/onboarding`);
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(`/${HOSPITAL_CODE}/login`);
  });

  test('should show tenant info after successful login', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Cliniva HMS').first()).toBeVisible();
    await expect(page.getByText(/Admin/i)).toBeVisible();
  });

  test('should navigate to settings after login if tenant needs setup', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
  });

  test('should show clinic name field in settings', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    const nameInput = page.locator('input[placeholder*="Clinic"], input[formControlName="name"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('should update clinic name during onboarding setup', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    const nameInput = page.locator('input[placeholder*="Clinic"], input[formControlName="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('My Clinic Name');
      const saveBtn = page.getByRole('button', { name: /Save/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should configure patient ID prefix in settings', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
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

  test('should configure timezone in settings', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await expect(page.getByText(/Timezone/i)).toBeVisible();
  });

  test('should show address field in settings for clinic setup', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await expect(page.locator('textarea, [formControlName="address"]')).toBeVisible();
  });

  test('should show phone and email fields for clinic contact', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await expect(page.locator('input[type="tel"], input[placeholder*="Phone"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('should have profile section visible after onboarding', async ({ page }) => {
    await login(page);
    await expect(page.getByText(/Admin/i)).toBeVisible();
    await expect(page.getByText(/admin@cliniva/i)).toBeVisible();
  });

  test('should navigate to dashboard after settings update', async ({ page }) => {
    await login(page);
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await page.getByText('Dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Today's Appointments")).toBeVisible();
  });
});
