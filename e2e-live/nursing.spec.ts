import { Locator, Page, devices, expect, test } from '@playwright/test';
import { addStaffUser, registerDoctor, registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * Nursing on real services, on phones: the doctor orders a medicine from the round, the nurse records vitals (a fever
 * is flagged), gives a dose with one tap and writes the handover. No screen may log a failing API call.
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

/**
 * A finger tap at the element's centre. On the chart screen Playwright's own click and tap report the screen's host
 * element as covering its buttons although the browser's hit test finds the button there (a real tap works), so the
 * chart is driven with real touch events.
 */
async function tap(target: Locator): Promise<void> {
  await target.waitFor();
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await target.page().touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function saved(page: Page, button: string): Promise<void> {
  const done = page.waitForResponse((r) => /\/hms\/nursing\//.test(r.url()) && r.request().method() !== 'GET');
  await tap(page.locator(button));
  const res = await done;
  expect(res.ok(), `${res.request().method()} ${res.url().split('/api/v1')[1]} (${res.status()})`).toBeTruthy();
}

test('the doctor orders on the round, the nurse charts vitals, gives the dose and hands over, on phones', async ({ page, request, browser }) => {
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const doctorName = `Dr. Round ${stamp}`;
  const doctorEmail = `dr.round${stamp}@live-staff.test`;
  const nurseEmail = `nurse.round${stamp}@live-staff.test`;
  const patientName = `Round Patient ${stamp}`;
  await registerDoctor(page, code, doctorName, `93${stamp}41`.slice(0, 10), doctorEmail);
  await registerPatient(page, code, patientName, `92${stamp}42`.slice(0, 10));
  await addStaffUser(page, code, { firstName: 'Round', lastName: 'Nurse', email: nurseEmail, role: 'NURSE' });

  // A ward with a bed, and the patient admitted under the doctor.
  await page.goto(`${code}/ipd/wards`);
  await page.locator('#add-ward').click();
  await page.fill('#ward-name', `Medical ${stamp}`);
  await page.fill('#ward-rate', '1000');
  await page.fill('#ward-bed-to', '1');
  await page.locator('#save-ward').click();
  await expect(page.locator(`[data-ward="Medical ${stamp}"]`)).toContainText('B-1', { timeout: 15000 });
  await page.goto(`${code}/ipd`);
  await page.locator(`[data-ward="Medical ${stamp}"] [data-bed="B-1"]`).click();
  await page.fill('#admit-patient', patientName);
  await page.locator(`[data-patient="${patientName}"]`).click();
  const doctor = await page.locator('#admit-doctor option', { hasText: doctorName }).getAttribute('value');
  await page.selectOption('#admit-doctor', doctor!);
  await page.fill('#admit-reason', 'Fever and cough');
  await page.locator('#admit-save').click();
  await page.waitForURL(/\/ipd\/admissions\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await expect(page.locator('#action-chart')).toBeVisible();

  // The doctor, on a phone: Round in the bottom bar, the patient, and a TDS order.
  const doctorPhone = await browser.newContext({ ...devices['Pixel 7'] });
  const dr = await doctorPhone.newPage();
  const drProblems = watch(dr);
  await signInWithOtp(dr, request, doctorEmail);
  await dr.locator('app-bottom-nav nav').getByText('Round').click();
  await dr.locator(`[data-patient="${patientName}"]`).click();
  await tap(dr.locator('#order-medicine'));
  await dr.fill('#order-name', 'Paracetamol');
  await dr.fill('#order-dose', '650 mg');
  await tap(dr.locator('#order-frequencies [data-frequency="QID"]'));
  await dr.fill('#order-days', '3');
  await saved(dr, '#order-save');
  await expect(dr.locator('[data-order="Paracetamol"]')).toContainText('650 mg');
  expect(drProblems, drProblems.join('\n')).toEqual([]);
  await doctorPhone.close();

  // The nurse, on a phone: vitals with a fever, a dose given, the handover.
  const nursePhone = await browser.newContext({ ...devices['Pixel 7'] });
  const nurse = await nursePhone.newPage();
  const nurseProblems = watch(nurse);
  await signInWithOtp(nurse, request, nurseEmail);
  await expect(nurse.locator('app-bottom-nav nav').getByRole('link')).toHaveText([/Home/, /Schedule/, /Patients/, /Round/, /Beds/]);
  await nurse.locator('app-bottom-nav nav').getByText('Round').click();
  const card = nurse.locator(`[data-patient="${patientName}"]`);
  await expect(card).toContainText('Vitals due', { timeout: 15000 });
  await card.click();

  await tap(nurse.locator('#tab-vitals'));
  await nurse.fill('#v-temp', '38.7');
  await nurse.fill('#v-pulse', '104');
  await nurse.fill('#v-spo2', '96');
  await saved(nurse, '#vitals-save');
  await expect(nurse.locator('#vitals')).toContainText('Fever 38.7');

  await tap(nurse.locator('#tab-medicines'));
  const slot = nurse.locator('[data-order="Paracetamol"] button[data-slot]:not([disabled])').first();
  await tap(slot);
  await saved(nurse, '#dose-given');
  await expect(nurse.locator('[data-order="Paracetamol"] [data-slot="GIVEN"]')).toHaveCount(1);

  await tap(nurse.locator('#tab-notes'));
  await tap(nurse.getByRole('button', { name: 'Handover' }));
  await nurse.fill('#note-text', 'Febrile 38.7, paracetamol given, encourage fluids.');
  await saved(nurse, '#note-save');
  await expect(nurse.locator('#notes')).toContainText('encourage fluids');
  expect(nurseProblems, nurseProblems.join('\n')).toEqual([]);
  await nursePhone.close();
});
