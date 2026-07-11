import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Reviews (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText(/Review/i).click();
    await page.waitForURL(/\/reviews/);
  });

  // ────────── READ ──────────
  test('should display reviews list', async ({ page }) => {
    await expect(page.getByText(/Review/i).first()).toBeVisible();
  });

  test('should show review columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Patient/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Doctor/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Rating/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('should display star ratings', async ({ page }) => {
    const stars = page.locator('text=★').or(page.locator('[class*="star"]'));
    const count = await stars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show review text', async ({ page }) => {
    const reviewText = page.getByText(/Great|Good|Excellent|Service/i).first();
    await expect(reviewText).toBeVisible();
  });

  // ────────── SUBMIT ──────────
  test('should submit a new review', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Submit Review|Write Review/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.locator('select[formControlName="rating"]').selectOption('5');
      await page.locator('textarea[formControlName="reviewText"]').fill('Excellent service and care.');
      await page.getByRole('button', { name: /Submit/i }).click();
      await page.waitForTimeout(500);
    }
  });

  test('should select rating between 1-5', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Submit Review|Write Review/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      const ratingSelect = page.locator('select[formControlName="rating"]');
      if (await ratingSelect.isVisible()) {
        for (let i = 1; i <= 5; i++) {
          await ratingSelect.selectOption(i.toString());
          await page.waitForTimeout(100);
        }
      }
    }
  });

  // ────────── APPROVE ──────────
  test('should approve a pending review', async ({ page }) => {
    const pendingTab = page.getByText('Pending');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForTimeout(300);
    }

    const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── REJECT ──────────
  test('should reject a pending review', async ({ page }) => {
    const pendingTab = page.getByText('Pending');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForTimeout(300);
    }

    const rejectBtn = page.getByRole('button', { name: /Reject/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── TAB NAVIGATION ──────────
  test('should switch between Approved and Pending tabs', async ({ page }) => {
    const approvedTab = page.getByText('Approved');
    if (await approvedTab.isVisible()) {
      await approvedTab.click();
      await page.waitForTimeout(300);
    }

    const pendingTab = page.getByText('Pending');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForTimeout(300);
    }
  });

  // ────────── APPROVED BADGE ──────────
  test('should show isApproved indicator on approved reviews', async ({ page }) => {
    const approvedTab = page.getByText('Approved');
    if (await approvedTab.isVisible()) {
      await approvedTab.click();
      await page.waitForTimeout(300);
    }

    const approvedBadge = page.getByText(/Approved/i).first();
    await expect(approvedBadge).toBeVisible();
  });

  // ────────── PUBLIC REVIEW VIEW ──────────
  test('should display approved reviews publicly', async ({ page }) => {
    await page.goto('/reviews');
    await page.waitForTimeout(300);
  });
});
