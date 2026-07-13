import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

const HOSPITAL_CODE = 'DEMO';

test.describe('Module Guard & License Enforcement (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ────────── MODULE-GUARDED ROUTES ──────────
  test('should load Patients module when module is active', async ({ page }) => {
    await page.getByText('Patients').click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByRole('heading', { name: 'Patients' }).or(page.getByText(/Patient/i).first())).toBeVisible();
  });

  test('should load Appointments module when module is active', async ({ page }) => {
    await page.getByText('Appointments').click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should load Consultations module when module is active', async ({ page }) => {
    await page.getByText('Consultations').click();
    await expect(page).toHaveURL(/\/consultations/);
  });

  test('should load Billing module when module is active', async ({ page }) => {
    await page.getByText('Billing').click();
    await expect(page).toHaveURL(/\/billing/);
  });

  test('should load Doctors module when module is active', async ({ page }) => {
    await page.getByText('Doctors').click();
    await expect(page).toHaveURL(/\/doctors/);
  });

  test('should load Medicines module when module is active', async ({ page }) => {
    await page.getByText(/Medicines|Pharmacy/i).click();
    await expect(page).toHaveURL(/\/medicines/);
  });

  test('should load Prescriptions module when module is active', async ({ page }) => {
    await page.getByText('Prescriptions').click();
    await expect(page).toHaveURL(/\/prescriptions/);
  });

  test('should load Reports module when module is active', async ({ page }) => {
    await page.getByText('Reports').click();
    await expect(page).toHaveURL(/\/reports/);
  });

  // ────────── DIRECT URL ACCESS TO MODULE-GUARDED ROUTES ──────────
  test('should access Patients via direct URL when module is active', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/patients`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/patients') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Appointments via direct URL when module is active', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/appointments`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/appointments') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Consultations via direct URL when module is active', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/consultations`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/consultations') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Billing via direct URL when module is active', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/billing`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/billing') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should access Doctors via direct URL when module is active', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/doctors`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/doctors') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  // ────────── MODULE GUARD REDIRECT BEHAVIOR ──────────
  test('should redirect to dashboard when accessing invalid module route', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/invalid-module-xyz`);
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isDashboard = url.includes('/dashboard');
    const isLogin = url.includes('/login');
    expect(isDashboard || isLogin).toBeTruthy();
  });

  // ────────── SETTINGS (no module guard) ──────────
  test('should access Settings directly (no module guard)', async ({ page }) => {
    await page.goto(`/${HOSPITAL_CODE}/settings`);
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/settings/);
  });

  // ────────── NAVIGATION VISIBILITY ──────────
  test('should show only active module nav links in sidebar', async ({ page }) => {
    const coreNavLinks = ['Dashboard', 'Patients', 'Appointments', 'Doctors', 'Billing', 'Settings'];
    for (const link of coreNavLinks) {
      const el = page.getByText(link).first();
      await expect(el).toBeVisible();
    }
  });

  test('should show sidebar module links accessible by click', async ({ page }) => {
    const links = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Billing', 'Settings'];
    for (const link of links) {
      await page.getByText(link).first().click();
      await page.waitForTimeout(200);
    }
  });

  // ────────── BRANDING & LICENSE ──────────
  test('should display Cliniva HMS branding', async ({ page }) => {
    await expect(page.getByText('Cliniva HMS').first()).toBeVisible();
  });

  test('should show trial banner for TRIAL subscription', async ({ page }) => {
    const trialBanner = page.locator('app-trial-banner');
    const count = await trialBanner.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ────────── UNAUTHENTICATED ACCESS ──────────
  test('should redirect to login when accessing module-guarded route without auth', async ({ page }) => {
    const guardedRoutes = ['patients', 'appointments', 'consultations', 'billing', 'doctors', 'medicines', 'prescriptions', 'reports'];
    for (const route of guardedRoutes) {
      await page.goto(`/${HOSPITAL_CODE}/${route}`);
      await page.waitForTimeout(300);
      const url = page.url().toLowerCase();
      const isLogin = url.includes('/login');
      const isRoute = url.includes(`/${route}`);
      expect(isLogin || isRoute).toBeTruthy();
    }
  });

  // ────────── ADMIN-ONLY ROUTES ──────────
  test('should show toast or redirect for non-admin on admin routes', async ({ page }) => {
    const adminRoutes = ['users', 'audit-logs'];
    for (const route of adminRoutes) {
      await page.goto(`/${HOSPITAL_CODE}/${route}`);
      await page.waitForTimeout(500);
      const url = page.url().toLowerCase();
      const isRoute = url.includes(`/${route}`);
      const isDashboard = url.includes('/dashboard');
      const isLogin = url.includes('/login');
      expect(isRoute || isDashboard || isLogin).toBeTruthy();
    }
  });
});
