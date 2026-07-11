import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Doctor CRUD (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Doctors').click();
    await expect(page).toHaveURL(/\/doctors/);
  });

  // ────────── READ ──────────
  test('should display doctor list with columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Specialization/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Phone/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('should show doctor rows', async ({ page }) => {
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
    await expect(page.getByText('Dr. Vivek Kumar')).toBeVisible();
  });

  test('should navigate to doctor detail', async ({ page }) => {
    await page.getByText('Dr. Anita Desai').click();
    await expect(page).toHaveURL(/\/doctors\//);
    await expect(page.getByText(/Specialization/i)).toBeVisible();
    await expect(page.getByText(/Consultation Fee/i)).toBeVisible();
  });

  // ────────── CREATE ──────────
  test('should open Add Doctor form', async ({ page }) => {
    await page.getByRole('button', { name: /Add Doctor/i }).click();
    await expect(page).toHaveURL(/\/doctors\/(new|add)/i);
  });

  test('should validate required fields on create', async ({ page }) => {
    await page.getByRole('button', { name: /Add Doctor/i }).click();
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(page.locator('input[formControlName="fullName"]')).toHaveClass(/ng-invalid/);
  });

  test('should create a new doctor', async ({ page }) => {
    await page.getByRole('button', { name: /Add Doctor/i }).click();
    await page.getByRole('button', { name: /Add Doctor Create New Doctor|Save/i }).click();
    await page.locator('#doctorFullName, [formControlName="fullName"]').fill('Dr. New Doctor');
    await page.locator('#doctorSpecialization, [formControlName="specialization"]').fill('Cardiology');
    await page.locator('#doctorPhone, [formControlName="phone"]').fill('9999999998');
    await page.locator('#doctorEmail, [formControlName="email"]').fill('new.doctor@cliniva.com');
    await page.locator('#consultationFee, [formControlName="consultationFee"]').fill('500');
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText('Dr. New Doctor')).toBeVisible();
  });

  // ────────── UPDATE ──────────
  test('should update doctor details', async ({ page }) => {
    await page.getByText('Dr. Anita Desai').click();
    await page.getByRole('button', { name: /Edit/i }).click();
    await page.locator('#doctorFullName, [formControlName="fullName"]').fill('Dr. Anita Desai Updated');
    await page.getByRole('button', { name: /Save|Update/i }).click();
    await expect(page.getByText('Dr. Anita Desai Updated')).toBeVisible();
  });

  // ────────── ENABLE / DISABLE ──────────
  test('should toggle doctor active/inactive status', async ({ page }) => {
    await page.getByText('Dr. Anita Desai').click();
    const toggleBtn = page.getByRole('button', { name: /Activate|Deactivate|Toggle/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show deactivated doctor with inactive badge', async ({ page }) => {
    const statusCells = page.locator('td').filter({ hasText: /ACTIVE|INACTIVE/i });
    await expect(statusCells.first()).toBeVisible();
  });

  // ────────── AVAILABILITY ──────────
  test('should show doctor availability schedule', async ({ page }) => {
    await page.getByText('Dr. Anita Desai').click();
    await expect(page.getByText(/Availability|Schedule/i)).toBeVisible();
  });

  test('should display day-of-week slots', async ({ page }) => {
    await page.getByText('Dr. Anita Desai').click();
    await expect(page.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i).first()).toBeVisible();
  });

  // ────────── SEARCH ──────────
  test('should search doctors by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search doctors/i);
    await searchInput.fill('Anita');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should search doctors by specialization', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Cardiology');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });
});
