import { expect, test } from '@playwright/test';
import {
  BASE_PATH, addStaffUser, bookAppointment, registerDoctor, registerPatient, setDoctorHours, signInAsNewAdmin, signInWithOtp,
} from './helpers';

/**
 * Hospital access on real services: departments, department access with emergency access ("break the glass") and
 * its review, and a clinic's own role that grants exactly the screens of its permissions.
 */
test('a doctor opens another department\'s patient only through emergency access, which is reviewed', { tag: '@desktop' }, async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);

  // Two departments.
  await page.goto(`${code}/departments`);
  for (const name of ['Cardiology', 'Orthopaedics']) {
    await page.locator('#add-department').click();
    await page.fill('#department-name', name);
    const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/departments$/.test(r.url()));
    await page.locator('#save-department').click();
    expect((await saved).ok(), `${name} created`).toBeTruthy();
    await expect(page.locator(`[data-name="${name}"]`)).toBeVisible();
  }

  // Dr. Rao (Cardiology) sees the patient; Dr. Iyer (Orthopaedics) does not.
  const rao = `Dr. Rao ${stamp}`;
  const iyer = `Dr. Iyer ${stamp}`;
  const iyerEmail = `iyer${stamp}@live-dept.test`;
  await registerDoctor(page, code, rao, `98${stamp}11`.slice(0, 10), `rao${stamp}@live-dept.test`);
  await registerDoctor(page, code, iyer, `98${stamp}22`.slice(0, 10), iyerEmail);
  for (const [doctor, department] of [[rao, 'Cardiology'], [iyer, 'Orthopaedics']]) {
    await page.goto(`${code}/doctors`);
    await page.getByRole('button', { name: `View ${doctor}` }).filter({ visible: true }).click();
    const moved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/departments\/doctors$/.test(r.url()));
    await page.locator('#doctor-department-select').selectOption({ label: department });
    expect((await moved).ok(), `${doctor} moved to ${department}`).toBeTruthy();
  }
  await page.goto(`${code}/doctors`);
  await page.locator('#doctor-search').fill(`Iyer ${stamp}`);
  await expect(page.getByText(iyer).filter({ visible: true })).toBeVisible();
  await expect(page.getByText(rao).filter({ visible: true })).toHaveCount(0);

  const patient = `Dept Patient ${stamp}`;
  await registerPatient(page, code, patient, `97${stamp}33`.slice(0, 10));
  await setDoctorHours(page, code, rao);
  await bookAppointment(page, code, rao, patient);

  await page.goto(`${code}/departments`);
  await page.locator('#toggle-scoping').click();
  await expect(page.locator('#department-access')).toContainText('Department access is on');

  // Dr. Iyer: registration details only, until emergency access with a reason.
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const doctor = await context.newPage();
  await signInWithOtp(doctor, request, iyerEmail);
  await doctor.goto(`${code}/patients?q=${encodeURIComponent(patient)}`);
  await doctor.getByRole('link', { name: patient }).filter({ visible: true }).first().click();
  await expect(doctor.locator('#out-of-department')).toBeVisible({ timeout: 15000 });
  await expect(doctor.locator('#detail-history')).toHaveCount(0);
  await doctor.locator('#emergency-access').click();
  await doctor.fill('#emergency-reason', 'short');
  await expect(doctor.locator('#emergency-confirm')).toBeDisabled();
  await doctor.fill('#emergency-reason', 'Collapsed in the waiting area, family says on warfarin');
  await doctor.locator('#emergency-confirm').click();
  await expect(doctor.locator('#emergency-active')).toBeVisible({ timeout: 15000 });
  await expect(doctor.locator('#out-of-department')).toHaveCount(0);
  await expect(doctor.locator('#detail-history')).toBeVisible();
  await context.close();

  // The owner reviews it.
  await page.goto(`${code}/emergency-access`);
  const entry = page.locator('#emergency-list > div').filter({ hasText: 'Collapsed in the waiting area' });
  await expect(entry).toBeVisible({ timeout: 15000 });
  await entry.getByRole('button', { name: /Review access by/ }).click();
  const reviewed = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/review$/.test(r.url()));
  await entry.getByRole('button', { name: 'Mark reviewed' }).click();
  expect((await reviewed).ok(), 'reviewed').toBeTruthy();
  await expect(page.locator('#no-emergency')).toBeVisible();
});

test('a custom role gets exactly the screens of its permissions', { tag: '@desktop' }, async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);

  // "Billing nurse": a nurse who takes payments and does not see clinical records.
  await page.goto(`${code}/roles`);
  await page.locator('#add-role').click();
  await page.fill('#role-name', 'Billing nurse');
  await page.locator('#role-base').selectOption('NURSE');
  for (const off of ['CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW', 'APPOINTMENT_VIEW']) {
    await page.locator(`[data-permission="${off}"]`).uncheck();
  }
  await page.locator('[data-permission="BILLING"]').check();
  await expect(page.locator('[data-permission="USER_MANAGE"]')).toBeDisabled();
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/roles$/.test(r.url()));
  await page.locator('#save-role').click();
  expect((await created).ok(), 'role created').toBeTruthy();
  await expect(page.locator('[data-role="Billing nurse"]')).toBeVisible();

  const email = `billing.nurse${stamp}@live-roles.test`;
  await addStaffUser(page, code, { firstName: 'Bina', lastName: 'Rao', email, role: { label: 'Billing nurse' } });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const staff = await context.newPage();
  await signInWithOtp(staff, request, email);
  const link = (route: string) => staff.locator(`app-sidebar a[href="${BASE_PATH}/${code}/${route}"]`);
  await expect(link('dashboard')).toHaveCount(1, { timeout: 15000 });
  for (const route of ['patients', 'billing', 'payments']) {
    await expect(link(route), `${route} offered`).toHaveCount(1);
  }
  for (const route of ['consultations', 'prescriptions', 'appointments', 'users', 'roles']) {
    await expect(link(route), `${route} not offered`).toHaveCount(0);
  }
  await staff.goto(`${code}/billing`);
  await expect(staff).toHaveURL(new RegExp(`/${code}/billing`));
  await context.close();
});
