import { Page, expect, test } from '@playwright/test';
import { addMedicine, registerDoctor, registerPatient, signInAsNewAdmin } from './helpers';

/**
 * Pharmacy stock on real services: stock received in a batch against a supplier's invoice (the expiry date kept
 * exactly), issued to an inpatient (the stay is charged), part of it returned (the charge goes down), and every
 * movement on the medicine's ledger. No screen may log a failing API call.
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

test('stock received in a batch, issued to an inpatient and partly returned @desktop', async ({ page, request }) => {
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const medicine = `Amoxicillin ${stamp}`;
  const patientName = `Stock Patient ${stamp}`;
  const doctorName = `Dr. Stock ${stamp}`;
  await addMedicine(page, code, medicine, '5.00');
  await registerDoctor(page, code, doctorName, `91${stamp}51`.slice(0, 10));
  await registerPatient(page, code, patientName, `90${stamp}52`.slice(0, 10));

  // Receive 50 in batch AB12, expiring 30 June 2027, from a new supplier.
  await page.goto(`${code}/stock`);
  await page.locator('#stock-tab-receive').click();
  await page.getByLabel('New supplier').fill(`Medi Dist ${stamp}`);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('#receive-supplier')).not.toHaveValue('');
  await page.fill('#receive-invoice', `INV-${stamp}`);
  const medId = await page.locator('[data-line="0"] select option', { hasText: medicine }).getAttribute('value');
  await page.getByLabel('Medicine, line 1').selectOption(medId!);
  await page.getByLabel('Batch, line 1').fill('ab12');
  await page.getByLabel('Expiry, line 1').fill('2027-06-30');
  await page.getByLabel('Quantity, line 1').fill('50');
  await page.getByLabel('Cost per unit, line 1').fill('2.75');
  const received = page.waitForResponse((r) => /\/hms\/stock\/receipts$/.test(r.url()));
  await page.locator('#receive-save').click();
  expect((await received).ok(), 'stock received').toBeTruthy();
  await page.locator(`[data-medicine="${medicine}"]`).click();
  await expect(page.locator('#stock-detail [data-batch="AB12"]')).toContainText('30 Jun 2027');
  await expect(page.locator('#stock-detail [data-batch="AB12"]')).toContainText('50/50');

  // A ward with a bed, and the patient admitted.
  await page.goto(`${code}/ipd/wards`);
  await page.locator('#add-ward').click();
  await page.fill('#ward-name', `Ward ${stamp}`);
  await page.fill('#ward-rate', '0');
  await page.fill('#ward-bed-to', '1');
  await page.locator('#save-ward').click();
  await expect(page.locator(`[data-ward="Ward ${stamp}"]`)).toContainText('B-1', { timeout: 15000 });
  await page.goto(`${code}/ipd`);
  await page.locator(`[data-ward="Ward ${stamp}"] [data-bed="B-1"]`).click();
  await page.fill('#admit-patient', patientName);
  await page.locator(`[data-patient="${patientName}"]`).click();
  const doctor = await page.locator('#admit-doctor option', { hasText: doctorName }).getAttribute('value');
  await page.selectOption('#admit-doctor', doctor!);
  await page.fill('#admit-reason', 'Cellulitis');
  await page.locator('#admit-save').click();
  await page.waitForURL(/\/ipd\/admissions\/[0-9a-f-]{36}$/, { timeout: 15000 });

  // Issue 10 from stock: charged at ₹5 each.
  await page.locator('#action-issue').click();
  await page.selectOption('#issue-medicine', medId!);
  await page.fill('#issue-quantity', '10');
  const issued = page.waitForResponse((r) => /\/hms\/stock\/issues$/.test(r.url()));
  await page.locator('#panel-save').click();
  expect((await issued).ok(), 'issued').toBeTruthy();
  const charge = page.locator(`[data-charge="${medicine}"]`);
  await expect(charge).toContainText('× 10');
  await expect(charge).toContainText('₹50');

  // 3 come back unused: the charge is for 7.
  page.once('dialog', (d) => d.accept('3'));
  const returned = page.waitForResponse((r) => /\/hms\/stock\/returns$/.test(r.url()));
  await charge.getByRole('button', { name: `Return ${medicine}` }).click();
  expect((await returned).ok(), 'returned').toBeTruthy();
  await expect(charge).toContainText('× 7');
  await expect(charge).toContainText('₹35');

  // The ledger: 43 on hand, received, issued and returned.
  await page.goto(`${code}/stock`);
  await page.locator(`[data-medicine="${medicine}"]`).click();
  await expect(page.locator('#stock-detail [data-batch="AB12"]')).toContainText('43/50');
  await expect(page.locator('#stock-detail')).toContainText('Received');
  await expect(page.locator('#stock-detail')).toContainText('Issued to ward');
  await expect(page.locator('#stock-detail')).toContainText('Returned');
  expect(problems, problems.join('\n')).toEqual([]);
});
