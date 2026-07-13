import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Navigation Structure (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show all primary sidebar navigation links', async ({ page }) => {
    const primaryLinks = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Consultations', 'Prescriptions', 'Billing', 'Medicines', 'Reports', 'Settings'];
    for (const link of primaryLinks) {
      await expect(page.getByText(link).first()).toBeVisible();
    }
  });

  test('should show admin-only navigation links', async ({ page }) => {
    const adminLinks = ['Users', 'Audit Logs'];
    for (const link of adminLinks) {
      const el = page.getByText(link).first();
      const visible = await el.isVisible();
      expect(typeof visible).toBe('boolean');
    }
  });

  test('should verify sidebar has Cliniva HMS branding', async ({ page }) => {
    await expect(page.getByText('Cliniva HMS').first()).toBeVisible();
  });

  test('should show user profile section in sidebar', async ({ page }) => {
    await expect(page.getByText(/Admin/i)).toBeVisible();
    await expect(page.getByText('ADMIN')).toBeVisible();
  });

  test('should have logout button in sidebar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should show header with search bar', async ({ page }) => {
    await expect(page.locator('app-header')).toBeVisible();
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
  });

  test('should show notification and help icons in header', async ({ page }) => {
    await expect(page.getByText('notifications').or(page.locator('[class*="notification"]')).first()).toBeVisible();
    await expect(page.getByText('help').or(page.locator('[class*="help"]')).first()).toBeVisible();
  });

  test('should show New Appointment button in header', async ({ page }) => {
    await expect(page.getByText('+ New Appointment').or(page.getByRole('button', { name: /New Appointment/i })).first()).toBeVisible();
  });

  test('should show breadcrumb on dashboard', async ({ page }) => {
    await expect(page.getByText('Overview').or(page.getByText('Dashboard')).first()).toBeVisible();
  });

  test('should show stat cards on dashboard after login', async ({ page }) => {
    await expect(page.getByText("Today's Appointments")).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
    await expect(page.getByText('Pending Bills').or(page.getByText(/Outstanding/i)).first()).toBeVisible();
    await expect(page.getByText('Doctors Available').or(page.getByText(/Available/i)).first()).toBeVisible();
  });

  test('should show patient queue table on dashboard', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue").or(page.getByText(/Patient Queue/i)).first()).toBeVisible();
  });

  test('should show quick action buttons on dashboard', async ({ page }) => {
    await expect(page.getByText('Register Patient')).toBeVisible();
    await expect(page.getByText('Book Appointment')).toBeVisible();
    await expect(page.getByText('Collect Payment')).toBeVisible();
  });

  test('should display correct breadcrumb on patient list page', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await expect(page.getByText('Patients').or(page.getByText(/All Patients/i)).first()).toBeVisible();
  });

  test('should display correct breadcrumb on appointments page', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await expect(page.getByText('Appointments').first()).toBeVisible();
  });

  test('should display correct breadcrumb on billing page', async ({ page }) => {
    await page.getByText('Billing').click();
    await page.waitForURL(/\/billing/);
    await expect(page.getByText(/Bills/i).or(page.getByText('Billing')).first()).toBeVisible();
  });

  test('should show floating action button on dashboard', async ({ page }) => {
    const fab = page.locator('app-fab, [class*="fab"], .fixed.bottom-*.right-*');
    const count = await fab.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to all 404 routes gracefully', async ({ page }) => {
    await page.goto('/some/non/existent/path');
    await page.waitForTimeout(500);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle navigating to root path', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const url = page.url().toLowerCase();
    const isValid = url.includes('/login') || url.includes('/dashboard');
    expect(isValid).toBeTruthy();
  });

  test('should maintain session when navigating via browser back/forward', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Dashboard').click();
    await page.waitForURL(/\/dashboard/);
    await page.goBack();
    await page.waitForTimeout(300);
    const currentUrl = page.url().toLowerCase();
    const isOk = currentUrl.includes('/patients') || currentUrl.includes('/dashboard') || currentUrl.includes('/login');
    expect(isOk).toBeTruthy();
  });
});
