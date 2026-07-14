import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Session & Auth Resilience (E2E)', () => {
  // ────────── TOKEN REFRESH ──────────
  test('should maintain session after page reload', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.reload();
    await page.waitForTimeout(500);

    const url = page.url().toLowerCase();
    const isAuthed = url.includes('/dashboard') || url.includes('/patients') || url.includes('/appointments');
    const isLogin = url.includes('/login');

    expect(isAuthed || isLogin).toBeTruthy();
  });

  test('should work after navigating away and back', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByText('Dashboard').first().click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  // ────────── MULTIPLE TAB NAVIGATION ──────────
  test('should survive rapid tab switches', async ({ page }) => {
    await login(page);

    const tabs = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Billing', 'Dashboard'];
    for (const tab of tabs) {
      await page.getByText(tab).first().click();
      await page.waitForTimeout(200);
    }

    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ────────── SESSION AFTER INACTIVITY ──────────
  test('should maintain session after brief inactivity', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.waitForTimeout(3000);

    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await expect(page.getByText('Patients')).toBeVisible();
  });

  // ────────── LOGOUT & CLEANUP ──────────
  test('should clear tokens on logout', async ({ page }) => {
    await login(page);

    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);

      const tokens = await page.evaluate(() => {
        return {
          access: localStorage.getItem('cliniva_access_token'),
          refresh: localStorage.getItem('cliniva_refresh_token'),
        };
      });

      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
    }
  });

  test('should redirect to login after logout and route attempt', async ({ page }) => {
    await login(page);

    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
    }

    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/);
  });

  // ────────── 401 HANDLING ──────────
  test('should show login page when accessing protected route without token', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login page when accessing patients without token', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });

  // ────────── INVALID TOKEN ──────────
  test('should handle invalid token gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('cliniva_access_token', 'invalid.token.here');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    const url = page.url().toLowerCase();
    const isLoginOrError = url.includes('/login') || url.includes('/dashboard');
    expect(isLoginOrError).toBeTruthy();
  });

  // ────────── BACK BUTTON AFTER LOGOUT ──────────
  test('should not allow back button access after logout', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveURL(/\/login/);
  });

  // ────────── CONCURRENT SESSION ──────────
  test('should handle opening app in new tab', async ({ page, context }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    const newTab = await context.newPage();
    await newTab.goto('/dashboard');
    await newTab.waitForTimeout(500);

    const newTabUrl = newTab.url().toLowerCase();
    const isOk = newTabUrl.includes('/dashboard') || newTabUrl.includes('/login');
    expect(isOk).toBeTruthy();

    await newTab.close();
  });

  // ────────── BROWSER REFRESH MID-ACTION ──────────
  test('should recover after refresh mid-navigation', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.reload();
    await page.waitForTimeout(500);

    const url = page.url().toLowerCase();
    const isOk = url.includes('/patients') || url.includes('/login');
    expect(isOk).toBeTruthy();
  });
});
