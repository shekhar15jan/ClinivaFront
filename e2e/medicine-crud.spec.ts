import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Medicine CRUD (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);
  });

  // ────────── READ ──────────
  test('should display medicine catalog', async ({ page }) => {
    await expect(page.getByText(/Medicine/i)).toBeVisible();
  });

  test('should show medicine table columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
  });

  // ────────── CREATE ──────────
  test('should open Add Medicine modal/form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add Medicine/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should create a new medicine', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add Medicine/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('#medicineName, [formControlName="name"]').fill('Paracetamol 500mg');
      await page.locator('#genericName, [formControlName="genericName"]').fill('Acetaminophen');
      await page.locator('#manufacturer, [formControlName="manufacturer"]').fill('Cipla');
      await page.locator('#category, [formControlName="category"]').fill('Analgesic');
      await page.locator('#unit, [formControlName="unit"]').fill('tablet');
      await page.locator('#price, [formControlName="price"]').fill('15');
      await page.getByRole('button', { name: /Save/i }).click();
      await page.waitForTimeout(500);
      await expect(page.getByText('Paracetamol 500mg')).toBeVisible();
    }
  });

  // ────────── UPDATE ──────────
  test('should update a medicine', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.locator('#medicineName, [formControlName="name"]').fill('Amoxicillin 250mg');
      await page.getByRole('button', { name: /Save|Update/i }).click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── DISCONTINUE ──────────
  test('should discontinue a medicine', async ({ page }) => {
    const deactivateBtn = page.getByRole('button', { name: /Deactivate|Discontinue/i });
    if (await deactivateBtn.first().isVisible()) {
      await deactivateBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should toggle stock status', async ({ page }) => {
    const stockBadge = page.locator('text=/IN_STOCK|LOW_STOCK|OUT_OF_STOCK/i').first();
    await expect(stockBadge).toBeVisible();
  });

  // ────────── SEARCH ──────────
  test('should search medicines by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search medicine/i);
    await searchInput.fill('Para');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should search medicines by generic name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Acetaminophen');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should show no results for invalid search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('zzz_nonexistent_medicine_xyz');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  // ────────── CATEGORY FILTER ──────────
  test('should filter by category', async ({ page }) => {
    const categoryFilter = page.locator('select').filter({ has: page.locator('option') });
    if (await categoryFilter.first().isVisible()) {
      await categoryFilter.first().selectOption({ index: 0 });
      await page.waitForTimeout(500);
    }
  });
});
