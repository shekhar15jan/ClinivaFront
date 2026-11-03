import { expect, test } from '@playwright/test';
import { countMails, nextMail, otpFrom, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

/**
 * A patient registers herself on the clinic's public page and has to prove the email first (requirement 3, P-33):
 * the details step emails a code, a wrong code creates nothing, the right code creates the account, and she then
 * signs in with her own emailed code and lands on the patient home.
 */
test('a patient proves her email with a code before the account exists', async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const email = `live-selfreg${stamp}@live-patient.test`;
  const name = `LIVE- Self Reg ${stamp}`;

  // A visitor (no sign-in) opens the clinic's registration page.
  const visitor = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const guest = await visitor.newPage();
  await guest.goto(`${code}/register`);
  await expect(guest.getByRole('heading', { name: /New patient\? Register/ })).toBeVisible();

  // Step 1: the details are checked on the page before any mail is sent.
  await guest.locator('#send-code').click();
  await expect(guest.locator('#register-error')).toContainText(/full name/i);
  expect(await countMails(request, email, ''), 'no mail before the details are valid').toBe(0);
  await guest.fill('#fullName', name);
  await guest.fill('#email', email);
  await guest.fill('#phone', `96${stamp}12`.slice(0, 10));
  await guest.locator('#send-code').click();
  await expect(guest.locator('#register-error')).toContainText(/privacy notice/i);
  await guest.selectOption('#gender', 'FEMALE');
  await guest.check('#privacy');

  // The code is emailed, and nothing is created yet.
  await guest.locator('#send-code').click();
  await expect(guest.locator('#otp')).toBeVisible({ timeout: 15000 });
  const proof = otpFrom(await nextMail(request, email, '', 0));
  const known = await request.get(`${CLINIVA}/tenant/resolve-by-email`, { params: { email } });
  expect(known.ok() ? ((await known.json()).data ?? []).length : 0, 'no account before the code is entered').toBe(0);

  // Step 2: a wrong code is refused and creates nothing.
  const wrong = proof === '000000' ? '111111' : '000000';
  await guest.fill('#otp', wrong);
  const refused = guest.waitForResponse((r) => r.request().method() === 'POST' && /\/auth\/register$/.test(r.url()));
  await guest.locator('#create-account').click();
  expect((await refused).ok(), 'the wrong code is refused').toBeFalsy();
  await expect(guest.locator('#register-error')).toBeVisible();
  await expect(guest.locator('#register-done')).toHaveCount(0);

  // The right code creates the account.
  await guest.fill('#otp', proof);
  const created = guest.waitForResponse((r) => r.request().method() === 'POST' && /\/auth\/register$/.test(r.url()));
  await guest.locator('#create-account').click();
  expect((await created).ok(), 'the right code creates the account').toBeTruthy();
  await expect(guest.locator('#register-done')).toBeVisible();
  await visitor.close();

  // She signs in with her own emailed code and lands on the patient home.
  const own = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const patientPage = await own.newPage();
  await signInWithOtp(patientPage, request, email);
  await expect(patientPage).toHaveURL(/\/patient\/dashboard/);
  await own.close();

  // The clinic's front desk finds her in the patient list.
  await page.goto(`${code}/patients?q=${encodeURIComponent(`Self Reg ${stamp}`)}`);
  await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
});
