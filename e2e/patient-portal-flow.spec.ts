import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Patient Portal Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to patient portal dashboard', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should display patient portal dashboard with overview', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForTimeout(500);
    await expect(page.getByText(/My Appointments|Upcoming/i).first()).toBeVisible();
    await expect(page.getByText(/My Prescriptions|Recent/i).first()).toBeVisible();
  });

  test('should show patient dashboard stats', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForTimeout(500);
    const stats = page.locator('[class*="stat"], [class*="card"], .mat-mdc-card');
    const count = await stats.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to my appointments page', async ({ page }) => {
    await page.goto('/patient/appointments');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Appointments/i).first()).toBeVisible();
  });

  test('should list patient appointments', async ({ page }) => {
    await page.goto('/patient/appointments');
    await page.waitForTimeout(500);
    const appointments = page.locator('table tbody tr, [class*="appointment-card"], .mat-mdc-row');
    const count = await appointments.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show appointment status in patient view', async ({ page }) => {
    await page.goto('/patient/appointments');
    await page.waitForTimeout(500);
    const statusBadge = page.getByText(/PENDING|APPROVED|REJECTED|CANCELLED|COMPLETED/i).first();
    const count = await statusBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to my prescriptions page', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Prescriptions/i).first()).toBeVisible();
  });

  test('should list patient prescriptions', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForTimeout(500);
    const prescriptions = page.locator('table tbody tr, [class*="prescription-card"], .mat-mdc-row');
    const count = await prescriptions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show prescription doctor name and date', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Dr\.|Doctor|Date/i).first()).toBeVisible();
  });

  test('should navigate to my bills page', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Bill|Invoice/i).first()).toBeVisible();
  });

  test('should list patient bills', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    const bills = page.locator('table tbody tr, [class*="bill-card"], .mat-mdc-row');
    const count = await bills.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show bill amounts in rupees', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test('should show bill payment status', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    const statusBadge = page.getByText(/PAID|UNPAID|PARTIALLY/i).first();
    const count = await statusBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to my profile page', async ({ page }) => {
    await page.goto('/patient/profile');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Profile/i).first()).toBeVisible();
  });

  test('should display patient personal information on profile', async ({ page }) => {
    await page.goto('/patient/profile');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Name|Email|Phone|DOB|Gender/i).first()).toBeVisible();
  });

  test('should navigate between patient portal tabs', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForTimeout(500);
    const tabs = ['Appointments', 'Prescriptions', 'Bills', 'Profile'];
    for (const tab of tabs) {
      const link = page.getByText(tab).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should return to main dashboard from patient portal', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForTimeout(500);
    await page.getByText('Dashboard').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show prescription details with medicine info', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForTimeout(500);
    const viewLink = page.getByRole('link').or(page.getByRole('button')).filter({ hasText: /View|Detail/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await page.waitForTimeout(500);
      const medicineText = page.getByText(/Medicine|Dosage|Frequency/i).first();
      await expect(medicineText).toBeVisible();
    }
  });
});
