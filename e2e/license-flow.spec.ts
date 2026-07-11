import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('License & Subscription Display (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show Cliniva brand name in the sidebar', async ({ page }) => {
    await expect(page.getByText('Cliniva HMS')).toBeVisible();
  });

  test('should have navigation links matching licensed modules', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Patients')).toBeVisible();
    await expect(page.getByText('Appointments')).toBeVisible();
    await expect(page.getByText('Doctors')).toBeVisible();
    await expect(page.getByText('Consultations')).toBeVisible();
    await expect(page.getByText('Billing')).toBeVisible();
    await expect(page.getByText('Pharmacy')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should not show the trial banner for ACTIVE subscription', async ({ page }) => {
    await expect(page.locator('app-trial-banner')).toHaveCount(0);
  });

  test('should display user profile section in sidebar after login', async ({ page }) => {
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(page.getByText('ADMIN')).toBeVisible();
  });

  test('should have a logout button in the sidebar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should show medical_services icon in sidebar header', async ({ page }) => {
    await expect(page.locator('.material-symbols-outlined').filter({ hasText: 'medical_services' })).toBeVisible();
  });

  test('should display the header with search bar in authenticated layout', async ({ page }) => {
    await expect(page.locator('app-header')).toBeVisible();
    await expect(page.getByPlaceholder(/Search/)).toBeVisible();
  });

  test('should have notification and help icons in the header', async ({ page }) => {
    await expect(page.getByText('notifications')).toBeVisible();
    await expect(page.getByText('help')).toBeVisible();
  });

  test('should show New Appointment button in header', async ({ page }) => {
    await expect(page.getByText('+ New Appointment')).toBeVisible();
  });

  test('should allow navigating to all major modules from sidebar', async ({ page }) => {
    const modules = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Consultations', 'Billing', 'Pharmacy', 'Settings'];
    for (const mod of modules) {
      await expect(page.getByRole('link', { name: mod })).toBeVisible();
    }
  });

  test('should display the dashboard with stat cards after login', async ({ page }) => {
    await expect(page.getByText("Today's Appointments")).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
    await expect(page.getByText('Pending Bills')).toBeVisible();
    await expect(page.getByText('Doctors Available')).toBeVisible();
  });

  test('should show the patient queue table on the dashboard', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue")).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Token No' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Patient Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Doctor' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should display quick actions on the dashboard', async ({ page }) => {
    await expect(page.getByText('Register Patient')).toBeVisible();
    await expect(page.getByText('Book Appointment')).toBeVisible();
    await expect(page.getByText('Collect Payment')).toBeVisible();
  });

  test('should have the correct breadcrumb on the dashboard', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Overview')).toBeVisible();
  });
});
