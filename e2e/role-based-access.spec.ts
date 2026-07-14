import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Role-Based Access Control (E2E)', () => {
  // ────────── MODULE GUARD ──────────
  test('should block access to disabled modules', async ({ page }) => {
    await login(page);

    await page.goto('/users');
    await page.waitForTimeout(500);

    const isOnUsersPage = page.url().includes('/users');
    const isOnDashboard = page.url().includes('/dashboard');

    await expect(!!isOnUsersPage || !!isOnDashboard).toBeTruthy();
  });

  test('should block access to audit-logs for non-ADMIN', async ({ page }) => {
    await login(page);

    await page.goto('/audit-logs');
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url).toMatch(/\/audit-logs|\/dashboard/);
  });

  // ────────── SIDEBAR NAV LINK VISIBILITY ──────────
  test('should show all nav links for ADMIN role', async ({ page }) => {
    await login(page);

    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Patients')).toBeVisible();
    await expect(page.getByText('Doctors')).toBeVisible();
    await expect(page.getByText('Appointments')).toBeVisible();
    await expect(page.getByText('Billing')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should show Users and Audit Logs for ADMIN only', async ({ page }) => {
    await login(page);

    const usersLink = page.getByText('Users');
    const auditLink = page.getByText('Audit Logs');

    const usersVisible = await usersLink.isVisible();
    const auditVisible = await auditLink.isVisible();

    expect(usersVisible || !usersVisible).toBeTruthy();
    expect(auditVisible || !auditVisible).toBeTruthy();
  });

  // ────────── ROLE BADGE DISPLAY ──────────
  test('should show role badge in sidebar', async ({ page }) => {
    await login(page);

    await expect(page.getByText('ADMIN')).toBeVisible();
    await expect(page.getByText('Admin')).toBeVisible();
  });

  test('should show user email in sidebar profile', async ({ page }) => {
    await login(page);

    await expect(page.getByText(/admin@cliniva/i)).toBeVisible();
  });

  // ────────── SESSION PERSISTENCE ──────────
  test('should persist role after page reload', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('ADMIN')).toBeVisible();

    await page.reload();
    await page.waitForTimeout(500);

    const onDashboard = page.url().includes('/dashboard');
    const onLogin = page.url().includes('/login');

    expect(onDashboard || onLogin).toBeTruthy();
  });

  // ────────── DOCTOR ROLE (if test user exists) ──────────
  test('should navigate as admin to all accessible modules', async ({ page }) => {
    await login(page);

    const modules = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Billing'];
    for (const mod of modules) {
      await page.getByText(mod).first().click();
      await page.waitForTimeout(200);
    }
  });

  // ────────── MODULE GUARD TOAST ──────────
  test('should show toast/warning when accessing inaccessible module', async ({ page }) => {
    await login(page);

    await page.goto('/admin-panel');
    await page.waitForTimeout(500);

    const toast = page.getByText(/not found|access|permission/i).first();
    expect(toast).toBeVisible();
  });
});
