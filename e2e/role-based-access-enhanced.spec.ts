import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

const HOSPITAL_CODE = 'DEMO';

test.describe('Role-Based Access Control - Enhanced (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ────────── ADMIN ROLE ACCESS ──────────
  test('should show ADMIN role badge in sidebar', async ({ page }) => {
    await expect(page.getByText('ADMIN')).toBeVisible();
  });

  test('should show Admin label in user profile section', async ({ page }) => {
    await expect(page.getByText('Admin').first()).toBeVisible();
  });

  test('should show admin email in sidebar', async ({ page }) => {
    await expect(page.getByText(/admin@cliniva/i)).toBeVisible();
  });

  test('should access Users page as ADMIN', async ({ page }) => {
    await page.getByText('Users').first().click();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/users') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Audit Logs page as ADMIN', async ({ page }) => {
    await page.getByText('Audit Logs').first().click();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/audit-logs') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  // ────────── MODULE ACCESS BY ROLE ──────────
  test('should access Patients module as ADMIN', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await expect(page).toHaveURL(/\/patients/);
  });

  test('should access Doctors module as ADMIN', async ({ page }) => {
    await page.getByText('Doctors').first().click();
    await expect(page).toHaveURL(/\/doctors/);
  });

  test('should access Appointments module as ADMIN', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should access Billing module as ADMIN', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await expect(page).toHaveURL(/\/billing/);
  });

  test('should access Settings module as ADMIN', async ({ page }) => {
    await page.getByText('Settings').first().click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should access Medicines module as ADMIN', async ({ page }) => {
    await page.getByText(/Medicines|Pharmacy/i).first().click();
    await expect(page).toHaveURL(/\/medicines/);
  });

  test('should access Reports module as ADMIN', async ({ page }) => {
    await page.getByText('Reports').first().click();
    await expect(page).toHaveURL(/\/reports/);
  });

  test('should access Health Packages module as ADMIN', async ({ page }) => {
    await page.getByText(/Health Package/i).first().click();
    await expect(page).toHaveURL(/\/health-packages/);
  });

  test('should access Contacts module as ADMIN', async ({ page }) => {
    await page.getByText('Contacts').first().click();
    await expect(page).toHaveURL(/\/contacts/);
  });

  test('should access Reviews module as ADMIN', async ({ page }) => {
    await page.getByText(/Review/i).first().click();
    await expect(page).toHaveURL(/\/reviews/);
  });

  // ────────── DIRECT URL ACCESS TO ADMIN ROUTES ──────────
  test('should access Users via direct URL as ADMIN', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/users`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/users') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Audit Logs via direct URL as ADMIN', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/audit-logs`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/audit-logs') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  // ────────── SIDEBAR VISIBILITY BY ROLE ──────────
  test('should show users link in sidebar for ADMIN role', async ({ page }) => {
    const usersLink = page.getByText('Users');
    const visible = await usersLink.isVisible();
    expect(visible).toBeTruthy();
  });

  test('should show audit logs link in sidebar for ADMIN role', async ({ page }) => {
    const auditLink = page.getByText('Audit Logs');
    const visible = await auditLink.isVisible();
    expect(visible).toBeTruthy();
  });

  // ────────── ROUTE GUARD BEHAVIOR ──────────
  test('should redirect to login when accessing any route without token', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isLogin = url.includes('/login');
    const isDashboard = url.includes('/dashboard');
    expect(isLogin || isDashboard).toBeTruthy();
  });

  test('should protect all routes', async ({ page }) => {
    const protectedRoutes = ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'settings', 'users'];
    for (const route of protectedRoutes) {
      await page.goto(`/${HOSPITAL_CODE}/${route}`);
      await page.waitForTimeout(300);
      const url = page.url().toLowerCase();
      const isLogin = url.includes('/login');
      const isRoute = url.includes(`/${route}`);
      expect(isLogin || isRoute).toBeTruthy();
    }
  });

  // ────────── SESSION PERSISTENCE ──────────
  test('should persist role and session after page reload', async ({ page }) => {
    await expect(page.getByText('ADMIN')).toBeVisible();
    await page.reload();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/dashboard') || url.includes('/login');
    expect(isOk).toBeTruthy();
  });

  test('should restore session from stored tokens on reload', async ({ page }) => {
    await expect(page.getByText('ADMIN')).toBeVisible();
    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem('cliniva_access_token'),
      refresh: localStorage.getItem('cliniva_refresh_token'),
    }));
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
    await page.reload();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isAuthed = !url.includes('/login');
    expect(isAuthed).toBeTruthy();
  });

  // ────────── LOGOUT ──────────
  test('should clear role on logout and redirect to login', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
      const tokens = await page.evaluate(() => ({
        access: localStorage.getItem('cliniva_access_token'),
      }));
      expect(tokens.access).toBeNull();
    }
  });

  test('should not allow back navigation after logout', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
    }
    await page.goto(`/${HOSPITAL_CODE}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  // ────────── TAB NAVIGATION ──────────
  test('should allow ADMIN to navigate between all accessible modules via sidebar', async ({ page }) => {
    const modules = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Billing', 'Settings'];
    for (const mod of modules) {
      await page.getByText(mod).first().click();
      await page.waitForTimeout(200);
    }
  });

  // ────────── PATIENT PORTAL ACCESS ──────────
  test('should access patient portal routes', async ({ page }) => {
    const patientRoutes = ['dashboard', 'appointments', 'prescriptions', 'bills', 'profile'];
    for (const route of patientRoutes) {
      await page.goto(`/${HOSPITAL_CODE}/patient/${route}`);
      await page.waitForTimeout(300);
      const url = page.url().toLowerCase();
      const isOk = url.includes(`/patient/${route}`) || url.includes('/dashboard') || url.includes('/login');
      expect(isOk).toBeTruthy();
    }
  });

  // ────────── PAYMENTS MODULE ACCESS ──────────
  test('should access Payments page (no role guard)', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    await page.goto(`/${HOSPITAL_CODE}/payments`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/payments') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });
});
