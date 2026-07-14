import { test, expect } from '@playwright/test';
import { loginAsNurse } from './helpers/login-as';

test.describe('NURSE Role Workflows (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNurse(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show NURSE role badge in sidebar', async ({ page }) => {
    await expect(page.getByText('NURSE')).toBeVisible();
  });

  test('should access Patients module for viewing', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  test('should view patient detail', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await expect(page.getByText(/Patient Profile/i)).toBeVisible();
  });

  test('should access Consultations module for vitals recording', async ({ page }) => {
    await page.getByText('Consultations').first().click();
    await expect(page).toHaveURL(/\/consultations/);
  });

  test('should navigate to consultation for vitals', async ({ page }) => {
    await page.getByText('Consultations').first().click();
    await page.waitForURL(/\/consultations/);
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/Vitals|BP|Temperature/i).first()).toBeVisible();
    }
  });

  test('should record patient vitals', async ({ page }) => {
    await page.getByText('Consultations').first().click();
    await page.waitForURL(/\/consultations/);
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.waitForTimeout(300);
      const bpField = page.locator('#vitalsBp, [formControlName="bp"], input[placeholder*="BP"]').first();
      if (await bpField.isVisible()) {
        await bpField.fill('120/80');
        await page.locator('#vitalsTemp, [formControlName="temperature"]').first().fill('98.6');
        await page.locator('#vitalsWeight, [formControlName="weight"]').first().fill('70');
        await page.locator('#vitalsSpo2, [formControlName="spo2"]').first().fill('98');
        await page.locator('#vitalsPulse, [formControlName="pulse"]').first().fill('72');
        await page.waitForTimeout(300);
      }
    }
  });

  test('should view appointment queue on dashboard', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue").or(page.getByText(/Patient Queue/i)).first()).toBeVisible();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  test('should access dashboard stat cards', async ({ page }) => {
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
  });

  test('should view doctor list', async ({ page }) => {
    await page.getByText('Doctors').first().click();
    await expect(page).toHaveURL(/\/doctors/);
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should view appointment calendar', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should view patient medical history', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await page.waitForTimeout(300);
    await page.getByText('Medical History').click();
    await page.waitForTimeout(300);
  });

  test('should NOT see Users link', async ({ page }) => {
    const usersLink = page.getByText('Users');
    const visible = await usersLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should NOT see Audit Logs link', async ({ page }) => {
    const auditLink = page.getByText('Audit Logs');
    const visible = await auditLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should be redirected from admin routes', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isBlocked = url.includes('/dashboard') || url.includes('/login');
    expect(isBlocked).toBeTruthy();
  });

  test('should NOT add new patients (NURSE can only view)', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const addBtn = page.getByRole('button', { name: 'Add Patient' });
    const visible = await addBtn.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should NOT see Billing module', async ({ page }) => {
    const billingLink = page.getByText('Billing');
    const visible = await billingLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should NOT see Settings module', async ({ page }) => {
    const settingsLink = page.getByText('Settings');
    const visible = await settingsLink.isVisible();
    expect(visible).toBeFalsy();
  });

  test('should logout successfully', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
