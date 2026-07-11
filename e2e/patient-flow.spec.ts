import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Patient Flow (E2E)', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await expect(page).toHaveURL(/\/patients/);
  });

  test('should display the patient list with table headers', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Age/Gender' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last Visit' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should show patient rows with mock data', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'Rahul Sharma' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Priya Patel' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Amit Singh' })).toBeVisible();
  });

  test('should show search input and filter button', async ({ page }) => {
    await expect(page.getByPlaceholder('Search patients...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Patient' })).toBeVisible();
  });

  test('should open and close the Add Patient modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Patient' })).toBeVisible();
    await expect(page.locator('#patientFullName')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Patient' })).toHaveCount(0);
  });

  test('should create a new patient via the modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Test Patient E2E');
    await page.locator('#patientDob').fill('1990-01-15');
    await page.locator('#patientGender').selectOption('FEMALE');
    await page.locator('#patientPhone').fill('9999999999');
    await page.locator('#patientEmail').fill('test@example.com');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.getByText('Test Patient E2E')).toBeVisible();
  });

  test('should show validation on empty required fields in add modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await expect(page.locator('#patientFullName')).toHaveClass(/ng-invalid/);
  });

  test('should navigate to patient detail on name click', async ({ page }) => {
    await page.getByRole('link', { name: 'Rahul Sharma' }).click();
    await expect(page).toHaveURL(/\/patients\//);
    await expect(page.getByText('Patient Profile')).toBeVisible();
  });

  test('should display patient detail with overview tabs', async ({ page }) => {
    await page.getByRole('link', { name: 'Rahul Sharma' }).click();
    await expect(page.getByText('UHID: CLI-001')).toBeVisible();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('Medical History')).toBeVisible();
    await expect(page.getByText('Appointments')).toBeVisible();
    await expect(page.getByText('Billing')).toBeVisible();
  });

  test('should show pagination info on patient list', async ({ page }) => {
    await expect(page.getByText('Showing')).toBeVisible();
    await expect(page.getByText('results')).toBeVisible();
  });
});
