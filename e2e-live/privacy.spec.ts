import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * Privacy and consent on the real backend: the administrator names the privacy officer and publishes the clinic's
 * own notice; the desk registers an adult (notice given, one optional purpose) and a child (a named guardian); the
 * consents show on the patient's record with their history; the patient changes a choice in the portal.
 */
test.describe('Privacy and consent, real backend', () => {
  test('notice, officer, consent at registration, a guardian for a child, and the patient changing their mind @desktop',
    async ({ page, request, browser }) => {
      const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
      const code = admin.hospitalCode;
      const stamp = Date.now().toString().slice(-6);

      // The administrator: officer, consent age, and the clinic's own notice as version 1.
      await page.goto(`${code}/privacy`);
      await expect(page.locator('#privacy-notice-version')).toContainText('Built-in');
      await page.fill('#privacy-officer-name', 'Meera Iyer');
      await page.fill('#privacy-officer-email', `privacy${stamp}@clinic.test`);
      await page.locator('#privacy-save').click();
      await expect(page.getByText('Privacy settings saved')).toBeVisible();
      const ownNotice = `Our own notice ${stamp}. We keep your records to treat you.`;
      await page.fill('#privacy-notice-body', ownNotice);
      await page.locator('#privacy-publish').click();
      await expect(page.locator('#privacy-notice-version')).toContainText('Version 1');
      await expect(page.locator('#privacy-versions [data-version="1"]')).toBeVisible();

      // The desk registers an adult: Save waits for the notice; one optional purpose is ticked.
      const adultEmail = `privacy.adult${stamp}@live-portal.test`;
      await page.goto(`${code}/patients`);
      await page.getByRole('button', { name: /Add Patient/ }).click();
      await page.fill('#patientFullName', `Privacy Adult ${stamp}`);
      await page.fill('#patientDob', '1985-04-12');
      await page.selectOption('#patientGender', 'FEMALE');
      await page.fill('#patientPhone', `93${stamp}41`.slice(0, 10));
      await page.fill('#patientEmail', adultEmail);
      const save = page.getByRole('button', { name: /Save Patient/ });
      await expect(save, 'not without the privacy notice').toBeDisabled();
      await page.getByRole('button', { name: 'read it' }).click();
      await expect(page.locator('#patient-notice-text')).toContainText(ownNotice);
      await page.check('#patientNoticeGiven');
      await expect(page.locator('#patientConsent-REMINDERS')).not.toBeChecked();
      await page.check('#patientConsent-REMINDERS');
      const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
      await save.click();
      const adult = (await (await created).json()).data;

      await page.goto(`${code}/patients/${adult.id}`);
      const panel = page.locator('#patient-consents');
      await expect(panel.locator('[data-purpose="CARE"] [data-state]')).toHaveAttribute('data-state', 'yes');
      await expect(panel.locator('[data-purpose="REMINDERS"] [data-state]')).toHaveAttribute('data-state', 'yes');
      await expect(panel.locator('[data-purpose="MARKETING"] [data-state]')).toHaveAttribute('data-state', 'no');
      await expect(panel.locator('[data-purpose="CARE"]')).toContainText('in person, notice v1');

      // A child: the guardian is asked for, and named on every consent.
      await page.goto(`${code}/patients`);
      await page.getByRole('button', { name: /Add Patient/ }).click();
      await page.fill('#patientFullName', `Privacy Child ${stamp}`);
      await page.fill('#patientDob', `${new Date().getFullYear() - 9}-02-03`);
      await page.selectOption('#patientGender', 'MALE');
      await page.fill('#patientPhone', `94${stamp}42`.slice(0, 10));
      await page.check('#patientNoticeGiven');
      await expect(page.locator('#patient-minor')).toBeVisible();
      await expect(save, 'not without the guardian').toBeDisabled();
      await page.fill('#patientGuardianName', 'Sunita Rao');
      await page.fill('#patientGuardianRelation', 'Mother');
      const child = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
      await save.click();
      const childId = (await (await child).json()).data.id;
      await page.goto(`${code}/patients/${childId}`);
      await expect(page.locator('#consents-minor')).toBeVisible();
      await expect(panel.locator('[data-purpose="CARE"]')).toContainText('by Sunita Rao (Mother)');

      // The patient, in the portal: sees the clinic's notice and officer, and withdraws reminders.
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const portal = await context.newPage();
      await signInWithOtp(portal, request, adultEmail);
      await portal.goto(`${code}/patient/privacy`);
      await expect(portal.locator('#my-privacy-notice')).toContainText(ownNotice);
      await expect(portal.locator('#my-privacy-officer')).toContainText('Meera Iyer');
      const mine = portal.locator('#patient-consents');
      await expect(mine.locator('[data-purpose="REMINDERS"] [data-state]')).toHaveAttribute('data-state', 'yes');
      await mine.locator('[data-change="REMINDERS"]').click();
      await expect(mine.locator('[data-purpose="REMINDERS"] [data-state]')).toHaveAttribute('data-state', 'no');
      await expect(mine.locator('[data-purpose="REMINDERS"]')).toContainText('by you, in the portal');
      await context.close();

      // Back at the desk, the history shows both choices.
      await page.goto(`${code}/patients/${adult.id}`);
      await expect(panel.locator('[data-purpose="REMINDERS"] [data-state]')).toHaveAttribute('data-state', 'no');
      await panel.locator('#consent-history summary').click();
      await expect(panel.locator('#consent-history li')).toHaveCount(6);
    });

  test('a patient downloads their data and asks for a correction; the privacy officer answers within the deadline @desktop',
    async ({ page, request, browser }) => {
      const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
      const code = admin.hospitalCode;
      const stamp = Date.now().toString().slice(-6);
      const email = `privacy.rights${stamp}@live-portal.test`;
      await page.goto(`${code}/patients`);
      await page.getByRole('button', { name: /Add Patient/ }).click();
      await page.fill('#patientFullName', `Rights Patient ${stamp}`);
      await page.fill('#patientDob', '1975-08-09');
      await page.selectOption('#patientGender', 'MALE');
      await page.fill('#patientPhone', `95${stamp}43`.slice(0, 10));
      await page.fill('#patientEmail', email);
      await page.check('#patientNoticeGiven');
      const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
      await page.getByRole('button', { name: /Save Patient/ }).click();
      const patientId = (await (await created).json()).data.id;

      // The patient downloads a copy of their data and asks for a correction.
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
      const portal = await context.newPage();
      await signInWithOtp(portal, request, email);
      await portal.goto(`${code}/patient/privacy`);
      const [download] = await Promise.all([portal.waitForEvent('download'), portal.locator('#consents-export').click()]);
      expect(download.suggestedFilename()).toBe('my-health-data.json');
      const copy = JSON.parse(readFileSync(await download.path(), 'utf-8'));
      expect(copy.patient[0].full_name).toBe(`Rights Patient ${stamp}`);
      expect(copy.consents.length).toBeGreaterThan(0);
      await portal.selectOption('#my-request-type', 'CORRECTION');
      await portal.fill('#my-request-details', 'My date of birth is 9 August 1976, not 1975.');
      await portal.locator('#my-request-send').click();
      await expect(portal.locator('#my-request-list')).toContainText('answer due by');

      // The privacy officer sees it, cannot close it without an answer, then closes it with one.
      await page.goto(`${code}/privacy`);
      const row = page.locator('#request-list [data-request]').filter({ hasText: `Rights Patient ${stamp}` });
      await expect(row).toContainText('Correct something wrong');
      await expect(row).toContainText('Due ');
      const id = await row.getAttribute('data-request');
      await page.selectOption(`[data-status="${id}"]`, 'DONE');
      await page.locator(`[data-update="${id}"]`).click();
      await expect(page.getByText('Write the answer given before closing the request.')).toBeVisible();
      await page.fill(`[data-answer="${id}"]`, 'Date of birth corrected to 9 August 1976.');
      await page.locator(`[data-update="${id}"]`).click();
      await expect(page.getByText('Request updated')).toBeVisible();

      // The patient sees the answer; the officer can also hand over the file from the record.
      await portal.reload();
      await expect(portal.locator('#my-request-list')).toContainText('done');
      await expect(portal.locator('#my-request-list')).toContainText('corrected to 9 August 1976');
      await context.close();
      await page.goto(`${code}/patients/${patientId}`);
      const [staffCopy] = await Promise.all([page.waitForEvent('download'), page.locator('#consents-export').click()]);
      expect(staffCopy.suggestedFilename()).toBe(`patient-data-${patientId}.json`);
    });

  test('privacy settings are checked by the API, and an unknown clinic has no notice @desktop', async ({ page, request }) => {
    await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await (async () => {
      const req = page.waitForRequest((r) => r.url().includes('/api/v1/hms/') && !!r.headers()['authorization'], { timeout: 20000 });
      await page.reload();
      return (await req).headers()['authorization'];
    })();
    const api = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';
    const settings = await request.get(`${api}/hms/privacy/settings`, { headers: { Authorization: bearer } });
    expect(settings.ok()).toBeTruthy();
    for (const body of [{ consentAge: 12 }, { consentAge: 18, officerEmail: 'not-an-email' }, { consentAge: 18, officerName: '<b>x</b>' }]) {
      const res = await request.put(`${api}/hms/privacy/settings`, { headers: { Authorization: bearer }, data: body });
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    const open = await request.get(`${api}/public/privacy/NO-SUCH-CLINIC`);
    expect(open.status()).toBe(404);
  });
});
