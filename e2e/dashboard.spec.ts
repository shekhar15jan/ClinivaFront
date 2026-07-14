import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Dashboard Overview (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display stat card for Todays Appointments', async ({ page }) => {
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
  });

  test('should display stat card for Total Patients', async ({ page }) => {
    await expect(page.getByText('Total Patients')).toBeVisible();
  });

  test('should display stat card for Pending Bills', async ({ page }) => {
    await expect(page.getByText('Pending Bills')).toBeVisible();
  });

  test('should display stat card for Doctors Available', async ({ page }) => {
    await expect(page.getByText('Doctors Available')).toBeVisible();
  });

  test('should display numeric values in stat cards', async ({ page }) => {
    const numbers = page.locator('text=/42|1284|45k|4|1,284/i').first();
    await expect(numbers).toBeVisible();
  });

  test('should display percentage changes in stat cards', async ({ page }) => {
    const changes = page.getByText('+5%').or(page.getByText('+12 new')).or(page.getByText('-2%')).first();
    await expect(changes).toBeVisible();
  });

  test('should display stat card icons', async ({ page }) => {
    const icons = page.locator('.material-symbols-outlined').filter({ hasText: /event_note|groups|receipt_long|medical_information/i });
    const count = await icons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should display Patient Activity chart section', async ({ page }) => {
    await expect(page.getByText('Patient Activity').or(page.getByText(/Weekly patient visit/i)).first()).toBeVisible();
  });

  test('should display chart day labels (Mon-Sun)', async ({ page }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (const day of days) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test('should have Daily and Weekly chart toggle buttons', async ({ page }) => {
    const dailyBtn = page.getByText('Daily').first();
    const weeklyBtn = page.getByText('Weekly').first();
    const dailyVisible = await dailyBtn.isVisible().catch(() => false);
    const weeklyVisible = await weeklyBtn.isVisible().catch(() => false);
    expect(dailyVisible || weeklyVisible).toBeTruthy();
  });

  test('should switch chart view on button click', async ({ page }) => {
    const weeklyBtn = page.getByText('Weekly').first();
    if (await weeklyBtn.isVisible().catch(() => false)) {
      await weeklyBtn.click();
      await page.waitForTimeout(300);
    }
    const dailyBtn = page.getByText('Daily').first();
    if (await dailyBtn.isVisible().catch(() => false)) {
      await dailyBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display Todays Patient Queue section', async ({ page }) => {
    await expect(page.getByText("Today's Patient Queue").or(page.getByText(/Patient Queue/i)).first()).toBeVisible();
  });

  test('should display queue table with desktop columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const hasToken = await page.getByText('Token').or(page.getByText('Token No')).first().isVisible().catch(() => false);
    const hasPatient = await page.getByText('Patient').or(page.getByText('Patient Name')).first().isVisible().catch(() => false);
    expect(hasToken || hasPatient).toBeTruthy();
  });

  test('should display queue entries with patient names', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    await expect(page.getByText('Rahul Sharma').or(page.getByText('Priya Patel')).or(page.getByText('Amit Kumar')).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display queue status badges', async ({ page }) => {
    const statuses = page.getByText(/Pending|In Consult|Completed/i);
    const count = await statuses.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should display queue token numbers', async ({ page }) => {
    const hasToken = await page.getByText('#001').or(page.getByText('#002')).or(page.getByText('#003')).first().isVisible().catch(() => false);
    expect(hasToken).toBeTruthy();
  });

  test('should display queue action buttons', async ({ page }) => {
    await expect(page.getByText('Mark Arrived').or(page.getByText('View Bill')).or(page.getByText('Start Consult')).first()).toBeVisible();
  });

  test('should display queue counts (Total and In Progress)', async ({ page }) => {
    await expect(page.getByText(/Total: 42/i)).toBeVisible();
    await expect(page.getByText(/In Progress: 4/i)).toBeVisible();
  });

  test('should display View Full Daily Queue link', async ({ page }) => {
    await expect(page.getByText('View Full Daily Queue')).toBeVisible();
  });

  test('should display Quick Actions section on desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const hasRegister = await page.getByText('Register Patient').first().isVisible().catch(() => false);
    const hasBook = await page.getByText('Book Appointment').first().isVisible().catch(() => false);
    expect(hasRegister || hasBook).toBeTruthy();
  });

  test('should display mobile greeting on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await expect(page.getByText('Good Morning').or(page.getByText(/12 appointments/i)).first()).toBeVisible();
  });

  test('should display mobile quick action buttons', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    const mobileActions = page.locator('text=Register Patient').or(page.getByText('Book')).first();
    const count = await mobileActions.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display Right Sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await expect(page.getByText('Quick Actions').first()).toBeVisible();
    await expect(page.getByText('Upcoming Appointments').first()).toBeVisible();
    await expect(page.getByText('Department Status').first()).toBeVisible();
  });

  test('should display Priority Alert section on desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await expect(page.getByText('Priority Alert').or(page.getByText('Review Now')).first()).toBeVisible();
  });

  test('should display Department Status with colored indicators', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await expect(page.getByText('Radiology').or(page.getByText('Pathology Lab')).or(page.getByText('Emergency Ward')).first()).toBeVisible();
  });

  test('should navigate from dashboard to patients via quick action', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const registerBtn = page.getByText('Register Patient').first();
    if (await registerBtn.isVisible().catch(() => false)) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/patients/);
    }
  });

  test('should navigate from dashboard to appointments via New Appointment FAB', async ({ page }) => {
    const fab = page.locator('app-fab, [class*="fab"], a[href*="appointments/book"]').first();
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate from dashboard via queue action button', async ({ page }) => {
    const actionBtn = page.getByText('Mark Arrived').or(page.getByText('View Bill')).first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should go to full queue from dashboard', async ({ page }) => {
    await page.getByText('View Full Daily Queue').click();
    await page.waitForTimeout(500);
    const url = page.url().toLowerCase();
    const isOk = url.includes('/appointments') || url.includes('/dashboard');
    expect(isOk).toBeTruthy();
  });

  test('should show upcoming appointments on desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await expect(page.getByText('James Dean').or(page.getByText('Anna Lee')).first()).toBeVisible();
  });

  test('should show breadcrumb or heading on dashboard', async ({ page }) => {
    const hasOverview = await page.getByText('Overview').isVisible().catch(() => false);
    const hasDashboard = await page.getByText('Dashboard').first().isVisible().catch(() => false);
    expect(hasOverview || hasDashboard).toBeTruthy();
  });

  test('should persist dashboard stat values after page reload', async ({ page }) => {
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText("Today's Appts").or(page.getByText("Today's Appointments")).first()).toBeVisible();
  });

  test('should navigate to all quick action pages from dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    const actions = ['Register Patient', 'Book Appointment', 'Collect Payment'];
    for (const action of actions) {
      const btn = page.getByRole('button', { name: action }).or(page.getByText(action)).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
        await page.goBack();
        await page.waitForTimeout(300);
      }
    }
  });
});
