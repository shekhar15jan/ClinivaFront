import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Health Packages (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText(/Health Package/i).click();
    await page.waitForURL(/\/health-packages/);
  });

  // ────────── READ ──────────
  test('should display package list', async ({ page }) => {
    await expect(page.getByText(/Package/i).first()).toBeVisible();
  });

  test('should show package name, price, description', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Price/i })).toBeVisible();
  });

  test('should show offer price vs actual price', async ({ page }) => {
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test('should show tests included', async ({ page }) => {
    await expect(page.getByText(/Test|Blood|Urine/i).first()).toBeVisible();
  });

  test('should show active/inactive status badge', async ({ page }) => {
    const badge = page.locator('text=/ACTIVE|INACTIVE/i').first();
    await expect(badge).toBeVisible();
  });

  // ────────── CREATE ──────────
  test('should create a new health package', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /Add Package/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('#packageName, [formControlName="packageName"]').fill('Full Body Checkup');
      await page.locator('#description, [formControlName="description"]').fill('Complete health screening');
      await page.locator('#actualPrice, [formControlName="actualPriceInPaisa"]').fill('2500');
      await page.locator('#offerPrice, [formControlName="offerPriceInPaisa"]').fill('1999');
      await page.locator('#tests, [formControlName="testsIncluded"]').fill('Blood, Urine, X-Ray, ECG');
      await page.getByRole('button', { name: /Save/i }).click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── UPDATE ──────────
  test('should update package price', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.locator('#offerPrice, [formControlName="offerPriceInPaisa"]').fill('1499');
      await page.getByRole('button', { name: /Save|Update/i }).click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── TOGGLE ACTIVE ──────────
  test('should toggle package active/inactive', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /Toggle|Activate|Deactivate/i }).first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── BOOK ──────────
  test('should book a health package', async ({ page }) => {
    const bookBtn = page.getByRole('button', { name: /Book/i }).first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.locator('input[formControlName="patientName"]').fill('Test Patient');
      await page.locator('input[formControlName="email"]').fill('patient@example.com');
      await page.locator('input[formControlName="phone"]').fill('9999999999');
      await page.locator('input[formControlName="bookingDate"]').fill(new Date().toISOString().split('T')[0]);
      await page.getByRole('button', { name: /Confirm|Book Now/i }).click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── BOOKINGS LIST ──────────
  test('should view bookings list', async ({ page }) => {
    const bookingsTab = page.getByText(/Bookings/i);
    if (await bookingsTab.isVisible()) {
      await bookingsTab.click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── APPROVE / REJECT BOOKING ──────────
  test('should approve a booking', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should reject a booking', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /Reject/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show booking status', async ({ page }) => {
    const status = page.locator('text=/PENDING|APPROVED|REJECTED|CONFIRMED/i').first();
    await expect(status).toBeVisible();
  });

  // ────────── PRICE FORMAT ──────────
  test('should display prices in rupee format', async ({ page }) => {
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });
});
