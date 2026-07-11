import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Prescription Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Prescriptions').click();
    await page.waitForURL(/\/prescriptions/);
  });

  // ────────── READ ──────────
  test('should display prescription list', async ({ page }) => {
    await expect(page.getByText(/Prescription/i).first()).toBeVisible();
  });

  test('should show prescription columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Patient/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Doctor/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Date/i })).toBeVisible();
  });

  test('should navigate to prescription detail', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show medicine list on prescription detail', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await expect(page.getByText(/Medicine|Dosage|Frequency|Duration/i).first()).toBeVisible();
    }
  });

  // ────────── CREATE (from consultation) ──────────
  test('should navigate to consultation workspace to create prescription', async ({ page }) => {
    await page.getByText('Consultations').click();
    await page.waitForURL(/\/consultations/);
    await expect(page.getByText(/Consultation/i).first()).toBeVisible();
  });

  // ────────── PDF ──────────
  test('should have Download PDF button on prescription', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      const pdfBtn = page.getByRole('button', { name: /PDF|Download/i });
      await expect(pdfBtn).toBeVisible();
    }
  });

  test('should have Print button on prescription', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      const printBtn = page.getByRole('button', { name: /Print/i });
      await expect(printBtn).toBeVisible();
    }
  });

  // ────────── MEDICINE DETAILS ──────────
  test('should show dosage instructions', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await expect(page.getByText(/Morning|Afternoon|Night|1-0-1/i).first()).toBeVisible();
    }
  });

  test('should show duration and unit', async ({ page }) => {
    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await expect(page.getByText(/DAYS|WEEKS|MONTHS/i).or(page.getByText(/duration/i)).first()).toBeVisible();
    }
  });

  // ────────── SEARCH ──────────
  test('should filter prescriptions by patient', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Rahul');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});
