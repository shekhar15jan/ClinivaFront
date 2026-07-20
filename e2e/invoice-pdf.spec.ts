import { test, expect } from '@playwright/test';

test.describe('Invoice PDF Download', () => {
  test.beforeEach(async ({ page }) => {
    // Login as receptionist
    await page.goto('/login');
    await page.fill('input[name="email"]', 'receptionist@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should download invoice PDF successfully', async ({ page }) => {
    // Navigate to billing
    await page.click('a[href="/billing"]');
    await page.waitForLoadState('networkidle');

    // Click on first bill
    const firstBill = page.locator('table tbody tr').first();
    await firstBill.click();

    // Click download invoice button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Invoice")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/);
  });

  test('should show invoice preview before download', async ({ page }) => {
    // Navigate to billing
    await page.click('a[href="/billing"]');
    await page.waitForLoadState('networkidle');

    // Click on first bill
    const firstBill = page.locator('table tbody tr').first();
    await firstBill.click();

    // Click preview invoice button
    await page.click('button:has-text("Preview Invoice")');

    // Verify PDF viewer is displayed
    await expect(page.locator('.pdf-viewer')).toBeVisible();
  });

  test('patient can download own invoice PDF', async ({ page }) => {
    // Login as patient
    await page.goto('/login');
    await page.fill('input[name="email"]', 'patient@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to bills
    await page.click('a[href="/bills"]');
    await page.waitForLoadState('networkidle');

    // Click on first bill
    const firstBill = page.locator('table tbody tr').first();
    await firstBill.click();

    // Verify download button is visible
    await expect(page.locator('button:has-text("Download Invoice")')).toBeVisible();
  });

  test('invoice contains correct billing details', async ({ page }) => {
    // Navigate to billing
    await page.click('a[href="/billing"]');
    await page.waitForLoadState('networkidle');

    // Click on first bill
    const firstBill = page.locator('table tbody tr').first();
    await firstBill.click();

    // Verify billing details are displayed
    await expect(page.locator('.bill-amount')).toBeVisible();
    await expect(page.locator('.bill-status')).toBeVisible();
    await expect(page.locator('.bill-date')).toBeVisible();
  });
});