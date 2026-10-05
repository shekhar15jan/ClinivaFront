import { Page, expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin } from './helpers';

/** Radiology on real services: the catalog, an X-ray ordered from the patient, done with its images, reported, billed. */
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

test('an X-ray from order to signed report and bill @desktop', async ({ page, request }) => {
  test.setTimeout(240000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const patientName = `Xray Patient ${stamp}`;
  await registerPatient(page, code, patientName, `87${stamp}82`.slice(0, 10));

  await page.goto(`${code}/radiology/studies`);
  await page.locator('#rad-starter').click();
  await expect(page.locator('[data-study="XR-CHEST"]')).toBeVisible();

  await page.goto(`${code}/patients`);
  await page.getByText(patientName).first().click();
  await page.locator('#order-imaging').click();
  await expect(page.locator('#rad-order-for')).toContainText(patientName);
  await page.locator('[data-study="XR-CHEST"]').click();
  await page.locator('#place-imaging-order').click();
  await expect(page.locator('#rad-order-status')).toHaveText('To do');

  const item = page.locator('[data-item="X-ray Chest PA"]');
  await item.getByRole('button', { name: 'Mark done' }).click();
  await page.fill('#image-link', 'https://pacs.example/viewer/1');
  await page.locator('#rad-save').click();
  await expect(item.locator('[data-images]')).toBeVisible();

  await item.getByRole('button', { name: 'Write report' }).click();
  await page.fill('#findings', 'Lung fields clear. Cardiac size normal.');
  await page.fill('#impression', 'No active disease.');
  await page.locator('#rad-save').click();
  await expect(page.locator('#rad-order-status')).toHaveText('Reported');
  await expect(item.locator('[data-report]')).toContainText('No active disease.');
  await expect(page.locator('#rad-print')).toBeVisible();

  await page.locator('#rad-bill').click();
  await expect(page.locator('#rad-order-header')).toContainText('Billed: BILL-');
  expect(problems, problems.join('\n')).toEqual([]);
});
