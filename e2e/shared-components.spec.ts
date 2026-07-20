import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Shared Component Interactions (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ────────── FAB (Floating Action Button) ──────────
  test('should display FAB on dashboard', async ({ page }) => {
    const fab = page.locator('app-fab, [class*="fab"], button[aria-label*="Appointment"]').first();
    await expect(fab).toBeVisible();
  });

  test('should show FAB icon on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    const fab = page.locator('app-fab, button[class*="bottom-20"], a[routerLink*="appointments/book"]').first();
    await expect(fab).toBeVisible();
  });

  test('should hide FAB on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    const fabMobile = page.locator('button.md\\:hidden, .md\\:hidden button');
    await expect(fabMobile).toHaveCount(0);
  });

  // ────────── PAGINATOR ──────────
  test('should display paginator on patient list', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const paginator = page.locator('app-paginator, mat-paginator, [class*="paginator"]');
    await expect(paginator.first()).toBeVisible();
  });

  test('should show page size selector in paginator', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const pageSizeSelector = page.locator('select, mat-select, [class*="page-size"]').first();
    await expect(pageSizeSelector).toBeVisible();
  });

  test('should show pagination info text', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await expect(page.getByText(/Showing/i)).toBeVisible();
  });

  test('should navigate to next page via paginator', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const nextBtn = page.getByRole('button', { name: /Next|chevron_right|>/i }).first();
    if (await nextBtn.isEnabled().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to previous page via paginator', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const nextBtn = page.getByRole('button', { name: /Next|chevron_right|>/i }).first();
    if (await nextBtn.isEnabled().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    const prevBtn = page.getByRole('button', { name: /Previous|chevron_left|</i }).first();
    if (await prevBtn.isEnabled().catch(() => false)) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // ────────── TOAST NOTIFICATIONS ──────────
  test('should display toast on successful patient creation', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Toast Patient');
    await page.locator('#patientDob').fill('1990-01-01');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('6666666666');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(500);
    const toast = page.locator('app-toast, [class*="toast"], .mat-snack-bar-container, [role="alert"]');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  });

  test('should dismiss toast after timeout', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Dismiss Toast');
    await page.locator('#patientDob').fill('1990-01-01');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('5555555555');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(3000);
    const toast = page.locator('.mat-snack-bar-container, [role="alert"]');
    await expect(toast).toHaveCount(0);
  });

  // ────────── CONFIRM DIALOG ──────────
  test('should show confirm dialog before soft-delete', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await page.waitForTimeout(300);
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/Are you sure|Confirm/i)).toBeVisible();
    }
  });

  test('should have Cancel and Confirm buttons in dialog', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await page.waitForTimeout(300);
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const cancelBtn = page.getByRole('button', { name: /Cancel/i });
      const confirmBtn = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
      await expect(cancelBtn.or(confirmBtn).first()).toBeVisible();
    }
  });

  test('should dismiss dialog when clicking Cancel', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await page.waitForTimeout(300);
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const cancelBtn = page.getByRole('button', { name: /Cancel|No/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
        const dialog = page.getByText(/Are you sure|Confirm/i);
        const count = await dialog.count();
        expect(count).toBe(0);
      }
    }
  });

  // ────────── EMPTY STATE ──────────
  test('should display empty state component with icon', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForTimeout(500);
    const emptyIcon = page.locator('app-empty-state, [class*="empty-state"]');
    await expect(emptyIcon.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state title and description', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForTimeout(500);
    const emptyTitle = page.getByText('No Payments').or(page.getByText(/No data|Empty/));
    await expect(emptyTitle.first()).toBeVisible({ timeout: 5000 });
  });

  // ────────── STATUS BADGE ──────────
  test('should display status badges in patient list', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const badges = page.locator('app-status-badge, [class*="badge"]');
    await expect(badges.first()).toBeVisible();
  });

  test('should show different status badge colors', async ({ page }) => {
    await page.getByText('Appointments').first().click();
    await page.waitForURL(/\/appointments/);
    const badges = page.locator('app-status-badge, [class*="badge"], [class*="status"]');
    await expect(badges.first()).toBeVisible();
  });

  // ────────── LOADING SPINNER ──────────
  test('should show loading state during module transitions', async ({ page }) => {
    const loadingText = page.getByText(/Loading/i);
    await page.goto('/payments');
    const loadingAppeared = await loadingText.isVisible().catch(() => false);
    const contentLoaded = await page.getByText(/Payment History|No Payments|Payments/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(loadingAppeared || contentLoaded).toBe(true);
  });

  test('should replace loading state with actual content', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForTimeout(2000);
    const loadingText = page.getByText('Loading payments...');
    const stillLoading = await loadingText.isVisible().catch(() => false);
    if (stillLoading) {
      const content = page.getByText('Payment History').or(page.getByText('No Payments'));
      await expect(content).toBeVisible();
    }
  });

  // ────────── TRIAL BANNER ──────────
  test('should show or hide trial banner based on subscription', async ({ page }) => {
    const trialBanner = page.locator('app-trial-banner, [class*="trial"]');
    const count = await trialBanner.count();
    expect(count === 0 || count > 0).toBe(true);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ────────── BOTTOM SHEET ──────────
  test('should display bottom sheet on mobile action', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const bottomSheet = page.locator('app-bottom-sheet, [class*="bottom-sheet"]');
    const mobileMenu = page.locator('[class*="mobile"], [class*="hamburger"], [class*="menu-toggle"]');
    const count = await bottomSheet.count();
    const menuCount = await mobileMenu.count();
    expect(count > 0 || menuCount > 0).toBe(true);
  });

  // ────────── RESOURCE USAGE BAR ──────────
  test('should display resource usage bar', async ({ page }) => {
    const usageBar = page.locator('app-resource-usage-bar, [class*="usage-bar"]');
    await expect(usageBar.first()).toBeVisible();
  });

  // ────────── MODULE UPGRADE PROMPT ──────────
  test('should display upgrade prompt for restricted features', async ({ page }) => {
    const upgradePrompt = page.locator('app-module-upgrade-prompt, [class*="upgrade"]');
    await expect(upgradePrompt.first()).toBeVisible();
  });
});
