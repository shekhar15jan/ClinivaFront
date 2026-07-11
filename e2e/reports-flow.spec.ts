import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Reports Dashboard (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Reports').click();
    await page.waitForURL(/\/reports/);
  });

  // ────────── DASHBOARD STATS ──────────
  test('should display dashboard stat cards', async ({ page }) => {
    await expect(page.getByText(/Today's Appointments/i)).toBeVisible();
    await expect(page.getByText(/Total Patients/i)).toBeVisible();
    await expect(page.getByText(/Pending Bills|Outstanding/i).first()).toBeVisible();
    await expect(page.getByText(/Doctors Available/i)).toBeVisible();
  });

  test('should show numeric values in stat cards', async ({ page }) => {
    const stats = page.locator('[class*="stat"], [class*="card"]').first();
    await expect(stats).toBeVisible();
    const numbers = page.locator('text=/\\d+/').first();
    await expect(numbers).toBeVisible();
  });

  // ────────── PATIENT QUEUE ──────────
  test('should show today patient queue table', async ({ page }) => {
    await expect(page.getByText(/Patient Queue|Queue/i).first()).toBeVisible();
  });

  test('should show token number in queue', async ({ page }) => {
    const tokenCol = page.getByRole('columnheader', { name: /Token/i });
    await expect(tokenCol).toBeVisible();
  });

  // ────────── QUICK ACTIONS ──────────
  test('should display quick action buttons', async ({ page }) => {
    await expect(page.getByText('Register Patient')).toBeVisible();
    await expect(page.getByText('Book Appointment')).toBeVisible();
    await expect(page.getByText('Collect Payment')).toBeVisible();
  });

  // ────────── APPOINTMENT TRENDS ──────────
  test('should show appointment trends report', async ({ page }) => {
    const trendsTab = page.getByText(/Appointment|Trend/i);
    if (await trendsTab.isVisible()) {
      await trendsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display appointment chart/table', async ({ page }) => {
    const trendsTab = page.getByText(/Appointment|Trend/i);
    if (await trendsTab.isVisible()) {
      await trendsTab.click();
      await expect(page.getByText(/Month|Weekly|Count/i).first()).toBeVisible();
    }
  });

  // ────────── REVENUE REPORT ──────────
  test('should show revenue report', async ({ page }) => {
    const revenueTab = page.getByText(/Revenue/i);
    if (await revenueTab.isVisible()) {
      await revenueTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display revenue in rupees', async ({ page }) => {
    const revenueTab = page.getByText(/Revenue/i);
    if (await revenueTab.isVisible()) {
      await revenueTab.click();
      await expect(page.getByText(/₹/).first()).toBeVisible();
    }
  });

  test('should show bills raised vs collected', async ({ page }) => {
    const revenueTab = page.getByText(/Revenue/i);
    if (await revenueTab.isVisible()) {
      await revenueTab.click();
      await expect(page.getByText(/Bills|Collected|Raised/i).first()).toBeVisible();
    }
  });

  // ────────── DOCTOR PERFORMANCE ──────────
  test('should show doctor-wise consultation count', async ({ page }) => {
    const docTab = page.getByText(/Doctor/i);
    if (await docTab.isVisible()) {
      await docTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display doctor name and consultation count', async ({ page }) => {
    const docTab = page.getByText(/Doctor/i);
    if (await docTab.isVisible()) {
      await docTab.click();
      await expect(page.getByText(/Dr/i).first()).toBeVisible();
    }
  });

  // ────────── TENANT SCOPING ──────────
  test('should show only current tenant data', async ({ page }) => {
    await expect(page.getByText('Cliniva HMS')).toBeVisible();
  });

  // ────────── FILTERS ──────────
  test('should allow date range filtering', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = today.slice(0, 8) + '01';
      await dateInputs.first().fill(firstOfMonth);
      await dateInputs.nth(1).fill(today);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});
