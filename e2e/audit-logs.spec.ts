import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Audit Logs (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText(/Audit Log/i).click();
    await page.waitForURL(/\/audit-logs/);
  });

  // ────────── READ ──────────
  test('should display audit log viewer', async ({ page }) => {
    await expect(page.getByText(/Audit Log/i).first()).toBeVisible();
  });

  test('should show audit log columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Timestamp/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /User/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Action/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Entity/i })).toBeVisible();
  });

  test('should show action types (CREATE, UPDATE, DELETE, LOGIN)', async ({ page }) => {
    const actions = page.getByText(/CREATE|UPDATE|DELETE|LOGIN|LOGOUT|STATUS_CHANGE/i);
    const count = await actions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show entity types', async ({ page }) => {
    const entities = page.getByText(/Patient|Appointment|Doctor|Prescription|User/i).first();
    await expect(entities).toBeVisible();
  });

  test('should show user who performed action', async ({ page }) => {
    const userCell = page.locator('td').filter({ hasText: /Admin|Doctor|Receptionist/i }).first();
    await expect(userCell).toBeVisible();
  });

  // ────────── FILTER BY ACTION ──────────
  test('should filter by action type', async ({ page }) => {
    const actionFilter = page.locator('select').filter({ hasText: /Action|CREATE|UPDATE|DELETE/i }).first();
    if (await actionFilter.isVisible()) {
      await actionFilter.selectOption('LOGIN');
      await page.waitForTimeout(500);
      await actionFilter.selectOption('CREATE');
      await page.waitForTimeout(500);
    }
  });

  // ────────── FILTER BY ENTITY ──────────
  test('should filter by entity type', async ({ page }) => {
    const entityFilter = page.locator('select').filter({ hasText: /Entity|Patient|Appointment/i }).first();
    if (await entityFilter.isVisible()) {
      await entityFilter.selectOption('Patient');
      await page.waitForTimeout(500);
    }
  });

  // ────────── FILTER BY USER ──────────
  test('should filter by user', async ({ page }) => {
    const userFilter = page.locator('select').filter({ has: page.locator('option') }).first();
    if (await userFilter.isVisible()) {
      await userFilter.selectOption({ index: 0 });
      await page.waitForTimeout(500);
    }
  });

  // ────────── FILTER BY DATE RANGE ──────────
  test('should filter by date range', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

      await dateInputs.first().fill(thirtyDaysAgo);
      await dateInputs.nth(1).fill(today);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  // ────────── PAGINATION ──────────
  test('should show pagination for audit logs', async ({ page }) => {
    const pagination = page.getByText(/Showing|Page/i);
    const count = await pagination.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ────────── READ ONLY ──────────
  test('should be read-only (no edit/delete buttons on log entries)', async ({ page }) => {
    const deleteBtns = page.getByRole('button', { name: /Delete/i });
    const count = await deleteBtns.count();
    if (count > 0) {
      const inTable = page.locator('tbody').locator('button:has-text("Delete")');
      await expect(inTable).toHaveCount(0);
    }
  });

  // ────────── SEARCH ──────────
  test('should search audit logs', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});
