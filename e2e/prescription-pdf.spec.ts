import { test, expect } from '@playwright/test';

test.describe('Prescription PDF Download', () => {
  test.beforeEach(async ({ page }) => {
    // Login as doctor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'doctor@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should download prescription PDF successfully', async ({ page }) => {
    // Navigate to prescriptions
    await page.click('a[href="/prescriptions"]');
    await page.waitForLoadState('networkidle');

    // Click on first prescription
    const firstPrescription = page.locator('table tbody tr').first();
    await firstPrescription.click();

    // Click download PDF button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/prescription.*\.pdf/);
  });

  test('should show PDF preview before download', async ({ page }) => {
    // Navigate to prescriptions
    await page.click('a[href="/prescriptions"]');
    await page.waitForLoadState('networkidle');

    // Click on first prescription
    const firstPrescription = page.locator('table tbody tr').first();
    await firstPrescription.click();

    // Click preview PDF button
    await page.click('button:has-text("Preview PDF")');

    // Verify PDF viewer is displayed
    await expect(page.locator('.pdf-viewer')).toBeVisible();
  });

  test('patient can download own prescription PDF', async ({ page }) => {
    // Login as patient
    await page.goto('/login');
    await page.fill('input[name="email"]', 'patient@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to prescriptions
    await page.click('a[href="/prescriptions"]');
    await page.waitForLoadState('networkidle');

    // Click on first prescription
    const firstPrescription = page.locator('table tbody tr').first();
    await firstPrescription.click();

    // Verify download button is visible
    await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
  });
});