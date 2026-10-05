import { Page, expect, test } from '@playwright/test';
import { registerDoctor, registerPatient, signInAsNewAdmin } from './helpers';

/**
 * A cashless stay on real services: common payers added, the patient's policy recorded from the stay, the claim
 * opened, pre-authorisation sent and approved, and the insurer's share shown off the patient's balance.
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

test('a claim for a stay, from the policy to an approved pre-authorisation @desktop', async ({ page, request }) => {
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const patientName = `Insured ${stamp}`;
  const doctorName = `Dr. Cover ${stamp}`;
  await registerDoctor(page, code, doctorName, `88${stamp}71`.slice(0, 10));
  await registerPatient(page, code, patientName, `87${stamp}72`.slice(0, 10));

  await page.goto(`${code}/insurance`);
  await page.locator('#tab-payers').click();
  await page.locator('#add-common-payers').click();
  await expect(page.locator('[data-payer="Ayushman Bharat PM-JAY"]')).toBeVisible({ timeout: 15000 });

  // Admit to a ₹2,000-a-day bed.
  await page.goto(`${code}/ipd/wards`);
  await page.locator('#add-ward').click();
  await page.fill('#ward-name', `Private ${stamp}`);
  await page.fill('#ward-rate', '2000');
  await page.fill('#ward-bed-to', '1');
  await page.locator('#save-ward').click();
  await expect(page.locator(`[data-ward="Private ${stamp}"]`)).toContainText('B-1', { timeout: 15000 });
  await page.goto(`${code}/ipd`);
  await page.locator(`[data-ward="Private ${stamp}"] [data-bed="B-1"]`).click();
  await page.fill('#admit-patient', patientName);
  await page.locator(`[data-patient="${patientName}"]`).click();
  const doctor = await page.locator('#admit-doctor option', { hasText: doctorName }).getAttribute('value');
  await page.selectOption('#admit-doctor', doctor!);
  await page.fill('#admit-reason', 'Appendicitis');
  await page.locator('#admit-save').click();
  await page.waitForURL(/\/ipd\/admissions\/[0-9a-f-]{36}$/, { timeout: 15000 });

  // The policy and the claim, from the stay.
  await page.locator('#action-insurance').click();
  const insurer = await page.locator('#new-policy select').first().locator('option', { hasText: 'Star Health' }).getAttribute('value');
  await page.locator('#new-policy select').first().selectOption(insurer!);
  const tpa = await page.locator('#new-policy select').nth(1).locator('option', { hasText: 'Medi Assist' }).getAttribute('value');
  await page.locator('#new-policy select').nth(1).selectOption(tpa!);
  await page.getByLabel('Policy or card number').fill(`SH/${stamp}`);
  await page.fill('#claim-requested', '50000');
  await page.locator('#panel-save').click();
  await page.waitForURL(/\/insurance\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await expect(page.locator('#claim-status')).toHaveText('Draft');

  // Pre-authorisation sent (the estimate filled in), then approved for ₹40,000.
  await page.locator('[data-step="SUBMIT_PREAUTH"]').click();
  await expect(page.locator('#step-amount')).toHaveValue('50000');
  await page.locator('#step-save').click();
  await expect(page.locator('#claim-status')).toHaveText('Pre-auth sent');
  await page.locator('[data-step="APPROVE"]').click();
  await page.fill('#step-amount', '40000');
  await page.locator('#step-save').click();
  await expect(page.locator('#claim-status')).toHaveText('Pre-auth approved');
  await expect(page.locator('#claim-timeline')).toContainText('Approved');

  // On the stay, the insurer's share comes off the patient's balance.
  await page.locator('#claim-header a', { hasText: 'IP-' }).click();
  await expect(page.locator('#account-insurance')).toContainText('40,000');
  expect(problems, problems.join('\n')).toEqual([]);
});
