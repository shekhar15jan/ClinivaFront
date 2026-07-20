import { test, expect } from '@playwright/test';

test.describe('Email Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should send appointment confirmation email', async ({ page }) => {
    // Navigate to appointments
    await page.click('a[href="/appointments"]');
    await page.waitForLoadState('networkidle');

    // Create new appointment
    await page.click('button:has-text("New Appointment")');
    await page.fill('input[name="patientName"]', 'Test Patient');
    await page.fill('input[name="doctorName"]', 'Dr. Smith');
    await page.fill('input[name="date"]', '2026-12-01');
    await page.fill('input[name="time"]', '10:00');
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Appointment created');
  });

  test('should send appointment reminder email', async ({ page }) => {
    // Navigate to appointments
    await page.click('a[href="/appointments"]');
    await page.waitForLoadState('networkidle');

    // Select an appointment
    const appointment = page.locator('table tbody tr').first();
    await appointment.click();

    // Click send reminder button
    await page.click('button:has-text("Send Reminder")');

    // Verify reminder sent message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Reminder sent');
  });

  test('should send prescription ready email', async ({ page }) => {
    // Navigate to prescriptions
    await page.click('a[href="/prescriptions"]');
    await page.waitForLoadState('networkidle');

    // Select a prescription
    const prescription = page.locator('table tbody tr').first();
    await prescription.click();

    // Click notify patient button
    await page.click('button:has-text("Notify Patient")');

    // Verify notification sent message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Patient notified');
  });

  test('should send payment receipt email', async ({ page }) => {
    // Navigate to billing
    await page.click('a[href="/billing"]');
    await page.waitForLoadState('networkidle');

    // Select a paid bill
    const paidBill = page.locator('table tbody tr:has-text("PAID")').first();
    await paidBill.click();

    // Click send receipt button
    await page.click('button:has-text("Send Receipt")');

    // Verify receipt sent message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Receipt sent');
  });

  test('should display email notification settings', async ({ page }) => {
    // Navigate to settings
    await page.click('a[href="/settings"]');
    await page.waitForLoadState('networkidle');

    // Click on notification settings tab
    await page.click('button:has-text("Notifications")');

    // Verify notification settings are displayed
    await expect(page.locator('.notification-settings')).toBeVisible();
    await expect(page.locator('input[name="appointmentReminder"]')).toBeVisible();
    await expect(page.locator('input[name="prescriptionReady"]')).toBeVisible();
    await expect(page.locator('input[name="paymentReceipt"]')).toBeVisible();
  });
});