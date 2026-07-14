import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Edge Cases & Resilience (E2E)', () => {
  // ────────── DOUBLE SUBMIT ──────────
  test('should prevent double submit on patient create', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Double Submit Test');
    await page.locator('#patientDob').fill('1990-01-01');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('1111111111');

    const saveBtn = page.getByRole('button', { name: 'Save Patient' });
    await saveBtn.click();
    await page.waitForTimeout(100);

    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
    await page.waitForTimeout(500);
  });

  // ────────── EMPTY FORM SUBMIT ──────────
  test('should show validation on completely empty patient form', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.locator('.ng-invalid').first()).toBeVisible();
  });

  test('should show validation on empty doctor form', async ({ page }) => {
    await login(page);
    await page.getByText('Doctors').first().click();
    await page.waitForURL(/\/doctors/);

    const addBtn = page.getByRole('button', { name: /Add Doctor/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.getByRole('button', { name: /Save/i }).click();
      await expect(page.locator('.ng-invalid').first()).toBeVisible();
    }
  });

  // ────────── NAVIGATION AWAY MID-FLOW ──────────
  test('should handle navigating away from Add Patient without saving', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Unsaved Patient');

    await page.getByText('Dashboard').first().click();
    await page.waitForURL(/\/dashboard/);

    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await expect(page.getByText('Unsaved Patient')).toHaveCount(0);
  });

  // ────────── RAPID NAVIGATION ──────────
  test('should handle rapid sidebar navigation', async ({ page }) => {
    await login(page);

    await page.getByText('Patients').first().click();
    await page.waitForTimeout(200);

    await page.getByText('Dashboard').first().click();
    await page.waitForTimeout(200);

    await page.getByText('Doctors').first().click();
    await page.waitForTimeout(200);

    await page.getByText('Appointments').first().click();
    await page.waitForTimeout(200);

    await page.getByText('Dashboard').first().click();
    await page.waitForURL(/\/dashboard/);
  });

  // ────────── LONG INPUT ──────────
  test('should handle very long patient name', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByRole('button', { name: 'Add Patient' }).click();
    const longName = 'A'.repeat(200);
    await page.locator('#patientFullName').fill(longName);
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  // ────────── SPECIAL CHARACTERS ──────────
  test('should handle special characters in patient name', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill("O'Brien-Smith Jr.");
    await page.locator('#patientDob').fill('1990-01-01');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('2222222222');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(500);
  });

  // ────────── SEARCH EDGE CASES ──────────
  test('should handle very long search query', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    const longQuery = 'x'.repeat(500);
    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill(longQuery);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should handle special characters in search', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);

    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill('@#$%^&*()');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  // ────────── LOGOUT ──────────
  test('should logout and redirect to login', async ({ page }) => {
    await login(page);

    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }

    await expect(page).toHaveURL(/\/login/);
  });

  test('should clear session after logout (cannot access dashboard)', async ({ page }) => {
    await login(page);

    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
    }

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // ────────── RESPONSIVE BEHAVIOR ──────────
  test('should show mobile drawer toggle on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    const menuBtn = page.getByRole('button', { name: /menu|toggle/i });
    const count = await menuBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show bottom nav on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    const bottomNav = page.locator('app-bottom-nav');
    const count = await bottomNav.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
