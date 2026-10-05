import { Page, expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin } from './helpers';

/**
 * The lab on real services: the catalog started from common tests, tests ordered from the patient's screen, billed at
 * the desk, samples collected, results entered (a high sugar flagged as it is typed), verified, and the report
 * released. No screen may log a failing API call.
 */
function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400 && !r.url().includes('/auth/refresh')) {
      problems.push(`${r.status()} ${r.request().method()} ${r.url().split('/api/v1')[1]}`);
    }
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message.slice(0, 160)}`));
  return problems;
}

async function done(page: Page, path: RegExp, click: () => Promise<void>): Promise<void> {
  const res = page.waitForResponse((r) => path.test(r.url()) && r.request().method() !== 'GET');
  await click();
  const r = await res;
  expect(r.ok(), `${r.request().method()} ${r.url().split('/api/v1')[1]} (${r.status()})`).toBeTruthy();
}

test('tests ordered for a patient, billed, collected, resulted, verified and reported @desktop', async ({ page, request }) => {
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const patientName = `Lab Patient ${stamp}`;
  await registerPatient(page, code, patientName, `89${stamp}61`.slice(0, 10));

  // The catalog, from the common tests.
  await page.goto(`${code}/lab`);
  await page.locator('#go-lab-tests').click();
  await done(page, /\/hms\/lab\/tests\/starter$/, () => page.locator('#lab-starter').click());
  await expect(page.locator('[data-test="CBC"]')).toContainText('Complete Blood Count');

  // Ordered from the patient's screen: blood count and fasting sugar.
  await page.goto(`${code}/patients`);
  await page.getByText(patientName).first().click();
  await page.locator('#order-lab').click();
  await expect(page.locator('#order-for')).toContainText(patientName);
  await page.locator('[data-test="CBC"]').click();
  await page.locator('[data-test="FBS"]').click();
  await expect(page.locator('#order-tests')).toContainText('Order 2 tests');
  await done(page, /\/hms\/lab\/orders$/, () => page.locator('#order-tests').click());
  await page.waitForURL(/\/lab\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await expect(page.locator('#lab-order-status')).toHaveText('To collect');

  // The desk bills it; the lab collects the samples.
  await done(page, /\/bill$/, () => page.locator('#lab-bill').click());
  await expect(page.locator('#lab-order-header')).toContainText('Billed: BILL-');
  await done(page, /\/collect$/, () => page.locator('#lab-collect').click());
  await expect(page.locator('#lab-order-status')).toHaveText('In the lab');

  // Results: a fasting sugar of 142 is flagged high as it is typed.
  const sugar = page.locator('[data-item="Blood Sugar Fasting"]');
  await sugar.getByRole('button', { name: 'Enter results' }).click();
  await sugar.getByLabel('Glucose, fasting').fill('142');
  await expect(sugar).toContainText('HIGH');
  await done(page, /\/results$/, () => sugar.getByRole('button', { name: 'Save results' }).click());
  await expect(sugar).toContainText('142');
  await expect(sugar.locator('[data-status]')).toHaveText('resulted');

  // Verified: the report is released.
  await done(page, /\/verify$/, () => sugar.getByRole('button', { name: 'Verify' }).click());
  await expect(sugar.locator('[data-status]')).toHaveText('verified');
  await expect(page.locator('#lab-report')).toBeVisible();
  expect(problems, problems.join('\n')).toEqual([]);
});
