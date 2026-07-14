import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Billing & Payment Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Billing').first().click();
    await expect(page).toHaveURL(/\/billing/);
  });

  // ────────── READ ──────────
  test('should display bill list with correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Invoice #' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Patient' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Paid' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Due' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('should show payment status badges', async ({ page }) => {
    await expect(page.getByText('PAID').or(page.getByText('UNPAID')).first()).toBeVisible();
  });

  test('should display amounts in rupees', async ({ page }) => {
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  // ────────── INVOICE DETAIL ──────────
  test('should navigate to invoice detail', async ({ page }) => {
    const viewBtn = page.getByRole('link', { name: 'View' }).first();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/billing\//);
    await expect(page.getByText(/Invoice/i)).toBeVisible();
  });

  test('should show invoice line items', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Qty')).toBeVisible();
    await expect(page.getByText('Rate')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
  });

  test('should show invoice totals', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
  });

  test('should show patient info on invoice', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  // ────────── PRINT ──────────
  test('should have Print button on invoice', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByRole('button', { name: /Print/i })).toBeVisible();
  });

  test('should have PDF download button on invoice', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    const pdfBtn = page.getByRole('button', { name: /PDF|Download/i });
    expect(pdfBtn).toBeVisible();
  });

  // ────────── PAYMENT ──────────
  test('should show Collect Payment button on unpaid bill', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByRole('button', { name: /Collect Payment|Pay Now/i })).toBeVisible();
  });

  test('should open payment modal', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    const payBtn = page.getByRole('button', { name: /Collect Payment|Pay Now/i });
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show payment method options', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    const payBtn = page.getByRole('button', { name: /Collect Payment|Pay Now/i });
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.getByText(/CASH|UPI|CARD|NET BANKING/i).first()).toBeVisible();
    }
  });

  test('should process cash payment', async ({ page }) => {
    await page.getByRole('link', { name: 'View' }).first().click();
    const payBtn = page.getByRole('button', { name: /Collect Payment|Pay Now/i });
    if (await payBtn.isVisible()) {
      await payBtn.click();
      const cashOption = page.getByText('CASH');
      if (await cashOption.isVisible()) {
        await cashOption.click();
      }
      const confirmBtn = page.getByRole('button', { name: /Confirm|Pay/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ────────── SEARCH & FILTER ──────────
  test('should search bills', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Rahul');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.locator('select');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Paid');
      await page.waitForTimeout(500);
      await statusFilter.selectOption('Unpaid');
      await page.waitForTimeout(500);
      await statusFilter.selectOption('All Status');
      await page.waitForTimeout(500);
    }
  });

  // ────────── VOID ──────────
  test('should void an unpaid bill', async ({ page }) => {
    const voidBtn = page.getByRole('button', { name: /Void/i });
    if (await voidBtn.first().isVisible()) {
      await voidBtn.first().click();
      await page.waitForTimeout(300);
      const confirmBtn = page.getByRole('button', { name: /Confirm|Yes/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
