import { APIRequestContext, Page, expect, test } from '@playwright/test';
import { countMails, registerPatient, signInAsNewAdmin } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';
const WEB = process.env.BASE_URL || 'http://localhost:4201';

/**
 * Attacks and bad input, on real services: security headers, CORS from a foreign site, forged and unsigned tokens,
 * one clinic reaching another's patients, SQL injection in search, invalid patient details through the real form,
 * script injected into a patient's record, password guessing, and what a token is worth after logging out.
 */

async function bearerOf(page: Page): Promise<string> {
  const request = page.waitForRequest((r) => r.url().includes('/api/v1/hms/') && !!r.headers()['authorization'], { timeout: 20000 });
  await page.reload();
  return (await request).headers()['authorization'];
}

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

async function newPatientId(request: APIRequestContext, bearer: string, name: string, extra: object = {}): Promise<string> {
  const res = await request.post(`${CLINIVA}/hms/patients`, { headers: { Authorization: bearer },
    data: { fullName: name, gender: 'FEMALE', phone: `98${Date.now().toString().slice(-8)}`, dateOfBirth: '1990-01-01', ...extra } });
  expect(res.ok(), `patient created (${res.status()}: ${(await res.text()).slice(0, 120)})`).toBeTruthy();
  return (await res.json()).data.id;
}

test.describe('Security and bad input, real backend', () => {
  test('security headers on the API and the web app, and no foreign site may call the API @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    const api = await request.get(`${CLINIVA}/hms/patients?page=0&size=1`, { headers: { Authorization: bearer } });
    expect(api.headers()['x-content-type-options']).toBe('nosniff');
    expect(api.headers()['referrer-policy']).toBe('no-referrer');
    expect(api.headers()['x-frame-options']).toBeTruthy();

    const web = await request.get(`${WEB}/`);
    for (const h of ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'content-security-policy']) {
      expect(web.headers()[h], `web page header ${h}`).toBeTruthy();
    }
    expect(web.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(web.headers()['server'] ?? '').not.toMatch(/\d/);

    const cors = await request.fetch(`${CLINIVA}/hms/patients`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example',
      'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } });
    expect(cors.headers()['access-control-allow-origin'] ?? '').not.toMatch(/evil|\*/);
    expect(admin.hospitalCode).toBeTruthy();
  });

  test('forged, unsigned and missing tokens are refused; one clinic cannot reach another @desktop', async ({ page, request, browser }) => {
    await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearerA = await bearerOf(page);
    const patient = await newPatientId(request, bearerA, 'Clinic A Patient');

    const [head, payload, sig] = bearerA.replace('Bearer ', '').split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const forged = `Bearer ${head}.${b64url({ ...claims, roles: ['ADMIN'], tenantId: '00000000-0000-0000-0000-000000000001' })}.${sig}`;
    const unsigned = `Bearer ${b64url({ alg: 'none', typ: 'JWT' })}.${payload}.`;
    for (const [what, auth] of [['forged', forged], ['unsigned', unsigned], ['missing', '']]) {
      const res = await request.get(`${CLINIVA}/hms/patients`, { headers: auth ? { Authorization: auth } : {} });
      expect(res.status(), `${what} token`).toBe(401);
    }

    const other = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const pageB = await other.newPage();
    await signInAsNewAdmin(pageB, request, 'HMS_FULL');
    const bearerB = await bearerOf(pageB);
    for (const [method, path, data] of [['GET', `/hms/patients/${patient}`, undefined], ['GET', `/hms/patients/${patient}/visits`, undefined],
      ['GET', `/hms/consultations/patient/${patient}`, undefined], ['PUT', `/hms/patients/${patient}`, { fullName: 'Hijacked', gender: 'FEMALE', phone: '9876543210' }],
      ['DELETE', `/hms/patients/${patient}`, undefined]] as const) {
      const res = await request.fetch(`${CLINIVA}${path}`, { method, headers: { Authorization: bearerB }, data });
      expect([403, 404], `clinic B ${method} ${path.replace(patient, '{id}')}`).toContain(res.status());
    }
    const list = await (await request.get(`${CLINIVA}/hms/patients?page=0&size=100`, { headers: { Authorization: bearerB } })).text();
    expect(list).not.toContain('Clinic A Patient');
    await other.close();
  });

  test('SQL injection in search changes nothing and leaks nothing @desktop', async ({ page, request }) => {
    await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    await newPatientId(request, bearer, 'Injection Canary');
    for (const q of ["' OR '1'='1", "'; DROP TABLE patients;--", '" OR 1=1 --', "%' UNION SELECT password_hash FROM users--", '\\', '%%%']) {
      const res = await request.get(`${CLINIVA}/hms/patients?page=0&size=50&search=${encodeURIComponent(q)}`, { headers: { Authorization: bearer } });
      expect(res.status(), q).toBeLessThan(500);
      const text = (await res.text()).toLowerCase();
      expect(text, q).not.toContain('password');
      expect(text, q).not.toContain('sql');
    }
    const all = await request.get(`${CLINIVA}/hms/patients?page=0&size=50`, { headers: { Authorization: bearer } });
    expect(await all.text()).toContain('Injection Canary');
  });

  test('invalid patient details are refused on the registration form; valid hospital names are taken @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const code = admin.hospitalCode;
    const cases: [string, string, string][] = [
      ['digits only', '1234567', '9876500001'], ['special characters', '@#$%^&*()', '9876500002'],
      ['script tag', '<script>alert(1)</script>', '9876500003'], ['phone all zeros', 'Zero Phone', '0000000000'],
      ['phone with letters', 'Letter Phone', '98765abcde'], ['phone too short', 'Short Phone', '12345'],
      ['name too long', 'A'.repeat(151), '9876500004'],
    ];
    for (const [what, name, phone] of cases) {
      await page.goto(`${code}/patients`);
      await page.getByRole('button', { name: /Add Patient/ }).click();
      await page.fill('#patientFullName', name);
      await page.fill('#patientDob', '1990-05-17');
      await page.selectOption('#patientGender', 'FEMALE');
      await page.fill('#patientPhone', phone);
      const save = page.getByRole('button', { name: /Save Patient/ });
      // The form may refuse it itself (Save stays disabled); otherwise the server must refuse it.
      if (await save.isDisabled()) {
        continue;
      }
      const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()), { timeout: 5000 }).catch(() => null);
      await save.click();
      const res = await posted;
      expect(res === null || !res.ok(), `${what}: not saved`).toBeTruthy();
      if (res) expect(res.status(), `${what}: refused as bad input`).toBe(400);
    }
    // Real hospital names are accepted.
    await registerPatient(page, code, `B/O Priya (Twin 1) ${Date.now().toString().slice(-4)}`, `97${Date.now().toString().slice(-8)}`);
  });

  test('script put into a patient record is shown as text, never run @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
    const id = await newPatientId(request, bearer, 'Script Victim', { address: payload, emergencyContactName: 'Safe Contact' });
    let dialog = false;
    page.on('dialog', async (d) => { dialog = true; await d.dismiss(); });
    await page.goto(`${admin.hospitalCode}/patients/${id}`);
    await expect(page.locator('main')).toContainText('Script Victim');
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(dialog).toBe(false);
  });

  test('guessing a password locks the account; a token is short-lived and logout ends the session @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    const claims = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString());
    expect(claims.exp - claims.iat, 'an access token lives at most 15 minutes').toBeLessThanOrEqual(15 * 60);

    // Logout: the refresh cookie no longer brings a session back.
    await page.locator('app-sidebar').getByRole('button', { name: /Logout$/ }).click();
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
    const refresh = await page.request.post(`${CLINIVA}/auth/refresh`, { data: {} });
    expect(refresh.ok(), 'no session after logout').toBeFalsy();

    // Five wrong passwords lock password sign-in, even with the right one after.
    for (let i = 0; i < 5; i++) {
      const res = await request.post(`${CLINIVA}/auth/login`, { data: { email: admin.adminEmail, password: `Wrong#${i}x` } });
      expect(res.status()).toBe(401);
    }
    const locked = await request.post(`${CLINIVA}/auth/login`, { data: { email: admin.adminEmail, password: admin.password } });
    expect(locked.status()).toBe(429);
    expect(await locked.text()).toContain('Too many wrong passwords');
  });

  test('sign-in never tells whether an email has an account @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const nobody = `nobody-${Date.now()}@e2e.test`;
    const tenantCode = admin.hospitalCode;
    const answer = async (path: string, data: object) => {
      const res = await request.post(`${CLINIVA}/auth/${path}`, { data: { tenantCode, ...data } });
      return `${res.status()} ${(await res.json()).message ?? ''}`;
    };
    expect(await answer('login', { email: nobody, password: 'Wrong#123x' }), 'login')
      .toBe(await answer('login', { email: admin.adminEmail, password: 'Wrong#123x' }));
    expect(await answer('verify-password', { email: nobody, password: 'Wrong#123x' }), 'verify-password')
      .toBe(await answer('verify-password', { email: admin.adminEmail, password: 'Wrong#123x' }));
    // Asking for a code reads the same for anyone; no code is sent to an address with no account.
    const sent = await request.post(`${CLINIVA}/auth/send-otp`, { data: { tenantCode, email: nobody } });
    expect(sent.status()).toBe(200);
    expect(await countMails(request, nobody, '')).toBe(0);
    expect(await answer('verify-otp', { email: nobody, otp: '123456' }), 'verify-otp')
      .toBe(await answer('verify-otp', { email: admin.adminEmail, otp: '000000' }));
  });

  test('money rules: no overpaying, no zero or negative amounts, no discount above the bill, no edit once paid @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    const call = (method: string, path: string, data?: object) =>
      request.fetch(`${CLINIVA}${path}`, { method, headers: { Authorization: bearer }, data });
    const patientId = await newPatientId(request, bearer, 'Money Rules Patient');
    const tests = (await (await call('POST', '/hms/lab/tests/starter')).json()).data;
    const cbc = tests.find((t: { code: string }) => t.code === 'CBC').id;
    const order = (await (await call('POST', '/hms/lab/orders', { patientId, testIds: [cbc] })).json()).data;
    const billed = (await (await call('POST', `/hms/lab/orders/${order.id}/bill`, { taxInPaisa: 0 })).json()).data;
    const billId = billed.billId;
    const total: number = (await (await call('GET', `/hms/bills/${billId}`)).json()).data.totalAmountInPaisa;
    expect(total).toBeGreaterThan(1);
    const pay = (amount: number) => call('POST', '/hms/payments/save', { billId, amountInPaisa: amount, paymentMethod: 'CASH', paymentMode: 'OFFLINE' });

    for (const amount of [0, -100, 99_999_999_999_999]) {
      expect((await pay(amount)).status(), `pay ${amount}`).toBe(400);
    }
    expect((await call('PUT', `/hms/bills/${billId}`, { discountInPaisa: total + 1 })).status(), 'discount above the bill').toBeGreaterThanOrEqual(400);
    expect((await call('PUT', `/hms/bills/${billId}`, { discountInPaisa: -1 })).status(), 'negative discount').toBe(400);
    expect((await pay(total + 1)).status(), 'more than due').toBeGreaterThanOrEqual(400);

    const half = Math.floor(total / 2);
    expect((await pay(half)).ok(), 'part payment').toBeTruthy();
    expect((await pay(total - half + 1)).status(), 'rest plus one').toBeGreaterThanOrEqual(400);
    expect((await pay(total - half)).ok(), 'the rest').toBeTruthy();
    expect((await pay(1)).status(), 'once paid, nothing more is taken').toBeGreaterThanOrEqual(400);
    expect((await call('PUT', `/hms/bills/${billId}`, { discountInPaisa: 1 })).status(), 'a paid bill is closed').toBeGreaterThanOrEqual(400);

    await page.goto(`${admin.hospitalCode}/billing/${billId}`);
    await expect(page.locator('main')).toContainText('Paid', { timeout: 15000 });
  });
});
