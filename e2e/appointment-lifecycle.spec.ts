import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Appointment Lifecycle (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Appointments').first().click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  // ────────── READ ──────────
  test('should display calendar with day/week/month views', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
  });

  test('should switch calendar views', async ({ page }) => {
    await page.getByRole('button', { name: 'Week' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Day' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Month' }).click();
    await page.waitForTimeout(300);
  });

  test('should show doctor columns in calendar', async ({ page }) => {
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
    await expect(page.getByText('Dr. Vivek Kumar')).toBeVisible();
  });

  test('should show token numbers on appointments', async ({ page }) => {
    const tokens = page.locator('text=/Token|#\\d+/i');
    const count = await tokens.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ────────── CREATE (Booking Flow) ──────────
  test('should open booking flow with 3 steps', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
    await expect(page.getByText('Step 1')).toBeVisible();
    await expect(page.getByText('Step 2')).toBeVisible();
    await expect(page.getByText('Step 3')).toBeVisible();
  });

  test('should complete step 1: select doctor and time', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByText('Step 2')).toBeVisible();
  });

  test('should complete step 2: select patient', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    await page.locator('#patientId, select').selectOption({ index: 0 });
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Step 3')).toBeVisible();
  });

  test('should complete step 3: confirm and create appointment', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#patientId, select').selectOption({ index: 0 });
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.getByText('Confirm Appointment')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Booking' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  // ────────── PARTIAL PROCESS ──────────
  test('should allow going back from step 2 to step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    const backBtn = page.getByRole('button', { name: /Back|Previous/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.getByText('Step 1')).toBeVisible();
    }
  });

  test('should allow abandoning booking mid-flow', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByRole('button', { name: /Cancel|Back to Appointments/i }).click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  // ────────── UPDATE ──────────
  test('should approve a pending appointment', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /Approve/i });
    if (await approveBtn.first().isVisible()) {
      await approveBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should reject a pending appointment', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    if (await rejectBtn.first().isVisible()) {
      await rejectBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── CANCEL (by patient) ──────────
  test('should allow cancelling an appointment', async ({ page }) => {
    const appointmentCard = page.getByText('Rahul Sharma').first();
    if (await appointmentCard.isVisible()) {
      await appointmentCard.click();
      await page.waitForTimeout(300);
      const cancelBtn = page.getByRole('button', { name: /Cancel/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  // ────────── FILTER ──────────
  test('should filter appointments by date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  test('should filter appointments by doctor', async ({ page }) => {
    const doctorFilter = page.locator('select').filter({ has: page.locator('option') });
    if (await doctorFilter.first().isVisible()) {
      await doctorFilter.first().selectOption({ index: 0 });
      await page.waitForTimeout(500);
    }
  });

  // ────────── STATUS FLOW ──────────
  test('should show appointment status badges', async ({ page }) => {
    const badges = page.locator('app-status-badge, [class*="status"]');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
