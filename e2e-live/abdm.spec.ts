import { Page, expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin } from './helpers';

/** ABDM on real services: the facility's HFR ID, and a patient's ABHA checked (a typing slip refused) and saved. */
function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('response', (r) => {
    // The refused ABHA is expected: it is the check digit at work.
    if (r.url().includes('/api/v1/') && r.status() >= 400 && !r.url().includes('/auth/refresh') && !/\/abha$/.test(r.url())) {
      problems.push(`${r.status()} ${r.request().method()} ${r.url().split('/api/v1')[1]}`);
    }
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message.slice(0, 160)}`));
  return problems;
}

/** The Verhoeff check digit ABHA numbers carry. */
function checkDigit(digits: string): number {
  const d = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
  const p = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 8, 7, 6, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
  let c = 0;
  [...digits].reverse().forEach((ch, i) => (c = d[c][p[(i + 1) % 8][Number(ch)]]));
  return inv[c];
}

test('the facility HFR ID and a patient ABHA, checked and saved @desktop', async ({ page, request }) => {
  test.setTimeout(240000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const patientName = `Abha Patient ${stamp}`;
  await registerPatient(page, code, patientName, `86${stamp}81`.slice(0, 10));

  await page.goto(`${code}/abdm`);
  await expect(page.locator('#abdm-gateway')).toContainText('Not connected');
  await page.fill('#hfr-id', 'IN2710000123');
  await page.locator('#save-hfr').click();
  await expect(page.locator('#abdm-todo')).not.toContainText('Health Facility Registry');

  await page.goto(`${code}/patients`);
  await page.getByText(patientName).first().click();
  await page.locator('#edit-abha').click();
  const base = `91${stamp}12345`.slice(0, 13);
  const good = base + checkDigit(base);
  const slip = base + ((checkDigit(base) + 1) % 10);
  await page.fill('#abha-number', slip);
  await page.locator('#save-abha').click();
  await expect(page.locator('#abha-error')).toContainText('not a valid ABHA number');
  await page.fill('#abha-number', good);
  await page.fill('#abha-address', `patient${stamp}@abdm`);
  await page.locator('#save-abha').click();
  await expect(page.locator('#abha-value')).toContainText(`${good.slice(0, 2)}-${good.slice(2, 6)}-${good.slice(6, 10)}-${good.slice(10)}`);
  await expect(page.locator('#abha-value')).toContainText(`patient${stamp}@abdm`);
  expect(problems, problems.join('\n')).toEqual([]);
});
