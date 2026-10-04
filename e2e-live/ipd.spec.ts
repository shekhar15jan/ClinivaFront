import { Page, devices, expect, test } from '@playwright/test';
import { addStaffUser, registerDoctor, registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * An inpatient stay on real services, through the screens: wards and beds are set up, a patient is admitted to a free
 * bed with an advance, moved, charged, the discharge summary written, the final bill made with the advance credited,
 * the excess given back, and the patient discharged; the bed goes for cleaning and a nurse on a phone marks it ready.
 * No screen may log a failing API call.
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

async function save(page: Page): Promise<void> {
  const done = page.waitForResponse((r) => /\/hms\/ipd\//.test(r.url()) && r.request().method() !== 'GET');
  await page.locator('#panel-save').click();
  const res = await done;
  expect(res.ok(), `${res.request().method()} ${res.url().split('/api/v1')[1]} (${res.status()})`).toBeTruthy();
}

test('a stay from a free bed to discharge, and the nurse readies the bed on a phone', async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const doctorName = `Dr. Ward ${stamp}`;
  const patientName = `Inpatient ${stamp}`;
  const wardName = `General ${stamp}`;
  await registerDoctor(page, code, doctorName, `96${stamp}21`.slice(0, 10));
  await registerPatient(page, code, patientName, `95${stamp}22`.slice(0, 10));

  // Wards and beds: one ward at ₹1,500 a day with beds B-1 to B-3.
  await page.goto(`${code}/ipd`);
  await expect(page.locator('#no-wards')).toBeVisible({ timeout: 15000 });
  await page.locator('#go-wards').click();
  await page.locator('#add-ward').click();
  await page.fill('#ward-name', wardName);
  await page.fill('#ward-rate', '1500');
  await page.fill('#ward-bed-to', '3');
  await page.locator('#save-ward').click();
  await expect(page.locator(`[data-ward="${wardName}"]`)).toContainText('B-3', { timeout: 15000 });

  // Admit from the board: tap a free bed, find the patient, pick the doctor, take ₹5,000 in advance.
  await page.goto(`${code}/ipd`);
  await expect(page.locator('#count-available')).toHaveText('3', { timeout: 15000 });
  await page.locator('[data-bed="B-1"]').click();
  await page.fill('#admit-patient', patientName);
  await page.locator(`[data-patient="${patientName}"]`).click();
  const doctor = await page.locator('#admit-doctor option', { hasText: doctorName }).getAttribute('value');
  await page.selectOption('#admit-doctor', doctor!);
  await page.fill('#admit-reason', 'Fever and breathlessness for 3 days');
  await page.fill('#admit-advance', '5000');
  await page.locator('#admit-save').click();
  await page.waitForURL(/\/ipd\/admissions\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await expect(page.locator('#admission-status')).toHaveText('In hospital');
  await expect(page.locator('#admission-header')).toContainText('bed B-1');

  // A charge, then a move to B-2.
  await page.locator('#action-charge').click();
  await page.fill('#charge-description', 'Dressing');
  await page.fill('#charge-quantity', '2');
  await page.fill('#charge-price', '250');
  await save(page);
  await expect(page.locator('[data-charge="Dressing"]')).toContainText('500');
  await page.locator('#action-move').click();
  await page.locator('#free-beds [data-bed="B-2"]').click();
  await save(page);
  await expect(page.locator('#admission-header')).toContainText('bed B-2');

  // The discharge summary advises discharge; the final bill credits the advance; the excess goes back.
  await page.locator('#action-summary').click();
  await page.fill('#summary-diagnosis', 'Community-acquired pneumonia');
  await page.fill('#summary-advice', 'Oral antibiotics for 5 days');
  await save(page);
  await expect(page.locator('#admission-status')).toHaveText('Discharge advised');
  await expect(page.locator('#final-diagnosis')).toContainText('pneumonia');
  await page.locator('#action-bill').click();
  await save(page);
  await expect(page.locator('#account')).toContainText('Final bill');
  await expect(page.locator('#account-balance')).toContainText('to give back');
  await page.locator('#action-refund').click();
  await save(page);
  await expect(page.locator('#account-balance')).toHaveText('Settled');

  // Discharge: the bed goes for cleaning.
  await page.locator('#action-discharge').click();
  await save(page);
  await expect(page.locator('#admission-status')).toHaveText('Discharged');
  await page.goto(`${code}/ipd`);
  await expect(page.locator('[data-bed="B-2"]')).toHaveAttribute('data-status', 'CLEANING', { timeout: 15000 });

  // The patient's screen lists the stay; the bill is itemised.
  await page.goto(`${code}/ipd/admissions`);
  await page.locator('#admission-stages button', { hasText: 'Discharged' }).click();
  await expect(page.locator('#admissions')).toContainText(patientName, { timeout: 15000 });
  expect(problems, problems.join('\n')).toEqual([]);

  // A ward nurse on a phone: Beds is in the bottom bar, and a bed being cleaned is marked ready with one tap.
  const nurseEmail = `ward.nurse${stamp}@live-staff.test`;
  await addStaffUser(page, code, { firstName: 'Ward', lastName: 'Nurse', email: nurseEmail, role: 'NURSE' });
  const phone = await browser.newContext({ ...devices['Pixel 7'] });
  const nurse = await phone.newPage();
  const nurseProblems = watch(nurse);
  await signInWithOtp(nurse, request, nurseEmail);
  await nurse.locator('app-bottom-nav nav').getByText('Beds').click();
  await expect(nurse.locator('[data-bed="B-2"]')).toHaveAttribute('data-status', 'CLEANING', { timeout: 15000 });
  await expect(nurse.locator('#go-wards')).toHaveCount(0);
  await nurse.locator('[data-bed="B-2"]').click();
  await expect(nurse.locator('[data-bed="B-2"]')).toHaveAttribute('data-status', 'AVAILABLE', { timeout: 15000 });
  expect(nurseProblems, nurseProblems.join('\n')).toEqual([]);
  await phone.close();
});
