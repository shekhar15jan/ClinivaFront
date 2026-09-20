import { expect, test } from '@playwright/test';
import { completePaidVisit, signInAsNewAdmin } from './helpers';

/**
 * What the clinic reads afterwards - dashboard, reports, payment list, audit trail - must agree with what
 * actually happened in the visit, not just render.
 */
test.describe('Numbers and trail after a paid visit, real backend', () => {
  test('dashboard, reports, payments and audit log all reflect the visit', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const visit = await completePaidVisit(page, request, browser, admin.hospitalCode);

    // Reports: revenue, the doctor's consultation, one paid bill.
    await page.goto(`/${admin.hospitalCode}/reports`);
    await expect(page.getByText('₹750').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(visit.doctorName).first()).toBeVisible();
    await expect(page.getByText(/1 consultations?/).first()).toBeVisible();
    await expect(page.getByText(/1 total patients/)).toBeVisible();
    // After a paid visit every chart has data; a leftover @else used to print "No data available" at the top regardless.
    await expect(page.getByText('No data available')).toHaveCount(0);

    // Payments: the row names the patient and the bill, and search finds it.
    await page.goto(`/${admin.hospitalCode}/payments`);
    const row = page.locator('tr', { hasText: visit.patientName });
    await expect(row).toContainText(visit.billNumber, { timeout: 15000 });
    await expect(row).toContainText('750');
    await page.getByPlaceholder(/Search by patient/).fill(visit.billNumber);
    await expect(page.locator('tr', { hasText: visit.patientName })).toHaveCount(1);
    await page.getByPlaceholder(/Search by patient/).fill('no-such-thing-zz');
    await expect(page.locator('tr', { hasText: visit.patientName })).toHaveCount(0);

    // Bills list shows it paid.
    await page.goto(`/${admin.hospitalCode}/billing`);
    await expect(page.locator('tr', { hasText: visit.patientName })).toContainText(/paid/i, { timeout: 15000 });

    // Audit log: who did what is recorded.
    await page.goto(`/${admin.hospitalCode}/audit-logs`);
    await expect(page.getByRole('heading', { name: /Audit/i }).first()).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
    const body = await page.locator('main').innerText();
    expect(body).toMatch(/Payment/);
    expect(body).toMatch(/Bill/);
    expect(body).toMatch(/Prescription/);
  });
});
