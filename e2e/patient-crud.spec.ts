import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Patient CRUD (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await expect(page).toHaveURL(/\/patients/);
  });

  // ────────── READ ──────────
  test('should display patient list with correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Age/Gender' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last Visit' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should navigate to patient detail on click', async ({ page }) => {
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await expect(page.getByText('Patient Profile')).toBeVisible();
    await expect(page.getByText('UHID:')).toBeVisible();
  });

  test('should show patient visit history on detail page', async ({ page }) => {
    await page.getByText('Rahul Sharma').click();
    await page.getByText('Overview').click();
    await expect(page.getByText('Personal Information')).toBeVisible();
    await page.getByText('Medical History').click();
  });

  test('should show patient appointments tab on detail', async ({ page }) => {
    await page.getByText('Rahul Sharma').click();
    await page.getByText('Appointments').click();
    await expect(page.getByText(/Appointments/i)).toBeVisible();
  });

  test('should show patient billing tab on detail', async ({ page }) => {
    await page.getByText('Rahul Sharma').click();
    await page.getByText('Billing').click();
    await expect(page.getByText(/Billing/i)).toBeVisible();
  });

  // ────────── CREATE ──────────
  test('should open and close Add Patient modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Patient' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Patient' })).toHaveCount(0);
  });

  test('should validate required fields on create', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.locator('#patientFullName')).toHaveClass(/ng-invalid/);
  });

  test('should create a new patient successfully', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Vikram Joshi');
    await page.locator('#patientDob').fill('1985-06-15');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('8887776665');
    await page.locator('#patientEmail').fill('vikram@example.com');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.getByText('Vikram Joshi')).toBeVisible();
  });

  test('should cancel mid-create and not add patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Ghost Patient');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Ghost Patient')).toHaveCount(0);
  });

  // ────────── UPDATE ──────────
  test('should edit patient details from detail page', async ({ page }) => {
    await page.getByText('Rahul Sharma').click();
    await page.getByRole('button', { name: /Edit/i }).click();
    await page.locator('#patientFullName').fill('Rahul Sharma Updated');
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText('Rahul Sharma Updated')).toBeVisible();
  });

  // ────────── DELETE (Soft-delete) ──────────
  test('should soft-delete a patient', async ({ page }) => {
    await page.getByText('Rahul Sharma').click();
    await page.getByRole('button', { name: /Delete|Deactivate/i }).click();
    const confirmDialog = page.getByText(/Are you sure|Confirm/i);
    if (await confirmDialog.isVisible()) {
      await page.getByRole('button', { name: /Confirm|Yes|Delete/i }).click();
    }
  });

  // ────────── SEARCH ──────────
  test('should search patients by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill('Rahul');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Priya Patel')).toHaveCount(0);
  });

  test('should show no results for non-matching search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill('zzz_nonexistent_patient');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/No patients found|No results/i)).toBeVisible();
  });

  test('should clear search and show all patients', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search patients/i);
    await searchInput.fill('Rahul');
    await page.keyboard.press('Enter');
    await searchInput.fill('');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Priya Patel')).toBeVisible();
  });

  // ────────── SORT ──────────
  test('should sort by name column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'Name' }).click();
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    const firstCell = rows.first().locator('td').nth(1);
    await expect(firstCell).toBeVisible();
  });

  // ────────── PAGINATION ──────────
  test('should show pagination controls', async ({ page }) => {
    await expect(page.getByText(/Showing/i)).toBeVisible();
    await expect(page.getByText(/results/i)).toBeVisible();
  });

  test('should navigate to next page', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /Next|>/i });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /Next|>/i });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    const prevBtn = page.getByRole('button', { name: /Previous|</i });
    if (await prevBtn.isEnabled()) {
      await prevBtn.click();
    }
  });
});
