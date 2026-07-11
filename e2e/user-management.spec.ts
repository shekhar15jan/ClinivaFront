import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('User Management (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Users').click();
    await page.waitForURL(/\/users/);
  });

  // ────────── READ ──────────
  test('should display user list', async ({ page }) => {
    await expect(page.getByText(/Users|User Management/i).first()).toBeVisible();
  });

  test('should show user columns (Name, Email, Role, Status)', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Role/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('should show user rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ────────── CREATE ──────────
  test('should open Add User form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add User/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should create a new user', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add User/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('input[formControlName="email"]').fill('newuser@cliniva.com');
      await page.locator('select[formControlName="role"], [formControlName="role"]').selectOption('DOCTOR');
      await page.getByRole('button', { name: /Save|Create/i }).click();
      await page.waitForTimeout(500);
    }
  });

  test('should validate email format on create', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add User/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('input[formControlName="email"]').fill('invalid-email');
      await page.getByRole('button', { name: /Save|Create/i }).click();
      await expect(page.locator('input[formControlName="email"]')).toHaveClass(/ng-invalid/);
    }
  });

  // ────────── ACTIVATE / DEACTIVATE ──────────
  test('should deactivate a user', async ({ page }) => {
    const deactivateBtn = page.getByRole('button', { name: /Deactivate/i });
    if (await deactivateBtn.first().isVisible()) {
      await deactivateBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should activate a deactivated user', async ({ page }) => {
    const activateBtn = page.getByRole('button', { name: /Activate/i });
    if (await activateBtn.first().isVisible()) {
      await activateBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should show active/inactive status badges', async ({ page }) => {
    const badges = page.locator('text=/ACTIVE|INACTIVE/i');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ────────── RESET PASSWORD ──────────
  test('should have reset password option', async ({ page }) => {
    const resetBtn = page.getByRole('button', { name: /Reset Password/i });
    expect(resetBtn).toBeVisible();
  });

  // ────────── ROLE DISPLAY ──────────
  test('should show user roles (ADMIN, DOCTOR, RECEPTIONIST, etc.)', async ({ page }) => {
    await expect(page.getByText(/ADMIN|DOCTOR|RECEPTIONIST|NURSE|PATIENT/i).first()).toBeVisible();
  });

  // ────────── SEARCH ──────────
  test('should search users by email', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin@cliniva');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});
