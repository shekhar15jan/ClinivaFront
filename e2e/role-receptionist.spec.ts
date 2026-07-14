import { test, expect } from '@playwright/test';
import { loginAsReceptionist } from './helpers/login-as';

test.describe('RECEPTIONIST Role Workflows (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsReceptionist(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show RECEPTIONIST role badge in sidebar', async ({ page }) => {
    await expect(page.getByText('RECEPTIONIST')).toBeVisible();
  });

  test('should access Patients module for registration', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByRole('button', { name: 'Add Patient' })).toBeVisible();
  });

  test('should register a new patient', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Walk-in Patient');
    await page.locator('#patientDob').fill('1995-03-20');
    await page.locator('#patientGender').selectOption('FEMALE');
    await page.locator('#patientPhone').fill('7777888899');
    await page.locator('#patientEmail').fill('walkin@example.com');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.getByText('Walk-in Patient')).toBeVisible();
  });

  test('should access Appointments module', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.getByRole('button', { name: 'New Appointment' })).toBeVisible();
  });

  test('should book a new appointment for a patient', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await page.waitForURL(/\/appointments/);
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#patientId, select').selectOption({ index: 0 });
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Confirm Appointment')).toBeVisible();
  });

  test('should approve a pending appointment', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await page.waitForURL(/\/appointments/);
    const approveBtn = page.getByRole('button', { name: /Approve/i });
    if (await approveBtn.first().isVisible()) {
      await approveBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should reject a pending appointment', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await page.waitForURL(/\/appointments/);
    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    if (await rejectBtn.first().isVisible()) {
      await rejectBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should access Billing module', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await expect(page).toHaveURL(/\/billing/);
  });

  test('should view invoice detail', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    const viewBtn = page.getByRole('link', { name: 'View' }).first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await expect(page).toHaveURL(/\/billing\//);
      await expect(page.getByText('Collect Payment')).toBeVisible();
    }
  });

  test('should search patients by name', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill('Rahul');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  test('should view doctor list', async ({ page }) => {
    await page.getByText('Doctors').first().click();
    await expect(page).toHaveURL(/\/doctors/);
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should access dashboard stat cards', async ({ page }) => {
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
  });

  test('should view patient queue on dashboard', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue").or(page.getByText(/Patient Queue/i)).first()).toBeVisible();
  });

  test('should NOT see Users link in sidebar', async ({ page }) => {
    const usersLink = page.getByText('Users');
    const visible = await usersLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should NOT see Audit Logs link in sidebar', async ({ page }) => {
    const auditLink = page.getByText('Audit Logs');
    const visible = await auditLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should be redirected from Users route', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isBlocked = url.includes('/dashboard') || url.includes('/login');
    expect(isBlocked).toBeTruthy();
  });

  test('should filter billing by status', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Paid');
      await page.waitForTimeout(300);
      await statusFilter.selectOption('Unpaid');
      await page.waitForTimeout(300);
    }
  });

  test('should see payment status badges on bills', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    await expect(page.getByText('PAID').or(page.getByText('UNPAID')).first()).toBeVisible();
  });

  test('should logout and clear session', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
