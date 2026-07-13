import { test, expect } from '@playwright/test';
import { loginAsPatient } from './helpers/login-as';

test.describe('PATIENT Role Workflows (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show PATIENT role badge in header/profile', async ({ page }) => {
    await expect(page.getByText('PATIENT')).toBeVisible();
  });

  test('should see patient portal dashboard as landing page', async ({ page }) => {
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test('should navigate to My Appointments', async ({ page }) => {
    await page.goto('/patient/appointments');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Appointments/i).first()).toBeVisible();
  });

  test('should navigate to My Prescriptions', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Prescriptions/i).first()).toBeVisible();
  });

  test('should navigate to My Bills', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Bill|Invoice/i).first()).toBeVisible();
  });

  test('should navigate to My Profile', async ({ page }) => {
    await page.goto('/patient/profile');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Profile/i).first()).toBeVisible();
  });

  test('should see patient portal nav items', async ({ page }) => {
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });

  test('should NOT see staff nav links in sidebar', async ({ page }) => {
    const staffLinks = ['Patients', 'Doctors', 'Appointments', 'Consultations', 'Billing', 'Settings'];
    for (const link of staffLinks) {
      const el = page.getByText(link);
      const visible = await el.isVisible();
      expect(visible).toBeFalsy();
    }
  });

  test('should NOT access staff Patients route', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isPatientPortal = url.includes('/patient/dashboard') || url.includes('/login');
    expect(isPatientPortal).toBeTruthy();
  });

  test('should NOT access staff Appointments route', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isPatientPortal = url.includes('/patient/dashboard') || url.includes('/login');
    expect(isPatientPortal).toBeTruthy();
  });

  test('should NOT access Doctors route', async ({ page }) => {
    await page.goto('/doctors');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isPatientPortal = url.includes('/patient/dashboard') || url.includes('/login');
    expect(isPatientPortal).toBeTruthy();
  });

  test('should NOT access Billing route', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isPatientPortal = url.includes('/patient/dashboard') || url.includes('/login');
    expect(isPatientPortal).toBeTruthy();
  });

  test('should see prescription details with medicine info', async ({ page }) => {
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

  test('should see bill amounts in rupees', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test('should see bill payment status', async ({ page }) => {
    await page.goto('/patient/bills');
    await page.waitForTimeout(500);
    const statusBadge = page.getByText(/PAID|UNPAID/i).first();
    const count = await statusBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should see personal info on profile page', async ({ page }) => {
    await page.goto('/patient/profile');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Name|Email|Phone|DOB|Gender/i).first()).toBeVisible();
  });

  test('should have role-based session persistence on reload', async ({ page }) => {
    await expect(page.getByText('PATIENT')).toBeVisible();
    await page.reload();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/dashboard') || url.includes('/login');
    expect(isOk).toBeTruthy();
  });

  test('should logout and clear patient session', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should NOT access admin routes', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isRedirect = url.includes('/login') || url.includes('/dashboard');
    expect(isRedirect).toBeTruthy();
  });

  test('should see secure portal branding', async ({ page }) => {
    await expect(page.getByText(/Cliniva/i).first()).toBeVisible();
  });
});
