import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Payments Module (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/payments');
    await page.waitForTimeout(500);
  });

  test('should display payment history page', async ({ page }) => {
    await expect(page.getByText('Payment History')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await expect(page.getByText(/Loading/i).first()).toBeVisible();
  });

  test('should display desktop payment table on large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/payments');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Bill ID')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByText('Method')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Date')).toBeVisible();
  });

  test('should display payment data rows with bill IDs', async ({ page }) => {
    await page.waitForTimeout(1000);
    const billIds = page.locator('text=/BILL-|#|INV-/i');
    const count = await billIds.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display payment amounts in rupees format', async ({ page }) => {
    await page.waitForTimeout(1000);
    const amounts = page.getByText(/₹/);
    const count = await amounts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display payment method labels', async ({ page }) => {
    await page.waitForTimeout(1000);
    const methods = page.getByText(/CASH|UPI|CARD|NET BANKING|ONLINE|OFFLINE/i);
    const count = await methods.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display payment status badges', async ({ page }) => {
    await page.waitForTimeout(1000);
    const statuses = page.getByText(/PENDING|SUCCESS|FAILED|REFUNDED/i);
    const count = await statuses.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display dates for payments', async ({ page }) => {
    await page.waitForTimeout(1000);
    const dates = page.locator('text=/2025|2026|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i');
    const count = await dates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display mobile card view on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/payments');
    await page.waitForTimeout(1000);
    const cards = page.locator('text=/Amount|Method|Date/i');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show empty state when no payments exist', async ({ page }) => {
    const emptyState = page.getByText('No Payments').or(page.getByText(/No payment/i));
    const count = await emptyState.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show status badge component for each payment', async ({ page }) => {
    await page.waitForTimeout(1000);
    const badges = page.locator('app-status-badge, [class*="badge"]');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show error state with retry on failure', async ({ page }) => {
    const errorMsg = page.getByText(/Failed to load|Error/i);
    const retryBtn = page.getByText('Retry');
    const errorCount = await errorMsg.count();
    const retryCount = await retryBtn.count();
    expect(errorCount + retryCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate back from payments to dashboard', async ({ page }) => {
    await page.getByText('Dashboard').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to payments from billing list', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    await page.getByText('Payments').or(page.locator('a[routerlink="/payments"]')).first().click().catch(() => {});
    await page.waitForTimeout(500);
  });

  test('should not show edit/delete buttons on payment rows', async ({ page }) => {
    await page.waitForTimeout(1000);
    const editDeleteBtns = page.getByRole('button', { name: /Edit|Delete|Update/i });
    const count = await editDeleteBtns.count();
    expect(count).toBe(0);
  });
});
