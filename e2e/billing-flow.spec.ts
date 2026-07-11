import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Billing Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Billing').click();
    await expect(page).toHaveURL(/\/billing/);
  });

  test('should display the billing list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Bills & Invoices' })).toBeVisible();
  });

  test('should show bill list table with correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Invoice #' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Patient' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Paid' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Due' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('should display mock bills in the list', async ({ page }) => {
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Priya Patel')).toBeVisible();
  });

  test('should show correct status badges for bills', async ({ page }) => {
    await expect(page.getByText('PAID')).toBeVisible();
    await expect(page.getByText('UNPAID')).toBeVisible();
  });

  test('should have search input and status filter', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search/)).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('select option')).toContainText('All Status');
    await expect(page.locator('select option')).toContainText('Paid');
    await expect(page.locator('select option')).toContainText('Unpaid');
    await expect(page.locator('select option')).toContainText('Partially Paid');
  });

  test('should show correct payment amounts for bills', async ({ page }) => {
    await expect(page.getByText('₹525')).toBeVisible();
    await expect(page.getByText('₹419')).toBeVisible();
  });

  test('should navigate to invoice detail when clicking View', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page).toHaveURL(/\/billing\/b-001/);
  });

  test('should display invoice detail page with correct components', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Invoice')).toBeVisible();
    await expect(page.getByText('Collect Payment')).toBeVisible();
    await expect(page.getByText('Print')).toBeVisible();
  });

  test('should show invoice line items and totals', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Qty')).toBeVisible();
    await expect(page.getByText('Rate')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
  });

  test('should display patient info on invoice detail', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  test('should handle collect payment flow on invoice', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Collect Payment')).toBeVisible();
  });
});
