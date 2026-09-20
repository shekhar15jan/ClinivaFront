import { APIRequestContext, Browser, Page, expect } from '@playwright/test';

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
  patch: (path: string) => Promise<any>;
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
  if (planCode === 'HMS_FULL' && !plans['HMS_FULL']) {
    // A plan with every real HMS module, so one clinic can exercise the whole product.
    const modules = (await (await request.get(`${CLOUDSUITE}/platform/products/${hms.id}/modules`, { headers })).json()).data;
    const made = await request.post(`${CLOUDSUITE}/platform/plans`, {
      headers,
      data: {
        code: 'HMS_FULL',
        name: 'HMS Full (live tests)',
        price: 1,
        billingCycle: 'MONTHLY',
        productId: hms.id,
        modules: modules
          .filter((m: any) => !String(m.code).startsWith('E2E_'))
          .map((m: any) => ({ moduleId: m.id, isAddon: false })),
      },
    });
    expect(made.ok(), 'create the HMS_FULL plan').toBeTruthy();
    plans['HMS_FULL'] = (await made.json()).data.id;
  }
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
    patch: async (path) => {
      const res = await request.patch(`${CLOUDSUITE}${path}`, { headers });
      expect(res.ok(), `PATCH ${path}`).toBeTruthy();
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

  const hospitalCode = await signInWithOtp(page, request, tenant.adminEmail);
  return { ...tenant, hospitalCode, password };
}

/** Signs `email` in through the real sign-in screens: the emailed one-time code is read from the mailbox. Returns the clinic code. */
export async function signInWithOtp(page: Page, request: APIRequestContext, email: string): Promise<string> {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => /^\/[^/]+\/login$/.test(url.pathname), { timeout: 15000 });
  const hospitalCode = new URL(page.url()).pathname.split('/')[1];

  const before = await countMails(request, email, 'otp');
  await page.locator('button:has-text("Send OTP")').click();
  await page.waitForURL(/\/otp$/, { timeout: 15000 });
  const otp = otpFrom(await nextMail(request, email, 'otp', before));
  const digits = page.locator('input.otp-digit');
  for (let i = 0; i < 6; i++) await digits.nth(i).fill(otp[i]);
  await page.getByRole('button', { name: /Verify/ }).click();
  // Patients land on their own dashboard, staff on the clinic's.
  await page.waitForURL(new RegExp(`/${hospitalCode}/(patient/)?dashboard`), { timeout: 20000 });
  return hospitalCode;
}

/** Registers a patient through the real form and returns once the API has accepted it. */
export async function registerPatient(page: Page, hospitalCode: string, name: string, phone: string, email?: string): Promise<void> {
  await page.goto(`/${hospitalCode}/patients`);
  await page.getByRole('button', { name: /Add Patient/ }).click();
  await page.fill('#patientFullName', name);
  await page.fill('#patientDob', '1990-05-17');
  await page.selectOption('#patientGender', 'FEMALE');
  await page.fill('#patientPhone', phone);
  // With an email the clinic also creates the patient's login for the portal.
  if (email) await page.fill('#patientEmail', email);
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
  await page.getByRole('button', { name: /Save Patient/ }).click();
  expect((await created).ok(), 'patient created').toBeTruthy();
}

/** Registers a doctor through the real form and returns once the API has accepted it. */
export async function registerDoctor(page: Page, hospitalCode: string, name: string, phone: string, email?: string): Promise<void> {
  await page.goto(`/${hospitalCode}/doctors`);
  await page.getByText('Add Doctor', { exact: false }).first().click();
  await page.fill('input[formControlName="fullName"]', name);
  await page.locator('select[formControlName="specialization"]').selectOption({ index: 1 });
  await page.fill('input[formControlName="qualification"]', 'MBBS, MD');
  await page.fill('input[formControlName="experienceYears"]', '8');
  await page.fill('input[formControlName="phone"]', phone);
  // With an email the clinic also creates the doctor's login.
  if (email) await page.fill('input[formControlName="email"]', email);
  await page.fill('input[formControlName="consultationFee"]', '600');
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/doctors$/.test(r.url()));
  await page.getByRole('button', { name: /Save Doctor/ }).click();
  expect((await created).ok(), 'doctor created').toBeTruthy();
}

/** Opens a doctor's page and gives them hours every day, so slots exist whatever today's weekday is. */
export async function setDoctorHours(page: Page, hospitalCode: string, doctorName: string): Promise<void> {
  await page.goto(`/${hospitalCode}/doctors`);
  await page.getByRole('button', { name: `View ${doctorName}` }).click();
  await expect(page.getByRole('heading', { name: 'Weekly Schedule' })).toBeVisible({ timeout: 15000 });
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
    await page.getByLabel(`${day} available`).check();
    await page.getByLabel(`${day} end`).fill('12:00');
  }
  const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/availability$/.test(r.url()));
  await page.locator('#save-availability').click();
  expect((await saved).ok(), 'schedule saved').toBeTruthy();
}

/** Books the first free slot for `patientName` with `doctorName` through the booking screens; returns the appointment id. */
export async function bookAppointment(page: Page, hospitalCode: string, doctorName: string, patientName: string): Promise<string> {
  await page.goto(`/${hospitalCode}/appointments/book`);
  await page.locator('[aria-label="Select Date"] [role="radio"]').first().click();
  await page.locator('[aria-label="Select Doctor"] [role="radio"]', { hasText: doctorName }).click();
  const slots = page.locator('[aria-label="Available Time Slots"] [role="radio"]');
  await expect(slots.first()).toBeVisible({ timeout: 15000 });
  await slots.first().click();
  await page.getByRole('button', { name: /Next Step/ }).click();
  const option = page.locator('#patientId option', { hasText: patientName });
  await expect(option).toHaveCount(1, { timeout: 15000 });
  await page.selectOption('#patientId', (await option.getAttribute('value'))!);
  await page.getByRole('button', { name: /Next Step/ }).click();
  const booked = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/appointments$/.test(r.url()));
  await page.getByRole('button', { name: /Confirm/ }).last().click();
  const response = await booked;
  expect(response.ok(), 'appointment booked').toBeTruthy();
  return (await response.json()).data.id as string;
}

/** Adds a medicine to the clinic's catalog through the real form. */
export async function addMedicine(page: Page, hospitalCode: string, name: string, priceRupees: string): Promise<void> {
  await page.goto(`/${hospitalCode}/medicines`);
  await page.getByRole('button', { name: /Add Medicine|Add New/ }).first().click();
  await page.fill('#med-form-name', name);
  await page.fill('#med-form-generic-name', 'Generic');
  await page.selectOption('#med-form-category', 'Analgesic');
  await page.fill('#med-form-manufacturer', 'Acme Pharma');
  await page.fill('#med-form-unit', 'Tablet');
  await page.fill('#med-form-price', priceRupees);
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/medicines$/.test(r.url()));
  await page.locator('form button[type="submit"]').click();
  expect((await created).ok(), 'medicine created').toBeTruthy();
}

/** Adds a staff login through the Users screen; returns once the API has accepted it. */
export async function addStaffUser(
  page: Page,
  hospitalCode: string,
  user: { firstName: string; lastName: string; email: string; role: 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'ADMIN' },
): Promise<void> {
  await page.goto(`/${hospitalCode}/users`);
  await page.locator('#add-user').click();
  await page.fill('#user-first-name', user.firstName);
  await page.fill('#user-last-name', user.lastName);
  await page.fill('#user-email', user.email);
  await page.selectOption('#user-role', user.role);
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/users$/.test(r.url()));
  await page.locator('#save-user').click();
  const response = await created;
  expect(response.ok(), `staff user created (${response.status()})`).toBeTruthy();
}

export interface PaidVisit {
  doctorName: string;
  doctorEmail: string;
  patientName: string;
  medicine: string;
  billNumber: string;
  /** Consultation 600 + 10 doses x 12.50 + 50 extra - 25 discount. */
  totalInPaisa: 75000;
}

/**
 * A whole visit by the people who do each part, on real services: the front desk books and approves, the doctor
 * (signed in with their own emailed code) consults and prescribes, the front desk bills and takes cash.
 */
export async function completePaidVisit(page: Page, request: APIRequestContext, browser: Browser, hospitalCode: string, patientEmail?: string): Promise<PaidVisit> {
  const stamp = Date.now().toString().slice(-6);
  const doctorName = `Dr. Visit ${stamp}`;
  const doctorEmail = `dr.visit${stamp}@live-staff.test`;
  const patientName = `Visit Patient ${stamp}`;
  const medicine = `Cefix ${stamp}`;

  await registerDoctor(page, hospitalCode, doctorName, `98${stamp}21`.slice(0, 10), doctorEmail);
  await registerPatient(page, hospitalCode, patientName, `97${stamp}22`.slice(0, 10), patientEmail);
  await addMedicine(page, hospitalCode, medicine, '12.50');
  await setDoctorHours(page, hospitalCode, doctorName);
  const appointmentId = await bookAppointment(page, hospitalCode, doctorName, patientName);

  await page.goto(`/${hospitalCode}/appointments`);
  const row = page.locator('li', { hasText: patientName });
  const approved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/approve$/.test(r.url()));
  await row.getByRole('button', { name: 'Approve' }).click();
  expect((await approved).ok(), 'appointment approved').toBeTruthy();

  const context = await browser.newContext();
  const doctor = await context.newPage();
  await signInWithOtp(doctor, request, doctorEmail);
  await doctor.goto(`/${hospitalCode}/consultations/${appointmentId}`);
  await expect(doctor.locator('#chiefComplaint')).toBeVisible({ timeout: 15000 });
  await doctor.fill('#chiefComplaint', 'Fever for three days');
  await doctor.fill('#diagnosis', 'Viral fever');
  const name = doctor.locator('input[formControlName="name"]').first();
  await name.fill(stamp);
  await doctor.getByRole('button', { name: new RegExp(medicine) }).click();
  await doctor.locator('input[formControlName="duration"]').first().fill('5');
  const prescription = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/prescriptions$/.test(r.url()));
  await doctor.getByRole('button', { name: /Finish & Print/ }).click();
  const prescriptionRes = await prescription;
  expect(prescriptionRes.ok(), 'prescription saved').toBeTruthy();
  const prescriptionId = (await prescriptionRes.json()).data.id as string;
  await context.close();

  await page.goto(`/${hospitalCode}/prescriptions/${prescriptionId}`);
  await page.fill('#bill-additional', '50');
  await page.fill('#bill-discount', '25');
  const generated = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/bills\/generate/.test(r.url()));
  await page.locator('#generate-bill-button').click();
  const bill = await generated;
  expect(bill.ok(), 'bill generated').toBeTruthy();
  const billNumber = (await bill.json()).data.billNumber as string;

  await page.locator('#collect-payment').click();
  const paid = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/payments\/save$/.test(r.url()));
  await page.locator('#payment-confirm').click();
  expect((await paid).ok(), 'payment saved').toBeTruthy();
  await expect(page.getByText('PAID', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  return { doctorName, doctorEmail, patientName, medicine, billNumber, totalInPaisa: 75000 };
}
