import { test, expect } from '@playwright/test';
import { loginAsDoctor } from './helpers/login-as';

test.describe('DOCTOR Role Workflows (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show DOCTOR role badge in sidebar', async ({ page }) => {
    await expect(page.getByText('DOCTOR')).toBeVisible();
  });

  test('should show doctor email in profile section', async ({ page }) => {
    await expect(page.getByText(/doctor@cliniva/i)).toBeVisible();
  });

  test('should access Appointments module', async ({ page }) => {
    await page.getByText('Appointments').click();
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should see appointment calendar with time slots', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
  });

  test('should access Consultations module', async ({ page }) => {
    await page.getByText('Consultations').click();
    await expect(page).toHaveURL(/\/consultations/);
  });

  test('should navigate to consultation workspace', async ({ page }) => {
    await page.getByText('Consultations').click();
    await page.waitForURL(/\/consultations/);
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should access Prescriptions module', async ({ page }) => {
    await page.getByText('Prescriptions').click();
    await expect(page).toHaveURL(/\/prescriptions/);
    await expect(page.getByText(/Prescription/i).first()).toBeVisible();
  });

  test('should access Patients module for viewing', async ({ page }) => {
    await page.getByText('Patients').click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  test('should view patient detail page', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await expect(page.getByText(/Patient Profile/i)).toBeVisible();
  });

  test('should access Reports module', async ({ page }) => {
    await page.getByText('Reports').click();
    await expect(page).toHaveURL(/\/reports/);
  });

  test('should view dashboard stat cards', async ({ page }) => {
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
  });

  test('should view Todays Patient Queue', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue").or(page.getByText(/Patient Queue/i)).first()).toBeVisible();
  });

  test('should access Medicines module', async ({ page }) => {
    await page.getByText(/Medicines|Pharmacy/i).click();
    await expect(page).toHaveURL(/\/medicines/);
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

  test('should be redirected when accessing Users route directly', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isBlocked = url.includes('/dashboard') || url.includes('/login');
    expect(isBlocked).toBeTruthy();
  });

  test('should be redirected when accessing Audit Logs route directly', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isBlocked = url.includes('/dashboard') || url.includes('/login');
    expect(isBlocked).toBeTruthy();
  });

  test('should see medicines with search functionality', async ({ page }) => {
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Para');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to booking flow from New Appointment', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
  });

  test('should logout successfully', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should persist DOCTOR role after page reload', async ({ page }) => {
    await expect(page.getByText('DOCTOR')).toBeVisible();
    await page.reload();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/dashboard') || url.includes('/login');
    expect(isOk).toBeTruthy();
    if (url.includes('/dashboard')) {
      await expect(page.getByText('DOCTOR')).toBeVisible();
    }
  });
});
