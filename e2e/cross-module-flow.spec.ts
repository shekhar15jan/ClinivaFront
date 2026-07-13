import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Cross-Module Integration Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate from dashboard to all major modules sequentially', async ({ page }) => {
    const moduleLinks = [
      { text: 'Patients', url: /\/patients/ },
      { text: 'Doctors', url: /\/doctors/ },
      { text: 'Appointments', url: /\/appointments/ },
      { text: 'Consultations', url: /\/consultations/ },
      { text: 'Prescriptions', url: /\/prescriptions/ },
      { text: 'Billing', url: /\/billing/ },
      { text: 'Reports', url: /\/reports/ },
    ];
    for (const mod of moduleLinks) {
      await page.getByText(mod.text).first().click();
      await expect(page).toHaveURL(mod.url);
    }
  });

  test('should navigate from patient list to detail and see appointments tab', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await page.getByText('Appointments').click();
    await expect(page.getByText(/Appointments/i)).toBeVisible();
  });

  test('should navigate from patient detail to appointment billing tab', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await page.getByText('Billing').click();
    await expect(page.getByText(/Billing|Bill/i)).toBeVisible();
  });

  test('should navigate from patient detail to medical history', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    await page.getByText('Rahul Sharma').click();
    await expect(page).toHaveURL(/\/patients\//);
    await page.getByText('Medical History').click();
    await expect(page.getByText(/History|Medical/i)).toBeVisible();
  });

  test('should navigate from doctor detail to availability schedule', async ({ page }) => {
    await page.getByText('Doctors').click();
    await page.waitForURL(/\/doctors/);
    await page.getByText('Dr. Anita Desai').click();
    await expect(page).toHaveURL(/\/doctors\//);
    await expect(page.getByText(/Availability|Schedule/i)).toBeVisible();
  });

  test('should navigate from appointment calendar to booking wizard', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
    await expect(page.getByText('Step 1')).toBeVisible();
    await page.getByRole('button', { name: /Cancel|Back/i }).click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should navigate from billing list to invoice detail', async ({ page }) => {
    await page.getByText('Billing').click();
    await page.waitForURL(/\/billing/);
    const viewBtn = page.getByRole('link', { name: 'View' }).first();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/billing\//);
    await expect(page.getByText(/Invoice/i)).toBeVisible();
    await expect(page.getByText('Collect Payment')).toBeVisible();
  });

  test('should navigate from reports dashboard to revenue report', async ({ page }) => {
    await page.getByText('Reports').click();
    await page.waitForURL(/\/reports/);
    const revenueTab = page.getByText(/Revenue/i);
    if (await revenueTab.isVisible()) {
      await revenueTab.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/₹/).first()).toBeVisible();
    }
  });

  test('should navigate from medicines to prescription creation flow', async ({ page }) => {
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);
    await expect(page.getByText(/Medicine/i).first()).toBeVisible();
    await page.getByText('Consultations').click();
    await page.waitForURL(/\/consultations/);
    await expect(page.getByText(/Consultation/i).first()).toBeVisible();
  });

  test('should navigate from settings back to dashboard', async ({ page }) => {
    await page.getByText('Settings').click();
    await page.waitForURL(/\/settings/);
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
    await page.getByText('Dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should switch between day/week/month calendar views', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await page.getByRole('button', { name: 'Week' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Day' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
  });

  test('should navigate back from invoice detail to billing list', async ({ page }) => {
    await page.getByText('Billing').click();
    await page.waitForURL(/\/billing/);
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page).toHaveURL(/\/billing\//);
    await page.goBack();
    await expect(page).toHaveURL(/\/billing/);
  });

  test('should open booking wizard step 1 and return to appointments list', async ({ page }) => {
    await page.getByText('Appointments').click();
    await page.waitForURL(/\/appointments/);
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
    await page.locator('[routerlink="/appointments"]').first().click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should navigate to all admin-only routes from sidebar', async ({ page }) => {
    const adminLinks = ['Users', 'Audit Logs'];
    for (const link of adminLinks) {
      const el = page.getByText(link);
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should navigate between patient list pages', async ({ page }) => {
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);
    const nextBtn = page.getByRole('button', { name: /Next|>/i });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    const prevBtn = page.getByRole('button', { name: /Previous|</i });
    if (await prevBtn.isEnabled()) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
