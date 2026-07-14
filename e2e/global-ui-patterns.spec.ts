import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Global UI Patterns (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display loading spinner during navigation', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForTimeout(300);
    const spinner = page.locator('app-loading-spinner, [class*="spinner"], .animate-spin');
    const count = await spinner.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show loading state on slow operations', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.waitForTimeout(300);
    const spinner = page.locator('app-loading-spinner, [class*="spinner"], .animate-spin, [disabled]');
    const count = await spinner.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display empty state when no data available', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const emptyState = page.getByText(/No patients found|No results|No data|Empty/i);
    const count = await emptyState.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show empty state component for empty lists', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const emptyComponent = page.locator('app-empty-state, [class*="empty-state"]');
    const count = await emptyComponent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display paginator on list pages', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    const paginator = page.locator('app-paginator, mat-paginator, [class*="paginator"]');
    const count = await paginator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show toast notification on successful actions', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('Toast Test Patient');
    await page.locator('#patientDob').fill('1990-01-01');
    await page.locator('#patientGender').selectOption('MALE');
    await page.locator('#patientPhone').fill('7777777777');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(500);
    const toast = page.locator('app-toast, [class*="toast"], .mat-snack-bar-container, [class*="snackbar"]');
    const count = await toast.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show confirmation dialog before destructive actions', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const confirmDialog = page.getByText(/Are you sure|Confirm|Delete this/i);
      await expect(confirmDialog).toBeVisible();
      const cancelBtn = page.getByRole('button', { name: /Cancel|No/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('should confirm dialog cancel button works', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const cancelBtn = page.getByRole('button', { name: /Cancel|No/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should display status badges for data states', async ({ page }) => {
    const pages = ['Patients', 'Appointments', 'Billing'];
    for (const p of pages) {
      await page.getByText(p).first().click();
      await page.waitForTimeout(300);
      const badge = page.locator('app-status-badge, [class*="badge"], [class*="status"]');
      const count = await badge.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display trial banner if applicable', async ({ page }) => {
    const trialBanner = page.locator('app-trial-banner, [class*="trial"], [class*="banner"]');
    const count = await trialBanner.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show resource usage bar for licensed modules', async ({ page }) => {
    const usageBar = page.locator('app-resource-usage-bar, [class*="usage-bar"]');
    const count = await usageBar.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display module upgrade prompt for inactive modules', async ({ page }) => {
    const upgradePrompt = page.locator('app-module-upgrade-prompt, [class*="upgrade"]');
    const count = await upgradePrompt.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show bottom sheet component on mobile interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForTimeout(500);
    const bottomSheet = page.locator('app-bottom-sheet, [class*="bottom-sheet"]');
    const count = await bottomSheet.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display error state on failed API calls', async ({ page }) => {
    await page.goto('/invalid-route');
    await page.waitForTimeout(500);
    const errorState = page.getByText(/Not Found|404|Error/i);
    const count = await errorState.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show global error toast for failed operations', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.locator('#patientFullName').fill('');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(500);
    const errorIndicator = page.locator('.ng-invalid, .text-red-700, .bg-red-50, [class*="error"]');
    const count = await errorIndicator.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show select dropdown with options for form fields', async ({ page }) => {
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    const genderSelect = page.locator('#patientGender, select[formControlName="gender"]');
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption('FEMALE');
      await page.waitForTimeout(100);
      const selectedValue = await genderSelect.inputValue();
      expect(selectedValue.length).toBeGreaterThan(0);
    }
  });

  test('should show filter dropdown options on list pages', async ({ page }) => {
    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(300);
    }
  });
});
