import { APIRequestContext, Page, expect } from '@playwright/test';

const CLOUDSUITE = process.env.CLOUDSUITE_API || 'http://localhost:8081/api/v1';
const MAILHOG = process.env.MAILHOG_API || 'http://localhost:8025/api/v2';
const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

/** Decode a quoted-printable mail body (MailHog stores bodies as the SMTP server received them). */
export function decodeQuotedPrintable(body: string): string {
  return body
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export interface Mail {
  subject: string;
  body: string;
  at: string;
}

export async function mailsTo(request: APIRequestContext, address: string): Promise<Mail[]> {
  const res = await request.get(`${MAILHOG}/search`, { params: { kind: 'to', query: address } });
  const json = await res.json();
  return (json.items ?? [])
    .map((m: any) => ({
      subject: m.Content.Headers.Subject?.[0] ?? '',
      body: decodeQuotedPrintable(m.Content.Body),
      at: m.Created,
    }))
    .sort((a: Mail, b: Mail) => a.at.localeCompare(b.at));
}

function matching(mails: Mail[], text: string): Mail[] {
  return mails.filter((m) => (m.subject + m.body).toLowerCase().includes(text.toLowerCase()));
}

export async function countMails(request: APIRequestContext, address: string, text: string): Promise<number> {
  return matching(await mailsTo(request, address), text).length;
}

/** Wait for a mail to `address` containing `text` beyond the `alreadySeen` ones, and return the newest. */
export async function nextMail(request: APIRequestContext, address: string, text: string, alreadySeen = 0): Promise<Mail> {
  let found: Mail | undefined;
  await expect
    .poll(
      async () => {
        const list = matching(await mailsTo(request, address), text);
        found = list.length > alreadySeen ? list[list.length - 1] : undefined;
        return !!found;
      },
      { timeout: 30000, message: `mail to ${address} containing "${text}"` },
    )
    .toBe(true);
  return found!;
}

export function temporaryPasswordFrom(mail: Mail): string {
  const match = mail.body.match(/monospace">\s*([^<\s]+)\s*</);
  expect(match, 'temporary password in the welcome email').toBeTruthy();
  return match![1];
}

export function otpFrom(mail: Mail): string {
  const match = mail.body.match(/(\d{6})/);
  expect(match, 'six-digit OTP in the email').toBeTruthy();
  return match![1];
}

export interface ProvisionedTenant {
  tenantUuid: string;
  adminEmail: string;
  productId: string;
  plans: Record<string, string>;
  post: (path: string, data?: unknown) => Promise<any>;
}

/** Creates a tenant with an administrator in CloudSuite, the way an operator would. */
export async function provisionTenant(request: APIRequestContext, planCode = 'HMS_STARTER'): Promise<ProvisionedTenant> {
  const login = await request.post(`${CLOUDSUITE}/auth/login`, { data: { email: 'admin@codeatcloud.in', password: 'admin' } });
  expect(login.ok(), 'CloudSuite operator sign-in').toBeTruthy();
  const token = (await login.json()).data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  const products = (await (await request.get(`${CLOUDSUITE}/platform/products`, { headers })).json()).data;
  const hms = products.find((p: any) => p.code === 'HMS');
  expect(hms, 'HMS product registered in CloudSuite').toBeTruthy();
  const planList = (await (await request.get(`${CLOUDSUITE}/platform/plans`, { headers, params: { productId: hms.id } })).json()).data;
  const plans: Record<string, string> = Object.fromEntries(planList.map((p: any) => [p.code, p.id]));
  expect(plans[planCode], `plan ${planCode}`).toBeTruthy();

  const stamp = Date.now().toString().slice(-8);
  const adminEmail = `admin@live${stamp}.test`;
  const created = await request.post(`${CLOUDSUITE}/platform/tenants`, {
    headers,
    data: {
      tenantId: `live-${stamp}`,
      name: `Live Clinic ${stamp}`,
      displayName: `Live Clinic ${stamp}`,
      // Deliberately different from the administrator's login email.
      contactEmail: `frontdesk@live${stamp}.test`,
      adminEmail,
      adminName: 'Live Admin',
      planId: plans[planCode],
    },
  });
  expect(created.status(), 'tenant created').toBe(201);
  const tenantUuid = (await created.json()).data.id;

  return {
    tenantUuid,
    adminEmail,
    productId: hms.id,
    plans,
    post: async (path, data) => {
      const res = await request.post(`${CLOUDSUITE}${path}`, { headers, data });
      expect(res.ok(), `POST ${path}`).toBeTruthy();
      return res.json();
    },
  };
}

export interface SignedInAdmin extends ProvisionedTenant {
  hospitalCode: string;
  password: string;
}

/**
 * Provisions a tenant in CloudSuite and signs its administrator in through the real UI. The forced
 * password change is done over the API (the onboarding spec drives that page); sign-in itself,
 * including the emailed OTP, goes through the browser.
 */
export async function signInAsNewAdmin(page: Page, request: APIRequestContext, planCode = 'HMS_PRO'): Promise<SignedInAdmin> {
  const tenant = await provisionTenant(request, planCode);
  const temporary = temporaryPasswordFrom(await nextMail(request, tenant.adminEmail, 'temporary password'));
  const password = `Live#${Date.now().toString().slice(-6)}Pw`;
  // The email can arrive before CloudSuite's event has created the account in Cliniva.
  await expect
    .poll(async () => {
      const res = await request.get(`${CLINIVA}/tenant/resolve-by-email`, { params: { email: tenant.adminEmail } });
      return res.ok() ? ((await res.json()).data ?? []).length : 0;
    }, { timeout: 30000, message: 'Cliniva knows the new administrator' })
    .toBeGreaterThan(0);
  const changed = await request.post(`${CLINIVA}/auth/change-password`, {
    data: { email: tenant.adminEmail, currentPassword: temporary, newPassword: password },
  });
  expect(changed.ok(), 'change the temporary password').toBeTruthy();

  await page.goto('/login');
  await page.fill('input[type="email"]', tenant.adminEmail);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => /^\/[^/]+\/login$/.test(url.pathname), { timeout: 15000 });
  const hospitalCode = new URL(page.url()).pathname.split('/')[1];

  const before = await countMails(request, tenant.adminEmail, 'otp');
  await page.locator('button:has-text("Send OTP")').click();
  await page.waitForURL(/\/otp$/, { timeout: 15000 });
  const otp = otpFrom(await nextMail(request, tenant.adminEmail, 'otp', before));
  const digits = page.locator('input.otp-digit');
  for (let i = 0; i < 6; i++) await digits.nth(i).fill(otp[i]);
  await page.getByRole('button', { name: /Verify/ }).click();
  await page.waitForURL(new RegExp(`/${hospitalCode}/dashboard`), { timeout: 20000 });
  return { ...tenant, hospitalCode, password };
}

/** Registers a patient through the real form and returns once the API has accepted it. */
export async function registerPatient(page: Page, hospitalCode: string, name: string, phone: string): Promise<void> {
  await page.goto(`/${hospitalCode}/patients`);
  await page.getByRole('button', { name: /Add Patient/ }).click();
  await page.fill('#patientFullName', name);
  await page.fill('#patientDob', '1990-05-17');
  await page.selectOption('#patientGender', 'FEMALE');
  await page.fill('#patientPhone', phone);
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
  await page.getByRole('button', { name: /Save Patient/ }).click();
  expect((await created).ok(), 'patient created').toBeTruthy();
}

/** Registers a doctor through the real form and returns once the API has accepted it. */
export async function registerDoctor(page: Page, hospitalCode: string, name: string, phone: string): Promise<void> {
  await page.goto(`/${hospitalCode}/doctors`);
  await page.getByText('Add Doctor', { exact: false }).first().click();
  await page.fill('input[formControlName="fullName"]', name);
  await page.locator('select[formControlName="specialization"]').selectOption({ index: 1 });
  await page.fill('input[formControlName="qualification"]', 'MBBS, MD');
  await page.fill('input[formControlName="experienceYears"]', '8');
  await page.fill('input[formControlName="phone"]', phone);
  await page.fill('input[formControlName="consultationFee"]', '600');
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/doctors$/.test(r.url()));
  await page.getByRole('button', { name: /Save Doctor/ }).click();
  expect((await created).ok(), 'doctor created').toBeTruthy();
}
