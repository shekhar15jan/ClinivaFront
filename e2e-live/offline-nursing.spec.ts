import { Locator, Page, devices, expect, test } from '@playwright/test';
import { addStaffUser, registerDoctor, registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * CLIN-23 in a real browser with the network switched off: a nurse on a phone records vitals and writes a note while offline;
 * each shows as kept on the device, the chart does not break, and when the connection returns each is sent exactly once.
 */
async function tap(target: Locator): Promise<void> {
  await target.waitFor();
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await target.page().touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test('a nurse offline: vitals and a note wait on the device and are sent once when the network returns', async ({ page, request, browser }) => {
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const doctorName = `Dr. Offline ${stamp}`;
  const doctorEmail = `dr.off${stamp}@live-staff.test`;
  const nurseEmail = `nurse.off${stamp}@live-staff.test`;
  const patientName = `Offline Patient ${stamp}`;
  await registerDoctor(page, code, doctorName, `93${stamp}51`.slice(0, 10), doctorEmail);
  await registerPatient(page, code, patientName, `92${stamp}52`.slice(0, 10));
  await addStaffUser(page, code, { firstName: 'Offline', lastName: 'Nurse', email: nurseEmail, role: 'NURSE' });

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
  await page.fill('#admit-reason', 'Observation');
  await page.locator('#admit-save').click();
  await page.waitForURL(/\/ipd\/admissions\/[0-9a-f-]{36}$/, { timeout: 15000 });

  // The nurse, on a phone, opens the patient's chart while online.
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const nurse: Page = await context.newPage();
  const sent: string[] = [];
  nurse.on('response', (r) => {
    if (r.request().method() === 'POST' && /\/hms\/nursing\/admissions\/[^/]+\/(vitals|notes)$/.test(r.url()) && r.status() < 300) {
      sent.push(r.url().split('/').pop()! + ' ' + r.status());
    }
  });
  await signInWithOtp(nurse, request, nurseEmail);
  await nurse.locator('app-bottom-nav nav').getByText('Round').click();
  await nurse.locator(`[data-patient="${patientName}"]`).click();
  await tap(nurse.locator('#tab-vitals'));
  await expect(nurse.locator('#vitals-save')).toBeVisible();

  // The network goes off. Vitals are recorded; the screen says it is kept on the device and the chart stays.
  await context.setOffline(true);
  await nurse.fill('#v-temp', '37.4');
  await nurse.fill('#v-pulse', '82');
  await tap(nurse.locator('#vitals-save'));
  await expect(nurse.getByText(/Saved on this device/i).first()).toBeVisible({ timeout: 15000 });
  await expect(nurse.locator('#vitals-save')).toBeVisible();
  expect(sent, 'nothing reaches the server while offline').toEqual([]);

  // A note, still offline.
  await tap(nurse.locator('#tab-notes'));
  await nurse.fill('#note-text', 'Comfortable, no complaints, offline note.');
  await tap(nurse.locator('#note-save'));
  await expect(nurse.getByText(/Saved on this device/i).first()).toBeVisible({ timeout: 15000 });
  expect(sent).toEqual([]);

  // The network returns: each entry is sent once, in order, with no duplicates.
  await context.setOffline(false);
  await expect.poll(() => sent.length, { timeout: 60000, message: 'both entries are sent after reconnecting' }).toBe(2);
  await nurse.waitForTimeout(3000);
  expect(sent.length, 'no duplicate sends').toBe(2);
  expect(sent.map((s) => s.split(' ')[0]).sort()).toEqual(['notes', 'vitals']);

  // They are really stored: a fresh load of the chart has the note and the reading.
  await nurse.reload();
  await tap(nurse.locator('#tab-notes'));
  await expect(nurse.locator('#notes')).toContainText('offline note', { timeout: 20000 });
  await tap(nurse.locator('#tab-vitals'));
  await expect(nurse.locator('#vitals')).toContainText('37.4', { timeout: 20000 });
  await context.close();
});
