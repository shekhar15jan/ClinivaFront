import { Page, devices, expect, test } from '@playwright/test';
import {
  addStaffUser, bookAppointment, completePaidVisit, registerDoctor, registerPatient, setDoctorHours, signInAsNewAdmin,
  signInWithOtp,
} from './helpers';

/**
 * The phone layout, on real services, in every run (it opens its own phone-sized browser): the bottom bar and the
 * menu drawer offer each person only what they may use, the front desk can register, find and book patients, a
 * patient reaches their bills, and Logout ends the session. No screen may log a failing API call or an error.
 */
const PHONE = devices['Pixel 7'];

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

const bottomBar = (page: Page) => page.locator('app-bottom-nav nav');

test.describe('On a phone, real backend', () => {
  test('the front desk registers, finds and books a patient, sees only its own tabs, and Logout ends the session',
    async ({ page, request, browser }) => {
      // The clinic is set up on a desktop by its administrator; a doctor with hours is needed for booking.
      const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
      const stamp = Date.now().toString().slice(-6);
      const doctor = `Dr. Phone ${stamp}`;
      await registerDoctor(page, admin.hospitalCode, doctor, `93${stamp}51`.slice(0, 10));
      await setDoctorHours(page, admin.hospitalCode, doctor);
      const email = `phone.desk${stamp}@live-staff.test`;
      await addStaffUser(page, admin.hospitalCode, { firstName: 'Phone', lastName: 'Desk', email, role: 'RECEPTIONIST' });

      const context = await browser.newContext({ ...PHONE });
      const desk = await context.newPage();
      const problems = watch(desk);
      const code = await signInWithOtp(desk, request, email);

      // The bottom bar: the desk's tabs, not Settings (which it may not open).
      await expect(bottomBar(desk)).toBeVisible();
      await expect(bottomBar(desk).getByRole('link')).toHaveText([/Home/, /Schedule/, /Patients/, /Beds/]);

      // The drawer: front-desk screens, no administration.
      await desk.getByRole('button', { name: 'Open menu' }).click();
      const drawer = desk.locator('app-mobile-drawer');
      await expect(drawer.getByRole('link', { name: /Billing/ })).toBeVisible();
      await expect(drawer.getByRole('link', { name: /Users|Audit Log|Settings/ })).toHaveCount(0);
      await drawer.getByRole('link', { name: /Patients/ }).click();
      await expect(desk).toHaveURL(new RegExp(`/${code}/patients$`));

      // Register a patient with the (icon-only on phones, now labelled) Add Patient button, then find them.
      const patient = `Phone Patient ${stamp}`;
      await registerPatient(desk, code, patient, `92${stamp}52`.slice(0, 10));
      await desk.goto(`${code}/patients`);
      await desk.fill('#patient-search', `Phone Patient ${stamp}`);
      await expect(desk.getByText(patient).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });

      // Book from the phone.
      await bookAppointment(desk, code, doctor, patient);
      await desk.goto(`${code}/appointments`);
      await expect(desk.getByText(patient).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });

      expect(problems, problems.join('\n')).toEqual([]);

      // Logout from the drawer ends the session: reopening the app does not bring it back.
      await desk.getByRole('button', { name: 'Open menu' }).click();
      await desk.locator('#drawer-logout').click();
      await expect(desk).toHaveURL(/\/login$/, { timeout: 15000 });
      await desk.goto(`${code}/dashboard`);
      await expect(desk).not.toHaveURL(new RegExp(`/${code}/dashboard$`), { timeout: 15000 });
      await context.close();
    });

  test('a patient reaches their bills from the phone bar, and the portal loads cleanly', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const email = `phone.patient${stamp}@live-portal.test`;
    await registerPatient(page, admin.hospitalCode, `Phone Portal ${stamp}`, `91${stamp}53`.slice(0, 10), email);

    const context = await browser.newContext({ ...PHONE });
    const patient = await context.newPage();
    const problems = watch(patient);
    const code = await signInWithOtp(patient, request, email);

    await expect(bottomBar(patient).getByRole('link')).toHaveText([/Home/, /Appointments/, /Rx/, /Bills/, /Profile/]);
    await bottomBar(patient).getByRole('link', { name: /Bills/ }).click();
    await expect(patient).toHaveURL(new RegExp(`/${code}/patient/bills$`));
    await expect(patient.getByRole('heading', { name: 'My Bills' })).toBeVisible();
    for (const tab of [/Appointments/, /Rx/, /Profile/, /Home/]) {
      await bottomBar(patient).getByRole('link', { name: tab }).click();
      await patient.waitForLoadState('networkidle');
    }
    expect(problems, problems.join('\n')).toEqual([]);
    await context.close();
  });

  /** Every screen of a role opens on the phone without a failing API call or an error. */
  async function screensOpen(phone: Page, problems: string[], code: string, screens: string[]) {
    for (const screen of screens) {
      await phone.goto(`${code}/${screen}`);
      await phone.waitForLoadState('networkidle');
      await expect(phone, `${screen} opens on a phone`).toHaveURL(new RegExp(`/${code}/${screen}$`));
    }
    expect(problems, problems.join('\n')).toEqual([]);
  }

  test('a doctor consults and prescribes on a phone, and every doctor screen works there', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    // The whole visit, with the doctor's part (consultation, prescription) done on a phone.
    const visit = await completePaidVisit(page, request, browser, admin.hospitalCode, undefined, 'Pixel 7');

    const context = await browser.newContext({ ...PHONE });
    const doctor = await context.newPage();
    const problems = watch(doctor);
    const code = await signInWithOtp(doctor, request, visit.doctorEmail);
    await expect(bottomBar(doctor).getByRole('link')).toHaveText([/Home/, /Schedule/, /Patients/, /Round/, /Beds/]);
    await doctor.getByRole('button', { name: 'Open menu' }).click();
    const drawer = doctor.locator('app-mobile-drawer');
    await expect(drawer.getByRole('link', { name: /Consultations/ })).toBeVisible();
    await expect(drawer.getByRole('link', { name: /Billing|Payments|Users|Settings/ })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Close menu' }).click();

    await screensOpen(doctor, problems, code,
      ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'medicines']);
    await doctor.goto(`${code}/prescriptions`);
    await expect(doctor.getByText(visit.patientName).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('a nurse has the queue, patients and prescriptions on a phone, clinical history included', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const patient = `Ward Patient ${stamp}`;
    await registerPatient(page, admin.hospitalCode, patient, `94${stamp}54`.slice(0, 10));
    const email = `phone.nurse${stamp}@live-staff.test`;
    await addStaffUser(page, admin.hospitalCode, { firstName: 'Phone', lastName: 'Nurse', email, role: 'NURSE' });

    const context = await browser.newContext({ ...PHONE });
    const nurse = await context.newPage();
    const problems = watch(nurse);
    const code = await signInWithOtp(nurse, request, email);
    await expect(bottomBar(nurse).getByRole('link')).toHaveText([/Home/, /Schedule/, /Patients/, /Round/, /Beds/]);
    await nurse.getByRole('button', { name: 'Open menu' }).click();
    const drawer = nurse.locator('app-mobile-drawer');
    await expect(drawer.getByRole('link', { name: /Prescriptions/ })).toBeVisible();
    await expect(drawer.getByRole('link', { name: /Billing|Payments|Users|Settings|Reports/ })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Close menu' }).click();

    await screensOpen(nurse, problems, code,
      ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'health-packages']);

    // Opens a patient from the phone list; a nurse sees the clinical history (the front desk does not).
    await nurse.goto(`${code}/patients`);
    await nurse.fill('#patient-search', patient);
    await nurse.getByText(patient).filter({ visible: true }).first().click();
    await expect(nurse).toHaveURL(new RegExp(`/${code}/patients/[0-9a-f-]{36}$`));
    await expect(nurse.locator('#detail-history')).toBeVisible({ timeout: 15000 });
    expect(problems, problems.join('\n')).toEqual([]);
    await context.close();
  });
});
