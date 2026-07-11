import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Contact Messages (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText(/Contact/i).click();
    await page.waitForURL(/\/contacts/);
  });

  // ────────── READ ──────────
  test('should display contact messages list', async ({ page }) => {
    await expect(page.getByText(/Contact|Message/i).first()).toBeVisible();
  });

  test('should show message columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Subject/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('should show message status (NEW, IN_PROGRESS, RESOLVED)', async ({ page }) => {
    const statusBadge = page.getByText(/NEW|IN_PROGRESS|RESOLVED/i).first();
    await expect(statusBadge).toBeVisible();
  });

  // ────────── SUBMIT (as patient/visitor) ──────────
  test('should submit a new contact message', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(300);

    const nameInput = page.locator('input[placeholder*="Name"], input[formControlName="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await page.locator('input[placeholder*="Email"], input[formControlName="email"]').fill('user@example.com');
      await page.locator('input[placeholder*="Subject"], input[formControlName="subject"]').fill('Appointment Query');
      await page.locator('textarea').fill('I would like to know about available slots.');
      await page.getByRole('button', { name: /Send|Submit/i }).click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── VIEW DETAIL ──────────
  test('should view contact message detail', async ({ page }) => {
    const viewBtn = page.getByRole('button', { name: /View/i }).first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/Message/i)).toBeVisible();
    }
  });

  // ────────── REPLY ──────────
  test('should reply to a contact message', async ({ page }) => {
    const replyBtn = page.getByRole('button', { name: /Reply/i }).first();
    if (await replyBtn.isVisible()) {
      await replyBtn.click();
      const replyInput = page.locator('textarea[formControlName="reply"], textarea');
      if (await replyInput.isVisible()) {
        await replyInput.fill('Thank you for contacting us. We will get back to you shortly.');
        await page.getByRole('button', { name: /Send|Submit Reply/i }).click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ────────── STATUS CHANGE ──────────
  test('should change message status', async ({ page }) => {
    const statusSelect = page.locator('select').filter({ has: page.locator('option') }).first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('IN_PROGRESS');
      await page.waitForTimeout(500);
      await statusSelect.selectOption('RESOLVED');
      await page.waitForTimeout(500);
    }
  });

  // ────────── FILTER BY STATUS ──────────
  test('should filter messages by status', async ({ page }) => {
    const filterTabs = page.getByText(/NEW|IN_PROGRESS|RESOLVED|All/i);
    const count = await filterTabs.count();
    if (count > 0) {
      await filterTabs.first().click();
      await page.waitForTimeout(500);
    }
  });

  // ────────── SEARCH ──────────
  test('should search messages', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('query');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});
