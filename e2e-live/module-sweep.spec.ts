import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

/**
 * Every screen a Professional-plan clinic can reach, on real services. The bar is low on purpose and
 * catches the most common breakage between this UI and its backend: a screen that renders while an
 * API call behind it fails, or that logs an error to the console.
 */
const LICENSED = [
  ['dashboard', 'Dashboard'],
  ['patients', 'Patients'],
  ['doctors', 'Doctors'],
  ['appointments', 'Appointments'],
  ['billing', 'Billing'],
  ['consultations', 'Consultations'],
  ['prescriptions', 'Prescriptions'],
  ['payments', 'Payments'],
  ['settings', 'Settings'],
  ['medicines', 'Medicines'],
  ['reports', 'Reports'],
  ['users', 'Users'],
  ['audit-logs', 'Audit logs'],
  ['health-packages', 'Health packages'],
  ['contacts', 'Contacts'],
  ['reviews', 'Reviews'],
] as const;

test.describe('Professional-plan clinic, real backend', () => {
  test('every licensed screen loads without a failing API call or console error', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const problems: string[] = [];
    let where = 'sign-in';
    page.on('response', (r) => {
      const url = r.url();
      if (url.includes('/api/v1/') && r.status() >= 400) problems.push(`[${where}] ${r.status()} ${r.request().method()} ${url.split('/api/v1')[1]}`);
    });
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource|favicon|woff2/i.test(m.text())) problems.push(`[${where}] console: ${m.text().slice(0, 160)}`);
    });
    page.on('pageerror', (e) => problems.push(`[${where}] uncaught: ${e.message.slice(0, 160)}`));

    for (const [path, label] of LICENSED) {
      where = label;
      await page.goto(`/${admin.hospitalCode}/${path}`);
      await page.waitForLoadState('networkidle');
      await expect(page, `${label} keeps its URL (not bounced elsewhere)`).toHaveURL(new RegExp(`/${admin.hospitalCode}/${path}`));
      await expect(page.locator('main, app-root').first()).toContainText(/\S/);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
